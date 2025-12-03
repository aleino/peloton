#!/usr/bin/env python3
"""Unit tests for data models."""

import pytest
from models import StationCoordinate, RouteStatistics, RouteGeometry, RouteFileEntry


class TestStationCoordinate:
    def test_valid_coordinate(self):
        station = StationCoordinate("030", 60.1695, 24.9354)
        assert station.station_id == "030"
        assert station.latitude == 60.1695
        assert station.longitude == 24.9354

    def test_invalid_latitude(self):
        with pytest.raises(ValueError, match="Invalid latitude"):
            StationCoordinate("030", 91.0, 24.9354)

    def test_invalid_longitude(self):
        with pytest.raises(ValueError, match="Invalid longitude"):
            StationCoordinate("030", 60.1695, 181.0)

    def test_to_valhalla_location(self):
        station = StationCoordinate("030", 60.1695, 24.9354)
        loc = station.to_valhalla_location()
        assert loc == {"lat": 60.1695, "lon": 24.9354}


class TestRouteStatistics:
    def test_route_key_canonical_order(self):
        """Test that route keys are always in sorted order."""
        route1 = RouteStatistics("030", "067", 100, 2500.0, 600.0)
        route2 = RouteStatistics("067", "030", 80, 2500.0, 600.0)

        assert route1.route_key == "030-067"
        assert route2.route_key == "030-067"
        assert route1.route_key == route2.route_key

    def test_is_reversed_property(self):
        """Test reverse detection."""
        forward = RouteStatistics("030", "067", 100, 2500.0, 600.0)
        reverse = RouteStatistics("067", "030", 80, 2500.0, 600.0)

        assert not forward.is_reversed
        assert reverse.is_reversed

    def test_invalid_trip_count(self):
        with pytest.raises(ValueError, match="Trip count must be positive"):
            RouteStatistics("030", "067", 0, 2500.0, 600.0)

    def test_negative_distance(self):
        with pytest.raises(ValueError, match="Distance cannot be negative"):
            RouteStatistics("030", "067", 100, -100.0, 600.0)


class TestRouteGeometry:
    def test_valid_geometry(self):
        geom = RouteGeometry(
            route_key="030-067",
            departure_station_id="030",
            return_station_id="067",
            polyline="u`~nJqafxC",
            distance_km=2.5,
            duration_minutes=10.0,
        )
        assert geom.route_key == "030-067"
        assert geom.polyline == "u`~nJqafxC"

    def test_to_file_entry_forward(self):
        geom = RouteGeometry("030-067", "030", "067", "abc", 2.5, 10.0)
        entry = geom.to_file_entry(is_reverse=False)

        assert entry.from_station == "030"
        assert entry.to_station == "067"
        assert entry.direction == "forward"
        assert entry.bidirectional is True

    def test_to_file_entry_reverse(self):
        geom = RouteGeometry("030-067", "030", "067", "abc", 2.5, 10.0)
        entry = geom.to_file_entry(is_reverse=True)

        assert entry.direction == "reverse"


class TestRouteFileEntry:
    def test_to_dict(self):
        entry = RouteFileEntry("030", "067", "abc", "forward", True)
        data = entry.to_dict()

        assert data == {
            "from": "030",
            "to": "067",
            "polyline": "abc",
            "direction": "forward",
            "bidirectional": True,
        }

    def test_invalid_direction(self):
        with pytest.raises(ValueError, match="Direction must be"):
            RouteFileEntry("030", "067", "abc", "sideways", True)

    def test_same_station(self):
        with pytest.raises(ValueError, match="cannot be the same"):
            RouteFileEntry("030", "030", "abc", "forward", True)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
