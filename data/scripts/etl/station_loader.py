"""Station data loader for HSL bike stations.

This module handles loading station coordinates from JSON files
and upserting them into the PostgreSQL database with PostGIS support.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Set, List, Optional
import psycopg
from psycopg import Connection

from models import StationData


logger = logging.getLogger(__name__)


def load_station_coordinates(json_path: str) -> Dict[str, StationData]:
    """Load station coordinates from JSON file.

    Args:
        json_path: Path to station_coordinates.json file

    Returns:
        Dictionary mapping station_id to StationData objects

    Raises:
        FileNotFoundError: If JSON file doesn't exist
        ValueError: If JSON format is invalid
    """
    path = Path(json_path)
    if not path.exists():
        raise FileNotFoundError(f"Station coordinates file not found: {json_path}")

    logger.info(f"Loading station coordinates from {json_path}")

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {e}")

    stations = {}

    # Parse JSON structure: {"stations": {"Station Name": {...}}}
    stations_data = data.get("stations", {})

    for station_name, station_info in stations_data.items():
        try:
            station = StationData(
                station_id=station_info["stationId"],
                name=station_info.get("name", station_name),
                lat=float(station_info["lat"]),
                lon=float(station_info["lon"]),
            )
            stations[station.station_id] = station
        except (KeyError, ValueError) as e:
            logger.warning(f"Skipping invalid station {station_name}: {e}")
            continue

    logger.info(f"Loaded {len(stations)} stations from JSON")
    return stations


def upsert_stations(
    connection: Connection, stations: List[StationData]
) -> tuple[int, int]:
    """Upsert station data into the database.

    Uses INSERT ... ON CONFLICT to handle updates for existing stations.
    Creates PostGIS POINT geometries from lat/lon coordinates.

    Args:
        connection: Active psycopg database connection
        stations: List of StationData objects to insert/update

    Returns:
        Tuple of (inserted_count, updated_count)

    Raises:
        psycopg.DatabaseError: On database operation failures
    """
    if not stations:
        logger.info("No stations to upsert")
        return (0, 0)

    logger.info(f"Upserting {len(stations)} stations into database")

    # SQL for upsert with PostGIS point creation
    upsert_sql = """
        INSERT INTO hsl.stations (
            station_id,
            name,
            location,
            created_at,
            updated_at
        ) VALUES (
            %s,
            %s,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (station_id) 
        DO UPDATE SET
            name = EXCLUDED.name,
            location = EXCLUDED.location,
            updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS inserted;
    """

    try:
        with connection.cursor() as cursor:
            inserted_count = 0
            updated_count = 0

            for station in stations:
                # Execute upsert for each station
                cursor.execute(
                    upsert_sql,
                    (
                        station.station_id,
                        station.name,
                        station.lon,  # PostGIS uses (lon, lat) order
                        station.lat,
                    ),
                )

                # Check if row was inserted (True) or updated (False)
                result = cursor.fetchone()
                if result and result[0]:
                    inserted_count += 1
                else:
                    updated_count += 1

            connection.commit()
            logger.info(
                f"Upserted stations: {inserted_count} inserted, {updated_count} updated"
            )
            return (inserted_count, updated_count)

    except psycopg.DatabaseError as e:
        connection.rollback()
        logger.error(f"Database error during station upsert: {e}")
        raise


def validate_station_references(
    connection: Connection, station_ids: Set[str]
) -> Set[str]:
    """Validate that station IDs exist in the database.

    Args:
        connection: Active psycopg database connection
        station_ids: Set of station IDs to validate

    Returns:
        Set of station IDs that are NOT found in database (missing stations)
    """
    if not station_ids:
        return set()

    logger.info(f"Validating {len(station_ids)} station references")

    query = """
        SELECT station_id 
        FROM hsl.stations 
        WHERE station_id = ANY(%s);
    """

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, (list(station_ids),))
            found_stations = {row[0] for row in cursor.fetchall()}

            missing_stations = station_ids - found_stations

            if missing_stations:
                logger.warning(
                    f"Found {len(missing_stations)} missing station references"
                )
            else:
                logger.info("All station references validated successfully")

            return missing_stations

    except psycopg.DatabaseError as e:
        logger.error(f"Database error during station validation: {e}")
        raise


def get_all_station_ids(connection: Connection) -> Set[str]:
    """Retrieve all station IDs currently in the database.

    Args:
        connection: Active psycopg database connection

    Returns:
        Set of all station IDs in hsl.stations table
    """
    query = "SELECT station_id FROM hsl.stations;"

    try:
        with connection.cursor() as cursor:
            cursor.execute(query)
            station_ids = {row[0] for row in cursor.fetchall()}
            logger.info(f"Retrieved {len(station_ids)} station IDs from database")
            return station_ids

    except psycopg.DatabaseError as e:
        logger.error(f"Database error retrieving station IDs: {e}")
        raise


def initialize_stations(connection: Connection, json_path: str) -> tuple[int, int]:
    """Initialize stations from JSON file into database.

    High-level function combining load and upsert operations.

    Args:
        connection: Active psycopg database connection
        json_path: Path to station_coordinates.json file

    Returns:
        Tuple of (inserted_count, updated_count)
    """
    stations_dict = load_station_coordinates(json_path)
    stations_list = list(stations_dict.values())
    return upsert_stations(connection, stations_list)
