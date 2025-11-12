#!/usr/bin/env python3
"""
Temporary CLI script to extract unique station names from HSL trips CSV files.

Usage:
    python extract_unique_stations.py [--output OUTPUT_FILE]
"""

import argparse
import csv
from pathlib import Path
from typing import Set


def extract_unique_stations(csv_dir: Path) -> Set[str]:
    """
    Extract unique station names from all CSV files in the directory.

    Args:
        csv_dir: Path to directory containing CSV files

    Returns:
        Set of unique station names
    """
    unique_stations = set()

    # Find all CSV files
    csv_files = list(csv_dir.glob("**/*.csv"))

    if not csv_files:
        print(f"No CSV files found in {csv_dir}")
        return unique_stations

    print(f"Processing {len(csv_files)} CSV files...")

    for csv_file in csv_files:
        print(f"  Reading {csv_file.name}...")
        try:
            with open(csv_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Extract departure and return station names
                    departure_station = row.get("Departure station name", "").strip()
                    return_station = row.get("Return station name", "").strip()

                    if departure_station:
                        unique_stations.add(departure_station)
                    if return_station:
                        unique_stations.add(return_station)
        except Exception as e:
            print(f"  Error processing {csv_file.name}: {e}")

    return unique_stations


def main():
    parser = argparse.ArgumentParser(
        description="Extract unique station names from HSL trips CSV files"
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(__file__).parent.parent / "raw" / "2024" / "od-trips-2024",
        help="Input directory containing CSV files (default: data/raw/2024/od-trips-2024)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Output file path (optional, prints to stdout if not specified)",
    )

    args = parser.parse_args()

    # Extract unique stations
    stations = extract_unique_stations(args.input)

    # Sort alphabetically for better readability
    sorted_stations = sorted(stations)

    print(f"\n{'='*60}")
    print(f"Found {len(sorted_stations)} unique stations")
    print(f"{'='*60}\n")

    # Output results
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            for station in sorted_stations:
                f.write(f"{station}\n")
        print(f"Results saved to {args.output}")
    else:
        for station in sorted_stations:
            print(station)


if __name__ == "__main__":
    main()
