# Peloton Database

PostgreSQL 17 database with PostGIS extension for HSL city bike trip data.

## Quick Start

### Start the database

```bash
cd db
docker-compose up -d
```

### Check status

```bash
docker-compose ps
docker-compose logs -f peloton-db
```

### Connect to database

```bash
docker-compose exec peloton-db psql -U peloton -d peloton_db
```

### Stop the database

```bash
docker-compose down
```

### Reset database (removes all data)

```bash
docker-compose down -v
docker-compose up -d
```

## Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Edit `.env` to set your database credentials:

```env
POSTGRES_DB=peloton_db
POSTGRES_USER=peloton
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_PORT=5432
```

## Database Schema

TBW.

## Initialization Scripts

The database is initialized with scripts in `init-scripts/` directory:

- `01-extensions.sql` - Enables PostGIS extension

Scripts are executed in alphabetical order during first container start.

## Backup & Restore

### Create backup

```bash
docker-compose exec peloton-db pg_dump -U peloton peloton_db > backups/peloton_$(date +%Y%m%d_%H%M%S).sql
```

### Restore backup

```bash
cat backups/peloton_20251112_123456.sql | docker-compose exec -T peloton-db psql -U peloton -d peloton_db
```

## Validation Queries

Connect to the database and run these queries to verify installation:

```sql
-- Check PostgreSQL version
SELECT version();

-- Check PostGIS installation
SELECT PostGIS_Full_Version();

-- List all extensions
SELECT * FROM pg_extension;

-- Check database encoding
SHOW SERVER_ENCODING;
SHOW CLIENT_ENCODING;
```

## Troubleshooting

### Container won't start

Check logs:

```bash
docker-compose logs peloton-db
```

### Connection refused

Ensure the container is running and healthy:

```bash
docker-compose ps
```

Check health status should show "healthy".

### Port already in use

Change `POSTGRES_PORT` in `.env` file to a different port (e.g., 5433).

### Reset everything

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Development

### Rebuild image after Dockerfile changes

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### View real-time logs

```bash
docker-compose logs -f peloton-db
```

### Execute SQL file

```bash
docker-compose exec -T peloton-db psql -U peloton -d peloton_db < your-script.sql
```

## Security Notes

- **Development**: Default credentials are for local development only
- **Production**: Always use strong passwords and restrict network access
- **Environment**: Never commit `.env` file to version control

## Performance

Default PostgreSQL configuration is suitable for development. For production or large datasets, consider tuning:

- `shared_buffers`
- `work_mem`
- `maintenance_work_mem`
- `effective_cache_size`
