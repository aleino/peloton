#!/usr/bin/env python3
"""
Fetch GPS coordinates for HSL bike rental stations using the Digitransit API.

Usage:
    python fetch_station_coordinates.py [--input INPUT_FILE] [--output OUTPUT_FILE]
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List
import urllib.request
import urllib.error


DIGITRANSIT_GRAPHQL_ENDPOINT = "https://api.digitransit.fi/routing/v2/hsl/gtfs/v1"
SUBSCRIPTION_KEY = os.getenv("DIGITRANSIT_SUBSCRIPTION_KEY")


GRAPHQL_QUERY = """
{
  bikeRentalStations {
    stationId
    name
    lat
    lon
    bikesAvailable
    spacesAvailable
  }
}
"""


def fetch_station_data() -> List[Dict]:
    """
    Fetch bike rental station data from HSL Digitransit API.

    Returns:
        List of station dictionaries with coordinates
    """
    if not SUBSCRIPTION_KEY:
        raise ValueError("Subscription key is needed")
    try:
        headers = {
            "Content-Type": "application/json",
            "digitransit-subscription-key": SUBSCRIPTION_KEY,
        }

        data = json.dumps({"query": GRAPHQL_QUERY}).encode("utf-8")

        req = urllib.request.Request(
            DIGITRANSIT_GRAPHQL_ENDPOINT, data=data, headers=headers, method="POST"
        )

        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))

        if "errors" in result:
            print(f"GraphQL errors: {result['errors']}", file=sys.stderr)
            return []

        return result.get("data", {}).get("bikeRentalStations", [])

    except urllib.error.URLError as e:
        print(f"Error fetching data from Digitransit API: {e}", file=sys.stderr)
        return []
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON response: {e}", file=sys.stderr)
        return []


def match_stations(
    unique_stations: List[str], api_stations: List[Dict]
) -> Dict[str, Dict]:
    """
    Match station names from CSV with API data.

    Args:
        unique_stations: List of station names from CSV files
        api_stations: List of station data from API

    Returns:
        Dictionary mapping station names to coordinate data
    """
    # Create lookup dict with normalized names
    api_lookup = {}
    for station in api_stations:
        name = station["name"]
        api_lookup[name] = station
        # Also store normalized version for fuzzy matching
        normalized = name.lower().strip()
        api_lookup[normalized] = station

    matched = {}
    unmatched = []

    for station_name in unique_stations:
        # Try exact match first
        if station_name in api_lookup:
            matched[station_name] = api_lookup[station_name]
        # Try normalized match
        elif station_name.lower().strip() in api_lookup:
            matched[station_name] = api_lookup[station_name.lower().strip()]
        else:
            unmatched.append(station_name)

    if unmatched:
        print(f"\n⚠️  Warning: {len(unmatched)} stations not matched with API data:")
        for name in unmatched[:10]:  # Show first 10
            print(f"  - {name}")
        if len(unmatched) > 10:
            print(f"  ... and {len(unmatched) - 10} more")

    return matched


def main():
    parser = argparse.ArgumentParser(
        description="Fetch GPS coordinates for HSL bike rental stations"
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(__file__).parent.parent / "interim" / "unique_stations.txt",
        help="Input file with unique station names (default: data/interim/unique_stations.txt)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent.parent / "interim" / "station_coordinates.json",
        help="Output JSON file (default: data/interim/station_coordinates.json)",
    )

    args = parser.parse_args()

    # Read unique station names
    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    with open(args.input, "r", encoding="utf-8") as f:
        unique_stations = [line.strip() for line in f if line.strip()]

    print(f"📍 Fetching coordinates for {len(unique_stations)} unique stations...")

    # Fetch data from API
    api_stations = fetch_station_data()

    if not api_stations:
        print("Error: No data received from API", file=sys.stderr)
        sys.exit(1)

    print(f"✅ Retrieved {len(api_stations)} stations from Digitransit API")

    # Match stations
    matched_stations = match_stations(unique_stations, api_stations)

    print(f"✅ Matched {len(matched_stations)} / {len(unique_stations)} stations")

    # Prepare output data
    output_data = {
        "metadata": {
            "source": "HSL Digitransit API",
            "endpoint": DIGITRANSIT_GRAPHQL_ENDPOINT,
            "total_stations": len(matched_stations),
            "unmatched_count": len(unique_stations) - len(matched_stations),
        },
        "stations": matched_stations,
    }

    # Ensure output directory exists
    args.output.parent.mkdir(parents=True, exist_ok=True)

    # Write to output file
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Coordinates saved to {args.output}")

    # Print sample
    print("\n📊 Sample data:")
    for i, (name, data) in enumerate(list(matched_stations.items())[:3]):
        print(f"  {name}")
        print(f"    Lat: {data['lat']}, Lon: {data['lon']}")
        print(f"    Station ID: {data['stationId']}")


if __name__ == "__main__":
    main()
