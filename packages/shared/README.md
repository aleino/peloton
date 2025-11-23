# @peloton/shared

Shared TypeScript types and Zod schemas for the Peloton project.

## Overview

This package provides a single source of truth for API contracts, enabling type safety and runtime validation across backend and frontend.

## Installation

This is a workspace package. Import it in other workspace packages:

```json
{
  "dependencies": {
    "@peloton/shared": "workspace:*"
  }
}
```

## Usage

### Backend (Express)

```typescript
import { healthGetResponseBody } from '@peloton/shared';

// Validate response data
router.get('/api/v1/health', async (req, res) => {
  const data = {
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  // Runtime validation
  const validated = healthGetResponseBody.parse(data);
  res.json(validated);
});
```

### Frontend

```typescript
import { HealthGetResponseBody } from '@peloton/shared';

// Type-safe API client
async function getHealth(): Promise<HealthGetResponseBody> {
  const response = await fetch('/api/v1/health');
  const data = await response.json();
  return healthGetResponseBody.parse(data);
}
```

## Schema Naming Convention

Schemas follow this pattern:

- `<concept><HttpMethod><ResponseOrRequest><BodyOrHeadersOrParams>`

Examples:

- `healthGetResponseBody` - GET /api/v1/health response body
- `stationsListResponseBody` - GET /api/v1/stations response body
- `stationsGetResponseBody` - GET /api/v1/stations/:id response body
- `errorResponseBody` - Standard error response

## Type Inference

TypeScript types are automatically inferred from Zod schemas:

```typescript
import { healthGetResponseBody, HealthGetResponseBody } from '@peloton/shared';

// Schema (lowercase, no "schema" suffix)
const schema = healthGetResponseBody;

// Type (PascalCase)
type Response = HealthGetResponseBody;
```

## Development

```bash
# Build the package
npm run build

# Watch mode during development
npm run dev

# Run tests
npm run test

# Lint
npm run lint
```

## Adding New Schemas

1. Create schema file in `src/schemas/`:

```typescript
// src/schemas/stations.schema.ts
import { z } from 'zod';

export const stationsListResponseBody = z.object({
  stations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      // ...
    })
  ),
});

export type StationsListResponseBody = z.infer<typeof stationsListResponseBody>;
```

2. Export from `src/schemas/index.ts`:

```typescript
export * from './stations.schema.js';
```

3. Rebuild the package: `npm run build`

## Project Structure

```
packages/shared/
├── src/
│   ├── schemas/      # Zod schema definitions (health, stations, geospatial, etc.)
│   ├── types/        # TypeScript type definitions
│   └── index.ts      # Main exports
├── tests/            # Test files
├── package.json
└── README.md
```

## ESM Compatibility

This package uses ESM modules. Import paths must include `.js` extensions:

```typescript
// Correct
export * from './common.schema.js';

// Incorrect
export * from './common.schema';
```

## License

MIT
