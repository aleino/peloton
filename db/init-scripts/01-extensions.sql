-- Enable PostGIS extension for geospatial data support
-- This extension provides support for geographic objects and spatial queries

CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify installation
-- This will output the PostGIS version information
SELECT PostGIS_Version();
