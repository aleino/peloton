"""Unit tests for HSL bike trip data pipeline.

Tests cover data models, validators, enrichers, and core functionality.
"""

import pytest
from datetime import datetime, date
from models import (
    StationData,
    RawTripData,
    EnrichedTripData,
    ValidationError,
    PipelineMetrics,
)
from validator import TripValidator
from enricher import enrich_trip_data, extract_date_components


class TestStationData:
    """Test StationData model validation."""

    def test_valid_station(self):
        """Test creating a valid station."""
        station = StationData(
            station_id="123", name="Test Station", lat=60.1699, lon=24.9384
        )
        assert station.station_id == "123"
        assert station.name == "Test Station"

    def test_invalid_latitude(self):
        """Test that invalid latitude raises error."""
        with pytest.raises(ValueError, match="Invalid latitude"):
            StationData(
                station_id="123", name="Test", lat=100.0, lon=24.9384  # Invalid
            )

    def test_invalid_longitude(self):
        """Test that invalid longitude raises error."""
        with pytest.raises(ValueError, match="Invalid longitude"):
            StationData(
                station_id="123", name="Test", lat=60.1699, lon=200.0  # Invalid
            )

    def test_empty_station_id(self):
        """Test that empty station_id raises error."""
        with pytest.raises(ValueError, match="station_id cannot be empty"):
            StationData(station_id="", name="Test", lat=60.1699, lon=24.9384)


class TestTripValidator:
    """Test trip data validation logic."""

    @pytest.fixture
    def valid_trip(self):
        """Create a valid trip for testing."""
        return RawTripData(
            departure_time=datetime(2024, 6, 1, 10, 0, 0),
            return_time=datetime(2024, 6, 1, 10, 30, 0),
            departure_station_id="001",
            departure_station_name="Station A",
            return_station_id="002",
            return_station_name="Station B",
            distance_meters=5000,
            duration_seconds=1800,
        )

    @pytest.fixture
    def validator(self):
        """Create validator with test configuration."""
        return TripValidator(
            max_speed_kmh=50.0,
            duration_tolerance_sec=60,
            min_duration_sec=1,
            valid_station_ids={"001", "002"},
        )

    def test_valid_trip_passes(self, validator, valid_trip):
        """Test that valid trip passes all validations."""
        errors = validator.validate_trip(valid_trip)
        assert len(errors) == 0

    def test_invalid_timestamps(self, validator):
        """Test that return before departure fails validation."""
        trip = RawTripData(
            departure_time=datetime(2024, 6, 1, 10, 30, 0),
            return_time=datetime(2024, 6, 1, 10, 0, 0),  # Before departure
            departure_station_id="001",
            departure_station_name="Station A",
            return_station_id="002",
            return_station_name="Station B",
            distance_meters=5000,
            duration_seconds=1800,
        )

        error = validator.validate_timestamps(trip)
        assert error is not None
        assert error.error_type == "invalid_timestamps"

    def test_duration_too_short(self, validator):
        """Test that trip duration below minimum fails."""
        trip = RawTripData(
            departure_time=datetime(2024, 6, 1, 10, 0, 0),
            return_time=datetime(2024, 6, 1, 10, 0, 1),
            departure_station_id="001",
            departure_station_name="Station A",
            return_station_id="002",
            return_station_name="Station B",
            distance_meters=10,
            duration_seconds=0,  # Too short
        )

        error = validator.validate_duration(trip)
        assert error is not None
        assert error.error_type == "invalid_duration"

    def test_excessive_speed(self, validator):
        """Test that unrealistic speed fails validation."""
        trip = RawTripData(
            departure_time=datetime(2024, 6, 1, 10, 0, 0),
            return_time=datetime(2024, 6, 1, 10, 1, 0),  # 1 minute
            departure_station_id="001",
            departure_station_name="Station A",
            return_station_id="002",
            return_station_name="Station B",
            distance_meters=100000,  # 100km in 1 minute = 6000 km/h
            duration_seconds=60,
        )

        error = validator.validate_average_speed(trip)
        assert error is not None
        assert error.error_type == "excessive_speed"

    def test_missing_station(self, validator):
        """Test that missing station ID fails validation."""
        trip = RawTripData(
            departure_time=datetime(2024, 6, 1, 10, 0, 0),
            return_time=datetime(2024, 6, 1, 10, 30, 0),
            departure_station_id="999",  # Not in valid_station_ids
            departure_station_name="Unknown Station",
            return_station_id="002",
            return_station_name="Station B",
            distance_meters=5000,
            duration_seconds=1800,
        )

        error = validator.validate_station_ids(trip)
        assert error is not None
        assert error.error_type == "missing_station"

    def test_negative_distance(self, validator):
        """Test that negative distance fails validation."""
        trip = RawTripData(
            departure_time=datetime(2024, 6, 1, 10, 0, 0),
            return_time=datetime(2024, 6, 1, 10, 30, 0),
            departure_station_id="001",
            departure_station_name="Station A",
            return_station_id="002",
            return_station_name="Station B",
            distance_meters=-100,  # Negative
            duration_seconds=1800,
        )

        error = validator.validate_distance(trip)
        assert error is not None
        assert error.error_type == "invalid_distance"


class TestDataEnricher:
    """Test data enrichment functionality."""

    def test_extract_date_components(self):
        """Test extracting date components from timestamp."""
        timestamp = datetime(2024, 6, 15, 14, 30, 0)  # Saturday, June 15, 2024

        components = extract_date_components(timestamp)

        assert components["date"] == date(2024, 6, 15)
        assert components["hour"] == 14
        assert components["weekday"] == 5  # Saturday (Monday=0)

    def test_enrich_trip_data(self):
        """Test enriching trip with derived fields."""
        raw_trip = RawTripData(
            departure_time=datetime(2024, 6, 1, 10, 0, 0),  # Saturday
            return_time=datetime(2024, 6, 1, 10, 30, 0),
            departure_station_id="001",
            departure_station_name="Station A",
            return_station_id="002",
            return_station_name="Station B",
            distance_meters=5000,
            duration_seconds=1800,
        )

        enriched = enrich_trip_data(raw_trip)

        # Check original fields preserved
        assert enriched.departure_time == raw_trip.departure_time
        assert enriched.return_time == raw_trip.return_time
        assert enriched.distance_meters == 5000
        assert enriched.duration_seconds == 1800

        # Check derived fields
        assert enriched.departure_date == date(2024, 6, 1)
        assert enriched.departure_hour == 10
        assert enriched.departure_weekday == 5  # Saturday

        assert enriched.return_date == date(2024, 6, 1)
        assert enriched.return_hour == 10
        assert enriched.return_weekday == 5


class TestPipelineMetrics:
    """Test pipeline metrics tracking."""

    def test_metrics_initialization(self):
        """Test that metrics start at zero."""
        metrics = PipelineMetrics()

        assert metrics.files_processed == 0
        assert metrics.total_rows == 0
        assert metrics.valid_rows == 0
        assert metrics.invalid_rows == 0

    def test_duration_calculation(self):
        """Test execution duration calculation."""
        metrics = PipelineMetrics()
        metrics.start_time = datetime(2024, 6, 1, 10, 0, 0)
        metrics.end_time = datetime(2024, 6, 1, 10, 2, 30)

        duration = metrics.duration_seconds
        assert duration == 150.0  # 2.5 minutes

    def test_throughput_calculation(self):
        """Test rows per second calculation."""
        metrics = PipelineMetrics()
        metrics.start_time = datetime(2024, 6, 1, 10, 0, 0)
        metrics.end_time = datetime(2024, 6, 1, 10, 1, 0)
        metrics.total_rows = 10000

        throughput = metrics.rows_per_second
        assert throughput == pytest.approx(166.67, rel=0.01)

    def test_success_rate(self):
        """Test success rate calculation."""
        metrics = PipelineMetrics()
        metrics.total_rows = 1000
        metrics.valid_rows = 850

        assert metrics.success_rate == 85.0

        # Test edge case with zero rows
        empty_metrics = PipelineMetrics()
        assert empty_metrics.success_rate == 0.0

    def test_invalid_rate(self):
        """Test invalid rate calculation."""
        metrics = PipelineMetrics()
        metrics.total_rows = 1000
        metrics.invalid_rows = 150

        assert metrics.invalid_rate == 15.0

    def test_insertion_rate(self):
        """Test insertion rate calculation."""
        metrics = PipelineMetrics()
        metrics.valid_rows = 1000
        metrics.trips_inserted = 950

        assert metrics.insertion_rate == 95.0

        # Test edge case with zero valid rows
        empty_metrics = PipelineMetrics()
        assert empty_metrics.insertion_rate == 0.0

    def test_duplicate_rate(self):
        """Test duplicate rate calculation."""
        metrics = PipelineMetrics()
        metrics.total_rows = 1000
        metrics.duplicates_skipped = 50

        assert metrics.duplicate_rate == 5.0

    def test_error_rate(self):
        """Test total error rate calculation."""
        metrics = PipelineMetrics()
        metrics.total_rows = 1000
        metrics.parsing_errors = 10
        metrics.validation_errors = 30
        metrics.database_errors = 5

        assert metrics.error_rate == 4.5  # (10+30+5)/1000 * 100

    def test_to_dict(self):
        """Test converting metrics to dictionary."""
        metrics = PipelineMetrics()
        metrics.files_processed = 5
        metrics.total_rows = 10000
        metrics.valid_rows = 9500
        metrics.invalid_rows = 500
        metrics.trips_inserted = 9000
        metrics.duplicates_skipped = 100
        metrics.start_time = datetime(2024, 6, 1, 10, 0, 0)
        metrics.end_time = datetime(2024, 6, 1, 10, 1, 0)

        result = metrics.to_dict()

        assert result["files_processed"] == 5
        assert result["trips"]["total_rows"] == 10000
        assert result["trips"]["valid_rows"] == 9500
        assert "duration_seconds" in result
        assert "success_rate" in result["trips"]
        assert "invalid_rate" in result["trips"]
        assert "insertion_rate" in result["performance"]
        assert "duplicate_rate" in result["performance"]
        assert "error_rate" in result["errors"]
