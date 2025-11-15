"""Main pipeline orchestrator for HSL bike trip data ETL.

This module coordinates the entire pipeline: loading stations, reading CSV files,
validating data, enriching with derived fields, and bulk loading into PostgreSQL.
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional
import yaml
from dotenv import load_dotenv
import psycopg
from tqdm import tqdm

from models import PipelineMetrics, ValidationError
from station_loader import initialize_stations, get_all_station_ids
from csv_reader import iter_csv_files, parse_csv_file
from validator import create_validator_from_config
from enricher import enrich_trip_batch
from db_writer import bulk_insert_trips


# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def load_config(config_path: str) -> dict:
    """Load pipeline configuration from YAML file.

    Args:
        config_path: Path to config.yaml file

    Returns:
        Configuration dictionary
    """
    # Load root .env file first (shared configuration)
    root_env = Path(__file__).parent.parent.parent.parent / ".env"
    if root_env.exists():
        load_dotenv(root_env)
        logger.info(f"Loaded root .env from {root_env}")

    # Load db .env for backwards compatibility (will override root values)
    db_env = Path(__file__).parent.parent.parent.parent / "db" / ".env"
    if db_env.exists():
        load_dotenv(db_env, override=True)
        logger.info(f"Loaded db .env from {db_env}")

    with open(config_path, "r") as f:
        config = yaml.safe_load(f)

    # Replace environment variables in config (env vars take precedence)
    if "database" in config:
        db_config = config["database"]
        db_config["host"] = os.getenv(
            "POSTGRES_HOST", db_config.get("host", "localhost")
        )
        db_config["port"] = int(
            os.getenv("POSTGRES_PORT", str(db_config.get("port", 5432)))
        )
        db_config["database"] = os.getenv(
            "POSTGRES_DB", db_config.get("database", "peloton_db")
        )
        db_config["user"] = os.getenv("POSTGRES_USER", db_config.get("user", "peloton"))
        db_config["password"] = os.getenv(
            "POSTGRES_PASSWORD", db_config.get("password", "")
        )

    # Convert relative paths to absolute paths (relative to project root)
    if "paths" in config:
        project_root = Path(__file__).parent.parent.parent.parent
        for key, value in config["paths"].items():
            if value and not Path(value).is_absolute():
                config["paths"][key] = str(project_root / value)

    return config


def create_db_connection(config: dict) -> psycopg.Connection:
    """Create PostgreSQL database connection.

    Args:
        config: Configuration dictionary with database settings

    Returns:
        Active psycopg connection
    """
    db_config = config["database"]

    connection_string = (
        f"host={db_config['host']} "
        f"port={db_config['port']} "
        f"dbname={db_config['database']} "
        f"user={db_config['user']} "
        f"password={db_config['password']}"
    )

    logger.info(
        f"Connecting to database: {db_config['host']}:{db_config['port']}/{db_config['database']}"
    )

    try:
        connection = psycopg.connect(connection_string)
        logger.info("Database connection established")
        return connection
    except psycopg.DatabaseError as e:
        logger.error(f"Failed to connect to database: {e}")
        raise


def write_error_log(errors: list[ValidationError], log_path: Path):
    """Write validation errors to CSV file.

    Args:
        errors: List of validation errors
        log_path: Path to error log file
    """
    if not errors:
        return

    logger.info(f"Writing {len(errors)} validation errors to {log_path}")

    with open(log_path, "w", encoding="utf-8") as f:
        # Write CSV header
        f.write("row_number,error_type,message\n")

        for error in errors:
            row_num = error.row_number if error.row_number else "N/A"
            f.write(f'{row_num},{error.error_type},"{error.message}"\n')


def write_pipeline_report(metrics: PipelineMetrics, output_path: Path):
    """Write pipeline execution report to JSON file.

    Args:
        metrics: Pipeline metrics to write
        output_path: Path to output JSON file
    """
    logger.info(f"Writing pipeline report to {output_path}")

    report = metrics.to_dict()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)


def process_pipeline(
    config: dict,
    dry_run: bool = False,
    stations_only: bool = False,
    specific_files: Optional[list[str]] = None,
) -> PipelineMetrics:
    """Execute the full pipeline.

    Args:
        config: Configuration dictionary
        dry_run: If True, validate only without writing to database
        stations_only: If True, only load stations and exit
        specific_files: Optional list of specific CSV files to process

    Returns:
        PipelineMetrics with execution statistics
    """
    metrics = PipelineMetrics()
    metrics.start_time = datetime.now()

    all_validation_errors = []

    # Create database connection
    connection = create_db_connection(config)

    try:
        # Step 1: Initialize stations
        logger.info("=== Step 1: Loading Stations ===")
        station_json_path = config["paths"]["station_coordinates"]

        if not dry_run:
            inserted, updated = initialize_stations(connection, station_json_path)
            metrics.stations_loaded = inserted
            metrics.stations_updated = updated
            logger.info(f"Stations: {inserted} inserted, {updated} updated")

        # Get valid station IDs for validation
        valid_station_ids = get_all_station_ids(connection)
        logger.info(f"Loaded {len(valid_station_ids)} valid station IDs")

        if stations_only:
            logger.info("Stations-only mode: exiting")
            metrics.end_time = datetime.now()
            return metrics

        # Step 2: Create validator
        logger.info("=== Step 2: Creating Validator ===")
        validator = create_validator_from_config(config, valid_station_ids)

        # Step 3: Process CSV files
        logger.info("=== Step 3: Processing CSV Files ===")
        raw_data_dir = Path(config["paths"]["raw_data"])
        chunk_size = config["pipeline"]["chunk_size"]

        # Get CSV files to process
        if specific_files:
            csv_files = [raw_data_dir / f for f in specific_files]
        else:
            csv_files = list(iter_csv_files(raw_data_dir))

        logger.info(f"Processing {len(csv_files)} CSV files")

        # Process each CSV file
        for csv_file in csv_files:
            logger.info(f"Processing file: {csv_file.name}")
            metrics.files_processed += 1

            # Process file in chunks
            for raw_trips, parse_errors in parse_csv_file(csv_file, chunk_size):
                metrics.total_rows += len(raw_trips)
                metrics.parsing_errors += len(parse_errors)
                all_validation_errors.extend(parse_errors)

                if not raw_trips:
                    continue

                # Validate trips
                valid_trips, validation_errors = validator.validate_batch(raw_trips)
                metrics.validation_errors += len(validation_errors)
                all_validation_errors.extend(validation_errors)

                # Track validation error types
                for error in validation_errors:
                    error_type = error.error_type
                    metrics.validation_errors_by_type[error_type] = (
                        metrics.validation_errors_by_type.get(error_type, 0) + 1
                    )

                metrics.valid_rows += len(valid_trips)
                metrics.invalid_rows += len(validation_errors)

                if not valid_trips:
                    continue

                # Enrich trips
                enriched_trips = enrich_trip_batch(valid_trips)

                # Insert to database (skip if dry run)
                if not dry_run:
                    try:
                        inserted, skipped = bulk_insert_trips(
                            connection, enriched_trips
                        )
                        metrics.trips_inserted += inserted
                        metrics.duplicates_skipped += skipped
                    except Exception as e:
                        logger.error(f"Database error during insert: {e}")
                        metrics.database_errors += 1

        # Step 4: Write error logs
        logger.info("=== Step 4: Writing Error Logs ===")
        if all_validation_errors:
            error_log_path = Path(config["paths"]["logs"]) / "invalid_trips.csv"
            write_error_log(all_validation_errors, error_log_path)

    finally:
        connection.close()
        logger.info("Database connection closed")

    metrics.end_time = datetime.now()
    return metrics


def main():
    """Main entry point for pipeline execution."""
    parser = argparse.ArgumentParser(
        description="HSL Bike Trip Data Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Full pipeline execution
  python run_pipeline.py --season 2024
  
  # Process specific files
  python run_pipeline.py --files 2024-04.csv,2024-05.csv
  
  # Dry run (validate only)
  python run_pipeline.py --season 2024 --dry-run
  
  # Initialize stations only
  python run_pipeline.py --stations-only
  
  # Verbose logging
  python run_pipeline.py --season 2024 --verbose
        """,
    )

    parser.add_argument(
        "--config",
        default="config.yaml",
        help="Path to configuration file (default: config.yaml)",
    )

    parser.add_argument("--season", help="Season year to process (e.g., 2024)")

    parser.add_argument(
        "--files", help="Comma-separated list of specific CSV files to process"
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate data without writing to database",
    )

    parser.add_argument(
        "--stations-only", action="store_true", help="Only load stations and exit"
    )

    parser.add_argument(
        "--verbose", action="store_true", help="Enable verbose (DEBUG) logging"
    )

    args = parser.parse_args()

    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Load environment variables
    load_dotenv()

    # Load configuration
    try:
        config = load_config(args.config)
    except Exception as e:
        logger.error(f"Failed to load configuration: {e}")
        sys.exit(1)

    # Parse specific files if provided
    specific_files = None
    if args.files:
        specific_files = [f.strip() for f in args.files.split(",")]

    # Update config paths if season specified
    if args.season:
        project_root = Path(__file__).parent.parent.parent.parent
        config["paths"]["raw_data"] = str(
            project_root / f"data/raw/{args.season}/od-trips-{args.season}"
        )

    # Run pipeline
    logger.info("=" * 60)
    logger.info("HSL BIKE TRIP DATA PIPELINE")
    logger.info("=" * 60)

    try:
        metrics = process_pipeline(
            config,
            dry_run=args.dry_run,
            stations_only=args.stations_only,
            specific_files=specific_files,
        )

        # Write report
        output_dir = Path(config["paths"]["output"])
        output_dir.mkdir(parents=True, exist_ok=True)
        report_path = (
            output_dir
            / f'pipeline_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        )
        write_pipeline_report(metrics, report_path)

        # Print summary
        logger.info("=" * 60)
        logger.info("PIPELINE EXECUTION SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Duration: {metrics.duration_seconds:.2f} seconds")
        logger.info(f"Files processed: {metrics.files_processed}")
        logger.info(f"Total rows: {metrics.total_rows:,}")
        logger.info(f"Valid rows: {metrics.valid_rows:,}")
        logger.info(f"Invalid rows: {metrics.invalid_rows:,}")
        logger.info(f"Trips inserted: {metrics.trips_inserted:,}")
        logger.info(f"Duplicates skipped: {metrics.duplicates_skipped:,}")
        logger.info(f"Throughput: {metrics.rows_per_second:.2f} rows/second")
        logger.info("=" * 60)

        if args.dry_run:
            logger.info("DRY RUN: No data written to database")

    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
