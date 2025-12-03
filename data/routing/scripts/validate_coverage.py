#!/usr/bin/env python3
"""Validate per-station coverage for generated route files."""

import json
import gzip
import sys
from pathlib import Path
from config import DatabaseConfig
from route_analyzer import RouteAnalyzer


def validate_station_coverage(station_id: str, output_dir: Path) -> dict:
    """
    Validate coverage for a specific station.

    Args:
        station_id: Station ID to validate
        output_dir: Output directory containing route files

    Returns:
        Dict with validation results
    """
    # Connect to database
    db = DatabaseConfig.from_env()
    analyzer = RouteAnalyzer(db)
    analyzer.connect()

    try:
        if not analyzer.conn:
            return {
                "station_id": station_id,
                "error": "Failed to connect to database",
            }

        # Get actual station trip counts
        query = f"""
        SELECT
            departure_station_id as station,
            return_station_id as destination,
            COUNT(*) as trips
        FROM {db.schema}.trips
        WHERE departure_station_id = %s
            AND departure_station_id != return_station_id
        GROUP BY departure_station_id, return_station_id
        ORDER BY trips DESC
        """

        with analyzer.conn.cursor() as cursor:
            cursor.execute(query, (station_id,))
            actual_routes = cursor.fetchall()

        if not actual_routes:
            return {
                "station_id": station_id,
                "error": "No trips found for this station",
            }

        total_trips = sum(r[2] for r in actual_routes)

        # Load generated station file
        station_file = output_dir / "by-station" / f"s{station_id}.json.gz"
        if not station_file.exists():
            return {
                "station_id": station_id,
                "error": f"Station file not found: {station_file}",
            }

        with gzip.open(station_file, "rt") as f:
            data = json.load(f)
            generated_destinations = set(r["to"] for r in data["routes"])

        # Calculate coverage
        covered_trips = sum(
            r[2] for r in actual_routes if r[1] in generated_destinations
        )
        coverage_pct = (covered_trips / total_trips) * 100

        return {
            "station_id": station_id,
            "total_trips": total_trips,
            "generated_routes": len(generated_destinations),
            "covered_trips": covered_trips,
            "coverage_pct": coverage_pct,
            "expected_coverage": 80.0,
            "match": 75 <= coverage_pct <= 85,
        }

    finally:
        analyzer.close()


def main():
    """Main validation script."""
    if len(sys.argv) < 2:
        print("Usage: python validate_coverage.py <station_id> [output_dir]")
        print("\nExample:")
        print("  python validate_coverage.py 030")
        print("  python validate_coverage.py 030 /path/to/frontend/public/routes")
        sys.exit(1)

    station_id = sys.argv[1]
    output_dir = (
        Path(sys.argv[2])
        if len(sys.argv) > 2
        else Path("../../../frontend/public/routes")
    )

    print(f"\n🔍 Validating coverage for station {station_id}...")
    print(f"   Output directory: {output_dir}\n")

    result = validate_station_coverage(station_id, output_dir)

    if "error" in result:
        print(f"❌ Error: {result['error']}")
        sys.exit(1)

    print(f"Station {result['station_id']}:")
    print(f"  Total trips: {result['total_trips']:,}")
    print(f"  Generated routes: {result['generated_routes']}")
    print(f"  Covered trips: {result['covered_trips']:,}")
    print(f"  Coverage: {result['coverage_pct']:.1f}%")
    print(f"  Expected: ~{result['expected_coverage']:.0f}%")
    print(f"  Match: {'✅' if result['match'] else '❌'}")

    if not result["match"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
