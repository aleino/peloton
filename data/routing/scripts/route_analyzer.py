#!/usr/bin/env python3
"""Database analysis for route generation."""

import logging
from typing import List, Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

from models import RouteStatistics, StationCoordinate
from config import DatabaseConfig

logger = logging.getLogger(__name__)


class RouteAnalyzer:
    """Analyzes trip data to identify routes for generation."""

    def __init__(self, db_config: DatabaseConfig):
        """
        Initialize route analyzer.

        Args:
            db_config: Database configuration
        """
        self.config = db_config
        self.conn: Optional[psycopg2.extensions.connection] = None

    def connect(self):
        """Establish database connection."""
        try:
            self.conn = psycopg2.connect(self.config.connection_string)
            logger.info(f"Connected to database: {self.config.database}")
        except psycopg2.Error as e:
            logger.error(f"Database connection failed: {e}")
            raise

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")

    def get_route_statistics(self, min_trips: int = 1) -> List[RouteStatistics]:
        """
        Get route statistics for all station pairs.

        Args:
            min_trips: Minimum number of trips required

        Returns:
            List of RouteStatistics ordered by trip count (descending)
        """
        if not self.conn:
            raise RuntimeError("Not connected to database. Call connect() first.")

        query = f"""
            SELECT
                departure_station_id,
                return_station_id,
                COUNT(*) as trip_count,
                AVG(distance_meters) as avg_distance_m,
                AVG(duration_seconds) as avg_duration_s
            FROM {self.config.schema}.trips
            WHERE departure_station_id != return_station_id
            GROUP BY departure_station_id, return_station_id
            HAVING COUNT(*) >= %s
            ORDER BY trip_count DESC
        """

        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (min_trips,))
                rows = cursor.fetchall()

                routes = [
                    RouteStatistics(
                        departure_station_id=row["departure_station_id"],
                        return_station_id=row["return_station_id"],
                        trip_count=row["trip_count"],
                        avg_distance_m=float(row["avg_distance_m"] or 0),
                        avg_duration_s=float(row["avg_duration_s"] or 0),
                    )
                    for row in rows
                ]

                logger.info(f"Found {len(routes)} routes with >= {min_trips} trips")
                return routes

        except psycopg2.Error as e:
            logger.error(f"Query failed: {e}")
            raise

    def get_top_n_routes(self, n: int = 1000) -> List[RouteStatistics]:
        """
        Get top N routes by trip count.

        Args:
            n: Number of top routes to return

        Returns:
            List of top N RouteStatistics
        """
        all_routes = self.get_route_statistics(min_trips=1)
        return all_routes[:n]

    def get_all_routes(self) -> List[RouteStatistics]:
        """
        Get all routes with at least 1 trip.

        Returns:
            List of all RouteStatistics
        """
        return self.get_route_statistics(min_trips=1)

    def get_routes_by_station_top_n(
        self, n: int = 50
    ) -> Dict[str, List[RouteStatistics]]:
        """
        Get top N routes for each departure station.

        Args:
            n: Number of top routes to return per station (default 50)

        Returns:
            Dict mapping station_id to list of top N RouteStatistics for that station

        Example:
            {
                "030": [RouteStatistics("030", "067", 100), ...],  # Top 50 from station 030
                "045": [RouteStatistics("045", "030", 80), ...],   # Top 50 from station 045
            }
        """
        if not self.conn:
            raise RuntimeError("Not connected to database. Call connect() first.")

        # Query to get top N routes per station
        query = f"""
            WITH ranked_routes AS (
                SELECT
                    departure_station_id,
                    return_station_id,
                    COUNT(*) as trip_count,
                    AVG(distance_meters) as avg_distance_m,
                    AVG(duration_seconds) as avg_duration_s,
                    ROW_NUMBER() OVER (
                        PARTITION BY departure_station_id
                        ORDER BY COUNT(*) DESC
                    ) as rank
                FROM {self.config.schema}.trips
                WHERE departure_station_id != return_station_id
                GROUP BY departure_station_id, return_station_id
            )
            SELECT
                departure_station_id,
                return_station_id,
                trip_count,
                avg_distance_m,
                avg_duration_s
            FROM ranked_routes
            WHERE rank <= %s
            ORDER BY departure_station_id, trip_count DESC
        """

        try:
            from collections import defaultdict

            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (n,))
                rows = cursor.fetchall()

                # Organize by station
                station_routes = defaultdict(list)

                for row in rows:
                    route = RouteStatistics(
                        departure_station_id=row["departure_station_id"],
                        return_station_id=row["return_station_id"],
                        trip_count=row["trip_count"],
                        avg_distance_m=float(row["avg_distance_m"] or 0),
                        avg_duration_s=float(row["avg_duration_s"] or 0),
                    )
                    station_routes[row["departure_station_id"]].append(route)

                # Convert to regular dict
                result = dict(station_routes)

                total_routes = sum(len(routes) for routes in result.values())
                logger.info(
                    f"Selected {total_routes} routes across {len(result)} stations "
                    f"(top {n} per station)"
                )

                return result

        except psycopg2.Error as e:
            logger.error(f"Query failed: {e}")
            raise

    def get_routes_by_station_coverage(
        self, coverage_pct: float = 80.0
    ) -> Dict[str, List[RouteStatistics]]:
        """
        Get routes for each station covering specified percentage of that station's trips.

        For each departure station, returns routes that collectively account for
        coverage_pct of trips departing from that station.

        Args:
            coverage_pct: Percentage of trips to cover per station (default 80.0)

        Returns:
            Dict mapping station_id to list of RouteStatistics for that station

        Example:
            {
                "030": [RouteStatistics("030", "067", 100), ...],  # 80% of station 030's trips
                "045": [RouteStatistics("045", "030", 80), ...],   # 80% of station 045's trips
            }
        """
        if not self.conn:
            raise RuntimeError("Not connected to database. Call connect() first.")

        # Query to get routes per station with cumulative trip counts
        query = f"""
            WITH station_trips AS (
                -- Get total trips per departure station
                SELECT
                    departure_station_id,
                    COUNT(*) as total_trips
                FROM {self.config.schema}.trips
                WHERE departure_station_id != return_station_id
                GROUP BY departure_station_id
            ),
            route_stats AS (
                -- Get trip counts per route
                SELECT
                    departure_station_id,
                    return_station_id,
                    COUNT(*) as trip_count,
                    AVG(distance_meters) as avg_distance_m,
                    AVG(duration_seconds) as avg_duration_s
                FROM {self.config.schema}.trips
                WHERE departure_station_id != return_station_id
                GROUP BY departure_station_id, return_station_id
            ),
            ranked_routes AS (
                -- Rank routes by trip count within each station
                SELECT
                    r.*,
                    st.total_trips,
                    SUM(r.trip_count) OVER (
                        PARTITION BY r.departure_station_id
                        ORDER BY r.trip_count DESC
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    ) as cumulative_trips,
                    ROW_NUMBER() OVER (
                        PARTITION BY r.departure_station_id
                        ORDER BY r.trip_count DESC
                    ) as rank
                FROM route_stats r
                JOIN station_trips st ON r.departure_station_id = st.departure_station_id
            )
            SELECT
                departure_station_id,
                return_station_id,
                trip_count,
                avg_distance_m,
                avg_duration_s,
                total_trips,
                cumulative_trips,
                (cumulative_trips::float / total_trips * 100) as coverage_pct
            FROM ranked_routes
            WHERE (cumulative_trips::float / total_trips * 100) <= %s
               OR rank = 1  -- Always include at least one route per station
            ORDER BY departure_station_id, trip_count DESC
        """

        try:
            from collections import defaultdict

            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (coverage_pct,))
                rows = cursor.fetchall()

                # Organize by station
                station_routes = defaultdict(list)

                for row in rows:
                    route = RouteStatistics(
                        departure_station_id=row["departure_station_id"],
                        return_station_id=row["return_station_id"],
                        trip_count=row["trip_count"],
                        avg_distance_m=float(row["avg_distance_m"] or 0),
                        avg_duration_s=float(row["avg_duration_s"] or 0),
                    )
                    station_routes[row["departure_station_id"]].append(route)

                # Convert to regular dict
                result = dict(station_routes)

                total_routes = sum(len(routes) for routes in result.values())
                logger.info(
                    f"Selected {total_routes} routes across {len(result)} stations "
                    f"for {coverage_pct}% per-station coverage"
                )

                return result

        except psycopg2.Error as e:
            logger.error(f"Query failed: {e}")
            raise

    def get_global_coverage_routes(
        self, coverage_pct: float = 80.0
    ) -> List[RouteStatistics]:
        """
        Get routes covering specified percentage of ALL trips globally.

        Args:
            coverage_pct: Percentage of total trips to cover (default 80.0)

        Returns:
            List of RouteStatistics covering coverage_pct of all trips
        """
        all_routes = self.get_route_statistics(min_trips=1)

        # Calculate target trip count
        total_trips = sum(r.trip_count for r in all_routes)
        target_trips = total_trips * (coverage_pct / 100.0)

        # Sort by trip count and accumulate
        routes_sorted = sorted(all_routes, key=lambda r: r.trip_count, reverse=True)

        cumulative_trips = 0
        selected_routes = []

        for route in routes_sorted:
            cumulative_trips += route.trip_count
            selected_routes.append(route)
            if cumulative_trips >= target_trips:
                break

        logger.info(
            f"Selected {len(selected_routes)} routes for {coverage_pct}% "
            f"global coverage ({cumulative_trips:,} / {total_trips:,} trips)"
        )

        return selected_routes

    def deduplicate_bidirectional(
        self, routes: List[RouteStatistics]
    ) -> tuple[List[RouteStatistics], Dict[str, RouteStatistics]]:
        """
        Deduplicate bidirectional routes.

        Routes A→B and B→A share the same geometry (just reversed).
        This method keeps only the canonical direction (sorted station IDs)
        and returns a mapping for the reverse direction.

        Args:
            routes: List of all routes

        Returns:
            Tuple of:
            - List of unique routes (canonical direction only)
            - Dict mapping route_key to reverse route (if exists)

        Example:
            Input: ["030→067", "067→030", "030→045"]
            Output: (
                ["030→067", "030→045"],  # Canonical only
                {"030-067": RouteStatistics("067→030")}  # Reverse mapping
            )
        """
        seen_keys = {}
        unique_routes = []
        reverse_map = {}

        for route in routes:
            key = route.route_key

            if key not in seen_keys:
                # First time seeing this route pair
                seen_keys[key] = route
                unique_routes.append(route)
            else:
                # We've seen the reverse direction
                # Store this as the reverse route
                reverse_map[key] = route

        logger.info(
            f"Deduplicated {len(routes)} routes to {len(unique_routes)} unique "
            f"(saved {len(routes) - len(unique_routes)} duplicates)"
        )

        return unique_routes, reverse_map

    def get_station_coordinates(
        self, station_ids: List[str]
    ) -> Dict[str, StationCoordinate]:
        """
        Fetch coordinates for given station IDs from PostGIS.

        Args:
            station_ids: List of station IDs to fetch

        Returns:
            Dict mapping station_id to StationCoordinate
        """
        if not self.conn:
            raise RuntimeError("Not connected to database. Call connect() first.")

        # Remove duplicates
        unique_ids = list(set(station_ids))

        query = f"""
            SELECT
                station_id,
                ST_Y(location::geometry) as latitude,
                ST_X(location::geometry) as longitude
            FROM {self.config.schema}.stations
            WHERE station_id = ANY(%s)
        """

        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (unique_ids,))
                rows = cursor.fetchall()

                coordinates = {
                    row["station_id"]: StationCoordinate(
                        station_id=row["station_id"],
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"]),
                    )
                    for row in rows
                }

                logger.info(f"Fetched coordinates for {len(coordinates)} stations")

                # Check for missing stations
                missing = set(unique_ids) - set(coordinates.keys())
                if missing:
                    logger.warning(
                        f"Missing coordinates for {len(missing)} stations: "
                        f"{sorted(list(missing))[:10]}..."
                    )

                return coordinates

        except psycopg2.Error as e:
            logger.error(f"Failed to fetch station coordinates: {e}")
            raise

    def get_statistics_summary(self) -> Dict:
        """
        Get summary statistics about the trips database.

        Returns:
            Dict with database statistics
        """
        if not self.conn:
            raise RuntimeError("Not connected to database. Call connect() first.")

        queries = {
            "total_trips": f"SELECT COUNT(*) FROM {self.config.schema}.trips",
            "unique_stations": f"SELECT COUNT(DISTINCT station_id) FROM {self.config.schema}.stations",
            "unique_departure_stations": f"SELECT COUNT(DISTINCT departure_station_id) FROM {self.config.schema}.trips",
            "unique_return_stations": f"SELECT COUNT(DISTINCT return_station_id) FROM {self.config.schema}.trips",
            "unique_station_pairs": f"""
                SELECT COUNT(*) FROM (
                    SELECT DISTINCT departure_station_id, return_station_id
                    FROM {self.config.schema}.trips
                    WHERE departure_station_id != return_station_id
                ) AS pairs
            """,
        }

        stats = {}
        try:
            with self.conn.cursor() as cursor:
                for key, query in queries.items():
                    cursor.execute(query)
                    result = cursor.fetchone()
                    stats[key] = result[0] if result else 0

            logger.info(f"Database statistics: {stats}")
            return stats

        except psycopg2.Error as e:
            logger.error(f"Failed to get statistics: {e}")
            raise


# Example usage and testing
if __name__ == "__main__":
    import sys
    from config import DatabaseConfig

    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    try:
        # Load database config
        db_config = DatabaseConfig.from_env()

        # Create analyzer
        analyzer = RouteAnalyzer(db_config)
        analyzer.connect()

        # Get database statistics
        print("\n=== Database Statistics ===")
        stats = analyzer.get_statistics_summary()
        for key, value in stats.items():
            print(f"{key}: {value:,}")

        # Get top 10 routes
        print("\n=== Top 10 Routes ===")
        top_routes = analyzer.get_top_n_routes(n=10)
        for i, route in enumerate(top_routes, 1):
            print(
                f"{i}. {route.departure_station_id} → "
                f"{route.return_station_id}: {route.trip_count} trips "
                f"({route.avg_distance_m:.0f}m, {route.avg_duration_s:.0f}s)"
            )

        # Test deduplication
        print("\n=== Deduplication Test ===")
        all_routes = analyzer.get_route_statistics(min_trips=100)
        unique_routes, reverse_map = analyzer.deduplicate_bidirectional(all_routes)
        print(f"Original routes: {len(all_routes)}")
        print(f"Unique routes: {len(unique_routes)}")
        print(f"Reverse routes: {len(reverse_map)}")

        # Get station coordinates for top routes
        print("\n=== Station Coordinates ===")
        station_ids = []
        for route in top_routes[:5]:
            station_ids.extend([route.departure_station_id, route.return_station_id])

        coords = analyzer.get_station_coordinates(station_ids)
        for station_id, coord in list(coords.items())[:5]:
            print(f"{station_id}: ({coord.latitude:.6f}, {coord.longitude:.6f})")

        analyzer.close()
        print("\n✅ All tests passed!")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
