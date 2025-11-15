-- ============================================================================
-- Peloton Database Schema - Trips
-- HSL City Bike Trip Data
-- ============================================================================
-- Created: 2025-11-12
-- PostgreSQL Version: 17
-- Description: Individual bike trip records (Origin-Destination data)
-- ============================================================================

-- Set search path to hsl schema
SET search_path TO hsl, public;

-- ============================================================================
-- Table: trips
-- Description: Individual bike trip records
-- ============================================================================

CREATE TABLE IF NOT EXISTS hsl.trips (
    -- Primary key
    trip_id BIGSERIAL PRIMARY KEY,

    -- Temporal data
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    departure_date DATE NOT NULL,
    departure_hour INTEGER NOT NULL,
    departure_weekday INTEGER NOT NULL,

    return_time TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date DATE NOT NULL,
    return_hour INTEGER NOT NULL,
    return_weekday INTEGER NOT NULL,

    -- Station references
    departure_station_id VARCHAR(50) NOT NULL,
    return_station_id VARCHAR(50) NOT NULL,

    -- Trip metrics
    distance_meters INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_departure_station
        FOREIGN KEY (departure_station_id)
        REFERENCES hsl.stations(station_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_return_station
        FOREIGN KEY (return_station_id)
        REFERENCES hsl.stations(station_id)
        ON DELETE RESTRICT,

    -- Data validation constraints
    CONSTRAINT valid_distance CHECK (distance_meters >= 0),
    CONSTRAINT valid_duration CHECK (duration_seconds > 0),
    CONSTRAINT valid_time_order CHECK (return_time > departure_time),

    -- Hour constraints
    CONSTRAINT valid_departure_hour CHECK (departure_hour >= 0 AND departure_hour <= 23),
    CONSTRAINT valid_return_hour CHECK (return_hour >= 0 AND return_hour <= 23),

    -- Weekday constraints
    CONSTRAINT valid_departure_weekday CHECK (departure_weekday >= 0 AND departure_weekday <= 6),
    CONSTRAINT valid_return_weekday CHECK (return_weekday >= 0 AND return_weekday <= 6),

    -- Average speed must not exceed 50 km/h
    CONSTRAINT valid_average_speed CHECK (
        distance_meters = 0 OR
        (distance_meters::FLOAT / duration_seconds) * 3.6 <= 50
    ),

    -- Duration should match timestamp difference (±60 sec tolerance)
    CONSTRAINT valid_trip_duration CHECK (
        EXTRACT(EPOCH FROM (return_time - departure_time)) >= duration_seconds - 60
        AND EXTRACT(EPOCH FROM (return_time - departure_time)) <= duration_seconds + 60
    ),

    -- Unique constraint for deduplication
    -- A trip is uniquely identified by departure time, departure station, and return station
    CONSTRAINT trips_unique_trip UNIQUE (departure_time, departure_station_id, return_station_id)
);

-- Indexes for trips
-- Temporal indexes
CREATE INDEX IF NOT EXISTS idx_trips_departure_time ON hsl.trips(departure_time DESC);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON hsl.trips(departure_date DESC);
CREATE INDEX IF NOT EXISTS idx_trips_departure_hour ON hsl.trips(departure_hour);
CREATE INDEX IF NOT EXISTS idx_trips_departure_weekday ON hsl.trips(departure_weekday);

CREATE INDEX IF NOT EXISTS idx_trips_return_hour ON hsl.trips(return_hour);
CREATE INDEX IF NOT EXISTS idx_trips_return_weekday ON hsl.trips(return_weekday);

-- Station and route indexes
CREATE INDEX IF NOT EXISTS idx_trips_departure_station ON hsl.trips(departure_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_return_station ON hsl.trips(return_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_route ON hsl.trips(departure_station_id, return_station_id);

-- Add comments
COMMENT ON TABLE hsl.trips IS 'HSL city bike trip records (Origin-Destination data)';
COMMENT ON COLUMN hsl.trips.distance_meters IS 'Trip distance in meters (can be 0 for same-station returns)';
COMMENT ON COLUMN hsl.trips.duration_seconds IS 'Trip duration in seconds';
COMMENT ON CONSTRAINT valid_average_speed ON hsl.trips IS 'Prevents trips with average speed > 50 km/h';
COMMENT ON INDEX idx_trips_departure_time IS 'Primary temporal index for recent trips';
COMMENT ON INDEX idx_trips_route IS 'Composite index for route popularity analysis';

-- ============================================================================
-- Analyze table for query planner
-- ============================================================================

ANALYZE hsl.trips;

-- ============================================================================
-- Trips table creation complete
-- ============================================================================

\echo 'Trips table created successfully';
