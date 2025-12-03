#!/usr/bin/env python3
"""Unit tests for configuration."""

import pytest
import os
from pathlib import Path
from config import (
    ValhallaConfig,
    DatabaseConfig,
    OutputConfig,
    GenerationConfig,
    PipelineConfig,
)


class TestValhallaConfig:
    def test_default_url(self):
        config = ValhallaConfig()
        assert config.base_url == "http://localhost:8002"

    def test_endpoints(self):
        config = ValhallaConfig(base_url="http://valhalla:8002")
        assert config.route_endpoint == "http://valhalla:8002/route"
        assert config.status_endpoint == "http://valhalla:8002/status"

    def test_invalid_url(self):
        with pytest.raises(ValueError, match="Invalid Valhalla URL"):
            ValhallaConfig(base_url="not-a-url")


class TestDatabaseConfig:
    def test_default_values(self):
        # Temporarily clear password for default test
        original_password = os.getenv("POSTGRES_PASSWORD")
        os.environ["POSTGRES_PASSWORD"] = "test123"

        config = DatabaseConfig()
        assert config.host == "localhost"
        assert config.port == 5432
        assert config.database == "peloton_db"
        assert config.schema == "hsl"

        # Restore original
        if original_password:
            os.environ["POSTGRES_PASSWORD"] = original_password

    def test_connection_string(self):
        config = DatabaseConfig(
            host="db.example.com",
            port=5433,
            database="testdb",
            user="testuser",
            password="testpass",
        )
        conn_str = config.connection_string
        assert "host=db.example.com" in conn_str
        assert "port=5433" in conn_str
        assert "dbname=testdb" in conn_str
        assert "password=testpass" in conn_str

    def test_missing_password(self):
        # Clear password
        original = os.getenv("POSTGRES_PASSWORD")
        if "POSTGRES_PASSWORD" in os.environ:
            del os.environ["POSTGRES_PASSWORD"]

        with pytest.raises(ValueError, match="POSTGRES_PASSWORD must be set"):
            DatabaseConfig()

        # Restore
        if original:
            os.environ["POSTGRES_PASSWORD"] = original


class TestOutputConfig:
    def test_default_paths(self):
        config = OutputConfig()
        assert config.base_dir.is_absolute()
        assert config.manifest_filename == "manifest.json"

    def test_station_file_path(self):
        config = OutputConfig()
        path = config.station_file_path("030")
        assert path.name == "s030.json.gz"
        assert path.parent.name == "by-station"

    def test_compression_settings(self):
        config = OutputConfig(use_compression=False)
        path = config.station_file_path("030")
        assert path.name == "s030.json"


class TestGenerationConfig:
    def test_phase1_settings(self):
        config = GenerationConfig(phase="phase1")
        assert config.is_phase1
        assert not config.is_phase2
        assert config.route_limit == 1000
        assert config.min_trips == 0

    def test_phase2_settings(self):
        config = GenerationConfig(phase="phase2")
        assert config.is_phase2
        assert not config.is_phase1
        assert config.route_limit is None
        assert config.min_trips == 1

    def test_invalid_phase(self):
        with pytest.raises(ValueError, match="Invalid phase"):
            GenerationConfig(phase="phase3")  # type: ignore[arg-type]


class TestPipelineConfig:
    def test_from_env(self):
        # Set required env vars
        os.environ["POSTGRES_PASSWORD"] = "test123"

        config = PipelineConfig.from_env(phase="phase1")
        assert config.generation.phase == "phase1"
        assert config.database.password == "test123"

    def test_summary(self):
        os.environ["POSTGRES_PASSWORD"] = "test123"
        config = PipelineConfig.from_env()
        summary = config.summary()

        assert "Phase: phase1" in summary
        assert "Database:" in summary
        assert "Valhalla:" in summary


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
