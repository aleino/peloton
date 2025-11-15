"""Data validator for HSL bike trip records.

This module provides comprehensive validation rules for trip data
to ensure data quality and integrity before database insertion.
"""

import logging
from typing import Set, Optional
from datetime import timedelta

from models import RawTripData, ValidationError


logger = logging.getLogger(__name__)


class TripValidator:
    """Validates trip data according to HSL data quality rules.

    Attributes:
        max_speed_kmh: Maximum realistic speed for bike trips
        duration_tolerance_sec: Tolerance for duration vs timestamp difference
        min_duration_sec: Minimum trip duration
        valid_station_ids: Set of valid station IDs from database
    """

    def __init__(
        self,
        max_speed_kmh: float = 50.0,
        duration_tolerance_sec: int = 60,
        min_duration_sec: int = 1,
        valid_station_ids: Optional[Set[str]] = None,
    ):
        """Initialize validator with configuration.

        Args:
            max_speed_kmh: Maximum allowed average speed
            duration_tolerance_sec: Allowed difference between actual and recorded duration
            min_duration_sec: Minimum acceptable trip duration
            valid_station_ids: Set of station IDs that exist in database
        """
        self.max_speed_kmh = max_speed_kmh
        self.duration_tolerance_sec = duration_tolerance_sec
        self.min_duration_sec = min_duration_sec
        self.valid_station_ids = valid_station_ids or set()

    def validate_timestamps(
        self, trip: RawTripData, row_number: Optional[int] = None
    ) -> Optional[ValidationError]:
        """Validate that timestamps are logical.

        Checks:
        - return_time > departure_time
        - Both timestamps are valid datetime objects

        Args:
            trip: Trip data to validate
            row_number: Optional row number for error reporting

        Returns:
            ValidationError if invalid, None if valid
        """
        if trip.return_time <= trip.departure_time:
            return ValidationError(
                row_number=row_number,
                error_type="invalid_timestamps",
                message=f"Return time ({trip.return_time}) must be after departure time ({trip.departure_time})",
            )

        return None

    def validate_duration(
        self, trip: RawTripData, row_number: Optional[int] = None
    ) -> Optional[ValidationError]:
        """Validate trip duration matches timestamps.

        Checks:
        - duration_seconds > min_duration_sec
        - duration_seconds ≈ actual time difference (±tolerance)

        Args:
            trip: Trip data to validate
            row_number: Optional row number for error reporting

        Returns:
            ValidationError if invalid, None if valid
        """
        # Check minimum duration
        if trip.duration_seconds < self.min_duration_sec:
            return ValidationError(
                row_number=row_number,
                error_type="invalid_duration",
                message=f"Duration ({trip.duration_seconds}s) is below minimum ({self.min_duration_sec}s)",
            )

        # Calculate actual duration from timestamps
        actual_duration = (trip.return_time - trip.departure_time).total_seconds()
        duration_diff = abs(actual_duration - trip.duration_seconds)

        # Check if recorded duration matches actual duration within tolerance
        if duration_diff > self.duration_tolerance_sec:
            return ValidationError(
                row_number=row_number,
                error_type="duration_mismatch",
                message=f"Duration mismatch: recorded={trip.duration_seconds}s, actual={actual_duration:.0f}s, diff={duration_diff:.0f}s",
            )

        return None

    def validate_distance(
        self, trip: RawTripData, row_number: Optional[int] = None
    ) -> Optional[ValidationError]:
        """Validate trip distance is non-negative.

        Args:
            trip: Trip data to validate
            row_number: Optional row number for error reporting

        Returns:
            ValidationError if invalid, None if valid
        """
        if trip.distance_meters < 0:
            return ValidationError(
                row_number=row_number,
                error_type="invalid_distance",
                message=f"Distance cannot be negative: {trip.distance_meters}m",
            )

        return None

    def validate_average_speed(
        self, trip: RawTripData, row_number: Optional[int] = None
    ) -> Optional[ValidationError]:
        """Validate average speed is realistic.

        Checks that average speed doesn't exceed max_speed_kmh.

        Args:
            trip: Trip data to validate
            row_number: Optional row number for error reporting

        Returns:
            ValidationError if invalid, None if valid
        """
        if trip.duration_seconds == 0:
            return ValidationError(
                row_number=row_number,
                error_type="zero_duration",
                message="Cannot calculate speed: duration is zero",
            )

        # Calculate average speed in km/h
        distance_km = trip.distance_meters / 1000.0
        duration_hours = trip.duration_seconds / 3600.0
        average_speed = distance_km / duration_hours

        if average_speed > self.max_speed_kmh:
            return ValidationError(
                row_number=row_number,
                error_type="excessive_speed",
                message=f"Average speed {average_speed:.1f} km/h exceeds maximum {self.max_speed_kmh} km/h",
            )

        return None

    def validate_station_ids(
        self, trip: RawTripData, row_number: Optional[int] = None
    ) -> Optional[ValidationError]:
        """Validate that station IDs exist in database.

        Args:
            trip: Trip data to validate
            row_number: Optional row number for error reporting

        Returns:
            ValidationError if invalid, None if valid
        """
        if not self.valid_station_ids:
            # Skip validation if station IDs not loaded
            return None

        missing_stations = []

        if trip.departure_station_id not in self.valid_station_ids:
            missing_stations.append(f"departure: {trip.departure_station_id}")

        if trip.return_station_id not in self.valid_station_ids:
            missing_stations.append(f"return: {trip.return_station_id}")

        if missing_stations:
            return ValidationError(
                row_number=row_number,
                error_type="missing_station",
                message=f'Missing station references: {", ".join(missing_stations)}',
            )

        return None

    def validate_trip(
        self, trip: RawTripData, row_number: Optional[int] = None
    ) -> list[ValidationError]:
        """Run all validation checks on a trip.

        Args:
            trip: Trip data to validate
            row_number: Optional row number for error reporting

        Returns:
            List of ValidationErrors (empty if all validations pass)
        """
        errors = []

        # Run all validation checks
        validators = [
            self.validate_timestamps,
            self.validate_duration,
            self.validate_distance,
            self.validate_average_speed,
            self.validate_station_ids,
        ]

        for validator in validators:
            error = validator(trip, row_number)
            if error:
                errors.append(error)

        return errors

    def validate_batch(
        self, trips: list[RawTripData], starting_row: int = 0
    ) -> tuple[list[RawTripData], list[ValidationError]]:
        """Validate a batch of trips.

        Args:
            trips: List of RawTripData to validate
            starting_row: Starting row number for error reporting

        Returns:
            Tuple of (valid_trips, validation_errors)
        """
        valid_trips = []
        all_errors = []

        for idx, trip in enumerate(trips):
            row_number = starting_row + idx
            errors = self.validate_trip(trip, row_number)

            if not errors:
                valid_trips.append(trip)
            else:
                all_errors.extend(errors)

        if all_errors:
            logger.debug(
                f"Validation rejected {len(all_errors)} trips out of {len(trips)}"
            )

        return (valid_trips, all_errors)


def create_validator_from_config(
    config: dict, valid_station_ids: Set[str]
) -> TripValidator:
    """Create TripValidator from configuration dictionary.

    Args:
        config: Configuration dict with 'validation' section
        valid_station_ids: Set of valid station IDs

    Returns:
        Configured TripValidator instance
    """
    validation_config = config.get("validation", {})

    return TripValidator(
        max_speed_kmh=validation_config.get("max_speed_kmh", 50.0),
        duration_tolerance_sec=validation_config.get("duration_tolerance_sec", 60),
        min_duration_sec=validation_config.get("min_duration_sec", 1),
        valid_station_ids=valid_station_ids,
    )
