# Environment Configuration Setup

This project uses a **centralized environment configuration** approach with a root `.env` file that all services read from.

## 🏗️ Structure

```
peloton/
├── .env                    # Root config (gitignored, create from .env.example)
├── .env.example           # Template with all shared values
├── backend/
│   ├── .env.example       # Backend-specific override examples
│   └── (optional .env)    # Override root values for backend
├── db/
│   ├── .env.example       # DB-specific override examples
│   └── (optional .env)    # Override root values for db
└── data/scripts/etl/
    └── (reads root .env)  # Python scripts use root config
```

## 🚀 Quick Start

1. **Copy the example file:**

   ```bash
   cp .env.example .env
   ```

2. **Update your values:**
   Edit `.env` and set your actual passwords and configuration:

   ```env
   POSTGRES_PASSWORD=your_actual_password_here
   ```

3. **Start services:**

   ```bash
   # Database
   cd db && docker-compose up -d

   # Backend
   cd backend && npm run dev

   # ETL Pipeline
   cd data/scripts/etl && python run_pipeline.py
   ```

## 📝 Configuration Priority

Environment variables are loaded in this order (later overrides earlier):

1. **Root `.env`** - Shared configuration for all services
2. **Directory `.env`** - Optional overrides (e.g., `backend/.env`, `db/.env`)
3. **Shell environment** - Variables set in your terminal

### Example Override

If you need a different database for backend testing:

```bash
# backend/.env (optional)
POSTGRES_DB=peloton_test_db
```

## 🔧 Service-Specific Details

### Backend (Node.js/TypeScript)

- Reads: `/.env` → `/backend/.env`
- Configuration: `backend/src/config/env.ts`
- Variables: `POSTGRES_*`, `PORT`, `NODE_ENV`, `ALLOWED_ORIGINS`

### Database (Docker Compose)

- Reads: `/.env` via `env_file: - ../.env`
- Configuration: `db/docker-compose.yml`
- Variables: `POSTGRES_*`

### ETL Pipeline (Python)

- Reads: `/.env` → `/db/.env` (backwards compatibility)
- Configuration: `data/scripts/etl/run_pipeline.py`
- Variables: `POSTGRES_*`, `PIPELINE_*`

## 📋 Available Variables

### PostgreSQL Database

| Variable            | Default      | Description              |
| ------------------- | ------------ | ------------------------ |
| `POSTGRES_HOST`     | `localhost`  | Database host            |
| `POSTGRES_PORT`     | `5432`       | Database port            |
| `POSTGRES_DB`       | `peloton_db` | Database name            |
| `POSTGRES_USER`     | `peloton`    | Database user            |
| `POSTGRES_PASSWORD` | _(required)_ | Database password        |
| `DB_POOL_MIN`       | `2`          | Min connection pool size |
| `DB_POOL_MAX`       | `20`         | Max connection pool size |

### Backend API

| Variable          | Default                                       | Description                    |
| ----------------- | --------------------------------------------- | ------------------------------ |
| `NODE_ENV`        | `development`                                 | Environment mode               |
| `PORT`            | `3000`                                        | Backend server port            |
| `API_VERSION`     | `v1`                                          | API version prefix             |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3001` | CORS origins (comma-separated) |

### Data Pipeline

| Variable               | Default           | Description          |
| ---------------------- | ----------------- | -------------------- |
| `PIPELINE_CHUNK_SIZE`  | `10000`           | CSV read chunk size  |
| `PIPELINE_BATCH_SIZE`  | `10000`           | DB insert batch size |
| `PIPELINE_MAX_WORKERS` | `4`               | Parallel workers     |
| `PIPELINE_TIMEZONE`    | `Europe/Helsinki` | Pipeline timezone    |

## ✅ Benefits

✅ **Single source of truth** - All shared config in one place  
✅ **No duplication** - Values defined once, used everywhere  
✅ **Override capability** - Directory-specific `.env` can override root values  
✅ **Docker-friendly** - Easy `env_file` reference in docker-compose  
✅ **Clear documentation** - `.env.example` files show what's needed

## 🔒 Security

- **Never commit `.env` files** - They're gitignored
- **Always use `.env.example`** - Safe to commit, no secrets
- **Use strong passwords** - Especially for production
- **Rotate credentials** - Regular password updates

## 🐛 Troubleshooting

### Service can't connect to database

1. Check `.env` exists in project root
2. Verify `POSTGRES_PASSWORD` is set
3. Ensure database is running: `cd db && docker-compose ps`
4. Check connection details match between services

### Environment variables not loading

1. Verify `.env` file location (should be in project root)
2. Check file permissions: `ls -la .env`
3. Restart the service after changing `.env`
4. For Node.js: ensure `dotenv` package is installed

### Docker Compose not reading .env

1. Verify `env_file: - ../.env` in `docker-compose.yml`
2. Check relative path is correct from `db/` directory
3. Restart containers: `docker-compose down && docker-compose up -d`
