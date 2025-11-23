# Peloton Backend API

Node.js v22 + Express.js REST API for HSL city bike trip visualization.

## Overview

This backend serves data from a PostgreSQL/PostGIS database containing Helsinki Region Transport (HSL) bike trip data. Currently in **MVP phase** with health check endpoint only.

## Tech Stack

- **Runtime**: Node.js v22 (LTS)
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 17 + PostGIS
- **Testing**: Vitest + Supertest
- **Documentation**: OpenAPI 3.0 + Swagger UI

## 🚀 Quick Start

### Prerequisites

- Node.js v22 or higher
- npm or yarn
- PostgreSQL database (running in Docker via `db/docker-compose.yml`)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Required environment variables:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=peloton_db
DB_USER=peloton
DB_PASSWORD=your_password_here

ALLOWED_ORIGINS=http://localhost:5173
API_VERSION=v1
```

### 3. Start Database

```bash
cd ../db
docker-compose up -d
cd ../backend
```

### 4. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## API Documentation

Interactive API documentation available at:

- **Swagger UI**: <http://localhost:3000/api/v1/docs>
- **OpenAPI Spec**: <http://localhost:3000/api/v1/openapi.json>

## Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to dist/
npm start            # Run production build
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (DB, env, OpenAPI)
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── openapi.ts
│   ├── routes/          # API route handlers (organized by resource)
│   │   ├── health/      # Health check endpoints
│   │   │   ├── health.routes.ts
│   │   │   └── health.openapi.ts
│   │   ├── stations/    # Station endpoints
│   │   │   ├── stations.routes.ts
│   │   │   └── stations.openapi.ts
│   │   └── docs.ts      # OpenAPI documentation route
│   ├── services/        # Business logic layer
│   │   └── stationService.ts
│   ├── middleware/      # Express middleware (CORS, validation, error handling)
│   │   ├── cors.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── db/              # Database queries and types
│   │   ├── types.ts
│   │   └── queries/
│   │       └── stationQueries.ts
│   ├── utils/           # Utilities (logger, GeoJSON helpers)
│   │   ├── logger.ts
│   │   └── geoJSON.ts
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/
│   ├── integration/     # Integration tests
│   │   ├── database.test.ts
│   │   ├── health.test.ts
│   │   ├── stations.test.ts
│   │   └── logs/
│   └── unit/            # Unit tests
│       ├── db/
│       ├── middleware/
│       ├── services/
│       └── utils/
├── docs/                # Additional documentation
├── logs/                # Application logs
├── dist/                # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Docker

### Build Image

```bash
docker build -t peloton-backend:latest .
```

### Run with Docker Compose

```bash
cd ../db
docker-compose up
```

Backend will be available at `http://localhost:3000`

## Testing

### Run All Tests

```bash
npm test
```

### Run with Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

**Target Coverage**: >80%

### Integration Tests

Tests require a running PostgreSQL database. Use Docker:

```bash
cd ../db
docker-compose up -d peloton-db
cd ../backend
npm test
```

## 🔧 Configuration

### Environment Variables

| Variable          | Description                            | Default                 |
| ----------------- | -------------------------------------- | ----------------------- |
| `NODE_ENV`        | Environment (development/production)   | `development`           |
| `PORT`            | Server port                            | `3000`                  |
| `DB_HOST`         | PostgreSQL host                        | `localhost`             |
| `DB_PORT`         | PostgreSQL port                        | `5432`                  |
| `DB_NAME`         | Database name                          | `peloton_db`            |
| `DB_USER`         | Database user                          | `peloton`               |
| `DB_PASSWORD`     | Database password                      | **required**            |
| `DB_POOL_MIN`     | Min connection pool size               | `2`                     |
| `DB_POOL_MAX`     | Max connection pool size               | `20`                    |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:5173` |
| `API_VERSION`     | API version prefix                     | `v1`                    |

## Troubleshooting

### Database Connection Failed

1. Check PostgreSQL is running: `docker ps`
2. Verify credentials in `.env`
3. Test connection: `psql -h localhost -U peloton -d peloton_db`

### Port Already in Use

Change `PORT` in `.env` or kill existing process:

```bash
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors

Ensure TypeScript is compiled:

```bash
npm run build
```

## Deployment

See `.ai/BackendMVP/007_docker_configuration.md` for Docker deployment details.

## Future Endpoints (Roadmap)

- `GET /api/v1/stations` - All bike stations (GeoJSON)
- `GET /api/v1/stations/:id` - Station details
- `GET /api/v1/trips/stats` - Trip statistics
- `GET /api/v1/trips/routes` - Route flow data
