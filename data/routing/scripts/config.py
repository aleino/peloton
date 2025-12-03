#!/usr/bin/env python3
"""Configuration management for route generation pipeline.

Provides flexible route selection strategies:
- TOP_N: Select N most popular routes
- PERCENTAGE: Select routes covering X% of trips

Routes can be selected for:
- Global (main file): Across entire network
- Individual (per-station files): For each station independently
- Aggregate (single file): Top routes from all stations

Example:
    >>> # Default configuration
    >>> config = RouteGenerationConfig.with_defaults()
    >>> print(config.global_strategy.top_n)  # 5
    >>> print(config.individual_strategy.coverage_percentage)  # 80.0
    >>> print(config.per_station_aggregate_strategy)  # None

    >>> # Custom configuration
    >>> config = RouteGenerationConfig(
    ...     global_strategy=RouteSelectionStrategy.top_n(1000),
    ...     individual_strategy=RouteSelectionStrategy.percentage(90.0)
    ... )
"""

import os
import warnings
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal, Optional
from enum import Enum
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class RouteSelectionType(Enum):
    """Type of route selection strategy."""

    TOP_N = "top_n"
    PERCENTAGE = "percentage"


@dataclass
class RouteSelectionStrategy:
    """Strategy for selecting routes to generate."""

    selection_type: RouteSelectionType
    top_n: Optional[int] = None
    coverage_percentage: Optional[float] = None

    @classmethod
    def create_top_n(cls, n: int) -> "RouteSelectionStrategy":
        """Create a top-N selection strategy.

        Args:
            n: Number of top routes to select

        Returns:
            RouteSelectionStrategy configured for top-N selection
        """
        if n < 1:
            raise ValueError(f"N must be positive: {n}")
        return cls(selection_type=RouteSelectionType.TOP_N, top_n=n)

    @classmethod
    def create_percentage(cls, pct: float) -> "RouteSelectionStrategy":
        """Create a percentage coverage selection strategy.

        Args:
            pct: Percentage of trips to cover (0-100)

        Returns:
            RouteSelectionStrategy configured for percentage coverage
        """
        if not (0 < pct <= 100):
            raise ValueError(f"Percentage must be between 0 and 100: {pct}")
        return cls(
            selection_type=RouteSelectionType.PERCENTAGE, coverage_percentage=pct
        )

    def __str__(self) -> str:
        """Human-readable description of strategy."""
        if self.selection_type == RouteSelectionType.TOP_N:
            return f"Top {self.top_n} routes"
        else:
            return f"{self.coverage_percentage}% coverage"


@dataclass
class RouteGenerationConfig:
    """Configuration for route generation strategies."""

    # Route selection strategies (None = disabled)
    global_strategy: Optional[RouteSelectionStrategy] = None
    individual_strategy: Optional[RouteSelectionStrategy] = None
    per_station_aggregate_strategy: Optional[RouteSelectionStrategy] = None

    # Minimum trip threshold
    min_trips_threshold: int = 1

    # Processing settings
    batch_size: int = 50
    log_interval: int = 10

    # Valhalla request settings
    costing: str = "bicycle"
    bicycle_type: str = "Road"

    def should_generate_global(self) -> bool:
        """Check if global routes should be generated."""
        return self.global_strategy is not None

    def should_generate_individual(self) -> bool:
        """Check if individual station routes should be generated."""
        return self.individual_strategy is not None

    def should_generate_aggregate(self) -> bool:
        """Check if per-station aggregate should be generated."""
        return self.per_station_aggregate_strategy is not None

    def __post_init__(self):
        """Validate configuration."""
        # At least one strategy must be enabled
        if not (
            self.should_generate_global()
            or self.should_generate_individual()
            or self.should_generate_aggregate()
        ):
            raise ValueError(
                "At least one of global_strategy, individual_strategy, or "
                "per_station_aggregate_strategy must be set"
            )

        if self.min_trips_threshold < 1:
            raise ValueError(
                f"min_trips_threshold must be positive: {self.min_trips_threshold}"
            )

        if not (1 <= self.batch_size <= 1000):
            raise ValueError(
                f"batch_size must be between 1 and 1000: {self.batch_size}"
            )


def _find_project_root() -> Path:
    """Find project root by looking for marker files.

    Searches upward from the config file location for project markers
    like package.json or .git directory.

    Returns:
        Path to project root, or falls back to calculated path.
    """
    import logging

    logger = logging.getLogger(__name__)

    current = Path(__file__).parent

    # Search up to 5 levels up
    for parent in [current] + list(current.parents)[:5]:
        # Look for project markers
        if (parent / "package.json").exists() or (parent / ".git").exists():
            logger.debug(f"Project root found at: {parent}")
            return parent

    # Fallback with warning
    fallback = current.parent.parent.parent
    logger.warning(
        f"Could not find project root markers (package.json, .git). "
        f"Using fallback: {fallback}. Set OUTPUT_DIR env var to override."
    )
    return fallback


# Get the directory where this config file is located
_CONFIG_DIR: Path = Path(__file__).parent
_PROJECT_ROOT: Path = _find_project_root()
_DEFAULT_OUTPUT_DIR: Path = _PROJECT_ROOT / "frontend" / "public" / "routes"


def _get_output_dir() -> Path:
    """Get output directory from environment variable or default.

    If OUTPUT_DIR env var is set and relative, it will be resolved
    relative to the config file location for consistent behavior.

    Returns:
        Absolute or relative Path to output directory.
    """
    env_dir = os.getenv("OUTPUT_DIR")
    if env_dir:
        path = Path(env_dir)
        # If relative, make it relative to config file
        if not path.is_absolute():
            path = _CONFIG_DIR / path
        return path
    return _DEFAULT_OUTPUT_DIR


@dataclass
class ValhallaConfig:
    """Valhalla routing engine configuration."""

    base_url: str = field(
        default_factory=lambda: os.getenv("VALHALLA_URL", "http://localhost:8002")
    )
    timeout_seconds: int = 30
    max_retries: int = 3
    retry_delay_seconds: float = 1.0
    snap_radius_m: int = 100  # Road snapping radius in meters
    min_reachability_nodes: int = 20  # Minimum reachability for location

    @property
    def route_endpoint(self) -> str:
        """Full URL for route API endpoint."""
        return f"{self.base_url}/route"

    @property
    def status_endpoint(self) -> str:
        """Full URL for status API endpoint."""
        return f"{self.base_url}/status"

    def __post_init__(self):
        """Validate configuration."""
        if not self.base_url.startswith(("http://", "https://")):
            raise ValueError(f"Invalid Valhalla URL: {self.base_url}")


@dataclass
class DatabaseConfig:
    """PostgreSQL database configuration."""

    host: str = field(default_factory=lambda: os.getenv("POSTGRES_HOST", "localhost"))
    port: int = field(default_factory=lambda: int(os.getenv("POSTGRES_PORT", "5432")))
    database: str = field(
        default_factory=lambda: os.getenv("POSTGRES_DB", "peloton_db")
    )
    user: str = field(default_factory=lambda: os.getenv("POSTGRES_USER", "peloton"))
    password: str = field(default_factory=lambda: os.getenv("POSTGRES_PASSWORD", ""))
    schema: str = field(default_factory=lambda: os.getenv("POSTGRES_SCHEMA", "hsl"))

    @property
    def connection_string(self) -> str:
        """PostgreSQL connection string."""
        return (
            f"host={self.host} "
            f"port={self.port} "
            f"dbname={self.database} "
            f"user={self.user} "
            f"password={self.password}"
        )

    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        """Create configuration from environment variables."""
        return cls()

    def __post_init__(self):
        """Validate configuration."""
        if not self.password:
            raise ValueError("POSTGRES_PASSWORD must be set in environment")
        if not (1 <= self.port <= 65535):
            raise ValueError(f"Invalid port: {self.port}")


@dataclass
class OutputConfig:
    """Output file configuration."""

    # Base directory for route files
    base_dir: Path = field(default_factory=_get_output_dir)

    # Subdirectory for per-station files
    station_subdir: str = "by-station"

    # File names
    manifest_filename: str = "manifest.json"

    # Compression settings
    use_compression: bool = True
    compression_level: int = 9  # 1-9, where 9 is max compression

    @property
    def manifest_path(self) -> Path:
        """Full path to manifest file."""
        return self.base_dir / self.manifest_filename

    def top_routes_path(
        self, phase: str = "phase1", coverage_pct: float = 80.0
    ) -> Path:
        """Full path to top routes file.

        Args:
            phase: Generation phase ("phase1", "phase2", etc.)
            coverage_pct: Coverage percentage for phase2+

        Returns:
            Path with appropriate filename for the phase
        """
        if phase == "phase1":
            filename = "top-1000.json.gz"
        else:
            # Phase 2+: Use coverage percentage in filename
            coverage_int = int(coverage_pct)
            filename = f"top-{coverage_int}pct.json.gz"
        return self.base_dir / filename

    def top_routes_filename(
        self, phase: str = "phase1", coverage_pct: float = 80.0
    ) -> str:
        """Get just the filename for top routes.

        Args:
            phase: Generation phase ("phase1", "phase2", etc.)
            coverage_pct: Coverage percentage for phase2+

        Returns:
            Filename string
        """
        if phase == "phase1":
            return "top-1000.json.gz"
        else:
            coverage_int = int(coverage_pct)
            return f"top-{coverage_int}pct.json.gz"

    @property
    def station_dir(self) -> Path:
        """Full path to station directory."""
        return self.base_dir / self.station_subdir

    def station_file_path(self, station_id: str) -> Path:
        """Generate path for a station's route file."""
        filename = (
            f"s{station_id}.json.gz" if self.use_compression else f"s{station_id}.json"
        )
        return self.station_dir / filename

    def __post_init__(self):
        """Resolve paths to absolute and validate."""
        # Only resolve if it's a relative path
        if not self.base_dir.is_absolute():
            self.base_dir = self.base_dir.resolve()

        # Validate that the path makes sense
        path_str = str(self.base_dir).lower()
        if not any(marker in path_str for marker in ["routes", "output", "public"]):
            warnings.warn(
                f"Output directory '{self.base_dir}' doesn't contain expected "
                "markers ('routes', 'output', 'public') - this might indicate "
                "a configuration error",
                UserWarning,
                stacklevel=2,
            )


@dataclass
class GenerationConfig:
    """Pipeline generation configuration (DEPRECATED - use RouteGenerationConfig)."""

    # Execution phase
    phase: Literal["phase1", "phase2"] = "phase1"

    # Phase 1: Top N routes (for MVP)
    phase1_limit: int = 1000

    # Phase 2: All routes with minimum trip threshold
    phase2_min_trips: int = 1

    # Coverage percentage for phase 2/3
    coverage_pct: float = 80.0

    # Processing settings
    batch_size: int = 50  # Routes per batch for progress logging
    log_interval: int = 10  # Log progress every N routes

    # Valhalla request settings
    costing: str = "bicycle"
    bicycle_type: str = "Road"

    @property
    def is_phase1(self) -> bool:
        """Check if running Phase 1."""
        return self.phase == "phase1"

    @property
    def is_phase2(self) -> bool:
        """Check if running Phase 2."""
        return self.phase == "phase2"

    @property
    def route_limit(self) -> int | None:
        """Get route limit for current phase."""
        return self.phase1_limit if self.is_phase1 else None

    @property
    def min_trips(self) -> int:
        """Get minimum trip threshold for current phase."""
        return 0 if self.is_phase1 else self.phase2_min_trips

    def __post_init__(self):
        """Validate configuration."""
        if self.phase not in ("phase1", "phase2"):
            raise ValueError(f"Invalid phase: {self.phase}")
        if self.phase1_limit < 1:
            raise ValueError(f"Phase 1 limit must be positive: {self.phase1_limit}")


@dataclass
class PipelineConfig:
    """Complete pipeline configuration."""

    valhalla: ValhallaConfig = field(default_factory=ValhallaConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    output: OutputConfig = field(default_factory=OutputConfig)
    generation: RouteGenerationConfig = field(
        default_factory=lambda: RouteGenerationConfig(
            global_strategy=RouteSelectionStrategy.create_top_n(5),
            individual_strategy=RouteSelectionStrategy.create_percentage(80.0),
        )
    )

    @classmethod
    def from_env(
        cls, phase: Literal["phase1", "phase2"] = "phase1", coverage: float = 80.0
    ) -> "PipelineConfig":
        """
        Create complete configuration from environment (DEPRECATED).

        Use build_config_from_args() instead for new CLI interface.

        Args:
            phase: Execution phase ('phase1' or 'phase2')
            coverage: Coverage percentage for phase2/phase3 (default: 80.0)
        """
        warnings.warn(
            "PipelineConfig.from_env() is deprecated. Use the new CLI arguments instead.",
            DeprecationWarning,
            stacklevel=2,
        )

        # Convert old phase-based config to new strategy-based config
        if phase == "phase1":
            gen_config = RouteGenerationConfig(
                global_strategy=RouteSelectionStrategy.create_top_n(1000),
                individual_strategy=None,
            )
        else:
            gen_config = RouteGenerationConfig(
                global_strategy=RouteSelectionStrategy.create_percentage(coverage),
                individual_strategy=RouteSelectionStrategy.create_percentage(coverage),
            )

        return cls(
            valhalla=ValhallaConfig(),
            database=DatabaseConfig.from_env(),
            output=OutputConfig(),
            generation=gen_config,
        )

    def validate(self) -> bool:
        """Validate complete configuration."""
        # All validation happens in __post_init__ of sub-configs
        return True

    def summary(self) -> str:
        """Generate configuration summary for logging."""
        output_exists = "✅ exists" if self.output.base_dir.exists() else "⚠️  not found"

        # Build route selection summary
        route_summary = []
        if self.generation.should_generate_global():
            route_summary.append(f"Global: {self.generation.global_strategy}")
        if self.generation.should_generate_individual():
            route_summary.append(f"Individual: {self.generation.individual_strategy}")
        if self.generation.should_generate_aggregate():
            route_summary.append(
                f"Aggregate: {self.generation.per_station_aggregate_strategy}"
            )

        routes_text = "\n".join(f"  - {s}" for s in route_summary)

        return f"""
Pipeline Configuration
======================
Route Selection:
{routes_text}
Min Trips: {self.generation.min_trips_threshold}

Database: {self.database.host}:{self.database.port}/{self.database.database}
Schema: {self.database.schema}

Valhalla: {self.valhalla.base_url}
Timeout: {self.valhalla.timeout_seconds}s
Max Retries: {self.valhalla.max_retries}

Output Directory: {self.output.base_dir} ({output_exists})
Compression: {self.output.use_compression}
======================
        """.strip()


# Example usage and testing
if __name__ == "__main__":
    print("Testing configuration loading...\n")

    # Test individual configs
    valhalla = ValhallaConfig()
    print(f"Valhalla URL: {valhalla.base_url}")
    print(f"Route endpoint: {valhalla.route_endpoint}")
    print(f"Status endpoint: {valhalla.status_endpoint}")

    # Test database config
    try:
        db = DatabaseConfig.from_env()
        print(f"\nDatabase: {db.host}:{db.port}/{db.database}")
        print(f"Schema: {db.schema}")
        print(f"Connection string: {db.connection_string[:50]}...")
    except ValueError as e:
        print(f"\n⚠️  Database config error: {e}")
        print("Make sure .env file has POSTGRES_PASSWORD set")

    # Test output config
    output = OutputConfig()
    print(f"\nOutput directory: {output.base_dir}")
    print(f"Manifest path: {output.manifest_path}")
    print(f"Station directory: {output.station_dir}")
    print(f"Example station file: {output.station_file_path('030')}")

    # Test generation config
    gen = GenerationConfig(phase="phase1")
    print(f"\nGeneration phase: {gen.phase}")
    print(f"Route limit: {gen.route_limit}")
    print(f"Is Phase 1: {gen.is_phase1}")

    # Test complete pipeline config
    try:
        config = PipelineConfig.from_env(phase="phase1")
        print(f"\n{config.summary()}")
    except ValueError as e:
        print(f"\n⚠️  Configuration error: {e}")
