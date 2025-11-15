-- ============================================================================
-- Peloton Database Schema - Stations
-- HSL City Bike Station Data
-- ============================================================================
-- Created: 2025-11-12
-- PostgreSQL Version: 17
-- Description: Station metadata and location information
-- ============================================================================

-- Set search path to hsl schema
SET search_path TO hsl, public;

-- ============================================================================
-- Table: stations
-- Description: City bike station information and metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS hsl.stations (
    -- Primary key
    -- In rare cases id can be UUID instead of 3 numbers.
    station_id VARCHAR(50) PRIMARY KEY,

    -- Station details
    name VARCHAR(255) NOT NULL,

    -- Location (PostGIS geography)
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for stations
CREATE INDEX IF NOT EXISTS idx_stations_location ON hsl.stations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_stations_name_lower ON hsl.stations(LOWER(name));

-- Add comments for documentation
COMMENT ON TABLE hsl.stations IS 'HSL city bike stations with geospatial data';
COMMENT ON COLUMN hsl.stations.station_id IS 'HSL station identifier (e.g., 018, 103)';
COMMENT ON COLUMN hsl.stations.location IS 'Station location as WGS84 point (longitude, latitude)';
COMMENT ON INDEX idx_stations_location IS 'Geospatial index for nearest station queries';

-- ============================================================================
-- Trigger: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stations_updated_at
    BEFORE UPDATE ON hsl.stations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';

-- ============================================================================
-- Analyze table for query planner
-- ============================================================================

ANALYZE hsl.stations;

-- ============================================================================
-- Stations table creation complete
-- ============================================================================

\echo 'Stations table created successfully';
