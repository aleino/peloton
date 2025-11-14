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

The database uses the `hsl` schema to organize HSL city bike data.

### Tables

#### `hsl.stations`

City bike station information with geospatial data.

| Column       | Type                       | Constraints                     | Description                                           |
| ------------ | -------------------------- | ------------------------------- | ----------------------------------------------------- |
| `station_id` | `VARCHAR(10)`              | PRIMARY KEY                     | HSL station identifier (e.g., '018', '103')           |
| `name`       | `VARCHAR(255)`             | NOT NULL                        | Station name                                          |
| `location`   | `GEOGRAPHY(POINT, 4326)`   |                                 | Station location as WGS84 point (longitude, latitude) |
| `address`    | `VARCHAR(255)`             |                                 | Street address                                        |
| `city`       | `VARCHAR(100)`             | CHECK (Helsinki, Espoo, Vantaa) | City where station is located                         |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT CURRENT_TIMESTAMP       | Record creation timestamp                             |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT CURRENT_TIMESTAMP       | Last update timestamp (auto-updated)                  |

#### `hsl.trips`

Individual bike trip records (Origin-Destination data).

| Column                 | Type                       | Constraints               | Description                                                 |
| ---------------------- | -------------------------- | ------------------------- | ----------------------------------------------------------- |
| `trip_id`              | `BIGSERIAL`                | PRIMARY KEY               | Auto-incrementing trip identifier                           |
| `departure_time`       | `TIMESTAMP WITH TIME ZONE` | NOT NULL                  | Trip departure timestamp                                    |
| `departure_date`       | `DATE`                     | NOT NULL                  | Departure date (denormalized for query performance)         |
| `departure_hour`       | `INTEGER`                  | NOT NULL, 0-23            | Departure hour (denormalized for query performance)         |
| `departure_weekday`    | `INTEGER`                  | NOT NULL, 0-6             | Departure weekday (0=Monday, 6=Sunday)                      |
| `return_time`          | `TIMESTAMP WITH TIME ZONE` | NOT NULL                  | Trip return timestamp                                       |
| `return_date`          | `DATE`                     | NOT NULL                  | Return date (denormalized for query performance)            |
| `return_hour`          | `INTEGER`                  | NOT NULL, 0-23            | Return hour (denormalized for query performance)            |
| `return_weekday`       | `INTEGER`                  | NOT NULL, 0-6             | Return weekday (0=Monday, 6=Sunday)                         |
| `departure_station_id` | `VARCHAR(10)`              | NOT NULL, FK → stations   | Departure station reference                                 |
| `return_station_id`    | `VARCHAR(10)`              | NOT NULL, FK → stations   | Return station reference                                    |
| `distance_meters`      | `INTEGER`                  | NOT NULL, ≥ 0             | Trip distance in meters (can be 0 for same-station returns) |
| `duration_seconds`     | `INTEGER`                  | NOT NULL, > 0             | Trip duration in seconds                                    |
| `created_at`           | `TIMESTAMP WITH TIME ZONE` | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp                                   |

**Data Validation:**

- Return time must be after departure time
- Average speed cannot exceed 50 km/h
- Duration must match timestamp difference (±60 seconds tolerance)
- All hour and weekday values must be in valid ranges

## Initialization Scripts

The database is initialized with scripts in `init-scripts/` directory:

- `01-ini.sql` - Sets timezone, creates schema, enables PostGIS extension
- `02-stations.sql` - Creates `hsl.stations` table with indexes and triggers
- `03-trips.sql` - Creates `hsl.trips` table with indexes and constraints

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
