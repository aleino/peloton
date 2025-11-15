"""Data enricher for adding derived fields to trip data.

This module transforms RawTripData into EnrichedTripData by extracting
date/time components needed for analytics queries.
"""

import logging
from typing import List
from datetime import datetime

from models import RawTripData, EnrichedTripData


logger = logging.getLogger(__name__)


def extract_date_components(timestamp: datetime) -> dict:
    """Extract date components from a timestamp.

    Args:
        timestamp: Datetime to extract components from

    Returns:
        Dictionary with date, hour, and weekday
    """
    return {
        "date": timestamp.date(),
        "hour": timestamp.hour,
        "weekday": timestamp.weekday(),  # Monday=0, Sunday=6
    }


def enrich_trip_data(trip: RawTripData) -> EnrichedTripData:
    """Enrich raw trip data with derived fields.

    Extracts date, hour, and weekday from departure and return timestamps.

    Args:
        trip: Raw trip data to enrich

    Returns:
        EnrichedTripData with all derived fields populated
    """
    # Extract departure components
    departure_components = extract_date_components(trip.departure_time)

    # Extract return components
    return_components = extract_date_components(trip.return_time)

    # Create enriched trip
    enriched = EnrichedTripData(
        # Original fields
        departure_time=trip.departure_time,
        return_time=trip.return_time,
        departure_station_id=trip.departure_station_id,
        return_station_id=trip.return_station_id,
        distance_meters=trip.distance_meters,
        duration_seconds=trip.duration_seconds,
        # Derived departure fields
        departure_date=departure_components["date"],
        departure_hour=departure_components["hour"],
        departure_weekday=departure_components["weekday"],
        # Derived return fields
        return_date=return_components["date"],
        return_hour=return_components["hour"],
        return_weekday=return_components["weekday"],
    )

    return enriched


def enrich_trip_batch(trips: List[RawTripData]) -> List[EnrichedTripData]:
    """Enrich a batch of trip records.

    Args:
        trips: List of raw trip data

    Returns:
        List of enriched trip data
    """
    enriched_trips = [enrich_trip_data(trip) for trip in trips]

    logger.debug(f"Enriched {len(enriched_trips)} trip records")

    return enriched_trips


def validate_enriched_data(trip: EnrichedTripData) -> bool:
    """Validate that enriched data has reasonable values.

    Performs sanity checks on derived fields.

    Args:
        trip: Enriched trip data to validate

    Returns:
        True if valid, False otherwise
    """
    # Validate hour ranges (0-23)
    if not (0 <= trip.departure_hour <= 23):
        logger.warning(f"Invalid departure hour: {trip.departure_hour}")
        return False

    if not (0 <= trip.return_hour <= 23):
        logger.warning(f"Invalid return hour: {trip.return_hour}")
        return False

    # Validate weekday ranges (0-6)
    if not (0 <= trip.departure_weekday <= 6):
        logger.warning(f"Invalid departure weekday: {trip.departure_weekday}")
        return False

    if not (0 <= trip.return_weekday <= 6):
        logger.warning(f"Invalid return weekday: {trip.return_weekday}")
        return False

    # Validate dates are not None
    if trip.departure_date is None or trip.return_date is None:
        logger.warning("Departure or return date is None")
        return False

    return True
