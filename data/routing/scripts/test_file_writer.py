#!/usr/bin/env python3
"""Tests for RouteFileWriter."""

import pytest
import json
import gzip
from pathlib import Path
import shutil

from file_writer import RouteFileWriter
from models import RouteGeometry, RouteStatistics
from config import OutputConfig


class TestRouteFileWriter:
    """Test suite for RouteFileWriter."""

    @pytest.fixture
    def test_dir(self, tmp_path):
        """Create temporary test directory."""
        return tmp_path / "test_routes"

    @pytest.fixture
    def writer(self, test_dir):
        """Create file writer with test directory."""
        config = OutputConfig(base_dir=test_dir)
        return RouteFileWriter(config)

    @pytest.fixture
    def sample_routes(self):
        """Create sample routes for testing."""
        return [
            RouteGeometry("030-067", "030", "067", "abc", 2.5, 10.0),
            RouteGeometry("030-045", "030", "045", "def", 1.8, 8.0),
        ]

    @pytest.fixture
    def bidirectional_map(self):
        """Create sample bidirectional map."""
        return {"030-067": RouteStatistics("067", "030", 80, 2500, 600)}

    def test_setup_directories(self, writer, test_dir):
        """Test directory creation."""
        writer.setup_directories()

        assert test_dir.exists()
        assert (test_dir / "by-station").exists()

    def test_write_popular_routes(self, writer, sample_routes, test_dir):
        """Test writing popular routes file."""
        writer.setup_directories()
        writer.write_popular_routes(sample_routes)

        filepath = test_dir / "top-1000.json.gz"
        assert filepath.exists()

        # Verify content
        with gzip.open(filepath, "rt") as f:
            data = json.load(f)

        assert data["count"] == 2
        assert len(data["routes"]) == 2
        assert data["routes"][0]["route_key"] == "030-067"
        assert data["routes"][0]["from"] == "030"
        assert data["routes"][0]["to"] == "067"
        assert data["routes"][0]["bidirectional"] is True

    def test_organize_by_station(self, writer, sample_routes, bidirectional_map):
        """Test station organization."""
        station_routes = writer.organize_by_station(sample_routes, bidirectional_map)

        # Should have 2 stations: 030 (2 routes), 067 (1 route from reverse)
        # Note: 045 is only a destination, no bidirectional pair exists for it
        assert "030" in station_routes
        assert "067" in station_routes

        assert len(station_routes["030"]) == 2  # Two routes from 030 (to 067, to 045)
        assert (
            len(station_routes["067"]) == 1
        )  # One route from 067 (reverse of 030-067)

    def test_organize_by_station_reverse_direction(
        self, writer, sample_routes, bidirectional_map
    ):
        """Test that reverse routes use same polyline."""
        station_routes = writer.organize_by_station(sample_routes, bidirectional_map)

        # Find the reverse route from 067 to 030
        reverse_routes = [
            r for r in station_routes["067"] if r.return_station_id == "030"
        ]
        assert len(reverse_routes) == 1

        reverse_route = reverse_routes[0]
        original_route = [r for r in sample_routes if r.route_key == "030-067"][0]

        # Should use same polyline
        assert reverse_route.polyline == original_route.polyline
        assert reverse_route.route_key == original_route.route_key

    def test_write_station_routes(
        self, writer, sample_routes, bidirectional_map, test_dir
    ):
        """Test writing station files."""
        writer.setup_directories()

        station_routes = writer.organize_by_station(sample_routes, bidirectional_map)

        created_files = writer.write_station_routes(station_routes, bidirectional_map)

        # Should create 2 files (030 and 067 only, 045 is only a destination)
        assert len(created_files) == 2
        assert "s030.json.gz" in created_files
        assert "s067.json.gz" in created_files

        # Verify file exists and content
        filepath = test_dir / "by-station" / "s030.json.gz"
        assert filepath.exists()

        with gzip.open(filepath, "rt") as f:
            data = json.load(f)

        assert data["station_id"] == "030"
        assert data["count"] == 2
        assert len(data["routes"]) == 2

    def test_station_file_direction_field(
        self, writer, sample_routes, bidirectional_map, test_dir
    ):
        """Test that direction field is correctly set."""
        writer.setup_directories()

        station_routes = writer.organize_by_station(sample_routes, bidirectional_map)

        writer.write_station_routes(station_routes, bidirectional_map)

        # Check forward direction (030 -> 067)
        filepath = test_dir / "by-station" / "s030.json.gz"
        with gzip.open(filepath, "rt") as f:
            data = json.load(f)

        route_to_067 = [r for r in data["routes"] if r["to"] == "067"][0]
        assert route_to_067["direction"] == "forward"

        # Check reverse direction (067 -> 030)
        filepath = test_dir / "by-station" / "s067.json.gz"
        with gzip.open(filepath, "rt") as f:
            data = json.load(f)

        route_to_030 = [r for r in data["routes"] if r["to"] == "030"][0]
        assert route_to_030["direction"] == "reverse"

    def test_write_manifest(self, writer, test_dir):
        """Test manifest generation."""
        writer.setup_directories()

        metadata = {
            "phase": "test",
            "total_routes": 100,
            "unique_routes": 50,
            "generation_time": 10.5,
            "success_rate": 95.5,
        }

        station_files = ["s030.json.gz", "s045.json.gz"]
        writer.write_manifest(metadata, station_files)

        manifest_path = test_dir / "manifest.json"
        assert manifest_path.exists()

        with open(manifest_path) as f:
            manifest = json.load(f)

        assert manifest["phase"] == "test"
        assert manifest["version"] == "1.0"
        assert manifest["statistics"]["total_routes"] == 100
        assert manifest["statistics"]["unique_routes"] == 50
        assert manifest["statistics"]["stations_count"] == 2
        assert manifest["statistics"]["generation_time_seconds"] == 10.5
        assert manifest["statistics"]["success_rate_pct"] == 95.5
        assert manifest["files"]["top_routes"] == "top-1000.json.gz"
        assert manifest["files"]["station_files"] == sorted(station_files)
        assert manifest["format"]["encoding"] == "polyline"
        assert manifest["format"]["precision"] == 6
        assert manifest["format"]["compression"] == "gzip"

    def test_write_manifest_with_defaults(self, writer, test_dir):
        """Test manifest generation with missing metadata."""
        writer.setup_directories()

        metadata = {}  # Empty metadata
        writer.write_manifest(metadata, [])

        manifest_path = test_dir / "manifest.json"
        with open(manifest_path) as f:
            manifest = json.load(f)

        # Should use defaults
        assert manifest["phase"] == "unknown"
        assert manifest["statistics"]["total_routes"] == 0
        assert manifest["statistics"]["unique_routes"] == 0

    def test_compression_reduces_file_size(self, writer, sample_routes, test_dir):
        """Test that gzip compression reduces file size."""
        writer.setup_directories()

        # Write with compression
        writer.write_popular_routes(sample_routes)
        compressed_size = (test_dir / "top-1000.json.gz").stat().st_size

        # Write without compression for comparison
        writer.config.use_compression = False
        writer.write_popular_routes(sample_routes, "top-1000-uncompressed.json")
        uncompressed_size = (test_dir / "top-1000-uncompressed.json").stat().st_size

        # Compressed should be smaller
        assert compressed_size < uncompressed_size

    def test_custom_filename(self, writer, sample_routes, test_dir):
        """Test writing popular routes with custom filename."""
        writer.setup_directories()

        custom_filename = "custom-routes.json.gz"
        writer.write_popular_routes(sample_routes, custom_filename)

        filepath = test_dir / custom_filename
        assert filepath.exists()

    def test_empty_routes_list(self, writer, test_dir):
        """Test handling empty routes list."""
        writer.setup_directories()

        writer.write_popular_routes([])

        filepath = test_dir / "top-1000.json.gz"
        assert filepath.exists()

        with gzip.open(filepath, "rt") as f:
            data = json.load(f)

        assert data["count"] == 0
        assert len(data["routes"]) == 0

    def test_organize_by_station_no_bidirectional(self, writer, sample_routes):
        """Test organizing routes with no bidirectional pairs."""
        # Empty bidirectional map
        station_routes = writer.organize_by_station(sample_routes, {})

        # Should only have forward directions from station 030
        assert "030" in station_routes
        assert (
            len(station_routes["030"]) == 2
        )  # Only forward routes (030->067, 030->045)
        assert "067" not in station_routes  # No reverse route created
        assert "045" not in station_routes  # No reverse route created

    def test_route_data_precision(self, writer, sample_routes, test_dir):
        """Test that distance and duration are rounded correctly."""
        writer.setup_directories()
        writer.write_popular_routes(sample_routes)

        filepath = test_dir / "top-1000.json.gz"
        with gzip.open(filepath, "rt") as f:
            data = json.load(f)

        route = data["routes"][0]
        # Distance should be rounded to 2 decimals
        assert route["distance_km"] == 2.5
        # Duration should be rounded to 1 decimal
        assert route["duration_min"] == 10.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
