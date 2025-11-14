-- ============================================================================
-- Peloton Database Initialization
-- Extensions, Schema, and Timezone Configuration
-- ============================================================================
-- Created: 2025-11-12
-- PostgreSQL Version: 17
-- Description: Initial database setup with PostGIS and HSL schema
-- ============================================================================

-- Set timezone to Helsinki
SET TIME ZONE 'Europe/Helsinki';

-- ============================================================================
-- Extensions
-- ============================================================================

-- Enable PostGIS extension for geospatial data support
-- This extension provides support for geographic objects and spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify installation
-- This will output the PostGIS version information
SELECT PostGIS_Version();

-- ============================================================================
-- Schema Creation
-- ============================================================================

-- Create hsl schema
CREATE SCHEMA IF NOT EXISTS hsl;

-- Set search path to hsl schema
SET search_path TO hsl, public;

-- ============================================================================
-- Initialization complete
-- ============================================================================

\echo 'Database initialization completed successfully';
\echo 'Timezone: Europe/Helsinki';
\echo 'Schema: hsl';
\echo 'Extensions: PostGIS';
