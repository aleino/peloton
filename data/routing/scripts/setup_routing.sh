#!/bin/bash

###############################################################################
# OSM Data Clipping Script for Helsinki Metropolitan Area
#
# This script prepares OSM data for Valhalla routing by:
# 1. Installing dependencies (osmium-tool)
# 2. Downloading Finland OSM data from Geofabrik
# 3. Clipping it to Helsinki metropolitan area (Helsinki, Espoo, Vantaa)
# 4. Preparing the clipped file for Docker volume mount
#
# Usage:
#   ./setup_routing.sh [--force-download]
#
# After running this script, start Valhalla with:
#   docker-compose up -d
#
# Requirements:
#   - macOS or Linux
#   - Homebrew (macOS) or apt (Linux)
#   - ~1GB free disk space (temporary)
###############################################################################

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROUTING_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$ROUTING_DIR/data"
CONFIG_DIR="$SCRIPT_DIR/config"
BBOX_CONFIG="$CONFIG_DIR/helsinki-bbox.json"

# OSM data URLs and paths
FINLAND_URL="https://download.geofabrik.de/europe/finland-latest.osm.pbf"
FINLAND_FILE="$DATA_DIR/finland-latest.osm.pbf"
CLIPPED_FILE="$DATA_DIR/helsinki-region.osm.pbf"

# Bounding box for Helsinki metropolitan area (from config)
BBOX="24.6,60.0,25.3,60.5"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check and install dependencies
install_dependencies() {
    log_info "Checking dependencies..."
    
    if command -v osmium &> /dev/null; then
        log_success "osmium-tool found: $(osmium --version | head -n1)"
        return 0
    fi
    
    log_warning "osmium-tool not found, attempting to install..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if ! command -v brew &> /dev/null; then
            log_error "Homebrew not found. Please install Homebrew first: https://brew.sh"
            exit 1
        fi
        log_info "Installing osmium-tool via Homebrew..."
        brew install osmium-tool
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            log_info "Installing osmium-tool via apt..."
            sudo apt-get update
            sudo apt-get install -y osmium-tool
            elif command -v yum &> /dev/null; then
            log_info "Installing osmium-tool via yum..."
            sudo yum install -y osmium-tool
        else
            log_error "Unable to install osmium-tool automatically. Please install manually."
            exit 1
        fi
    else
        log_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    if command -v osmium &> /dev/null; then
        log_success "osmium-tool installed successfully: $(osmium --version | head -n1)"
    else
        log_error "Failed to install osmium-tool"
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating directory structure..."
    mkdir -p "$DATA_DIR"
    log_success "Directories ready"
}

# Download Finland OSM data
download_finland_osm() {
    local force_download="${1:-}"
    
    if [[ -f "$FINLAND_FILE" && "$force_download" != "--force" ]]; then
        log_info "Finland OSM file already exists: $FINLAND_FILE"
        log_info "Use --force-download to re-download"
        return 0
    fi
    
    log_info "Downloading Finland OSM data from Geofabrik..."
    log_info "URL: $FINLAND_URL"
    log_info "Target: $FINLAND_FILE"
    log_warning "This is a 662 MB download, please be patient..."
    
    if command -v curl &> /dev/null; then
        curl -L -o "$FINLAND_FILE" "$FINLAND_URL"
        elif command -v wget &> /dev/null; then
        wget -O "$FINLAND_FILE" "$FINLAND_URL"
    else
        log_error "Neither curl nor wget found. Cannot download OSM data."
        exit 1
    fi
    
    log_success "Finland OSM data downloaded: $(du -h "$FINLAND_FILE" | cut -f1)"
}

# Create bounding box configuration if it doesn't exist
create_bbox_config() {
    if [[ -f "$BBOX_CONFIG" ]]; then
        log_info "Bounding box config already exists"
        return 0
    fi
    
    log_info "Creating bounding box configuration..."
    
    mkdir -p "$CONFIG_DIR"
    cat > "$BBOX_CONFIG" <<EOF
{
  "description": "Helsinki Metropolitan Area (Helsinki, Espoo, Vantaa)",
  "bbox": {
    "min_lon": 24.6,
    "min_lat": 60.0,
    "max_lon": 25.3,
    "max_lat": 60.5
  },
  "notes": {
    "coverage": "Covers all HSL bike stations + buffer for routing",
    "stations_range": "Lat: 60.15-60.30, Lon: 24.80-25.15",
    "buffer": "~20km buffer for alternate routes",
    "osmium_format": "24.6,60.0,25.3,60.5"
  }
}
EOF
    
    log_success "Bounding box config created: $BBOX_CONFIG"
}

# Clip OSM data to Helsinki region
clip_osm_data() {
    log_info "Clipping OSM data to Helsinki region..."
    log_info "Bounding box: $BBOX"
    log_info "Input:  $(du -h "$FINLAND_FILE" | cut -f1) (Finland)"
    
    # osmium extract with bounding box
    osmium extract \
    --bbox "$BBOX" \
    --output "$CLIPPED_FILE" \
    --overwrite \
    --strategy simple \
    "$FINLAND_FILE"
    
    log_success "OSM data clipped successfully!"
    log_info "Output: $(du -h "$CLIPPED_FILE" | cut -f1) (Helsinki region)"
    
    # Calculate size reduction
    ORIGINAL_SIZE=$(stat -f%z "$FINLAND_FILE" 2>/dev/null || stat -c%s "$FINLAND_FILE")
    CLIPPED_SIZE=$(stat -f%z "$CLIPPED_FILE" 2>/dev/null || stat -c%s "$CLIPPED_FILE")
    REDUCTION=$(echo "scale=1; 100 - ($CLIPPED_SIZE * 100 / $ORIGINAL_SIZE)" | bc)
    
    log_success "Size reduction: ${REDUCTION}% (saved $(numfmt --to=iec --suffix=B $((ORIGINAL_SIZE - CLIPPED_SIZE)) 2>/dev/null || echo "$((ORIGINAL_SIZE - CLIPPED_SIZE)) bytes"))"
}

# Verify the clipped file
verify_clipped_file() {
    log_info "Verifying clipped OSM file..."
    
    # Check file exists and is not empty
    if [[ ! -f "$CLIPPED_FILE" ]]; then
        log_error "Clipped file not found: $CLIPPED_FILE"
        exit 1
    fi
    
    # Check file size is reasonable (should be 50-100 MB)
    FILE_SIZE=$(stat -f%z "$CLIPPED_FILE" 2>/dev/null || stat -c%s "$CLIPPED_FILE")
    SIZE_MB=$((FILE_SIZE / 1024 / 1024))
    
    if [[ $SIZE_MB -lt 30 ]]; then
        log_warning "Clipped file seems too small: ${SIZE_MB}MB (expected 50-100 MB)"
        log_warning "This might indicate an issue with the clipping process"
        elif [[ $SIZE_MB -gt 150 ]]; then
        log_warning "Clipped file seems too large: ${SIZE_MB}MB (expected 50-100 MB)"
        log_warning "This might indicate the bounding box is too large"
    else
        log_success "Clipped file size looks good: ${SIZE_MB}MB"
    fi
    
    # Try to get OSM file info (if osmium is available)
    if command -v osmium &> /dev/null; then
        log_info "OSM file statistics:"
        osmium fileinfo "$CLIPPED_FILE" | grep -E "(Nodes|Ways|Relations):" || true
    fi
    
    log_success "Verification complete"
}

# Cleanup temporary files
cleanup_temporary_files() {
    log_info "Checking for temporary files to clean up..."
    
    # Optionally remove the full Finland file to save space
    if [[ -f "$FINLAND_FILE" ]]; then
        log_info "Full Finland OSM file still present: $(du -h "$FINLAND_FILE" | cut -f1)"
        read -p "Remove Finland file to save space? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm "$FINLAND_FILE"
            log_success "Finland OSM file removed"
        else
            log_info "Keeping Finland OSM file (can be removed manually later)"
        fi
    fi
}

# Print next steps
print_next_steps() {
    echo ""
    echo "============================================================"
    log_success "ROUTING SETUP COMPLETE!"
    echo "============================================================"
    echo ""
    echo "📁 Clipped OSM file: $CLIPPED_FILE"
    echo "📊 File size: $(du -h "$CLIPPED_FILE" | cut -f1)"
    echo ""
    echo "🔄 Next steps:"
    echo "  1. Start Valhalla: cd $ROUTING_DIR && docker-compose up -d"
    echo "  2. Wait for tile building (2-3 minutes)"
    echo "  3. Check status: curl http://localhost:8002/status"
    echo ""
    echo "📝 Note: The clipped file is ready at:"
    echo "  $CLIPPED_FILE"
    echo ""
    echo "🧹 To re-clip with updated data:"
    echo "  $0 --force-download"
    echo ""
}

# Main execution
main() {
    echo "============================================================"
    echo "Valhalla Routing Setup - Helsinki Metropolitan Area"
    echo "============================================================"
    echo ""
    
    FORCE_DOWNLOAD=""
    if [[ "${1:-}" == "--force-download" ]]; then
        FORCE_DOWNLOAD="--force"
        log_warning "Force download enabled"
    fi
    
    install_dependencies
    create_directories
    download_finland_osm "$FORCE_DOWNLOAD"
    create_bbox_config
    clip_osm_data
    verify_clipped_file
    cleanup_temporary_files
    print_next_steps
}

# Run main function
main "$@"
