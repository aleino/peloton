import { Delaunay } from 'd3-delaunay';
import type { Feature, FeatureCollection, Polygon, Position } from 'geojson';
import { polygon as turfPolygon, featureCollection } from '@turf/helpers';
import intersect from '@turf/intersect';

/**
 * Bounds for Voronoi generation [minX, minY, maxX, maxY]
 * Derived from helsinki-area.json extent
 */
export type VoronoiBounds = [number, number, number, number];

/**
 * Options for Voronoi generation
 */
export interface VoronoiOptions {
  /** Bounding box [minX, minY, maxX, maxY] */
  bounds: VoronoiBounds;
  /** Optional clipping polygon (e.g., Helsinki area boundary) */
  clipPolygon?: Position[];
}

/**
 * Generate Voronoi polygons from station point features
 *
 * Transforms a FeatureCollection of Point features into a FeatureCollection
 * of Polygon features representing Voronoi cells. Each cell retains the
 * properties from its corresponding station point.
 *
 * @param stations - GeoJSON FeatureCollection with Point geometries
 * @param options - Voronoi generation options (bounds, optional clipping)
 * @returns GeoJSON FeatureCollection with Polygon geometries
 *
 * @example
 * ```typescript
 * const voronoiPolygons = generateVoronoiPolygons(stationData, {
 *   bounds: [24.6, 60.0, 25.3, 60.4],
 * });
 * ```
 */
export function generateVoronoiPolygons<P extends Record<string, unknown>>(
  stations: FeatureCollection<GeoJSON.Point, P>,
  options: VoronoiOptions
): FeatureCollection<Polygon, P> {
  // 1. Extract coordinates from station features
  const points: [number, number][] = stations.features.map(
    (f) => f.geometry.coordinates as [number, number]
  );

  // 2. Handle edge cases
  if (points.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  if (points.length === 1) {
    // Single point: return bounding box as the single Voronoi cell
    const [minX, minY, maxX, maxY] = options.bounds;
    const firstStation = stations.features[0];
    if (!firstStation) {
      return { type: 'FeatureCollection', features: [] };
    }
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [minX, minY],
                [maxX, minY],
                [maxX, maxY],
                [minX, maxY],
                [minX, minY],
              ],
            ],
          },
          properties: firstStation.properties,
        },
      ],
    };
  }

  // 3. Create Delaunay triangulation and Voronoi diagram
  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi(options.bounds);

  // 4. Convert Voronoi cells to GeoJSON features
  const features: Feature<Polygon, P>[] = stations.features.map((station, i) => {
    const cellPolygon = voronoi.cellPolygon(i);

    // cellPolygon returns null for degenerate cases
    if (!cellPolygon) {
      // Fallback: create a small polygon around the point
      const point = points[i];
      if (!point) {
        throw new Error(`Point at index ${i} is undefined`);
      }
      const [x, y] = point;
      const epsilon = 0.0001;
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [x - epsilon, y - epsilon],
              [x + epsilon, y - epsilon],
              [x + epsilon, y + epsilon],
              [x - epsilon, y + epsilon],
              [x - epsilon, y - epsilon],
            ],
          ],
        },
        properties: station.properties,
      };
    }

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [cellPolygon],
      },
      properties: station.properties,
    };
  });

  // 5. Clip cells to boundary polygon if provided
  if (options.clipPolygon && options.clipPolygon.length > 0) {
    const clippedFeatures = clipVoronoiCells(features, options.clipPolygon);
    return { type: 'FeatureCollection', features: clippedFeatures };
  }

  return { type: 'FeatureCollection', features };
}

/**
 * Calculate bounds from a LineString or Polygon boundary
 *
 * @param coordinates - Array of [lon, lat] positions
 * @returns Bounds array [minX, minY, maxX, maxY]
 */
export function calculateBoundsFromCoordinates(coordinates: Position[]): VoronoiBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const coord of coordinates) {
    const [x, y] = coord;
    if (x !== undefined && x < minX) minX = x;
    if (x !== undefined && x > maxX) maxX = x;
    if (y !== undefined && y < minY) minY = y;
    if (y !== undefined && y > maxY) maxY = y;
  }

  return [minX, minY, maxX, maxY];
}

/**
 * Clip Voronoi cells to a boundary polygon using Turf.js
 *
 * @param cells - Array of Voronoi cell features
 * @param boundaryCoordinates - Boundary polygon coordinates (closed ring)
 * @returns Clipped array of features
 */
function clipVoronoiCells<P extends Record<string, unknown>>(
  cells: Feature<Polygon, P>[],
  boundaryCoordinates: Position[]
): Feature<Polygon, P>[] {
  // Convert boundary coordinates to a closed polygon if not already closed
  const coords = [...boundaryCoordinates];
  const first = coords[0];
  const last = coords[coords.length - 1];

  // Check if polygon is closed (first and last coordinates are the same)
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    coords.push([...first]);
  }

  // Create Turf polygon for the boundary
  const boundaryPolygon = turfPolygon([coords]);

  // Calculate boundary bbox once
  const [bMinX, bMinY, bMaxX, bMaxY] = calculateBoundsFromCoordinates(coords);

  // Clip each Voronoi cell to the boundary
  const clippedCells: Feature<Polygon, P>[] = [];

  for (const cell of cells) {
    try {
      // Calculate cell bbox
      // Voronoi cells from d3-delaunay are simple polygons (single ring)
      const cellCoords = cell.geometry.coordinates[0];
      if (!cellCoords) continue;

      const [cMinX, cMinY, cMaxX, cMaxY] = calculateBoundsFromCoordinates(cellCoords);

      // Check for bbox intersection
      // If disjoint, skip intersection (cell is outside)
      if (cMaxX < bMinX || cMinX > bMaxX || cMaxY < bMinY || cMinY > bMaxY) {
        continue;
      }

      // Create Turf polygon from cell for intersection
      const cellPolygon = turfPolygon(
        cell.geometry.coordinates,
        cell.properties as Record<string, unknown>
      );

      // Create a FeatureCollection with both polygons for intersection
      const features = featureCollection([cellPolygon, boundaryPolygon]);

      // Perform intersection using Turf.js
      const clipped = intersect(features);

      if (clipped) {
        // Preserve the original properties
        clippedCells.push({
          type: 'Feature',
          geometry: clipped.geometry,
          properties: cell.properties,
        } as Feature<Polygon, P>);
      }
      // If intersection is null (cell is completely outside boundary), skip it
    } catch (error) {
      // If clipping fails for any reason, keep the original cell
      console.warn('Failed to clip Voronoi cell, keeping original:', error);
      clippedCells.push(cell);
    }
  }

  return clippedCells;
}
