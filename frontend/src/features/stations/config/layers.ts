/**
 * Mapbox layer and source configuration for stations
 *
 * Centralized configuration to avoid magic strings and improve maintainability.
 * These IDs are used across multiple components and hooks.
 */

/**
 * Source ID for station GeoJSON data
 */
export const STATIONS_SOURCE_ID = 'stations-source';

/**
 * Layer ID for station circle backgrounds (colored by Viridis scale)
 */
export const STATIONS_CIRCLES_LAYER_ID = 'stations-circles';

/**
 * Layer ID for station icon symbols
 */
export const STATIONS_SYMBOLS_LAYER_ID = 'stations-layer';

/**
 * Layer ID for station clusters (circles showing aggregated stations)
 */
export const STATIONS_CLUSTERS_LAYER_ID = 'stations-clusters';

/**
 * Layer ID for cluster count labels
 */
export const STATIONS_CLUSTER_COUNT_LAYER_ID = 'stations-cluster-count';
