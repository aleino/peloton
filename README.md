# Peloton

HSL (Helsinki Region Transport) bike trip data visualization and analysis platform.

## Overview

Peloton is a full-stack web application for visualizing and analyzing Helsinki city bike trip data. It combines interactive map-based visualizations with powerful data analysis capabilities to explore patterns in urban bike-sharing usage.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Material-UI (MUI) + Mapbox GL JS
- **Backend**: Node.js v22 + Express.js + TypeScript
- **Database**: PostgreSQL 17 + PostGIS
- **Shared**: Monorepo with `@peloton/shared` for type-safe API contracts
- **Data Pipeline**: Python 3.12 for ETL scripts
- **Testing**: Vitest (frontend & backend), pytest (Python)

## Project Structure

```
peloton/
├── frontend/             # React web application
│   ├── src/
│   │   ├── app/          # App configuration (router, theme)
│   │   ├── components/   # Reusable UI components
│   │   ├── features/     # Feature modules (stations, map, filters)
│   │   ├── layouts/      # Layout components
│   │   └── pages/        # Page components
│   └── README.md
├── backend/              # Express.js REST API
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   ├── db/           # Database queries
│   │   └── utils/        # Utilities
│   └── README.md
├── db/                   # PostgreSQL + PostGIS setup
│   ├── docker-compose.yml
│   ├── init-scripts/     # Database initialization
│   └── README.md
├── packages/
│   └── shared/           # Shared types and schemas
│       ├── src/
│       │   ├── schemas/  # Zod schemas
│       │   └── types/    # TypeScript types
│       └── README.md
└── data/                 # Data files and ETL scripts
    ├── raw/              # Raw HSL data
    ├── interim/          # Processing intermediates
    ├── output/           # Final processed data
    └── scripts/
        └── etl/          # Python ETL pipeline
```

## Quick Start

### Prerequisites

- Node.js v22 or higher
- Python 3.12
- Docker and Docker Compose
- Mapbox API token

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/aleino/peloton.git
cd peloton
```

2. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start the database**

```bash
cd db
docker-compose up -d
cd ..
```

4. **Install dependencies**

```bash
# Install all workspace dependencies
npm install
```

5. **Start backend**

```bash
cd backend
npm run dev
```

6. **Start frontend** (in a new terminal)

```bash
cd frontend
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/v1/docs

## Development

See individual README files for detailed documentation:

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)
- [Database README](./db/README.md)
- [Shared Package README](./packages/shared/README.md)
- [Data README](./data/README.md)

## Environment Setup

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed environment configuration instructions.

## Data Pipeline

The ETL pipeline processes HSL bike trip data and loads it into PostgreSQL:

```bash
cd data/scripts/etl
pyenv shell 3.12
python run_pipeline.py
```

See [data/scripts/etl/README.md](./data/scripts/etl/README.md) for details.

## Testing

Run tests for all packages:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Python tests
cd data/scripts/etl
pytest
```

## Documentation

- **Copilot Instructions**: `.github/copilot-instructions.md`
- **Code Style Guide**: `frontend/CODE_STYLE.md`
- **Naming Conventions**: `naming_conventions.md`
