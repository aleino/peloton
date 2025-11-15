"""Database writer for bulk loading trip data into PostgreSQL.

This module handles efficient bulk insertion of trip data using
PostgreSQL COPY protocol and staging tables for idempotency.
"""

import logging
from typing import List
from io import StringIO
import psycopg
from psycopg import Connection, sql

from models import EnrichedTripData

BUFFER_SIZE = 8192


logger = logging.getLogger(__name__)


def create_staging_table(connection: Connection) -> str:
    """Create a temporary staging table for trip data.

    The staging table has the same structure as hsl.trips but is temporary
    and not subject to constraints, allowing for fast bulk loading.

    Args:
        connection: Active psycopg database connection

    Returns:
        Name of the created staging table

    Raises:
        psycopg.DatabaseError: On database operation failures
    """
    staging_table = "trips_staging"

    drop_table_sql = sql.SQL("DROP TABLE IF EXISTS {} CASCADE;").format(
        sql.Identifier(staging_table)
    )

    # Create staging table with explicit column definitions (no serial ID)
    create_sql = sql.SQL(
        """
        CREATE TEMP TABLE {} (
            departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
            departure_date DATE NOT NULL,
            departure_hour INTEGER NOT NULL,
            departure_weekday INTEGER NOT NULL,
            return_time TIMESTAMP WITH TIME ZONE NOT NULL,
            return_date DATE NOT NULL,
            return_hour INTEGER NOT NULL,
            return_weekday INTEGER NOT NULL,
            departure_station_id VARCHAR(50) NOT NULL,
            return_station_id VARCHAR(50) NOT NULL,
            distance_meters INTEGER NOT NULL,
            duration_seconds INTEGER NOT NULL
        );
        """
    ).format(sql.Identifier(staging_table))

    try:
        with connection.cursor() as cursor:
            cursor.execute(drop_table_sql)
            cursor.execute(create_sql)
        connection.commit()
        logger.info(f"Created staging table: {staging_table}")
        return staging_table

    except psycopg.DatabaseError as e:
        connection.rollback()
        logger.error(f"Failed to create staging table: {e}")
        raise


def bulk_insert_to_staging(
    connection: Connection, staging_table: str, trips: List[EnrichedTripData]
) -> int:
    """Bulk insert trips into staging table using COPY.

    Uses PostgreSQL COPY FROM for maximum performance.

    Args:
        connection: Active psycopg database connection
        staging_table: Name of staging table
        trips: List of enriched trip data to insert

    Returns:
        Number of rows inserted

    Raises:
        psycopg.DatabaseError: On database operation failures
    """
    if not trips:
        logger.info("No trips to insert")
        return 0

    logger.info(f"Bulk inserting {len(trips)} trips to staging table")

    # Prepare CSV data in memory
    csv_buffer = StringIO()

    for trip in trips:
        # Format: tab-separated values for COPY
        row = "\t".join(
            [
                trip.departure_time.isoformat(),
                trip.departure_date.isoformat(),
                str(trip.departure_hour),
                str(trip.departure_weekday),
                trip.return_time.isoformat(),
                trip.return_date.isoformat(),
                str(trip.return_hour),
                str(trip.return_weekday),
                trip.departure_station_id,
                trip.return_station_id,
                str(trip.distance_meters),
                str(trip.duration_seconds),
            ]
        )
        csv_buffer.write(row + "\n")

    # Reset buffer position to beginning
    csv_buffer.seek(0)

    try:
        with connection.cursor() as cursor:
            # Use COPY FROM for bulk insert
            copy_sql = sql.SQL("COPY {} FROM STDIN").format(
                sql.Identifier(staging_table)
            )
            with cursor.copy(copy_sql) as copy:
                while data := csv_buffer.read(BUFFER_SIZE):
                    copy.write(data)

        connection.commit()
        logger.info(f"Successfully inserted {len(trips)} rows to staging")
        return len(trips)

    except psycopg.DatabaseError as e:
        connection.rollback()
        logger.error(f"Failed to bulk insert to staging: {e}")
        raise


def merge_staging_to_trips(
    connection: Connection, staging_table: str
) -> tuple[int, int]:
    """Merge staging data into main trips table.

    Uses INSERT ... ON CONFLICT to avoid duplicates.
    A trip is considered duplicate if it has the same:
    - departure_time
    - departure_station_id
    - return_station_id

    Args:
        connection: Active psycopg database connection
        staging_table: Name of staging table

    Returns:
        Tuple of (inserted_count, skipped_count)

    Raises:
        psycopg.DatabaseError: On database operation failures
    """
    logger.info("Merging staging data to hsl.trips table")

    merge_sql = sql.SQL(
        """
        INSERT INTO hsl.trips (
            departure_time, departure_date, departure_hour, departure_weekday,
            return_time, return_date, return_hour, return_weekday,
            departure_station_id, return_station_id,
            distance_meters, duration_seconds,
            created_at
        )
        SELECT 
            departure_time, departure_date, departure_hour, departure_weekday,
            return_time, return_date, return_hour, return_weekday,
            departure_station_id, return_station_id,
            distance_meters, duration_seconds,
            CURRENT_TIMESTAMP as created_at
        FROM {}
        ON CONFLICT (departure_time, departure_station_id, return_station_id)
        DO NOTHING
        RETURNING trip_id;
        """
    ).format(sql.Identifier(staging_table))

    try:
        with connection.cursor() as cursor:
            cursor.execute(merge_sql)
            inserted_count = cursor.rowcount

            # Get count from staging to calculate skipped
            count_sql = sql.SQL("SELECT COUNT(*) FROM {}").format(
                sql.Identifier(staging_table)
            )
            cursor.execute(count_sql)
            staging_count = cursor.fetchone()[0]

            skipped_count = staging_count - inserted_count

        connection.commit()
        logger.info(
            f"Merged {inserted_count} new trips, skipped {skipped_count} duplicates"
        )
        return (inserted_count, skipped_count)

    except psycopg.DatabaseError as e:
        connection.rollback()
        logger.error(f"Failed to merge staging to trips: {e}")
        raise


def bulk_insert_trips(
    connection: Connection, trips: List[EnrichedTripData]
) -> tuple[int, int]:
    """High-level function to bulk insert trips with staging table pattern.

    This is the main entry point for inserting trips. It creates a staging
    table, loads data via COPY, and merges into the main table.

    Args:
        connection: Active psycopg database connection
        trips: List of enriched trip data to insert

    Returns:
        Tuple of (inserted_count, skipped_count)
    """
    if not trips:
        return (0, 0)

    logger.info(f"Starting bulk insert of {len(trips)} trips")

    staging_table = create_staging_table(connection)
    bulk_insert_to_staging(connection, staging_table, trips)
    inserted, skipped = merge_staging_to_trips(connection, staging_table)

    return (inserted, skipped)


def get_trip_count(connection: Connection) -> int:
    """Get total number of trips in database.

    Args:
        connection: Active psycopg database connection

    Returns:
        Total count of trips in hsl.trips table
    """
    query = "SELECT COUNT(*) FROM hsl.trips;"

    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            count = cursor.fetchone()[0]
            return count

    except psycopg.DatabaseError as e:
        logger.error(f"Failed to get trip count: {e}")
        raise


def delete_all_trips(connection: Connection) -> int:
    """Delete all trips from the database.

    WARNING: This is a destructive operation. Use only for testing
    or when you need to completely refresh the data.

    Args:
        connection: Active psycopg database connection

    Returns:
        Number of trips deleted
    """
    logger.warning("Deleting all trips from database")

    delete_sql = "DELETE FROM hsl.trips;"

    try:
        with connection.cursor() as cursor:
            cursor.execute(delete_sql)
            deleted_count = cursor.rowcount

        connection.commit()
        logger.info(f"Deleted {deleted_count} trips")
        return deleted_count

    except psycopg.DatabaseError as e:
        connection.rollback()
        logger.error(f"Failed to delete trips: {e}")
        raise
