#!/usr/bin/env python3
"""Test Valhalla connectivity and basic routing."""

import sys
import logging
import requests
from config import ValhallaConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_valhalla_status():
    """Test Valhalla status endpoint."""
    config = ValhallaConfig()

    try:
        logger.info(f"Testing Valhalla at: {config.base_url}")
        response = requests.get(config.status_endpoint, timeout=config.timeout_seconds)
        response.raise_for_status()
        logger.info("✅ Valhalla status: OK")
        return True
    except Exception as e:
        logger.error(f"❌ Valhalla status check failed: {e}")
        return False


def test_valhalla_routing():
    """Test Valhalla route generation."""
    config = ValhallaConfig()

    # Helsinki Central → Kaikukatu
    request_data = {
        "locations": [
            {"lat": 60.1695, "lon": 24.9354},
            {"lat": 60.1712, "lon": 24.9412},
        ],
        "costing": "bicycle",
    }

    try:
        logger.info("Testing route generation...")
        response = requests.post(
            config.route_endpoint, json=request_data, timeout=config.timeout_seconds
        )
        response.raise_for_status()

        data = response.json()
        trip = data.get("trip", {})
        legs = trip.get("legs", [])

        if not legs:
            logger.error("❌ No route generated")
            return False

        leg = legs[0]
        summary = leg.get("summary", {})
        shape = leg.get("shape", "")

        logger.info(f"✅ Route generated:")
        logger.info(f"   Distance: {summary.get('length', 0):.2f} km")
        logger.info(f"   Duration: {summary.get('time', 0) / 60:.1f} min")
        logger.info(f"   Polyline length: {len(shape)} chars")

        return True

    except Exception as e:
        logger.error(f"❌ Route generation failed: {e}")
        return False


def main():
    """Run all Valhalla tests."""
    logger.info("=" * 60)
    logger.info("Valhalla Connectivity Tests")
    logger.info("=" * 60)

    results = []

    # Test 1: Status endpoint
    logger.info("\n[Test 1/2] Status Endpoint")
    results.append(test_valhalla_status())

    # Test 2: Route generation
    logger.info("\n[Test 2/2] Route Generation")
    results.append(test_valhalla_routing())

    # Summary
    logger.info("\n" + "=" * 60)
    if all(results):
        logger.info("✅ All tests passed!")
        logger.info("Valhalla is ready for route generation.")
        return 0
    else:
        logger.error("❌ Some tests failed")
        logger.error("Fix issues before running pipeline.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
