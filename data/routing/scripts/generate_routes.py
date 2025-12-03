#!/usr/bin/env python3
"""Main pipeline for generating bicycle routes.

Generates route geometries using Valhalla routing engine with flexible
selection strategies. Routes can be selected by:
- Number: Top N most popular routes
- Coverage: Routes accounting for X% of trips

Selection can be configured independently for:
- Global routes: Across entire network (main file)
- Individual routes: Per-station basis (station files)
- Aggregate routes: Top routes from each station (single file)

Usage:
    # Default (5 global top, 80% individual, no aggregate)
    python generate_routes.py

    # Custom global
    python generate_routes.py --global-top 1000 --no-individual

    # Custom individual
    python generate_routes.py --no-global --individual-pct 90

    # Both custom
    python generate_routes.py --global-top 50 --individual-pct 75

    # Aggregate only
    python generate_routes.py --aggregate-top 10 --no-global --no-individual

    # All three types
    python generate_routes.py --global-top 100 --individual-pct 80 --aggregate-top 5

See --help for complete options.
"""

import sys
import logging
import time
import argparse
from typing import List, Dict

from config import (
    PipelineConfig,
    RouteGenerationConfig,
    RouteSelectionStrategy,
    RouteSelectionType,
    ValhallaConfig,
    DatabaseConfig,
    OutputConfig,
    GenerationConfig,
)
from models import RouteStatistics, StationCoordinate, RouteGeometry
from route_analyzer import RouteAnalyzer
from route_generator import RouteGenerator
from file_writer import RouteFileWriter

logger = logging.getLogger(__name__)


class RoutePipeline:
    """Main pipeline orchestrator for route generation."""

    def __init__(self, config: PipelineConfig):
        """
        Initialize pipeline.

        Args:
            config: Complete pipeline configuration
        """
        self.config = config
        self.analyzer = RouteAnalyzer(config.database)
        # Create compatibility GenerationConfig for RouteGenerator
        compat_gen_config = GenerationConfig(
            phase="phase1",  # Dummy value, not used
            batch_size=config.generation.batch_size,
            log_interval=config.generation.log_interval,
            costing=config.generation.costing,
            bicycle_type=config.generation.bicycle_type,
        )
        self.generator = RouteGenerator(config.valhalla, compat_gen_config)
        self.writer = RouteFileWriter(config.output)

        # State
        self.bidirectional_map: Dict[str, RouteStatistics] = {}
        self.per_station_routes: Dict[str, List[RouteStatistics]] = {}
        self.global_routes: List[RouteStatistics] = []

    def run(self):
        """
        Execute complete route generation pipeline.

        Pipeline steps:
        1. Connect to database
        2. Test Valhalla connection
        3. Analyze route statistics
        4. Fetch station coordinates
        5. Generate route geometries
        6. Organize routes by station
        7. Write output files
        8. Report statistics
        """
        start_time = time.time()

        try:
            logger.info("=" * 60)
            logger.info("Route Generation Pipeline")
            logger.info("=" * 60)
            logger.info(f"\n{self.config.summary()}\n")

            # Step 1: Connect to database
            logger.info("Step 1/8: Connecting to database...")
            self.analyzer.connect()

            # Get database statistics
            db_stats = self.analyzer.get_statistics_summary()
            logger.info(f"Database contains {db_stats['total_trips']:,} trips")

            # Step 2: Test Valhalla connection
            logger.info("\nStep 2/8: Testing Valhalla connection...")
            if not self.generator.test_connection():
                raise RuntimeError("Valhalla is not available")

            # Step 3: Analyze and select routes
            logger.info("\nStep 3/8: Analyzing route statistics...")
            routes_to_generate, self.per_station_routes = self._select_routes()
            logger.info(f"Selected {len(routes_to_generate)} routes to generate")

            # Step 4: Fetch station coordinates
            logger.info("\nStep 4/8: Fetching station coordinates...")
            station_coords = self._fetch_station_coordinates(routes_to_generate)
            logger.info(f"Fetched coordinates for {len(station_coords)} stations")

            # Step 5: Generate route geometries
            logger.info("\nStep 5/8: Generating route geometries...")
            generated_routes = self._generate_geometries(
                routes_to_generate, station_coords
            )
            logger.info(f"Generated {len(generated_routes)} route geometries")

            # Step 6: Organize routes by station
            logger.info("\nStep 6/8: Organizing routes by station...")
            station_routes = self.writer.organize_by_station(
                generated_routes, self.bidirectional_map
            )

            # Step 7: Write output files
            logger.info("\nStep 7/8: Writing output files...")
            self._write_output_files(generated_routes, station_routes)

            # Step 8: Report statistics
            logger.info("\nStep 8/8: Generating statistics report...")
            elapsed = time.time() - start_time
            self._report_statistics(
                len(routes_to_generate), len(generated_routes), elapsed
            )

            logger.info("\n" + "=" * 60)
            logger.info("✅ Pipeline completed successfully!")
            logger.info("=" * 60)

        except Exception as e:
            logger.error(f"\n❌ Pipeline failed: {e}", exc_info=True)
            raise

        finally:
            # Cleanup
            if self.analyzer.conn:
                self.analyzer.close()

    def _select_routes(
        self,
    ) -> tuple[List[RouteStatistics], Dict[str, List[RouteStatistics]]]:
        """
        Select routes based on generation configuration.

        Returns:
            Tuple of:
            - List of unique routes to generate (deduplicated)
            - Dict of station_id -> routes for per-station files

        Side effects:
            Sets self.global_routes for global file generation
        """
        gen_config = self.config.generation

        # Collect routes based on strategies
        all_routes_dict = {}  # (from, to) -> RouteStatistics
        per_station_routes = {}  # station_id -> [RouteStatistics]

        # Get global routes if enabled
        if gen_config.should_generate_global():
            logger.info("Selecting global routes...")
            assert (
                gen_config.global_strategy is not None
            ), "global_strategy should not be None when should_generate_global() is True"
            global_routes = self._get_routes_for_strategy(
                gen_config.global_strategy, scope="global"
            )
            self.global_routes = global_routes

            for route in global_routes:
                key = (route.departure_station_id, route.return_station_id)
                all_routes_dict[key] = route

            logger.info(f"  Selected {len(global_routes)} global routes")
        else:
            self.global_routes = []
            logger.info("Global routes disabled")

        # Get individual station routes if enabled
        if gen_config.should_generate_individual():
            logger.info("Selecting individual station routes...")
            assert (
                gen_config.individual_strategy is not None
            ), "individual_strategy should not be None when should_generate_individual() is True"
            per_station_routes = self._get_routes_per_station(
                gen_config.individual_strategy
            )

            # Add to union
            for station_id, routes in per_station_routes.items():
                for route in routes:
                    key = (route.departure_station_id, route.return_station_id)
                    if key not in all_routes_dict:
                        all_routes_dict[key] = route

            total_individual = sum(
                len(routes) for routes in per_station_routes.values()
            )
            logger.info(f"  Selected {total_individual} individual station routes")
        else:
            logger.info("Individual station routes disabled")

        # Convert to list and deduplicate bidirectional
        all_routes = list(all_routes_dict.values())
        logger.info(f"  Union: {len(all_routes)} total unique routes to generate")

        unique_routes, reverse_map = self.analyzer.deduplicate_bidirectional(all_routes)
        self.bidirectional_map = reverse_map

        logger.info(
            f"  After bidirectional deduplication: {len(unique_routes)} geometries to generate"
        )

        return unique_routes, per_station_routes

    def _get_routes_for_strategy(
        self, strategy: RouteSelectionStrategy, scope: str = "global"
    ) -> List[RouteStatistics]:
        """
        Get routes for a given selection strategy.

        Args:
            strategy: Route selection strategy
            scope: Description for logging ("global" or station ID)

        Returns:
            List of RouteStatistics
        """
        if strategy.selection_type == RouteSelectionType.TOP_N:
            assert (
                strategy.top_n is not None
            ), "top_n should not be None for TOP_N strategy"
            logger.info(f"  Strategy: Top {strategy.top_n} routes ({scope})")
            return self.analyzer.get_top_n_routes(n=strategy.top_n)

        elif strategy.selection_type == RouteSelectionType.PERCENTAGE:
            assert (
                strategy.coverage_percentage is not None
            ), "coverage_percentage should not be None for PERCENTAGE strategy"
            logger.info(
                f"  Strategy: {strategy.coverage_percentage}% coverage ({scope})"
            )
            return self.analyzer.get_global_coverage_routes(
                strategy.coverage_percentage
            )

        else:
            raise ValueError(f"Unknown selection type: {strategy.selection_type}")

    def _get_routes_per_station(
        self, strategy: RouteSelectionStrategy
    ) -> Dict[str, List[RouteStatistics]]:
        """
        Get routes for each station based on strategy.

        Args:
            strategy: Route selection strategy

        Returns:
            Dict mapping station_id to list of RouteStatistics
        """
        if strategy.selection_type == RouteSelectionType.TOP_N:
            assert (
                strategy.top_n is not None
            ), "top_n should not be None for TOP_N strategy"
            logger.info(f"  Strategy: Top {strategy.top_n} routes per station")
            return self.analyzer.get_routes_by_station_top_n(strategy.top_n)

        elif strategy.selection_type == RouteSelectionType.PERCENTAGE:
            assert (
                strategy.coverage_percentage is not None
            ), "coverage_percentage should not be None for PERCENTAGE strategy"
            logger.info(
                f"  Strategy: {strategy.coverage_percentage}% coverage per station"
            )
            return self.analyzer.get_routes_by_station_coverage(
                strategy.coverage_percentage
            )

        else:
            raise ValueError(f"Unknown selection type: {strategy.selection_type}")

    def _fetch_station_coordinates(
        self, routes: List[RouteStatistics]
    ) -> Dict[str, StationCoordinate]:
        """
        Fetch coordinates for all stations in routes.

        Args:
            routes: List of routes

        Returns:
            Dict mapping station_id to StationCoordinate
        """
        # Collect all unique station IDs
        station_ids = set()
        for route in routes:
            station_ids.add(route.departure_station_id)
            station_ids.add(route.return_station_id)

        logger.info(f"Fetching coordinates for {len(station_ids)} unique stations")

        return self.analyzer.get_station_coordinates(list(station_ids))

    def _generate_geometries(
        self,
        routes: List[RouteStatistics],
        station_coords: Dict[str, StationCoordinate],
    ) -> List[RouteGeometry]:
        """
        Generate route geometries using Valhalla.

        Args:
            routes: List of routes to generate
            station_coords: Station coordinates lookup

        Returns:
            List of successfully generated RouteGeometry objects
        """
        # Prepare station pairs
        station_pairs = []
        skipped = 0

        for route in routes:
            # Check if we have coordinates for both stations
            if (
                route.departure_station_id not in station_coords
                or route.return_station_id not in station_coords
            ):
                logger.warning(
                    f"Missing coordinates for route: "
                    f"{route.departure_station_id} → {route.return_station_id}"
                )
                skipped += 1
                continue

            from_station = station_coords[route.departure_station_id]
            to_station = station_coords[route.return_station_id]
            station_pairs.append((from_station, to_station))

        if skipped > 0:
            logger.warning(f"Skipped {skipped} routes due to missing coordinates")

        # Generate routes in batch
        return self.generator.generate_batch(station_pairs)

    def _write_output_files(
        self,
        generated_routes: List[RouteGeometry],
        station_routes: Dict[str, List[RouteGeometry]],
    ):
        """
        Write output files based on configuration.

        Args:
            generated_routes: List of all generated routes
            station_routes: Routes organized by station
        """
        self.writer.setup_directories()
        created_files = []

        # Write global routes file if enabled
        if self.config.generation.should_generate_global():
            logger.info("Writing global routes file...")

            # Filter to only include global routes
            global_route_keys = {r.route_key for r in self.global_routes}
            global_generated = [
                r for r in generated_routes if r.route_key in global_route_keys
            ]

            filename = self.writer.write_global_routes(
                global_generated, strategy=self.config.generation.global_strategy
            )
            created_files.append(filename)
            logger.info(f"  Wrote {len(global_generated)} routes to {filename}")

        # Write station files if enabled
        if self.config.generation.should_generate_individual():
            logger.info("Writing per-station files...")
            station_files = self.writer.write_station_routes(
                station_routes,
                self.bidirectional_map,
                per_station_filter=self.per_station_routes,
            )
            created_files.extend(station_files)
            logger.info(f"  Wrote {len(station_files)} station files")

        # Write manifest
        logger.info("Writing manifest...")
        gen_stats = self.generator.get_statistics()
        metadata = {
            "global_strategy": (
                str(self.config.generation.global_strategy)
                if self.config.generation.global_strategy
                else None
            ),
            "individual_strategy": (
                str(self.config.generation.individual_strategy)
                if self.config.generation.individual_strategy
                else None
            ),
            "total_routes": len(generated_routes),
            "unique_routes": len(generated_routes),
            "generation_time": time.time(),
            "success_rate": gen_stats["success_rate_pct"],
        }
        self.writer.write_manifest(metadata, created_files)

    def _report_statistics(
        self, routes_requested: int, routes_generated: int, elapsed_seconds: float
    ):
        """
        Log final statistics.

        Args:
            routes_requested: Number of routes requested
            routes_generated: Number of routes successfully generated
            elapsed_seconds: Total elapsed time
        """
        gen_stats = self.generator.get_statistics()

        rate = routes_generated / elapsed_seconds if elapsed_seconds > 0 else 0
        success_rate = (
            (routes_generated / routes_requested * 100) if routes_requested > 0 else 0
        )

        logger.info("\n📊 Pipeline Statistics:")
        if self.config.generation.should_generate_global():
            logger.info(f"   Global: {self.config.generation.global_strategy}")
        if self.config.generation.should_generate_individual():
            logger.info(f"   Individual: {self.config.generation.individual_strategy}")
        if self.config.generation.should_generate_aggregate():
            logger.info(
                f"   Aggregate: {self.config.generation.per_station_aggregate_strategy}"
            )
        logger.info(f"   Routes requested: {routes_requested:,}")
        logger.info(f"   Routes generated: {routes_generated:,}")
        logger.info(f"   Routes failed: {gen_stats['routes_failed']:,}")
        logger.info(f"   Success rate: {success_rate:.1f}%")
        logger.info(f"   Total time: {elapsed_seconds:.1f}s")
        logger.info(f"   Generation rate: {rate:.1f} routes/sec")
        logger.info(f"   Output directory: {self.config.output.base_dir}")


def build_config_from_args(args) -> PipelineConfig:
    """
    Build PipelineConfig from CLI arguments.

    Args:
        args: Parsed command-line arguments

    Returns:
        Configured PipelineConfig

    Raises:
        ValueError: If configuration is invalid
    """
    # Validate mutually exclusive arguments
    if (
        hasattr(args, "global_top")
        and hasattr(args, "global_pct")
        and args.global_top
        and args.global_pct
    ):
        raise ValueError("Cannot specify both --global-top and --global-pct")
    if (
        hasattr(args, "individual_top")
        and hasattr(args, "individual_pct")
        and args.individual_top
        and args.individual_pct
    ):
        raise ValueError("Cannot specify both --individual-top and --individual-pct")
    if (
        hasattr(args, "aggregate_top")
        and hasattr(args, "aggregate_pct")
        and args.aggregate_top
        and args.aggregate_pct
    ):
        raise ValueError("Cannot specify both --aggregate-top and --aggregate-pct")

    # Handle deprecated phase argument
    if hasattr(args, "phase") and args.phase:
        import warnings

        warnings.warn(
            "--phase is deprecated. Use --global-* and --individual-* arguments instead.",
            DeprecationWarning,
            stacklevel=2,
        )
        # Convert to new config
        if args.phase == "phase1":
            global_strategy = RouteSelectionStrategy.create_top_n(1000)
            individual_strategy = None
        else:  # phase2
            coverage = args.coverage if hasattr(args, "coverage") else 80.0
            global_strategy = RouteSelectionStrategy.create_percentage(coverage)
            individual_strategy = RouteSelectionStrategy.create_percentage(coverage)
        aggregate_strategy = None
    else:
        # Determine global strategy
        global_strategy = None
        if not args.no_global:
            if args.global_top:
                global_strategy = RouteSelectionStrategy.create_top_n(args.global_top)
            elif args.global_pct:
                global_strategy = RouteSelectionStrategy.create_percentage(
                    args.global_pct
                )
            else:
                # Default: top 5 routes
                global_strategy = RouteSelectionStrategy.create_top_n(5)

        # Determine individual strategy
        individual_strategy = None
        if not args.no_individual:
            if args.individual_top:
                individual_strategy = RouteSelectionStrategy.create_top_n(
                    args.individual_top
                )
            elif args.individual_pct:
                individual_strategy = RouteSelectionStrategy.create_percentage(
                    args.individual_pct
                )
            else:
                # Default: 80% coverage
                individual_strategy = RouteSelectionStrategy.create_percentage(80.0)

        # Determine per-station aggregate strategy
        aggregate_strategy = None
        if not args.no_aggregate:
            if args.aggregate_top:
                aggregate_strategy = RouteSelectionStrategy.create_top_n(
                    args.aggregate_top
                )
            elif args.aggregate_pct:
                aggregate_strategy = RouteSelectionStrategy.create_percentage(
                    args.aggregate_pct
                )
            # No default for aggregate - only generate if explicitly requested

    # Validate that at least one is enabled
    if (
        global_strategy is None
        and individual_strategy is None
        and aggregate_strategy is None
    ):
        raise ValueError(
            "At least one of global, individual, or aggregate routes must be enabled. "
            "Remove --no-global, --no-individual, or --no-aggregate."
        )

    # Create generation config
    gen_config = RouteGenerationConfig(
        global_strategy=global_strategy,
        individual_strategy=individual_strategy,
        per_station_aggregate_strategy=aggregate_strategy,
        min_trips_threshold=args.min_trips,
    )

    # Create complete pipeline config
    return PipelineConfig(
        valhalla=ValhallaConfig(),
        database=DatabaseConfig.from_env(),
        output=OutputConfig(),
        generation=gen_config,
    )


def main():
    """Main entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description="Generate bicycle routes between HSL bike stations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Use defaults (5 global top routes, 80%% individual coverage)
  python generate_routes.py

  # Only generate top 1000 global routes (no individual)
  python generate_routes.py --global-top 1000 --no-individual

  # Only generate individual station routes with 90%% coverage
  python generate_routes.py --no-global --individual-pct 90

  # Both: top 50 global + 75%% individual
  python generate_routes.py --global-top 50 --individual-pct 75

  # Both with percentage for global too
  python generate_routes.py --global-pct 95 --individual-pct 80

  # Generate aggregate file with top 10 from each station
  python generate_routes.py --aggregate-top 10 --no-global --no-individual

  # All three types with different strategies
  python generate_routes.py --global-top 100 --individual-pct 80 --aggregate-top 5
        """,
    )

    # Global route selection
    global_group = parser.add_argument_group(
        "Global Routes", "Routes for main output file (all stations combined)"
    )
    global_type = global_group.add_mutually_exclusive_group()
    global_type.add_argument(
        "--global-top",
        type=int,
        metavar="N",
        help="Generate top N routes globally (e.g., --global-top 1000)",
    )
    global_type.add_argument(
        "--global-pct",
        type=float,
        metavar="PCT",
        help="Generate routes covering PCT%% of all trips (e.g., --global-pct 95)",
    )
    global_group.add_argument(
        "--no-global", action="store_true", help="Skip generating global routes file"
    )

    # Individual station route selection
    individual_group = parser.add_argument_group(
        "Individual Station Routes", "Routes for per-station files"
    )
    individual_type = individual_group.add_mutually_exclusive_group()
    individual_type.add_argument(
        "--individual-top",
        type=int,
        metavar="N",
        help="Generate top N routes per station (e.g., --individual-top 50)",
    )
    individual_type.add_argument(
        "--individual-pct",
        type=float,
        metavar="PCT",
        help="Generate routes covering PCT%% per station (e.g., --individual-pct 80)",
    )
    individual_group.add_argument(
        "--no-individual",
        action="store_true",
        help="Skip generating per-station route files",
    )

    # Per-station aggregate selection
    aggregate_group = parser.add_argument_group(
        "Per-Station Aggregate", "Single file with top routes from each station"
    )
    aggregate_type = aggregate_group.add_mutually_exclusive_group()
    aggregate_type.add_argument(
        "--aggregate-top",
        type=int,
        metavar="N",
        help="Generate file with top N routes from each station (e.g., --aggregate-top 10)",
    )
    aggregate_type.add_argument(
        "--aggregate-pct",
        type=float,
        metavar="PCT",
        help="Generate file with PCT%% routes from each station (e.g., --aggregate-pct 50)",
    )
    aggregate_group.add_argument(
        "--no-aggregate",
        action="store_true",
        help="Skip generating per-station aggregate file",
    )

    # Other options
    parser.add_argument(
        "--min-trips",
        type=int,
        default=1,
        help="Minimum trips required for a route (default: 1)",
    )
    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
        help="Logging level (default: INFO)",
    )

    # Deprecated phase argument for backwards compatibility
    parser.add_argument(
        "--phase",
        choices=["phase1", "phase2"],
        help="DEPRECATED: Use --global-* and --individual-* instead",
    )
    parser.add_argument(
        "--coverage",
        type=float,
        default=80.0,
        help="DEPRECATED: Used with --phase for backwards compatibility",
    )

    args = parser.parse_args()

    # Setup logging
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    try:
        # Build configuration from arguments
        config = build_config_from_args(args)

        # Run pipeline
        pipeline = RoutePipeline(config)
        pipeline.run()

        return 0

    except KeyboardInterrupt:
        logger.info("\n\n⚠️  Pipeline interrupted by user")
        return 130

    except ValueError as e:
        logger.error(f"\n❌ Configuration error: {e}")
        parser.print_help()
        return 1

    except Exception as e:
        logger.error(f"\n❌ Pipeline failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
