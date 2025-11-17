# Naming Conventions

## General Principles

- DO NOT use ambiguous word `data`. Use more descriptive names like `stations`, `trips`, `routes`, etc...
- DO NOT use words that can be easily misspelled e.g. `produciton` or `developemnt`. Instead use simpler words like `dev` and `prod`.

### Environment-Related Naming

- **File names**: Use `dev` and `prod` (e.g., `.env.dev`, `config.prod.ts`)
- **Environment variable values**: Use full words `'development'` and `'production'`
  - ✅ `NODE_ENV=development`, `VITE_ENV=production`
  - ❌ `NODE_ENV=dev`, `VITE_ENV=prod`
- **Rationale**:
  - Short names in filenames reduce typing and path length
  - Full words in environment values follow Node.js/Vite standards and avoid library compatibility issues

## TypeScript

### Zod Schema and Type Naming

- **Schema variables** use **camelCase**: `stationsListResponseBody`.
- **Type names** use **PascalCase**: `StationsListResponseBody`.
- **Schema/Type must match** (except case):
  - ✅ `healthGetResponseBody` → `HealthGetResponseBody`.
  - ❌ `healthResponseSchema` → `HealthResponse`.
- **NEVER use "Schema" suffix**:
  - ✅ `stationStatistics`, `pointGeometry`, `location`.
  - ❌ `stationStatisticsSchema`, `pointGeometrySchema`, `locationSchema`.

#### Collections vs Single Resources

- **Collections**: `<concept>ListResponseBody` (e.g., `stationsListResponseBody`)
- **Single Resource**: `<concept>GetResponseBody` (e.g., `stationsGetResponseBody`)

#### HTTP Endpoint Schemas

Pattern: `<CONCEPT><HTTP_METHOD><REQUEST_OR_RESPONSE><BODY_OR_HEADERS_OR_PARAMS>`

**Examples**:

```typescript
// Collections (GET /stations)
export const stationsListResponseBody = z.object({...});
export type StationsListResponseBody = z.infer<typeof stationsListResponseBody>;

// Single resource (GET /stations/:id)
export const stationsGetResponseBody = z.object({...});
export type StationsGetResponseBody = z.infer<typeof stationsGetResponseBody>;

// Query parameters (GET /stations?bounds=...&format=...)
export const stationsGetQueryParams = z.object({...});
export type StationsGetQueryParams = z.infer<typeof stationsGetQueryParams>;

// Path parameters (GET /stations/:stationId)
export const stationId = z.object({...});
export type StationId = z.infer<typeof stationId>;

// Request body (POST /stations)
export const stationsPostRequestBody = z.object({...});
export type StationsPostRequestBody = z.infer<typeof stationsPostRequestBody>;
```

#### GeoJSON Schemas

- **Generic types**: Use existing libraries (geojson-zod, @turf/helpers)
- **Resource-specific**: Define with resource name
  - ✅ `stationFeature`, `stationFeatureCollection`
  - ❌ `geoJsonFeature` (too generic)

### OpenAPI Documentation

- Use **registry pattern** with `@asteasolutions/zod-to-openapi`
- See `backend/src/routes/health/health.openapi.ts` for example

### Database vs API Naming

- **Database fields**: `snake_case` (e.g., `station_id`, `created_at`)
- **API/TypeScript**: `camelCase` (e.g., `stationId`, `createdAt`)

### Backend and frontend contracts

- Use `camelCase` for all shared contracts between backend and frontend.
- Shared Zod schemas in `packages/shared/src/schemas`

## Python

- Follow PEP 8 naming conventions
