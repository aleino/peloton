#!/usr/bin/env python3
"""
Fetch HSL bike data for a specific season.

This script downloads Origin-Destination (OD) data for HSL city bikes
from the HSL Open Data API. The data includes all trips made with city
bikes in Helsinki and Espoo.

Data includes:
- Departure and arrival stations
- Departure and arrival times
- Trip distance (meters)
- Trip duration (seconds)

Source: https://www.hsl.fi/hsl/avoin-data
Owner: City Bike Finland
"""

import os
import sys
import requests
from pathlib import Path


def fetch_hsl_bike_data(year: int, output_dir: str = "../raw") -> bool:
    """
    Fetch HSL bike data for a specific year.

    Args:
        year: The year to fetch data for (e.g., 2024)
        output_dir: Directory to save the downloaded file (default: ../raw)

    Returns:
        bool: True if successful, False otherwise
    """
    # Construct the URL for the yearly data package
    url = f"https://dev.hsl.fi/citybikes/od-trips-{year}/od-trips-{year}.zip"

    # Create output directory if it doesn't exist
    output_path = Path(__file__).parent / output_dir
    output_path.mkdir(parents=True, exist_ok=True)

    # Output file path
    output_file = output_path / f"od-trips-{year}.zip"

    print(f"Fetching HSL bike data for {year}...")
    print(f"URL: {url}")
    print(f"Output: {output_file}")

    try:
        # Send GET request
        response = requests.get(url, stream=True)
        response.raise_for_status()  # Raise exception for bad status codes

        # Get total file size if available
        total_size = int(response.headers.get("content-length", 0))

        # Download the file
        with open(output_file, "wb") as f:
            if total_size == 0:
                # No content-length header
                f.write(response.content)
                print("Download complete!")
            else:
                # Show progress
                downloaded = 0
                chunk_size = 8192

                for chunk in response.iter_content(chunk_size=chunk_size):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        progress = (downloaded / total_size) * 100
                        print(
                            f"\rProgress: {progress:.1f}% ({downloaded / 1024 / 1024:.1f} MB)",
                            end="",
                        )

                print("\nDownload complete!")

        print(f"File saved to: {output_file}")
        print(f"File size: {output_file.stat().st_size / 1024 / 1024:.1f} MB")
        return True

    except requests.exceptions.RequestException as e:
        print(f"Error downloading data: {e}", file=sys.stderr)
        # Clean up partial download
        if output_file.exists():
            output_file.unlink()
        return False
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return False


def main():
    """Main entry point for the script."""
    # Default year
    year = 2024

    # Allow year to be passed as command line argument
    if len(sys.argv) > 1:
        try:
            year = int(sys.argv[1])
        except ValueError:
            print(f"Invalid year: {sys.argv[1]}", file=sys.stderr)
            print("Usage: python fetch_hsl_bike_data.py [YEAR]")
            sys.exit(1)

    # Validate year range
    if year < 2016 or year > 2025:
        print(
            f"Year {year} is out of range. Data available from 2016 onwards.",
            file=sys.stderr,
        )
        sys.exit(1)

    # Fetch the data
    success = fetch_hsl_bike_data(year)

    if success:
        print("\n✓ Data fetched successfully!")
        sys.exit(0)
    else:
        print("\n✗ Failed to fetch data.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
