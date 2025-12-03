# Route Generation Scripts

Python scripts for generating cycling routes using Valhalla routing engine.

## Prerequisites

- Python 3.12 (via pyenv)
- PostgreSQL database running (with HSL data)
- Valhalla routing engine running (see `../README.md`)

## Environment Setup

### 1. Enable Python 3.12

```bash
pyenv shell 3.12
```

### 2. Install Dependencies

```bash
cd data/routing/scripts
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your database credentials
# The default values should work if you're using the project's Docker setup
```

### 4. Verify Setup

```bash
python test_environment.py
```

All checks should pass with ✅.

## Installed Packages

- **psycopg2-binary** (2.9.9): PostgreSQL database connectivity
- **requests** (2.31.0): HTTP client for Valhalla API
- **polyline** (2.0.2): Polyline encoding/decoding for route geometries
- **python-dotenv** (1.0.0): Environment variable management
- **tqdm** (4.66.1): Progress bars for long-running operations
- **pytest** (7.4.3): Testing framework

## Project Structure

```
data/routing/scripts/
├── requirements.txt       # Python dependencies
├── .env                   # Environment configuration (gitignored)
├── .env.example           # Example environment configuration
├── test_environment.py    # Environment validation script
└── README.md              # This file
```

## Usage

### Default Generation (Recommended)

Generate with sensible defaults:

```bash
python generate_routes.py
```

This will generate:

- Global routes: Top 5 most popular
- Individual routes: 80% coverage per station
- Output: ~2-3 MB compressed

### Custom Route Selection

See all available options:

```bash
python generate_routes.py --help
```

Common examples:

```bash
# Large dataset for production
python generate_routes.py --global-pct 100 --individual-pct 100

# Quick test with minimal data
python generate_routes.py --global-top 50 --individual-top 10

# Only global routes
python generate_routes.py --global-top 1000 --no-individual

# Aggregate file with top 10 from each station
python generate_routes.py --aggregate-top 10 --no-global --no-individual

# All three types
python generate_routes.py --global-top 100 --individual-pct 80 --aggregate-top 5
```

See main README (`../README.md`) for complete usage guide.

### Pipeline Steps

The pipeline performs these steps:

1. Connect to PostgreSQL database
2. Test Valhalla API connection
3. Analyze route statistics
4. Fetch station coordinates
5. Generate route geometries via Valhalla
6. Organize routes by departure station
7. Write compressed JSON files
8. Generate manifest and statistics

## Environment Variables

| Variable            | Description                 | Default                        |
| ------------------- | --------------------------- | ------------------------------ |
| `POSTGRES_HOST`     | PostgreSQL host             | `localhost`                    |
| `POSTGRES_PORT`     | PostgreSQL port             | `5432`                         |
| `POSTGRES_DB`       | Database name               | `peloton_db`                   |
| `POSTGRES_USER`     | Database user               | `peloton`                      |
| `POSTGRES_PASSWORD` | Database password           | _(required)_                   |
| `POSTGRES_SCHEMA`   | Schema name                 | `hsl`                          |
| `VALHALLA_URL`      | Valhalla API URL            | `http://localhost:8002`        |
| `OUTPUT_DIR`        | Output directory for routes | `../../frontend/public/routes` |

## Common Issues

### Python version wrong

```bash
# Ensure Python 3.12 is active
pyenv shell 3.12
python --version  # Should show Python 3.12.x
```

### Database connection fails

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify credentials in .env match db/.env
```

### Import errors

```bash
# Reinstall dependencies
pip install -r requirements.txt
```

## Testing

### Test Valhalla Connectivity

Test that Valhalla is running and responding correctly:

```bash
python test_valhalla.py
```

Expected output:

```
============================================================
Valhalla Connectivity Tests
============================================================

[Test 1/2] Status Endpoint
✅ Valhalla status: OK

[Test 2/2] Route Generation
✅ Route generated:
   Distance: 0.68 km
   Duration: 3.4 min
   Polyline length: 246 chars

============================================================
✅ All tests passed!
Valhalla is ready for route generation.
```

### Run Unit Tests

Test route key logic, polyline encoding, and data models:

```bash
pytest test_pipeline.py -v
```

Or run all tests:

```bash
pytest -v
```

### Run Environment Tests

Verify database and Valhalla connectivity:

```bash
python test_environment.py
```

**Important**: Always run `test_valhalla.py` before running the full pipeline to ensure Valhalla is ready.

## Output

Generated routes are written to `frontend/public/routes/`:

- **manifest.json**: Metadata and file list
- **global-top-N.json.gz** or **global-Npct.json.gz**: Global routes (if using --global-top or --global-pct)
- **per-station-top-N.json.gz** or **per-station-Npct.json.gz**: Aggregate routes (if using --aggregate-top or --aggregate-pct)
- **by-station/s{id}.json.gz**: Per-station route files (if not using --no-individual)
