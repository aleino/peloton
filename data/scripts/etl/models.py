"""Data models for HSL bike trip pipeline.

This module defines dataclasses for stations and trips, providing
type-safe data structures for the ETL pipeline.
"""

from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Optional


@dataclass
class StationData:
    """Represents a bike station with geographic coordinates.

    Attributes:
        station_id: Unique identifier for the station
        name: Human-readable station name
        lat: Latitude coordinate (WGS84)
        lon: Longitude coordinate (WGS84)
    """

    station_id: str
    name: str
    lat: float
    lon: float

    def __post_init__(self):
        """Validate station data after initialization."""
        if not self.station_id or not self.station_id.strip():
            raise ValueError("station_id cannot be empty")
        if not self.name or not self.name.strip():
            raise ValueError("name cannot be empty")
        if not (-90 <= self.lat <= 90):
            raise ValueError(f"Invalid latitude: {self.lat}")
        if not (-180 <= self.lon <= 180):
            raise ValueError(f"Invalid longitude: {self.lon}")


@dataclass
class RawTripData:
    """Raw trip data as parsed from CSV files.

    This represents the data directly from CSV before enrichment.
    """

    departure_time: datetime
    return_time: datetime
    departure_station_id: str
    departure_station_name: str
    return_station_id: str
    return_station_name: str
    distance_meters: int
    duration_seconds: int


@dataclass
class EnrichedTripData:
    """Enriched trip data with derived fields ready for database insertion.

    Includes all raw data plus computed date/time components.
    """

    # Original fields
    departure_time: datetime
    return_time: datetime
    departure_station_id: str
    return_station_id: str
    distance_meters: int
    duration_seconds: int

    # Derived fields from departure_time
    departure_date: date
    departure_hour: int
    departure_weekday: int

    # Derived fields from return_time
    return_date: date
    return_hour: int
    return_weekday: int


@dataclass
class ValidationError:
    """Represents a data validation error for logging.

    Attributes:
        row_number: Line number in CSV file (if applicable)
        error_type: Category of validation error
        message: Human-readable error description
        raw_data: Optional dictionary of the problematic data
    """

    row_number: Optional[int]
    error_type: str
    message: str
    raw_data: Optional[dict] = None


@dataclass
class PipelineMetrics:
    """Tracks pipeline execution metrics for reporting.

    This class accumulates statistics during pipeline execution
    for generating the final summary report.
    """

    files_processed: int = 0
    total_rows: int = 0
    valid_rows: int = 0
    invalid_rows: int = 0
    stations_loaded: int = 0
    stations_updated: int = 0
    stations_missing: int = 0
    trips_inserted: int = 0
    duplicates_skipped: int = 0

    parsing_errors: int = 0
    validation_errors: int = 0
    database_errors: int = 0

    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    validation_errors_by_type: dict = field(default_factory=dict)

    @property
    def duration_seconds(self) -> float:
        """Calculate total execution duration in seconds."""
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return 0.0

    @property
    def rows_per_second(self) -> float:
        """Calculate processing throughput."""
        duration = self.duration_seconds
        if duration > 0:
            return self.total_rows / duration
        return 0.0

    @property
    def success_rate(self) -> float:
        """Calculate percentage of valid rows (0.0-100.0)."""
        if self.total_rows == 0:
            return 0.0
        return (self.valid_rows / self.total_rows) * 100.0

    @property
    def invalid_rate(self) -> float:
        """Calculate percentage of invalid rows (0.0-100.0)."""
        if self.total_rows == 0:
            return 0.0
        return (self.invalid_rows / self.total_rows) * 100.0

    @property
    def insertion_rate(self) -> float:
        """Calculate percentage of valid trips successfully inserted (0.0-100.0)."""
        if self.valid_rows == 0:
            return 0.0
        return (self.trips_inserted / self.valid_rows) * 100.0

    @property
    def duplicate_rate(self) -> float:
        """Calculate percentage of rows that were duplicates (0.0-100.0)."""
        if self.total_rows == 0:
            return 0.0
        return (self.duplicates_skipped / self.total_rows) * 100.0

    @property
    def error_rate(self) -> float:
        """Calculate total error rate including parsing, validation, and database errors (0.0-100.0)."""
        if self.total_rows == 0:
            return 0.0
        total_errors = (
            self.parsing_errors + self.validation_errors + self.database_errors
        )
        return (total_errors / self.total_rows) * 100.0

    def to_dict(self) -> dict:
        """Convert metrics to dictionary for JSON serialization."""
        return {
            "execution_time": self.start_time.isoformat() if self.start_time else None,
            "duration_seconds": round(self.duration_seconds, 2),
            "files_processed": self.files_processed,
            "stations": {
                "loaded": self.stations_loaded,
                "updated": self.stations_updated,
                "missing": self.stations_missing,
            },
            "trips": {
                "total_rows": self.total_rows,
                "valid_rows": self.valid_rows,
                "invalid_rows": self.invalid_rows,
                "inserted": self.trips_inserted,
                "duplicates_skipped": self.duplicates_skipped,
                "success_rate": round(self.success_rate, 2),
                "invalid_rate": round(self.invalid_rate, 2),
            },
            "errors": {
                "parsing_errors": self.parsing_errors,
                "validation_errors": self.validation_errors,
                "database_errors": self.database_errors,
                "error_rate": round(self.error_rate, 2),
                "by_type": self.validation_errors_by_type,
            },
            "performance": {
                "rows_per_second": round(self.rows_per_second, 2),
                "insertion_rate": round(self.insertion_rate, 2),
                "duplicate_rate": round(self.duplicate_rate, 2),
            },
        }
