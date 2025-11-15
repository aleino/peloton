"""CSV reader for HSL bike trip data.

This module provides efficient streaming and parsing of CSV files
containing trip data, with memory-efficient chunk-based processing.
"""

import logging
from pathlib import Path
from typing import Iterator, Optional, List
from datetime import datetime
import pandas as pd

from models import RawTripData, ValidationError


logger = logging.getLogger(__name__)


def iter_csv_files(directory: Path) -> Iterator[Path]:
    """Iterate over CSV files in a directory.

    Args:
        directory: Path to directory containing CSV files

    Yields:
        Path objects for each CSV file found

    Raises:
        FileNotFoundError: If directory doesn't exist
    """
    dir_path = Path(directory)

    if not dir_path.exists():
        raise FileNotFoundError(f"Directory not found: {directory}")

    if not dir_path.is_dir():
        raise NotADirectoryError(f"Not a directory: {directory}")

    csv_files = sorted(dir_path.glob("*.csv"))

    if not csv_files:
        logger.warning(f"No CSV files found in {directory}")
    else:
        logger.info(f"Found {len(csv_files)} CSV files in {directory}")

    for csv_file in csv_files:
        yield csv_file


def read_csv_chunk(file_path: Path, chunk_size: int = 10000) -> Iterator[pd.DataFrame]:
    """Read CSV file in chunks for memory-efficient processing.

    Args:
        file_path: Path to CSV file
        chunk_size: Number of rows per chunk (default: 10000)

    Yields:
        DataFrame chunks from the CSV file

    Raises:
        FileNotFoundError: If CSV file doesn't exist
        pd.errors.ParserError: If CSV parsing fails
    """
    if not file_path.exists():
        raise FileNotFoundError(f"CSV file not found: {file_path}")

    logger.info(f"Reading CSV file: {file_path.name}")

    try:
        # Use pandas read_csv with chunk size for streaming
        reader = pd.read_csv(
            file_path,
            chunksize=chunk_size,
            parse_dates=["Departure", "Return"],
            encoding="utf-8",
            dtype={
                "Departure station id": str,
                "Return station id": str,
            },
        )

        chunk_count = 0
        for chunk in reader:
            chunk_count += 1
            logger.debug(f"Processing chunk {chunk_count} ({len(chunk)} rows)")
            yield chunk

    except pd.errors.ParserError as e:
        logger.error(f"CSV parsing error in {file_path.name}: {e}")
        raise


def parse_trip_row(
    row: pd.Series, row_number: int
) -> tuple[Optional[RawTripData], Optional[ValidationError]]:
    """Parse a single CSV row into RawTripData.

    Args:
        row: Pandas Series representing one CSV row
        row_number: Line number in CSV for error reporting

    Returns:
        Tuple of (RawTripData or None, ValidationError or None)
        - If successful: (RawTripData, None)
        - If parsing fails: (None, ValidationError)
    """
    try:
        # Parse timestamps
        departure_time = pd.to_datetime(row["Departure"])
        return_time = pd.to_datetime(row["Return"])

        # Validate timestamps are not NaT (Not a Time)
        if pd.isna(departure_time) or pd.isna(return_time):
            return (
                None,
                ValidationError(
                    row_number=row_number,
                    error_type="invalid_timestamp",
                    message="Departure or Return time is missing/invalid",
                    raw_data=row.to_dict(),
                ),
            )

        # Parse station IDs and names
        departure_station_id = str(row["Departure station id"]).strip()
        departure_station_name = str(row["Departure station name"]).strip()
        return_station_id = str(row["Return station id"]).strip()
        return_station_name = str(row["Return station name"]).strip()

        # Parse numeric fields
        try:
            # Convert pandas values to Python scalars for type safety
            distance_meters = int(float(row["Covered distance (m)"]))  # type: ignore[arg-type]
            duration_seconds = int(float(row["Duration (sec.)"]))  # type: ignore[arg-type]
        except (ValueError, TypeError) as e:
            return (
                None,
                ValidationError(
                    row_number=row_number,
                    error_type="invalid_numeric",
                    message=f"Invalid distance or duration: {e}",
                    raw_data=row.to_dict(),
                ),
            )

        # Create RawTripData object
        trip = RawTripData(
            departure_time=departure_time.to_pydatetime(),
            return_time=return_time.to_pydatetime(),
            departure_station_id=departure_station_id,
            departure_station_name=departure_station_name,
            return_station_id=return_station_id,
            return_station_name=return_station_name,
            distance_meters=distance_meters,
            duration_seconds=duration_seconds,
        )

        return (trip, None)

    except KeyError as e:
        return (
            None,
            ValidationError(
                row_number=row_number,
                error_type="missing_column",
                message=f"Missing required column: {e}",
                raw_data=row.to_dict(),
            ),
        )
    except Exception as e:
        return (
            None,
            ValidationError(
                row_number=row_number,
                error_type="parsing_error",
                message=f"Unexpected parsing error: {e}",
                raw_data=row.to_dict(),
            ),
        )


def parse_csv_file(
    file_path: Path, chunk_size: int = 10000
) -> Iterator[tuple[List[RawTripData], List[ValidationError]]]:
    """Parse entire CSV file, yielding batches of trips and errors.

    Combines chunk reading and row parsing into a single interface.

    Args:
        file_path: Path to CSV file
        chunk_size: Number of rows per chunk

    Yields:
        Tuples of (valid_trips, parse_errors) for each chunk
    """
    row_offset = 1  # Account for header row

    for chunk in read_csv_chunk(file_path, chunk_size):
        valid_trips: List[RawTripData] = []
        parse_errors: List[ValidationError] = []

        for idx, row in chunk.iterrows():
            row_number = row_offset + int(idx)  # type: ignore[arg-type]
            trip, error = parse_trip_row(row, row_number)

            if trip:
                valid_trips.append(trip)
            if error:
                parse_errors.append(error)

        row_offset += len(chunk)
        yield (valid_trips, parse_errors)


def count_csv_rows(file_path: Path) -> int:
    """Count total rows in CSV file (excluding header).

    Args:
        file_path: Path to CSV file

    Returns:
        Number of data rows in CSV
    """
    try:
        # Quick row count using wc-like approach
        with open(file_path, "r", encoding="utf-8") as f:
            return sum(1 for _ in f) - 1  # Subtract header row
    except Exception as e:
        logger.warning(f"Could not count rows in {file_path.name}: {e}")
        return 0
