#!/usr/bin/env python3
"""Data models for route generation pipeline."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class StationCoordinate:
    """Station with geographic coordinates from database."""

    station_id: str
    latitude: float
    longitude: float

    def __post_init__(self):
        """Validate coordinates."""
        if not (-90 <= self.latitude <= 90):
            raise ValueError(f"Invalid latitude: {self.latitude}")
        if not (-180 <= self.longitude <= 180):
            raise ValueError(f"Invalid longitude: {self.longitude}")

    def to_valhalla_location(self) -> dict:
        """Convert to Valhalla API location format."""
        return {"lat": self.latitude, "lon": self.longitude}


@dataclass
class RouteStatistics:
    """Trip statistics for a station pair from database analysis."""

    departure_station_id: str
    return_station_id: str
    trip_count: int
    avg_distance_m: float
    avg_duration_s: float

    @property
    def route_key(self) -> str:
        """
        Normalized route key for bidirectional deduplication.

        Always returns stations in sorted order so that:
        - RouteStatistics("030", "067", ...).route_key == "030-067"
        - RouteStatistics("067", "030", ...).route_key == "030-067"

        This ensures we only generate one geometry per station pair.
        """
        stations = sorted([self.departure_station_id, self.return_station_id])
        return f"{stations[0]}-{stations[1]}"

    @property
    def is_reversed(self) -> bool:
        """Check if this route is in reverse order compared to canonical key."""
        return self.departure_station_id > self.return_station_id

    def __post_init__(self):
        """Validate statistics."""
        if self.trip_count < 1:
            raise ValueError(f"Trip count must be positive: {self.trip_count}")
        if self.avg_distance_m < 0:
            raise ValueError(f"Distance cannot be negative: {self.avg_distance_m}")
        if self.avg_duration_s < 0:
            raise ValueError(f"Duration cannot be negative: {self.avg_duration_s}")


@dataclass
class RouteGeometry:
    """Generated route geometry from Valhalla."""

    route_key: str  # Canonical key (sorted stations)
    departure_station_id: str
    return_station_id: str
    polyline: str  # Encoded polyline (precision 6)
    distance_km: float
    duration_minutes: float

    def __post_init__(self):
        """Validate route geometry."""
        import logging

        logger = logging.getLogger(__name__)

        if not self.polyline:
            raise ValueError("Polyline cannot be empty")
        if self.distance_km < 0:
            raise ValueError(f"Distance cannot be negative: {self.distance_km}")
        if self.duration_minutes < 0:
            raise ValueError(f"Duration cannot be negative: {self.duration_minutes}")

        # Sanity check for bicycle routes (warn about unusually long routes)
        if self.distance_km > 100:
            logger.warning(
                f"Unusually long bicycle route: {self.distance_km:.1f}km "
                f"for {self.route_key}"
            )

    def to_file_entry(self, is_reverse: bool) -> "RouteFileEntry":
        """
        Convert to file output format.

        Args:
            is_reverse: True if this geometry represents the reverse direction
                       (e.g., geometry is A→B but we're outputting B→A)
        """
        return RouteFileEntry(
            from_station=self.departure_station_id,
            to_station=self.return_station_id,
            polyline=self.polyline,
            direction="reverse" if is_reverse else "forward",
            bidirectional=True,  # All routes are bidirectional
        )


@dataclass
class RouteFileEntry:
    """Route entry format for JSON output files."""

    from_station: str  # Station ID (e.g., "030")
    to_station: str  # Station ID (e.g., "067")
    polyline: str  # Encoded polyline geometry
    direction: str  # "forward" or "reverse"
    bidirectional: bool  # Always True (can use geometry in both directions)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "from": self.from_station,
            "to": self.to_station,
            "polyline": self.polyline,
            "direction": self.direction,
            "bidirectional": self.bidirectional,
        }

    def __post_init__(self):
        """Validate file entry."""
        if self.direction not in ("forward", "reverse"):
            raise ValueError(
                f"Direction must be 'forward' or 'reverse': {self.direction}"
            )
        if self.from_station == self.to_station:
            raise ValueError(
                f"From and to stations cannot be the same: {self.from_station}"
            )


# Example usage and testing
if __name__ == "__main__":
    # Test StationCoordinate
    station = StationCoordinate("030", 60.1695, 24.9354)
    print(f"Station: {station.station_id} at ({station.latitude}, {station.longitude})")
    print(f"Valhalla format: {station.to_valhalla_location()}")

    # Test RouteStatistics with bidirectional key
    route1 = RouteStatistics("030", "067", 100, 2500.0, 600.0)
    route2 = RouteStatistics("067", "030", 80, 2500.0, 600.0)
    print(f"\nRoute 030→067 key: {route1.route_key}")
    print(f"Route 067→030 key: {route2.route_key}")
    print(f"Keys match: {route1.route_key == route2.route_key}")
    print(f"Route1 reversed: {route1.is_reversed}")
    print(f"Route2 reversed: {route2.is_reversed}")

    # Test RouteGeometry
    geometry = RouteGeometry(
        route_key="030-067",
        departure_station_id="030",
        return_station_id="067",
        polyline="u`~nJqafxC...",  # Sample encoded polyline
        distance_km=2.5,
        duration_minutes=10.0,
    )
    print(f"\nGeometry: {geometry.route_key}")

    # Test RouteFileEntry
    entry = geometry.to_file_entry(is_reverse=False)
    print(f"File entry: {entry.to_dict()}")
