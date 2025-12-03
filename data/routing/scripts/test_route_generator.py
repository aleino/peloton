#!/usr/bin/env python3
"""Tests for RouteGenerator."""

import pytest
from route_generator import RouteGenerator
from models import StationCoordinate
from config import ValhallaConfig, GenerationConfig


class TestRouteGenerator:
    @pytest.fixture
    def generator(self):
        """Create route generator."""
        valhalla = ValhallaConfig()
        generation = GenerationConfig()
        return RouteGenerator(valhalla, generation)

    def test_connection(self, generator):
        """Test Valhalla connectivity."""
        assert generator.test_connection()

    def test_generate_route(self, generator):
        """Test single route generation."""
        station_a = StationCoordinate("030", 60.1695, 24.9354)
        station_b = StationCoordinate("067", 60.1712, 24.9412)

        route = generator.generate_route(station_a, station_b)

        assert route is not None
        assert route.route_key == "030-067"
        assert route.distance_km > 0
        assert route.duration_minutes > 0
        assert len(route.polyline) > 10

    def test_bidirectional_routes(self, generator):
        """Test that forward and reverse routes have same key."""
        station_a = StationCoordinate("030", 60.1695, 24.9354)
        station_b = StationCoordinate("067", 60.1712, 24.9412)

        route_forward = generator.generate_route(station_a, station_b)
        route_reverse = generator.generate_route(station_b, station_a)

        assert route_forward is not None
        assert route_reverse is not None
        assert route_forward.route_key == route_reverse.route_key

    def test_generate_batch(self, generator):
        """Test batch route generation."""
        station_pairs = [
            (
                StationCoordinate("030", 60.1695, 24.9354),
                StationCoordinate("067", 60.1712, 24.9412),
            ),
            (
                StationCoordinate("030", 60.1695, 24.9354),
                StationCoordinate("094", 60.1620, 24.9210),
            ),
        ]

        routes = generator.generate_batch(station_pairs)

        assert len(routes) > 0
        assert all(isinstance(r.route_key, str) for r in routes)
        assert all(r.distance_km > 0 for r in routes)

    def test_statistics(self, generator):
        """Test statistics tracking."""
        stats = generator.get_statistics()

        assert "total_requests" in stats
        assert "routes_generated" in stats
        assert "routes_failed" in stats
        assert "success_rate_pct" in stats


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
