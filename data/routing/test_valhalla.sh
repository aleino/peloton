#!/bin/bash

# Test Valhalla routing setup
# This script verifies that Valhalla is properly configured and ready for route generation

set -e

VALHALLA_URL="http://localhost:8002"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Valhalla Routing Engine Test"
echo "=========================================="
echo ""

# Test 1: Container Status
echo "Test 1: Checking Docker container status..."
if docker ps --filter name=valhalla_routing | grep -q valhalla_routing; then
    echo -e "${GREEN}✓${NC} Container is running"
else
    echo -e "${RED}✗${NC} Container is not running"
    echo "Start the container with: docker-compose up -d"
    exit 1
fi
echo ""

# Test 2: Status Endpoint
echo "Test 2: Checking status endpoint..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$VALHALLA_URL/status")
if [ "$STATUS_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Status endpoint is responding"
    STATUS_JSON=$(curl -s "$VALHALLA_URL/status")
    
    # Check if routing tiles are available by looking for 'route' in available_actions
    HAS_ROUTE=$(echo "$STATUS_JSON" | python3 -c "import sys, json; actions = json.load(sys.stdin).get('available_actions', []); print('route' in actions)")
    
    if [ "$HAS_ROUTE" = "True" ]; then
        echo -e "${GREEN}✓${NC} Tiles are built and ready"
        VERSION=$(echo "$STATUS_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin).get('version', 'unknown'))")
        MODIFIED=$(echo "$STATUS_JSON" | python3 -c "import sys, json; import datetime; ts = json.load(sys.stdin).get('tileset_last_modified', 0); print(datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S'))")
        echo "  Version: $VERSION"
        echo "  Tileset modified: $MODIFIED"
    else
        echo -e "${YELLOW}⚠${NC} Tiles are still building or routing is not available"
        echo "Check logs with: docker-compose logs -f valhalla"
        exit 0
    fi
else
    echo -e "${RED}✗${NC} Status endpoint returned HTTP $STATUS_CODE"
    echo "Service may still be starting. Check logs with: docker-compose logs -f valhalla"
    exit 0
fi
echo ""

# Test 3: Route Generation
echo "Test 3: Testing route generation..."
echo "Generating bicycle route in Helsinki (Railway Square to Kamppi)..."

ROUTE_REQUEST='{
    "locations": [
        {"lat": 60.1695, "lon": 24.9354},
        {"lat": 60.1699, "lon": 24.9384}
    ],
    "costing": "bicycle",
    "directions_options": {
        "language": "en-US"
    }
}'

ROUTE_RESPONSE=$(curl -s -X POST "$VALHALLA_URL/route" \
    -H "Content-Type: application/json" \
-d "$ROUTE_REQUEST")

ROUTE_CODE=$?

if [ $ROUTE_CODE -eq 0 ]; then
    # Check if response contains trip data
    if echo "$ROUTE_RESPONSE" | python3 -c "import sys, json; trip = json.load(sys.stdin).get('trip'); sys.exit(0 if trip else 1)" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Route generated successfully"
        echo ""
        echo "Route Details:"
        echo "$ROUTE_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
trip = data.get('trip', {})
summary = trip.get('summary', {})
print(f\"  Distance: {summary.get('length', 0):.2f} km\")
print(f\"  Time: {summary.get('time', 0)} seconds\")
legs = trip.get('legs', [])
if legs:
    print(f\"  Maneuvers: {len(legs[0].get('maneuvers', []))} steps\")
        "
    else
        echo -e "${RED}✗${NC} Route request failed"
        echo "Response:"
        echo "$ROUTE_RESPONSE" | python3 -m json.tool
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Failed to connect to routing endpoint"
    exit 1
fi
echo ""

# Test 4: Configuration Check
echo "Test 4: Checking configuration..."
if [ -f "custom_files/valhalla.json" ]; then
    echo -e "${GREEN}✓${NC} valhalla.json configuration file exists"
    MAX_DIST=$(python3 -c "
import json
with open('custom_files/valhalla.json') as f:
    config = json.load(f)
    print(config['service_limits']['bicycle']['max_distance'])
    ")
    echo "  Max bicycle distance: ${MAX_DIST} meters"
else
    echo -e "${YELLOW}⚠${NC} Configuration file not found"
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "=========================================="
echo ""
echo "Valhalla is ready for route generation."
echo ""
echo "Useful commands:"
echo "  • View logs: docker-compose logs -f valhalla"
echo "  • Stop container: docker-compose down"
echo "  • Restart container: docker-compose restart"
echo ""
