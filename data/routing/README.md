# Bicycle Route Generation System

Generates bicycle route geometries between HSL bike station pairs using Valhalla routing engine.

## Overview

This system generates polyline-encoded bicycle routes for visualization in the Peloton application. Routes are computed using Valhalla with OpenStreetMap data and output as gzip-compressed JSON files.

### Features

- **Bidirectional deduplication**: One geometry per station pair (40% storage savings)
- **Flexible route selection**: Generate exactly what you need
  - Global routes: Top N or percentage coverage across all trips
  - Individual station routes: Top N or percentage per station
  - Per-station aggregate: Single file with top routes from each station
  - Generate any combination in a single run
- **Sensible defaults**: 5 top global routes + 80% individual coverage
- **Gzip compression**: ~70-80% size reduction
- **Per-station organization**: One file per station for efficient loading

### Output Structure

```text
frontend/public/routes/
├── manifest.json                  # Generation metadata
├── global-top-50.json.gz         # Most popular routes (if using --global-top)
├── global-80pct.json.gz          # Coverage routes (if using --global-pct)
├── per-station-top-10.json.gz    # Top routes from each station (if using --aggregate-top)
├── per-station-50pct.json.gz     # PCT routes from each station (if using --aggregate-pct)
└── by-station/
    ├── s030.json.gz              # Routes from station 030
    ├── s045.json.gz              # Routes from station 045
    └── ...                       # One file per station
```

Note: Filenames depend on selection strategies used.

### Generation Statistics

Approximate timings and output sizes for common configurations:

| Configuration                                            | Routes | Time   | Gzipped Size | Use Case      |
| -------------------------------------------------------- | ------ | ------ | ------------ | ------------- |
| `--global-top 100 --individual-pct 50`                   | ~500   | 5 min  | ~3 MB        | Development   |
| `--global-top 1000 --individual-pct 80`                  | ~5K    | 10 min | ~8 MB        | MVP/Demo      |
| `--aggregate-top 10 --no-global --no-individual`         | ~4.5K  | 8 min  | ~4 MB        | All stations  |
| `--global-pct 95 --individual-pct 95`                    | ~40K   | 45 min | ~20 MB       | Production    |
| `--global-pct 100 --individual-pct 100`                  | ~41K   | 60 min | ~23 MB       | Complete      |
| `--global-top 100 --individual-pct 80 --aggregate-top 5` | ~7K    | 12 min | ~6 MB        | Comprehensive |

**Note**: All sizes are gzipped (compression level 9, ~70-80% reduction from uncompressed JSON)

**Generation rate**: ~1-2 routes/second | **Success rate**: >99%

---

## Prerequisites

### Required Software

- **Docker & Docker Compose** (for Valhalla)
- **Python 3.12** (via pyenv)
- **PostgreSQL** (HSL trips database)
- **~1 GB disk space** (for Valhalla OSM tiles - Helsinki region only)
- **~2-4 GB RAM** (for Valhalla routing)

### Data Requirements

- HSL trips data loaded in `hsl.trips` table
- HSL stations data loaded in `hsl.stations` table with PostGIS location

---

## Setup

### Step 1: Setup Valhalla (Docker)

Before starting Valhalla for the first time, run the setup script to download and clip OSM data to the Helsinki metropolitan area:

```bash
cd data/routing
./scripts/setup_routing.sh
```

This script will:

1. ✓ Check/install `osmium-tool` dependency
2. ✓ Download Finland OSM data (662 MB, ~4-5 min)
3. ✓ Clip to Helsinki region (saves ~90% space)
4. ✓ Prepare clipped file for Docker mounting

**Expected output**: Clipped file `data/helsinki-region.osm.pbf` (~50-80 MB)

Then start Valhalla:

```bash
docker-compose up -d

# Monitor tile building (takes ~2-3 minutes with clipped data)
docker-compose logs -f valhalla

# Wait for "Tile building complete" message

# Test connectivity
./test_valhalla.sh
```

### Step 2: Setup Python Environment

```bash
cd data/routing/scripts

# Enable Python 3.12
pyenv shell 3.12

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Configure Environment

```bash
# Create .env file from example
cp .env.example .env

# Edit with your database credentials
vim .env
```

Required variables:

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=peloton_db
POSTGRES_USER=peloton
POSTGRES_PASSWORD=your_password_here
POSTGRES_SCHEMA=hsl

VALHALLA_URL=http://localhost:8002
OUTPUT_DIR=../../frontend/public/routes
```

### Step 4: Verify Setup

```bash
# Test environment
python test_environment.py

# Run unit tests
pytest test_pipeline.py -v
```

All tests should pass before proceeding.

---

## Usage

### Default Configuration (Recommended)

Generate with sensible defaults (5 top global routes, 80% individual coverage):

```bash
cd data/routing/scripts
source venv/bin/activate

python generate_routes.py
```

### Custom Global Routes

Generate specific number of top global routes:

```bash
# Top 1000 most popular routes
python generate_routes.py --global-top 1000 --no-individual

# Top 50 routes with 90% individual coverage
python generate_routes.py --global-top 50 --individual-pct 90
```

Generate global routes by coverage percentage:

```bash
# Routes covering 95% of all trips
python generate_routes.py --global-pct 95 --no-individual
```

### Custom Individual Station Routes

Generate specific number of routes per station:

```bash
# Top 10 routes for each station
python generate_routes.py --no-global --individual-top 10
```

Generate by coverage percentage per station:

```bash
# Routes covering 75% of each station's trips (default: 80%)
python generate_routes.py --no-global --individual-pct 75
```

### Per-Station Aggregate Routes

Generate single file with top routes from each station:

```bash
# Top 10 routes from each station
python generate_routes.py --aggregate-top 10 --no-global --no-individual

# Routes covering 50% of trips from each station
python generate_routes.py --aggregate-pct 50 --no-global --no-individual
```

### Combined Strategies

Mix and match global, individual, and aggregate strategies:

```bash
# Top 100 global + 90% individual
python generate_routes.py --global-top 100 --individual-pct 90

# 95% global + top 20 individual
python generate_routes.py --global-pct 95 --individual-top 20

# Both using percentages
python generate_routes.py --global-pct 80 --individual-pct 80

# All three types with different strategies
python generate_routes.py --global-top 100 --individual-pct 80 --aggregate-top 5

# Aggregate with individual (no global)
python generate_routes.py --no-global --individual-pct 80 --aggregate-top 10
```

### Additional Options

```bash
# Set minimum trips threshold
python generate_routes.py --min-trips 5

# Enable debug logging
python generate_routes.py --log-level DEBUG

# See all options
python generate_routes.py --help
```

### Understanding the Strategies

**Global Routes** (main file):

- Include routes important across the entire network
- TOP_N: Selects N most popular routes globally
- PERCENTAGE: Selects routes covering X% of all trips
- Used for: City-wide patterns, popular corridors

**Individual Station Routes** (per-station files):

- Include routes relevant to each specific station
- TOP_N: Selects N most popular routes from each station
- PERCENTAGE: Selects routes covering X% of each station's trips
- Used for: Station-specific navigation, local routing

**Per-Station Aggregate** (single file):

- Single file with top routes FROM each station
- TOP_N: Selects N most popular routes departing from each station
- PERCENTAGE: Selects routes covering X% of trips from each station
- Used for: Comprehensive network overview, ensuring all stations represented

**Typical Configurations**:

- **Development/Testing**: `--global-top 100 --individual-pct 50` (fast, ~5 min)
- **MVP/Demo**: `--global-top 1000 --individual-pct 80` (balanced, ~10 min)
- **Production**: `--global-pct 100 --individual-pct 100` (complete, ~60 min)
- **Comprehensive Coverage**: `--aggregate-top 10` (all stations, ~5 min)

### Command Options

```bash
python generate_routes.py --help
```

**Global Route Selection** (for main output file):

- `--global-top N`: Generate top N most popular routes globally
- `--global-pct PCT`: Generate routes covering PCT% of all trips (0-100)
- `--no-global`: Skip generating global routes file

**Individual Station Route Selection** (for per-station files):

- `--individual-top N`: Generate top N routes for each station
- `--individual-pct PCT`: Generate routes covering PCT% per station (0-100)
- `--no-individual`: Skip generating per-station route files

**Per-Station Aggregate Selection** (single file with routes from all stations):

- `--aggregate-top N`: Generate file with top N routes from each station
- `--aggregate-pct PCT`: Generate file with PCT% routes from each station (0-100)
- `--no-aggregate`: Skip generating aggregate file (default: skipped)

**Other Options**:

- `--min-trips N`: Minimum trips required for a route (default: 1)
- `--log-level {DEBUG,INFO,WARNING,ERROR}`: Logging level (default: INFO)

**Defaults** (when no arguments provided):

- Global: Top 5 routes
- Individual: 80% coverage per station
- Aggregate: None (not generated by default)
- Min trips: 1

---

## Output File Formats

### manifest.json

Generation metadata and file index:

```json
{
  "generated_at": "2025-11-30T12:00:00Z",
  "version": "1.0",
  "configuration": {
    "global_strategy": "top_5",
    "individual_strategy": "80_pct",
    "aggregate_strategy": null
  },
  "statistics": {
    "total_routes": 495,
    "unique_routes": 495,
    "stations_count": 300,
    "generation_time_seconds": 315,
    "success_rate_pct": 99.0
  },
  "files": {
    "global_routes": "global-top-5.json.gz",
    "aggregate_routes": null,
    "station_files": ["s030.json.gz", "s045.json.gz", ...]
  },
  "format": {
    "encoding": "polyline",
    "precision": 6,
    "compression": "gzip"
  }
}
```

### global-top-N.json.gz or global-Npct.json.gz

Global routes file (when using --global-top or --global-pct):

```json
{
  "routes": [
    {
      "route_key": "030-067",
      "from": "030",
      "to": "067",
      "polyline": "u`~nJqafxC_@aA...",
      "distance_km": 2.53,
      "duration_min": 10.2,
      "bidirectional": true
    }
  ],
  "count": 495
}
```

### by-station/s{id}.json.gz

Per-station routes:

```json
{
  "station_id": "030",
  "routes": [
    {
      "to": "067",
      "polyline": "u`~nJqafxC_@aA...",
      "direction": "forward",
      "bidirectional": true,
      "distance_km": 2.53,
      "duration_min": 10.2
    },
    {
      "to": "045",
      "polyline": "w`~nJsafxC_@cB...",
      "direction": "reverse",
      "bidirectional": true,
      "distance_km": 1.82,
      "duration_min": 8.1
    }
  ],
  "count": 42
}
```

### Field Descriptions

- **polyline**: Google polyline-encoded geometry (precision 6 = ~0.1m accuracy)
- **direction**: `"forward"` (canonical order) or `"reverse"` (geometry reversed)
- **bidirectional**: Always `true` (geometry works in both directions)
- **distance_km**: Route length in kilometers
- **duration_min**: Estimated cycling time in minutes

### Decoding Polylines

JavaScript (frontend):

```javascript
import polyline from '@mapbox/polyline';

const encoded = 'u`~nJqafxC_@aA...';
const coordinates = polyline.decode(encoded, 6); // precision 6
// Returns: [[60.1695, 24.9354], [60.1712, 24.9412], ...]
```

Python:

```python
import polyline

encoded = 'u`~nJqafxC_@aA...'
coordinates = polyline.decode(encoded, precision=6)
# Returns: [(60.1695, 24.9354), (60.1712, 24.9412), ...]
```

---

## Troubleshooting

### Valhalla Issues

**Problem**: "Valhalla connection failed"

```bash
# Check if container is running
docker ps | grep valhalla

# If not running, start it
cd data/routing
docker-compose up -d

# Wait for tiles to build
docker-compose logs -f valhalla

# Test endpoint
./test_valhalla.sh
```

**Problem**: Tiles not building

```bash
# Check logs for errors
docker logs valhalla | grep -i error

# Ensure setup script was run first
./scripts/setup_routing.sh

# Try rebuilding with fresh volume
docker-compose down -v
docker-compose up -d
```

**Problem**: Routes fail with HTTP 400

- Some station pairs may not have valid cycling routes
- Check if stations are on disconnected road networks (islands)
- Verify coordinates are within Helsinki region (bbox: 24.6-25.3°E, 60.0-60.5°N)
- Review Valhalla logs for specific errors

### Database Issues

**Problem**: "Database connection failed"

```bash
# Test connection manually
psql -h localhost -p 5432 -U peloton -d peloton_db -c "SELECT 1;"

# Check credentials in .env
cat .env | grep POSTGRES
```

**Problem**: "Missing coordinates for station"

```sql
-- Check if station exists in database
SELECT station_id, ST_AsText(location)
FROM hsl.stations
WHERE station_id = '030';

-- Check for NULL locations
SELECT COUNT(*) FROM hsl.stations WHERE location IS NULL;
```

### Python Issues

**Problem**: Import errors

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Verify Python version
python --version  # Should be 3.12.x

# Reinstall dependencies
pip install -r requirements.txt
```

**Problem**: "psycopg2" install fails

```bash
# macOS: Install libpq
brew install libpq

# Ubuntu/Debian:
sudo apt-get install libpq-dev
```

### Performance Issues

**Problem**: Generation is very slow

- Check system resources: `docker stats`
- Ensure Valhalla has enough memory (2-4 GB)
- Check network latency between Python and Valhalla
- Review Valhalla logs for warnings

**Problem**: High failure rate

- Check Valhalla logs for errors
- Verify OSM data covers all station locations
- Check for missing station coordinates in database

---

## Maintenance

### Regenerating Routes

Routes can be regenerated at any time:

```bash
# Remove old files
rm -rf ../../frontend/public/routes/*

# Generate new routes (using defaults or custom config)
python generate_routes.py
# or
python generate_routes.py --global-top 1000 --individual-pct 80
```

Data in the database is never modified.

### Updating OSM Data

To use newer OpenStreetMap data:

```bash
cd data/routing

# Re-run setup script with force flag
./scripts/setup_routing.sh --force-download

# Rebuild Valhalla tiles
docker-compose down -v
docker-compose up -d

# Wait for new tiles to build (~2-3 minutes)
```

**Recommended frequency**: Monthly or quarterly updates

### Testing Changes

After modifying code:

```bash
# Run unit tests
pytest test_pipeline.py -v

# Test with small sample
# (manually edit generate_routes.py to limit routes)
```

---

## Architecture

### Components

1. **RouteAnalyzer**: Queries database for trip statistics and calculates coverage
2. **RouteGenerator**: Calls Valhalla API for route geometries
3. **RouteFileWriter**: Writes organized output files with optional filtering
4. **RoutePipeline**: Orchestrates complete workflow

### Data Flow

```text
PostgreSQL (trips)
  → RouteAnalyzer (statistics, coordinates, coverage calculation)
  → RouteGenerator (Valhalla API)
  → RouteFileWriter (JSON + gzip, per-station filtering)
  → frontend/public/routes/
```

### Bidirectional Route Handling

- Routes A→B and B→A use the same geometry
- Stored once with canonical key: min(A,B)-max(A,B)
- Included in both station files with direction indicator
- Frontend reverses geometry when direction="reverse"

### Route Selection Logic

The system supports three independent route selection strategies:

**1. Global Routes** (main file):

- Selects routes based on popularity across entire network
- TOP_N: Selects N most popular routes globally
- PERCENTAGE: Selects routes covering X% of all trips
- Used for city-wide route visualization

**2. Individual Station Routes** (per-station files):

- For each station, selects routes based on that station's trip distribution
- TOP_N: Selects N most popular routes from each station
- PERCENTAGE: Selects routes covering X% of each station's trips
- Each station file only contains routes relevant to that station
- Example (80% coverage): Station 030 with 1000 trips across 50 destinations → top 10 destinations covering 820 trips

**3. Per-Station Aggregate** (single comprehensive file):

- Collects top routes FROM each station into one file
- TOP_N: Includes N most popular routes departing from each station
- PERCENTAGE: Includes routes covering X% of trips from each station
- Ensures all stations are represented in dataset
- Useful for network-wide analysis and visualization

**SQL Implementation**:

- Uses window functions (PARTITION BY, ROW_NUMBER) for efficient calculation
- Includes cumulative trip counts to determine coverage cutoffs
- Always includes at least one route per station

**Benefits**:

- Flexible: Generate exactly what you need
- Efficient: Avoid generating rarely-used routes
- Comprehensive: Ensure coverage across all stations
- Independent: Combine strategies as needed

---

## File Organization

```text
data/routing/
├── docker-compose.yml         # Valhalla container setup
├── test_valhalla.sh          # Valhalla connectivity test
├── custom_files/
│   └── valhalla.json         # Valhalla configuration
├── scripts/
│   ├── setup_routing.sh      # OSM data download and clipping
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (gitignored)
│   ├── .env.example          # Example configuration
│   ├── models.py             # Data models
│   ├── config.py             # Configuration management
│   ├── route_analyzer.py     # Database analysis and coverage calculation
│   ├── route_generator.py    # Valhalla integration
│   ├── file_writer.py        # File output with filtering
│   ├── generate_routes.py    # Main pipeline
│   ├── validate_coverage.py  # Coverage validation script
│   ├── test_environment.py   # Environment tests
│   ├── test_pipeline.py      # Unit tests
│   └── test_route_analyzer.py # RouteAnalyzer tests
└── README.md                  # This file
```

---

## Performance Benchmarks

See the [Generation Statistics](#generation-statistics) table above for common configurations.

### Resource Usage

- **CPU**: Moderate (HTTP requests, JSON encoding)
- **Memory**: ~200 MB (Python process)
- **Disk I/O**: Low (streaming writes)
- **Network**: Moderate (Valhalla API calls)
- **Generation Rate**: ~1-2 routes/second
- **Success Rate**: >99%

---

## Valhalla Configuration

### Docker Compose Settings

- **Port**: 8002 (exposed to host)
- **OSM Data**: Helsinki region clipped from Finland
- **Tile Storage**: Docker volume `valhalla_tiles`
- **Configuration**: `custom_files/valhalla.json`

### Bicycle Routing Parameters

- **Max Distance**: 50 km (50,000 meters)
- **Max Matrix Distance**: 100 km (100,000 meters)
- **Bicycle Type**: Road bike
- **Cycling Speed**: 15 km/h
- **Road Preference**: Minimal (0.1 - prefers bike paths)
- **Hill Avoidance**: Low (0.25)
- **Bad Surface Avoidance**: High (0.85)

### Bounding Box Configuration

The Helsinki region bounding box is defined in `scripts/config/helsinki-bbox.json`:

```json
{
  "bbox": {
    "min_lon": 24.6,
    "min_lat": 60.0,
    "max_lon": 25.3,
    "max_lat": 60.5
  }
}
```

This covers:

- **Cities**: Helsinki, Espoo, Vantaa
- **Coverage**: All HSL bike stations + 20km buffer for routing
- **Area**: ~70km × 55km rectangle

---

## Additional Resources

- **Valhalla API Documentation**: <https://valhalla.github.io/valhalla/api/>
- **Polyline Encoding**: <https://developers.google.com/maps/documentation/utilities/polylinealgorithm>
- **OpenStreetMap Data**: <https://www.geofabrik.de/data/download.html>

---

**Version**: 1.1  
**Author**: Peloton Development Team
