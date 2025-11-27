import { useState, useEffect } from 'react';
import type { FeatureCollection, LineString, Position } from 'geojson';
import { calculateBoundsFromCoordinates, type VoronoiBounds } from '../utils/generateVoronoi';

const BOUNDARY_URL = '/geojson/helsinki-area.json';

export interface HelsinkiAreaBoundary {
  /** Raw coordinates from the LineString geometry */
  coordinates: Position[];
  /** Calculated bounding box [minX, minY, maxX, maxY] */
  bounds: VoronoiBounds;
}

export interface UseHelsinkiAreaBoundaryResult {
  /** Boundary data (null while loading or on error) */
  data: HelsinkiAreaBoundary | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
}

// Module-level cache to avoid re-fetching
let cachedBoundary: HelsinkiAreaBoundary | null = null;
let fetchPromise: Promise<HelsinkiAreaBoundary> | null = null;

/**
 * Fetch and parse the Helsinki area boundary GeoJSON
 */
async function fetchBoundary(): Promise<HelsinkiAreaBoundary> {
  // Return cached if available
  if (cachedBoundary) {
    return cachedBoundary;
  }

  // Return existing promise if fetch in progress
  if (fetchPromise) {
    return fetchPromise;
  }

  // Start new fetch
  fetchPromise = (async () => {
    const response = await fetch(BOUNDARY_URL);

    if (!response.ok) {
      throw new Error(`Failed to load boundary: ${response.status} ${response.statusText}`);
    }

    const geojson: FeatureCollection<LineString> = await response.json();

    if (!geojson.features || geojson.features.length === 0) {
      throw new Error('Invalid boundary GeoJSON: no features found');
    }

    const feature = geojson.features[0];
    if (!feature) {
      throw new Error('Invalid boundary GeoJSON: first feature is undefined');
    }

    if (feature.geometry.type !== 'LineString') {
      throw new Error(`Invalid geometry type: expected LineString, got ${feature.geometry.type}`);
    }

    const coordinates = feature.geometry.coordinates;
    const bounds = calculateBoundsFromCoordinates(coordinates);

    cachedBoundary = { coordinates, bounds };
    return cachedBoundary;
  })();

  try {
    return await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}

/**
 * Hook to load the Helsinki area boundary GeoJSON
 *
 * Fetches the boundary file from /geojson/helsinki-area.json and extracts
 * the coordinates and bounding box. Results are cached globally to avoid
 * re-fetching on component re-mounts.
 *
 * @returns Object with data, isLoading, and error properties
 *
 * @example
 * ```tsx
 * const { data: boundary, isLoading, error } = useHelsinkiAreaBoundary();
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error} />;
 *
 * const voronoiPolygons = generateVoronoiPolygons(stations, {
 *   bounds: boundary.bounds,
 * });
 * ```
 */
export function useHelsinkiAreaBoundary(): UseHelsinkiAreaBoundaryResult {
  const [data, setData] = useState<HelsinkiAreaBoundary | null>(cachedBoundary);
  const [isLoading, setIsLoading] = useState(!cachedBoundary);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetch if already cached
    if (cachedBoundary) {
      return;
    }

    let cancelled = false;

    fetchBoundary()
      .then((boundary) => {
        if (!cancelled) {
          setData(boundary);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}

/**
 * Clear the cached boundary (useful for testing)
 */
export function clearBoundaryCache(): void {
  cachedBoundary = null;
  fetchPromise = null;
}
