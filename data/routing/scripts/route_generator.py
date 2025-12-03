#!/usr/bin/env python3
"""Valhalla route generation client."""

import logging
import time
from typing import Optional, List, Tuple
import requests
import polyline

from models import StationCoordinate, RouteGeometry
from config import ValhallaConfig, GenerationConfig

logger = logging.getLogger(__name__)


class RouteGenerator:
    """Generates bicycle routes using Valhalla routing engine."""

    def __init__(
        self, valhalla_config: ValhallaConfig, generation_config: GenerationConfig
    ):
        """
        Initialize route generator.

        Args:
            valhalla_config: Valhalla API configuration
            generation_config: Route generation settings
        """
        self.valhalla = valhalla_config
        self.generation = generation_config
        self.session = requests.Session()

        # Statistics
        self.routes_generated = 0
        self.routes_failed = 0
        self.total_requests = 0
        self.failed_routes = []  # Track failures with reasons for debugging

    def test_connection(self) -> bool:
        """
        Test Valhalla connection and readiness.

        Returns:
            True if Valhalla is ready, False otherwise
        """
        try:
            response = self.session.get(
                self.valhalla.status_endpoint, timeout=self.valhalla.timeout_seconds
            )
            response.raise_for_status()

            logger.info("✅ Valhalla connection successful")
            return True

        except requests.RequestException as e:
            logger.error(f"❌ Valhalla connection failed: {e}")
            return False

    def generate_route(
        self, from_station: StationCoordinate, to_station: StationCoordinate
    ) -> Optional[RouteGeometry]:
        """
        Generate bicycle route between two stations.

        Args:
            from_station: Departure station coordinates
            to_station: Return station coordinates

        Returns:
            RouteGeometry if successful, None if route generation fails
        """
        # Build Valhalla request with location snapping parameters
        request_data = {
            "locations": [
                {
                    **from_station.to_valhalla_location(),
                    "radius": self.valhalla.snap_radius_m,
                    "minimum_reachability": self.valhalla.min_reachability_nodes,
                },
                {
                    **to_station.to_valhalla_location(),
                    "radius": self.valhalla.snap_radius_m,
                    "minimum_reachability": self.valhalla.min_reachability_nodes,
                },
            ],
            "costing": self.generation.costing,
            "costing_options": {
                "bicycle": {"bicycle_type": self.generation.bicycle_type}
            },
            "directions_options": {
                "units": "kilometers",
                "narrative": False,  # Exclude turn-by-turn text (reduces response size)
                "maneuvers": False,  # Exclude maneuver details (reduces response size)
            },
        }

        # Retry logic
        for attempt in range(1, self.valhalla.max_retries + 1):
            try:
                self.total_requests += 1

                response = self.session.post(
                    self.valhalla.route_endpoint,
                    json=request_data,
                    timeout=self.valhalla.timeout_seconds,
                )
                response.raise_for_status()

                # Parse response
                data = response.json()
                trip = data.get("trip", {})
                legs = trip.get("legs", [])

                if not legs:
                    logger.warning(
                        f"No route found: {from_station.station_id} → "
                        f"{to_station.station_id}"
                    )
                    self.routes_failed += 1
                    return None

                leg = legs[0]
                summary = leg.get("summary", {})

                # Get encoded polyline (Valhalla uses precision-6 by default)
                encoded_shape = leg.get("shape", "")

                # Verify encoding by decoding and re-encoding
                # This ensures we have precision-6 encoding
                try:
                    decoded = polyline.decode(encoded_shape, precision=6)
                    verified_shape = polyline.encode(decoded, precision=6)
                except Exception as e:
                    logger.warning(
                        f"Polyline encoding issue for "
                        f"{from_station.station_id} → {to_station.station_id}: {e}"
                    )
                    verified_shape = encoded_shape

                # Create route key (canonical order)
                stations = sorted([from_station.station_id, to_station.station_id])
                route_key = f"{stations[0]}-{stations[1]}"

                # Create RouteGeometry
                route_geometry = RouteGeometry(
                    route_key=route_key,
                    departure_station_id=from_station.station_id,
                    return_station_id=to_station.station_id,
                    polyline=verified_shape,
                    distance_km=summary.get("length", 0.0),
                    duration_minutes=summary.get("time", 0.0) / 60.0,
                )

                self.routes_generated += 1

                # Log progress every N routes
                if self.routes_generated % self.generation.log_interval == 0:
                    logger.info(
                        f"Generated {self.routes_generated} routes "
                        f"({self.routes_failed} failed)"
                    )

                return route_geometry

            except requests.HTTPError as e:
                if e.response.status_code == 400:
                    # Bad request - route not possible
                    logger.warning(
                        f"Route not possible: {from_station.station_id} → "
                        f"{to_station.station_id} (HTTP 400)"
                    )
                    self.failed_routes.append(
                        {
                            "from": from_station.station_id,
                            "to": to_station.station_id,
                            "reason": "Route not possible (HTTP 400)",
                            "error_type": "HTTPError",
                        }
                    )
                    self.routes_failed += 1
                    return None
                elif attempt < self.valhalla.max_retries:
                    logger.warning(
                        f"HTTP error (attempt {attempt}/{self.valhalla.max_retries}): "
                        f"{e}. Retrying..."
                    )
                    time.sleep(self.valhalla.retry_delay_seconds)
                else:
                    logger.error(
                        f"Failed after {self.valhalla.max_retries} attempts: "
                        f"{from_station.station_id} → {to_station.station_id}"
                    )
                    self.routes_failed += 1
                    return None

            except requests.RequestException as e:
                if attempt < self.valhalla.max_retries:
                    logger.warning(
                        f"Request failed (attempt {attempt}/"
                        f"{self.valhalla.max_retries}): {e}. Retrying..."
                    )
                    time.sleep(self.valhalla.retry_delay_seconds)
                else:
                    logger.error(
                        f"Request failed after {self.valhalla.max_retries} "
                        f"attempts: {e}"
                    )
                    self.failed_routes.append(
                        {
                            "from": from_station.station_id,
                            "to": to_station.station_id,
                            "reason": str(e),
                            "error_type": type(e).__name__,
                        }
                    )
                    self.routes_failed += 1
                    return None

            except Exception as e:
                logger.error(f"Unexpected error generating route: {e}", exc_info=True)
                self.failed_routes.append(
                    {
                        "from": from_station.station_id,
                        "to": to_station.station_id,
                        "reason": str(e),
                        "error_type": type(e).__name__,
                    }
                )
                self.routes_failed += 1
                return None

        return None

    def generate_batch(
        self, station_pairs: List[Tuple[StationCoordinate, StationCoordinate]]
    ) -> List[RouteGeometry]:
        """
        Generate routes for a batch of station pairs.

        Args:
            station_pairs: List of (from_station, to_station) tuples

        Returns:
            List of successfully generated RouteGeometry objects
        """
        logger.info(f"Generating {len(station_pairs)} routes...")

        start_time = time.time()
        routes = []

        for i, (from_station, to_station) in enumerate(station_pairs, 1):
            route = self.generate_route(from_station, to_station)

            if route:
                routes.append(route)

            # Progress reporting with ETA every 100 routes
            if i % 100 == 0:
                elapsed = time.time() - start_time
                rate = i / elapsed if elapsed > 0 else 0
                remaining = (len(station_pairs) - i) / rate if rate > 0 else 0
                logger.info(
                    f"Progress: {i}/{len(station_pairs)} "
                    f"({rate:.1f} routes/s, ETA: {remaining:.0f}s)"
                )

        elapsed = time.time() - start_time
        rate = len(routes) / elapsed if elapsed > 0 else 0

        logger.info(
            f"Batch complete: {len(routes)}/{len(station_pairs)} routes generated "
            f"in {elapsed:.1f}s ({rate:.1f} routes/sec)"
        )

        return routes

    def get_statistics(self) -> dict:
        """
        Get generation statistics.

        Returns:
            Dict with generation stats including failure details
        """
        success_rate = (
            (self.routes_generated / self.total_requests * 100)
            if self.total_requests > 0
            else 0
        )

        return {
            "total_requests": self.total_requests,
            "routes_generated": self.routes_generated,
            "routes_failed": self.routes_failed,
            "success_rate_pct": round(success_rate, 2),
            "failed_routes": self.failed_routes,
        }


# Example usage and testing
if __name__ == "__main__":
    import sys
    from config import ValhallaConfig, GenerationConfig

    # Setup logging
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    try:
        # Create configs
        valhalla_config = ValhallaConfig()
        generation_config = GenerationConfig()

        # Create generator
        generator = RouteGenerator(valhalla_config, generation_config)

        # Test connection
        print("Testing Valhalla connection...")
        if not generator.test_connection():
            print("❌ Valhalla not available. Start with: docker-compose up -d")
            sys.exit(1)

        # Test route generation with sample coordinates
        print("\nGenerating sample routes...")

        # Helsinki Central (030) → Kaikukatu (067)
        station_030 = StationCoordinate("030", 60.1695, 24.9354)
        station_067 = StationCoordinate("067", 60.1712, 24.9412)

        route1 = generator.generate_route(station_030, station_067)
        if route1:
            print(f"\n✅ Route generated:")
            print(f"   Key: {route1.route_key}")
            print(f"   Distance: {route1.distance_km:.2f} km")
            print(f"   Duration: {route1.duration_minutes:.1f} min")
            print(f"   Polyline: {route1.polyline[:50]}...")
        else:
            print("❌ Route generation failed")

        # Test reverse route (should use same geometry)
        print("\nGenerating reverse route...")
        route2 = generator.generate_route(station_067, station_030)
        if route2:
            print(f"✅ Reverse route generated: {route2.route_key}")
            if route1:
                print(f"   Same geometry: {route1.route_key == route2.route_key}")
        else:
            print("❌ Reverse route generation failed")

        # Print statistics
        print(f"\n📊 Statistics:")
        stats = generator.get_statistics()
        for key, value in stats.items():
            print(f"   {key}: {value}")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
