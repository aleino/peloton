# HSL Bike Trip Data Pipeline

This directory contains Python 3.12 scripts for processing HSL city bike trip data and loading it into PostgreSQL.

## 📁 Directory Structure

```
data/scripts/
└── etl/
    ├── config.yaml              # Pipeline configuration
    ├── models.py                # Data models and types
    ├── station_loader.py        # Station data loading
    ├── csv_reader.py            # CSV file reading and parsing
    ├── validator.py             # Data validation rules
    ├── enricher.py              # Data enrichment (derived fields)
    ├── db_writer.py             # Database bulk loading
    ├── run_pipeline.py          # Main pipeline orchestrator
    └── test_pipeline.py         # Unit tests
```

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.12
- PostgreSQL 17 with PostGIS extension
- Database schema initialized (see `db/init-scripts/`)

### 2. Install Dependencies

```bash
cd /Users/aleksi/dev/peloton
pip install -r data/scripts/etl/requirements.txt
```

### 3. Configure Environment

To set up environment variables, copy the example env file in the root directory:

```bash
cp .env.example .env
```

### 4. Run the Pipeline

```bash
# Full pipeline execution for 2024 data
python data/scripts/etl/run_pipeline.py --season 2024

# Process specific CSV files
python data/scripts/etl/run_pipeline.py --files 2024-04.csv,2024-05.csv

# Dry run (validation only, no DB writes)
python data/scripts/etl/run_pipeline.py --season 2024 --dry-run

# Load stations only
python data/scripts/etl/run_pipeline.py --stations-only

# Verbose logging
python data/scripts/etl/run_pipeline.py --season 2024 --verbose
```

## 📊 Pipeline Architecture

### Data Flow

```
CSV Files → Parse → Validate → Enrich → Load → PostgreSQL
              ↓        ↓         ↓        ↓
           Errors    Errors   Derived   COPY
                              Fields   Protocol
```

### Components

#### 1. **Station Loader** (`station_loader.py`)

- Loads station coordinates from JSON
- Upserts into `hsl.stations` with PostGIS points
- Validates station references

#### 2. **CSV Reader** (`csv_reader.py`)

- Streams CSV files in chunks (10K rows)
- Parses trip data efficiently
- Memory-safe for large files

#### 3. **Validator** (`validator.py`)

- Validates timestamps (return > departure)
- Checks duration accuracy (±60s tolerance)
- Enforces speed limits (<50 km/h average)
- Validates station references
- Ensures data quality

#### 4. **Enricher** (`enricher.py`)

- Extracts date from timestamps
- Calculates hour (0-23)
- Determines weekday (0=Monday, 6=Sunday)

#### 5. **Database Writer** (`db_writer.py`)

- Uses PostgreSQL COPY for bulk loading
- Staging table pattern for idempotency
- Handles duplicate detection
- Batch size: 10K rows

#### 6. **Pipeline Orchestrator** (`run_pipeline.py`)

- Coordinates all components
- Manages database connections
- Generates execution reports
- Logs errors and metrics

## 🔧 Configuration

Edit `data/scripts/etl/config.yaml` to customize:

```yaml
database:
  host: localhost
  port: 5432
  database: peloton_db
  user: peloton_user

pipeline:
  chunk_size: 10000 # Rows per chunk
  batch_size: 10000 # Rows per batch insert
  max_workers: 4 # Parallel workers

validation:
  max_speed_kmh: 50 # Maximum realistic speed
  duration_tolerance_sec: 60 # Duration matching tolerance
  min_duration_sec: 1 # Minimum trip duration

paths:
  raw_data: "data/raw/2024/od-trips-2024"
  station_coordinates: "data/interim/station_coordinates.json"
  logs: "data/logs"
  output: "data/output"
```

## 📈 Output Files

### Pipeline Report

**Location**: `data/output/pipeline_report_YYYYMMDD_HHMMSS.json`

```json
{
  "execution_time": "2025-11-14T23:15:00",
  "duration_seconds": 125.4,
  "files_processed": 7,
  "stations": {
    "loaded": 453,
    "missing": 6,
    "updated": 12
  },
  "trips": {
    "total_rows": 1234567,
    "valid_rows": 1234200,
    "invalid_rows": 367,
    "inserted": 1234200,
    "duplicates_skipped": 0
  },
  "errors": {
    "parsing_errors": 125,
    "validation_errors": 242,
    "by_type": {
      "excessive_speed": 45,
      "duration_mismatch": 67,
      "missing_station": 130
    }
  },
  "performance": {
    "rows_per_second": 9836
  }
}
```

### Error Logs

**Location**: `data/logs/invalid_trips.csv`

Contains all validation errors with row numbers and error messages.

### Execution Log

**Location**: `data/logs/pipeline.log`

Detailed pipeline execution log with timestamps.

## 🧪 Testing

Run unit tests:

```bash
# Run all tests
pytest data/scripts/etl/test_pipeline.py

# Run with coverage
pytest data/scripts/etl/test_pipeline.py --cov=data/scripts/etl --cov-report=html

# Run specific test class
pytest data/scripts/etl/test_pipeline.py::TestTripValidator

# Verbose output
pytest data/scripts/etl/test_pipeline.py -v
```

## 🔒 Data Quality Rules

### Timestamp Validation

- `return_time` must be after `departure_time`
- Both must be valid ISO timestamps

### Duration Validation

- Must be ≥ 1 second
- Must match actual time difference (±60 seconds)

### Distance Validation

- Must be ≥ 0 meters

### Speed Validation

- Average speed must be ≤ 50 km/h

### Station Validation

- Both departure and return stations must exist in database

## ⚡ Performance

### Expected Throughput

- **~10,000 rows/second** on typical hardware
- **~2-3 minutes** for full 2024 season (~1.2M trips)

### Optimization Features

- Chunk-based processing (memory efficient)
- PostgreSQL COPY protocol (fast bulk loading)
- Batch commits (reduces overhead)
- Staging table pattern (idempotent)

## 🔄 Idempotency

The pipeline can be safely re-run multiple times:

- Stations are upserted (no duplicates)
- Trips use conflict detection
- Duplicate trips are automatically skipped

A trip is considered duplicate if it has the same:

- `departure_time`
- `departure_station_id`
- `return_station_id`

## 🐛 Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker ps

# Verify credentials in .env
cat .env

# Test connection
psql -h localhost -U peloton_user -d peloton_db
```

### Missing Station Errors

```bash
# Re-initialize stations
python data/scripts/etl/run_pipeline.py --stations-only

# Check station coordinates file exists
ls -la data/interim/station_coordinates.json
```

### Import Errors

```bash
# Reinstall dependencies
pip install -r data/scripts/etl/requirements.txt --force-reinstall
```
