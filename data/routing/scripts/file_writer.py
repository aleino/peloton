#!/usr/bin/env python3
"""File writing and organization for route geometries."""

import json
import gzip
import logging
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime, UTC
from collections import defaultdict

from models import RouteGeometry, RouteStatistics
from config import OutputConfig

logger = logging.getLogger(__name__)


class RouteFileWriter:
    """Writes route geometries to JSON files with compression."""

    def __init__(self, output_config: OutputConfig):
        """
        Initialize file writer.

        Args:
            output_config: Output configuration
        """
        self.config = output_config

    def setup_directories(self):
        """Create output directory structure."""
        # Create base directory
        self.config.base_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created base directory: {self.config.base_dir}")

        # Create station subdirectory
        self.config.station_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created station directory: {self.config.station_dir}")

    def write_manifest(self, metadata: Dict, station_files: List[str]):
        """
        Write manifest file with generation metadata.

        Args:
            metadata: Generation metadata (phase, timestamp, counts, etc.)
            station_files: List of station file names
        """
        phase = metadata.get("phase", "phase1")
        coverage_pct = metadata.get("coverage_pct", 80.0)

        manifest = {
            "generated_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            "version": "1.0",
            "phase": phase,
            "statistics": {
                "total_routes": metadata.get("total_routes", 0),
                "unique_routes": metadata.get("unique_routes", 0),
                "stations_count": len(station_files),
                "generation_time_seconds": metadata.get("generation_time", 0),
                "success_rate_pct": metadata.get("success_rate", 0),
            },
            "files": {
                "top_routes": self.config.top_routes_filename(
                    phase=phase, coverage_pct=coverage_pct
                ),
                "station_files": sorted(station_files),
            },
            "format": {
                "encoding": "polyline",
                "precision": 6,
                "compression": "gzip" if self.config.use_compression else "none",
            },
        }

        manifest_path = self.config.manifest_path
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)

        logger.info(f"Wrote manifest: {manifest_path}")

    def write_popular_routes(
        self,
        routes: List[RouteGeometry],
        phase: str = "phase1",
        coverage_pct: float = 80.0,
    ):
        """
        Write top-N most popular routes to a single file.

        Args:
            routes: List of route geometries
            phase: Generation phase for filename
            coverage_pct: Coverage percentage for phase2+
        """
        filepath = self.config.top_routes_path(phase=phase, coverage_pct=coverage_pct)

        # Convert routes to JSON format
        data = {
            "routes": [
                {
                    "route_key": route.route_key,
                    "from": route.departure_station_id,
                    "to": route.return_station_id,
                    "polyline": route.polyline,
                    "distance_km": round(route.distance_km, 2),
                    "duration_min": round(route.duration_minutes, 1),
                    "bidirectional": True,
                }
                for route in routes
            ],
            "count": len(routes),
        }

        self._write_gzipped_json(filepath, data)

        file_size = filepath.stat().st_size
        logger.info(
            f"Wrote {len(routes)} popular routes to {filepath.name} "
            f"({file_size:,} bytes)"
        )

    def write_global_routes(
        self,
        routes: List[RouteGeometry],
        strategy: "RouteSelectionStrategy",  # Forward reference
    ) -> str:
        """
        Write global routes file with new naming convention.

        Args:
            routes: List of route geometries
            strategy: Route selection strategy used

        Returns:
            Filename of created file
        """
        # Determine filename based on strategy
        from config import RouteSelectionType

        if strategy.selection_type == RouteSelectionType.TOP_N:
            filename = f"top-{strategy.top_n}.json.gz"
        else:  # PERCENTAGE
            pct_int = int(strategy.coverage_percentage)
            filename = f"top-{pct_int}pct.json.gz"

        filepath = self.config.base_dir / filename

        # Convert routes to JSON format
        data = {
            "generation_strategy": {
                "type": strategy.selection_type.value,
                "value": (
                    strategy.top_n
                    if strategy.selection_type.value == "top_n"
                    else strategy.coverage_percentage
                ),
            },
            "routes": [
                {
                    "route_key": route.route_key,
                    "from": route.departure_station_id,
                    "to": route.return_station_id,
                    "polyline": route.polyline,
                    "distance_km": round(route.distance_km, 2),
                    "duration_min": round(route.duration_minutes, 1),
                    "bidirectional": True,
                }
                for route in routes
            ],
            "count": len(routes),
        }

        self._write_gzipped_json(filepath, data)

        file_size = filepath.stat().st_size
        logger.info(
            f"Wrote {len(routes)} global routes to {filepath.name} "
            f"({file_size:,} bytes)"
        )

        return filename

    def write_station_routes(
        self,
        station_routes: Dict[str, List[RouteGeometry]],
        bidirectional_map: Dict[str, RouteStatistics],
        per_station_filter: Optional[Dict[str, List[RouteStatistics]]] = None,
    ) -> List[str]:
        """
        Write per-station route files.

        Each station gets one file with all routes departing from that station.
        Routes may be in "forward" or "reverse" direction based on canonical key.

        Args:
            station_routes: Dict mapping station_id to list of ALL available routes
            bidirectional_map: Dict mapping route_key to reverse route statistics
            per_station_filter: Optional dict of station_id -> routes to include
                               If provided, only these routes are written per station

        Returns:
            List of created filenames
        """
        created_files = []

        for station_id, all_routes in sorted(station_routes.items()):
            filepath = self.config.station_file_path(station_id)

            # Filter routes if per_station_filter provided
            if per_station_filter and station_id in per_station_filter:
                # Get allowed route keys for this station
                allowed_keys = set()
                for route_stat in per_station_filter[station_id]:
                    # Create route key
                    key = f"{min(route_stat.departure_station_id, route_stat.return_station_id)}-{max(route_stat.departure_station_id, route_stat.return_station_id)}"
                    allowed_keys.add(key)

                # Filter routes
                routes = [r for r in all_routes if r.route_key in allowed_keys]
            else:
                routes = all_routes

            # Convert routes to JSON format with direction info
            route_entries = []
            for route in routes:
                # Determine if this is forward or reverse direction
                is_reverse = route.departure_station_id != min(
                    route.departure_station_id, route.return_station_id
                )

                entry = {
                    "to": route.return_station_id,
                    "polyline": route.polyline,
                    "direction": "reverse" if is_reverse else "forward",
                    "bidirectional": True,
                    "distance_km": round(route.distance_km, 2),
                    "duration_min": round(route.duration_minutes, 1),
                }
                route_entries.append(entry)

            data = {
                "station_id": station_id,
                "routes": route_entries,
                "count": len(route_entries),
            }

            self._write_gzipped_json(filepath, data)
            created_files.append(filepath.name)

        total_size = sum(
            self.config.station_file_path(station_id).stat().st_size
            for station_id in station_routes
        )

        logger.info(
            f"Wrote {len(station_routes)} station files "
            f"(total: {total_size:,} bytes)"
        )

        return created_files

    def _write_gzipped_json(self, filepath: Path, data: Dict):
        """
        Write JSON data with gzip compression.

        Args:
            filepath: Output file path
            data: Data to write as JSON
        """
        if self.config.use_compression and not str(filepath).endswith(".gz"):
            filepath = Path(str(filepath) + ".gz")

        if self.config.use_compression:
            with gzip.open(
                filepath,
                "wt",
                encoding="utf-8",
                compresslevel=self.config.compression_level,
            ) as f:
                json.dump(data, f, separators=(",", ":"))
        else:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)

    def organize_by_station(
        self, routes: List[RouteGeometry], bidirectional_map: Dict[str, RouteStatistics]
    ) -> Dict[str, List[RouteGeometry]]:
        """
        Organize routes by departure station.

        Creates a dictionary where each station has a list of routes
        departing from it. Handles bidirectional routes by including
        both directions.

        Args:
            routes: List of all route geometries (unique only)
            bidirectional_map: Dict mapping route_key to reverse route

        Returns:
            Dict mapping station_id to list of routes
        """
        station_routes = defaultdict(list)

        for route in routes:
            # Add forward direction
            station_routes[route.departure_station_id].append(route)

            # Check if there's a reverse direction
            if route.route_key in bidirectional_map:
                reverse_route_stats = bidirectional_map[route.route_key]

                # Create reverse route geometry using same polyline
                reverse_route = RouteGeometry(
                    route_key=route.route_key,  # Same canonical key
                    departure_station_id=reverse_route_stats.departure_station_id,
                    return_station_id=reverse_route_stats.return_station_id,
                    polyline=route.polyline,  # Same geometry
                    distance_km=route.distance_km,
                    duration_minutes=route.duration_minutes,
                )

                station_routes[reverse_route.departure_station_id].append(reverse_route)

        logger.info(
            f"Organized {len(routes)} routes into {len(station_routes)} "
            f"station files"
        )

        return dict(station_routes)


# Example usage and testing
if __name__ == "__main__":
    import sys
    from config import OutputConfig
    from models import RouteGeometry, RouteStatistics

    # Setup logging
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    try:
        # Create config with test output directory
        config = OutputConfig(base_dir=Path("./test_output"))
        writer = RouteFileWriter(config)

        # Setup directories
        print("Setting up directories...")
        writer.setup_directories()
        print(f"✅ Created: {config.base_dir}")
        print(f"✅ Created: {config.station_dir}")

        # Create sample routes
        print("\nCreating sample routes...")
        sample_routes = [
            RouteGeometry(
                route_key="030-067",
                departure_station_id="030",
                return_station_id="067",
                polyline="u`~nJqafxC_@aA",
                distance_km=2.5,
                duration_minutes=10.0,
            ),
            RouteGeometry(
                route_key="030-045",
                departure_station_id="030",
                return_station_id="045",
                polyline="w`~nJsafxC_@cB",
                distance_km=1.8,
                duration_minutes=8.0,
            ),
        ]

        # Create bidirectional map
        bidirectional_map = {"030-067": RouteStatistics("067", "030", 80, 2500, 600)}

        # Write popular routes
        print("\nWriting popular routes file...")
        writer.write_popular_routes(sample_routes)
        print(f"✅ Wrote: {config.top_routes_path}")

        # Organize by station
        print("\nOrganizing routes by station...")
        station_routes = writer.organize_by_station(sample_routes, bidirectional_map)
        print(f"Stations: {list(station_routes.keys())}")
        for station_id, routes in station_routes.items():
            print(f"  {station_id}: {len(routes)} routes")

        # Write station files
        print("\nWriting station files...")
        created_files = writer.write_station_routes(station_routes, bidirectional_map)
        for filename in created_files:
            print(f"✅ Wrote: {filename}")

        # Write manifest
        print("\nWriting manifest...")
        metadata = {
            "phase": "test",
            "total_routes": len(sample_routes),
            "unique_routes": len(sample_routes),
            "generation_time": 10.5,
            "success_rate": 100.0,
        }
        writer.write_manifest(metadata, created_files)
        print(f"✅ Wrote: {config.manifest_filename}")

        # Display manifest
        with open(config.manifest_path) as f:
            manifest = json.load(f)
        print("\n📄 Manifest content:")
        print(json.dumps(manifest, indent=2))

        # Cleanup test output
        import shutil

        print(f"\nCleaning up test directory...")
        shutil.rmtree(config.base_dir)
        print("✅ Test complete!")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
