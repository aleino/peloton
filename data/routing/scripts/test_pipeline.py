#!/usr/bin/env python3
"""Unit tests for route generation pipeline."""

import pytest
from models import RouteStatistics, StationCoordinate, RouteGeometry, RouteFileEntry
import polyline


class TestRouteKeyLogic:
    """Test bidirectional route key generation."""

    def test_canonical_order(self):
        """Route keys should always be in sorted order."""
        route1 = RouteStatistics("030", "067", 100, 2500, 600)
        route2 = RouteStatistics("067", "030", 80, 2500, 600)

        assert route1.route_key == "030-067"
        assert route2.route_key == "030-067"
        assert route1.route_key == route2.route_key

    def test_is_reversed(self):
        """Test reverse detection."""
        forward = RouteStatistics("030", "067", 100, 2500, 600)
        reverse = RouteStatistics("067", "030", 80, 2500, 600)

        assert not forward.is_reversed
        assert reverse.is_reversed

    def test_self_loop_different_key(self):
        """Routes to same station should have different keys."""
        route1 = RouteStatistics("030", "045", 100, 2500, 600)
        route2 = RouteStatistics("030", "067", 100, 2500, 600)

        assert route1.route_key != route2.route_key

    def test_numeric_station_ids(self):
        """Test with numeric station IDs."""
        route1 = RouteStatistics("001", "002", 50, 1500, 400)
        route2 = RouteStatistics("002", "001", 60, 1500, 400)

        assert route1.route_key == "001-002"
        assert route2.route_key == "001-002"

    def test_three_digit_stations(self):
        """Test with three-digit station IDs."""
        route = RouteStatistics("123", "456", 75, 3000, 800)
        assert route.route_key == "123-456"


class TestPolylineEncoding:
    """Test polyline encoding/decoding."""

    def test_encode_decode_roundtrip(self):
        """Encoding then decoding should return original."""
        original_coords = [
            (60.1695, 24.9354),
            (60.1712, 24.9412),
            (60.1720, 24.9450),
        ]

        # Encode
        encoded = polyline.encode(original_coords, precision=6)

        # Decode
        decoded = polyline.decode(encoded, precision=6)

        # Should match (within floating point precision)
        for (lat1, lon1), (lat2, lon2) in zip(original_coords, decoded):
            assert abs(lat1 - lat2) < 0.000001
            assert abs(lon1 - lon2) < 0.000001

    def test_precision_6_encoding(self):
        """Test that precision-6 encoding works."""
        coords = [(60.1695, 24.9354)]
        encoded = polyline.encode(coords, precision=6)

        assert isinstance(encoded, str)
        assert len(encoded) > 0

        # Decode should work
        decoded = polyline.decode(encoded, precision=6)
        assert len(decoded) == 1

    def test_multiple_points(self):
        """Test encoding multiple points."""
        coords = [
            (60.1695, 24.9354),
            (60.1700, 24.9360),
            (60.1705, 24.9365),
            (60.1710, 24.9370),
        ]
        encoded = polyline.encode(coords, precision=6)
        decoded = polyline.decode(encoded, precision=6)

        assert len(decoded) == len(coords)


class TestStationCoordinates:
    """Test station coordinate handling."""

    def test_valid_coordinates(self):
        """Valid coordinates should work."""
        station = StationCoordinate("030", 60.1695, 24.9354)
        assert station.station_id == "030"
        assert station.latitude == 60.1695
        assert station.longitude == 24.9354

    def test_to_valhalla_location(self):
        """Should convert to Valhalla format."""
        station = StationCoordinate("030", 60.1695, 24.9354)
        loc = station.to_valhalla_location()

        assert loc == {"lat": 60.1695, "lon": 24.9354}

    def test_invalid_latitude_high(self):
        """Invalid latitude should raise error."""
        with pytest.raises(ValueError, match="Invalid latitude"):
            StationCoordinate("030", 91.0, 24.9354)

    def test_invalid_latitude_low(self):
        """Invalid latitude should raise error."""
        with pytest.raises(ValueError, match="Invalid latitude"):
            StationCoordinate("030", -91.0, 24.9354)

    def test_invalid_longitude_high(self):
        """Invalid longitude should raise error."""
        with pytest.raises(ValueError, match="Invalid longitude"):
            StationCoordinate("030", 60.1695, 181.0)

    def test_invalid_longitude_low(self):
        """Invalid longitude should raise error."""
        with pytest.raises(ValueError, match="Invalid longitude"):
            StationCoordinate("030", 60.1695, -181.0)

    def test_edge_case_coordinates(self):
        """Test edge case valid coordinates."""
        # North Pole
        station1 = StationCoordinate("001", 90.0, 0.0)
        assert station1.latitude == 90.0

        # South Pole
        station2 = StationCoordinate("002", -90.0, 0.0)
        assert station2.latitude == -90.0

        # Date line
        station3 = StationCoordinate("003", 0.0, 180.0)
        assert station3.longitude == 180.0


class TestRouteStatistics:
    """Test route statistics validation."""

    def test_valid_statistics(self):
        """Valid statistics should work."""
        stats = RouteStatistics("030", "067", 100, 2500.0, 600.0)
        assert stats.trip_count == 100
        assert stats.avg_distance_m == 2500.0
        assert stats.avg_duration_s == 600.0

    def test_invalid_trip_count(self):
        """Zero or negative trip count should raise error."""
        with pytest.raises(ValueError, match="Trip count must be positive"):
            RouteStatistics("030", "067", 0, 2500.0, 600.0)

    def test_invalid_distance(self):
        """Negative distance should raise error."""
        with pytest.raises(ValueError, match="Distance cannot be negative"):
            RouteStatistics("030", "067", 100, -100.0, 600.0)

    def test_invalid_duration(self):
        """Negative duration should raise error."""
        with pytest.raises(ValueError, match="Duration cannot be negative"):
            RouteStatistics("030", "067", 100, 2500.0, -100.0)


class TestRouteGeometry:
    """Test route geometry handling."""

    def test_valid_geometry(self):
        """Valid geometry should work."""
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
        """Test file entry creation for forward route."""
        geom = RouteGeometry("030-067", "030", "067", "abc", 2.5, 10.0)
        entry = geom.to_file_entry(is_reverse=False)

        assert entry.from_station == "030"
        assert entry.to_station == "067"
        assert entry.direction == "forward"
        assert entry.bidirectional is True

    def test_to_file_entry_reverse(self):
        """Test file entry creation for reverse route."""
        geom = RouteGeometry("030-067", "030", "067", "abc", 2.5, 10.0)
        entry = geom.to_file_entry(is_reverse=True)

        assert entry.direction == "reverse"
        assert entry.bidirectional is True

    def test_empty_polyline(self):
        """Empty polyline should raise error."""
        with pytest.raises(ValueError, match="Polyline cannot be empty"):
            RouteGeometry("030-067", "030", "067", "", 2.5, 10.0)

    def test_negative_distance(self):
        """Negative distance should raise error."""
        with pytest.raises(ValueError, match="Distance cannot be negative"):
            RouteGeometry("030-067", "030", "067", "abc", -2.5, 10.0)

    def test_negative_duration(self):
        """Negative duration should raise error."""
        with pytest.raises(ValueError, match="Duration cannot be negative"):
            RouteGeometry("030-067", "030", "067", "abc", 2.5, -10.0)


class TestRouteFileEntry:
    """Test route file entry format."""

    def test_valid_entry(self):
        """Valid entry should work."""
        entry = RouteFileEntry(
            from_station="030",
            to_station="067",
            polyline="abc",
            direction="forward",
            bidirectional=True,
        )
        assert entry.from_station == "030"
        assert entry.to_station == "067"

    def test_to_dict(self):
        """Test dictionary conversion."""
        entry = RouteFileEntry("030", "067", "abc", "forward", True)
        d = entry.to_dict()

        assert d["from"] == "030"
        assert d["to"] == "067"
        assert d["polyline"] == "abc"
        assert d["direction"] == "forward"
        assert d["bidirectional"] is True

    def test_invalid_direction(self):
        """Invalid direction should raise error."""
        with pytest.raises(ValueError, match="Direction must be"):
            RouteFileEntry("030", "067", "abc", "sideways", True)

    def test_same_stations(self):
        """Same from/to stations should raise error."""
        with pytest.raises(ValueError, match="cannot be the same"):
            RouteFileEntry("030", "030", "abc", "forward", True)


class TestFileStructure:
    """Test output file structure validation."""

    def test_manifest_structure(self):
        """Test that manifest has required fields."""
        required_fields = [
            "generated_at",
            "version",
            "phase",
            "statistics",
            "files",
            "format",
        ]

        # This would be an actual manifest in integration tests
        manifest = {
            "generated_at": "2025-11-30T12:00:00Z",
            "version": "1.0",
            "phase": "phase1",
            "statistics": {},
            "files": {},
            "format": {},
        }

        for field in required_fields:
            assert field in manifest

    def test_station_file_format(self):
        """Test that station file has required structure."""
        station_file = {
            "station_id": "030",
            "routes": [
                {
                    "to": "067",
                    "polyline": "abc",
                    "direction": "forward",
                    "bidirectional": True,
                    "distance_km": 2.5,
                    "duration_min": 10.0,
                }
            ],
            "count": 1,
        }

        assert "station_id" in station_file
        assert "routes" in station_file
        assert "count" in station_file
        assert len(station_file["routes"]) == station_file["count"]

    def test_route_entry_format(self):
        """Test route entry has required fields."""
        route_entry = {
            "to": "067",
            "polyline": "abc",
            "direction": "forward",
            "bidirectional": True,
            "distance_km": 2.5,
            "duration_min": 10.0,
        }

        required_fields = [
            "to",
            "polyline",
            "direction",
            "bidirectional",
            "distance_km",
            "duration_min",
        ]

        for field in required_fields:
            assert field in route_entry


def run_tests():
    """Run all tests with pytest."""
    return pytest.main([__file__, "-v", "--tb=short"])


if __name__ == "__main__":
    import sys

    sys.exit(run_tests())
