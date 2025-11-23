import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  stationsListResponseBody,
  stationsGetResponseBody,
  stationsGetQueryParams,
  stationsGetPathParams,
} from '@peloton/shared';

/**
 * Register station-related endpoints in the OpenAPI registry
 *
 * @param registry - OpenAPI registry instance
 */
export function registerStationsEndpoints(registry: OpenAPIRegistry) {
  // GET /api/v1/stations - List all stations
  registry.registerPath({
    method: 'get',
    path: '/stations',
    tags: ['Stations'],
    summary: 'Get all bike stations',
    description: `
Retrieve all HSL bike stations as GeoJSON FeatureCollection.

Returns geographic data optimized for map visualization with Mapbox GL.
Use the \`bounds\` parameter to filter stations within a geographic area.

**Examples:**
- Get all stations: \`GET /stations\`
- Get stations in a bounding box: \`GET /stations?bounds=24.9,60.15,25.0,60.20\`

**Response Format:**
- Type: GeoJSON FeatureCollection
- Geometry: Point (lon, lat)
- Properties: stationId, name, totalDepartures
    `.trim(),
    request: {
      query: stationsGetQueryParams,
    },
    responses: {
      200: {
        description: 'Successful response with stations list',
        content: {
          'application/json': {
            schema: stationsListResponseBody,
          },
        },
      },
      400: {
        description: 'Invalid query parameters (e.g., malformed bounds)',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'INVALID_BOUNDS' },
                    message: {
                      type: 'string',
                      example: 'Invalid bounds format. Expected: minLat,minLon,maxLat,maxLon',
                    },
                  },
                  required: ['code', 'message'],
                },
              },
              required: ['error'],
            },
          },
        },
      },
      500: {
        description: 'Internal server error',
      },
    },
  });

  // GET /api/v1/stations/:stationId - Get single station with statistics
  registry.registerPath({
    method: 'get',
    path: '/stations/{stationId}',
    tags: ['Stations'],
    summary: 'Get station by ID',
    description: `
Retrieve detailed information about a specific bike station, including trip statistics.

Returns comprehensive data including:
- Station location and metadata
- Total departures and arrivals
- Average trip duration and distance
- Busiest hour and day of week

**Example:** \`GET /stations/001\`
    `.trim(),
    request: {
      params: stationsGetPathParams,
    },
    responses: {
      200: {
        description: 'Successful response with station details',
        content: {
          'application/json': {
            schema: stationsGetResponseBody,
          },
        },
      },
      404: {
        description: 'Station not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'STATION_NOT_FOUND' },
                    message: { type: 'string', example: 'Station with ID "999" not found' },
                  },
                  required: ['code', 'message'],
                },
              },
              required: ['error'],
            },
          },
        },
      },
      500: {
        description: 'Internal server error',
      },
    },
  });
}
