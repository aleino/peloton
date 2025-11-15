# Peloton Backend API

Express.js + TypeScript backend for serving HSL bike trip data.

## 🚀 Quick Start

### Prerequisites

- Node.js v22 or higher
- npm v10 or higher
- PostgreSQL database (running via Docker in `db/` directory)

### Installation

1. **Install dependencies:**

```bash
cd backend
npm install
```

2. **Configure environment:**

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your database credentials
# Default values work with the Docker PostgreSQL setup
```

3. **Start PostgreSQL (if not already running):**

```bash
cd ../db
docker-compose up -d
```

### Development

**Run in development mode (with auto-reload):**

```bash
npm run dev
```

**Build TypeScript:**

```bash
npm run build
```

**Run production build:**

```bash
npm start
```

**Run tests:**

```bash
npm test
```

**Lint code:**

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

**Format code:**

```bash
npm run format
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration modules
│   │   ├── database.ts  # PostgreSQL connection pool
│   │   └── env.ts       # Environment validation
│   ├── routes/          # Express route handlers
│   │   └── health.ts    # Health check endpoint
│   ├── middleware/      # Express middleware
│   │   ├── errorHandler.ts  # Error handling
│   │   └── cors.ts      # CORS configuration
│   ├── utils/           # Utility functions
│   │   └── logger.ts    # Winston logger
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── tests/               # Test files
├── logs/                # Application logs (auto-created)
├── dist/                # Compiled JavaScript (auto-created)
├── package.json
├── tsconfig.json
└── .env
```

## 🔌 API Endpoints

### Health Check

**GET** `/health`

Returns service health status and database connectivity.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "uptime": 123.45,
  "database": {
    "connected": true
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable          | Description                    | Default                 |
| ----------------- | ------------------------------ | ----------------------- |
| `NODE_ENV`        | Environment (development/prod) | `development`           |
| `PORT`            | Server port                    | `3000`                  |
| `DB_HOST`         | PostgreSQL host                | `localhost`             |
| `DB_PORT`         | PostgreSQL port                | `5432`                  |
| `DB_NAME`         | Database name                  | `peloton_db`            |
| `DB_USER`         | Database user                  | `peloton`               |
| `DB_PASSWORD`     | Database password              | (required)              |
| `DB_POOL_MIN`     | Minimum connection pool size   | `2`                     |
| `DB_POOL_MAX`     | Maximum connection pool size   | `20`                    |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins   | `http://localhost:5173` |
| `API_VERSION`     | API version identifier         | `v1`                    |

## 🧪 Testing

Run tests with coverage:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 📦 Tech Stack

- **Runtime**: Node.js v22
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL (via `pg`)
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Vitest
- **Security**: Helmet
- **CORS**: cors middleware

## 🛡️ Code Quality

This project follows strict TypeScript and code quality standards:

- **TypeScript**: Strict mode enabled
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Type Safety**: Full type coverage

## 🔐 Security

- Helmet.js for HTTP headers security
- CORS configuration for cross-origin requests
- Environment variable validation
- Parameterized database queries
- Input validation with Zod

## 📝 Logging

Logs are written to:

- **Console**: Formatted output for development
- **logs/error.log**: Error-level logs
- **logs/combined.log**: All logs

Log levels: `error`, `warn`, `info`, `debug`

## 🚧 Development Guidelines

1. **Always use TypeScript** - No `any` types unless absolutely necessary
2. **Follow naming conventions**:
   - HTTP schemas: `<concept><method><response|request><body|headers|params>`
   - Use camelCase for variables, PascalCase for types
3. **Test before commit**: Ensure all tests pass
4. **Document API changes**: Update this README
