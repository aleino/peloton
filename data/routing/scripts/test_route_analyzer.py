#!/usr/bin/env python3
"""Integration tests for RouteAnalyzer."""

import pytest
from route_analyzer import RouteAnalyzer
from config import DatabaseConfig


class TestRouteAnalyzer:
    @pytest.fixture
    def analyzer(self):
        """Create analyzer with database connection."""
        config = DatabaseConfig.from_env()
        analyzer = RouteAnalyzer(config)
        analyzer.connect()
        yield analyzer
        analyzer.close()

    def test_database_connection(self, analyzer):
        """Test database connection works."""
        assert analyzer.conn is not None
        assert not analyzer.conn.closed

    def test_get_statistics_summary(self, analyzer):
        """Test statistics summary query."""
        stats = analyzer.get_statistics_summary()

        assert "total_trips" in stats
        assert "unique_stations" in stats
        assert stats["total_trips"] > 0
        assert stats["unique_stations"] > 0

    def test_get_top_routes(self, analyzer):
        """Test top N routes query."""
        routes = analyzer.get_top_n_routes(n=10)

        assert len(routes) == 10
        assert all(r.trip_count > 0 for r in routes)
        # Should be sorted by trip count descending
        assert routes[0].trip_count >= routes[-1].trip_count

    def test_deduplication(self, analyzer):
        """Test bidirectional deduplication."""
        routes = analyzer.get_route_statistics(min_trips=10)
        unique, reverse_map = analyzer.deduplicate_bidirectional(routes)

        # Should reduce route count
        assert len(unique) < len(routes)
        # Roughly half (some routes may be one-way dominant)
        assert len(unique) >= len(routes) * 0.4
        assert len(unique) <= len(routes) * 0.6

    def test_get_station_coordinates(self, analyzer):
        """Test fetching station coordinates."""
        coords = analyzer.get_station_coordinates(["030", "067"])

        assert "030" in coords
        assert "067" in coords
        assert -90 <= coords["030"].latitude <= 90
        assert -180 <= coords["030"].longitude <= 180

    def test_route_statistics_with_minimum_trips(self, analyzer):
        """Test filtering routes by minimum trip count."""
        routes_10 = analyzer.get_route_statistics(min_trips=10)
        routes_100 = analyzer.get_route_statistics(min_trips=100)

        # Higher threshold should return fewer routes
        assert len(routes_100) < len(routes_10)
        # All routes should meet minimum threshold
        assert all(r.trip_count >= 100 for r in routes_100)

    def test_get_all_routes(self, analyzer):
        """Test getting all routes (min_trips=1)."""
        all_routes = analyzer.get_all_routes()

        assert len(all_routes) > 0
        assert all(r.trip_count >= 1 for r in all_routes)

    def test_route_key_consistency(self, analyzer):
        """Test that route keys are consistently normalized."""
        routes = analyzer.get_route_statistics(min_trips=100)

        for route in routes:
            # Route key should always be in sorted order
            stations = sorted([route.departure_station_id, route.return_station_id])
            expected_key = f"{stations[0]}-{stations[1]}"
            assert route.route_key == expected_key

    def test_missing_station_coordinates(self, analyzer):
        """Test handling of non-existent station IDs."""
        coords = analyzer.get_station_coordinates(["999", "000"])

        # Should handle missing stations gracefully
        # May return empty dict or partial results depending on data
        assert isinstance(coords, dict)

    def test_get_routes_by_station_coverage(self, analyzer):
        """Test per-station coverage calculation."""
        station_routes = analyzer.get_routes_by_station_coverage(coverage_pct=80.0)

        # Verify structure
        assert isinstance(station_routes, dict)
        assert len(station_routes) > 0

        # Check a specific station if it exists
        if "030" in station_routes:
            routes = station_routes["030"]
            assert len(routes) > 0
            assert all(r.departure_station_id == "030" for r in routes)
            assert all(r.trip_count > 0 for r in routes)

        # Verify all routes are from their respective stations
        for station_id, routes in station_routes.items():
            assert all(r.departure_station_id == station_id for r in routes)

    def test_get_global_coverage_routes(self, analyzer):
        """Test global coverage calculation."""
        routes = analyzer.get_global_coverage_routes(coverage_pct=80.0)

        assert len(routes) > 0
        assert all(r.trip_count > 0 for r in routes)

        # Routes should be sorted by trip count descending
        for i in range(len(routes) - 1):
            assert routes[i].trip_count >= routes[i + 1].trip_count

        # Verify coverage is approximately 80%
        all_routes = analyzer.get_route_statistics(min_trips=1)
        total_trips = sum(r.trip_count for r in all_routes)
        covered_trips = sum(r.trip_count for r in routes)
        coverage_pct = (covered_trips / total_trips) * 100

        # Should be around 80% (±5% tolerance)
        assert 75.0 <= coverage_pct <= 85.0

    def test_station_coverage_different_percentages(self, analyzer):
        """Test per-station coverage with different percentages."""
        routes_50 = analyzer.get_routes_by_station_coverage(coverage_pct=50.0)
        routes_80 = analyzer.get_routes_by_station_coverage(coverage_pct=80.0)

        # Higher coverage should result in more routes
        total_50 = sum(len(routes) for routes in routes_50.values())
        total_80 = sum(len(routes) for routes in routes_80.values())
        assert total_80 > total_50

    def test_global_coverage_different_percentages(self, analyzer):
        """Test global coverage with different percentages."""
        routes_50 = analyzer.get_global_coverage_routes(coverage_pct=50.0)
        routes_80 = analyzer.get_global_coverage_routes(coverage_pct=80.0)

        # Higher coverage should result in more routes
        assert len(routes_80) > len(routes_50)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
