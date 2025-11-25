import { useState, useEffect } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Navigation2, Home } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { clearStationSelections } from '@/features/stations/stations.store';
import { MAP_ANIMATION, INITIAL_VIEW_STATE } from '../../map.config';
import { Styled } from './MapZoomControls.styles';

/**
 * Custom map zoom controls with glassmorphic design
 *
 * Features:
 * - Zoom in/out controls (primary panel)
 * - Compass control synced to map bearing (secondary panel)
 * - Home button to reset map to initial state (secondary panel)
 * - Theme-aware glassmorphic styling
 */
export const MapZoomControls = () => {
  const { main } = useMap();
  const dispatch = useAppDispatch();
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    if (!main) {
      return;
    }

    const map = main.getMap();

    // Listen for bearing changes
    const handleRotate = () => {
      setBearing(map.getBearing());
    };

    // Set initial bearing after effect is mounted
    handleRotate();

    map.on('rotate', handleRotate);

    return () => {
      map.off('rotate', handleRotate);
    };
  }, [main]);

  const handleZoomIn = () => {
    if (!main) {
      return;
    }
    main.getMap().zoomIn();
  };

  const handleZoomOut = () => {
    if (!main) {
      return;
    }
    main.getMap().zoomOut();
  };

  const handleCompass = () => {
    if (!main) {
      return;
    }
    const map = main.getMap();
    const currentBearing = map.getBearing();
    const currentPitch = map.getPitch();

    // If already at north (bearing 0 and pitch 0), rotate to south
    if (Math.abs(currentBearing) < 1 && currentPitch < 1) {
      map.easeTo({
        bearing: 180,
        pitch: 0,
        duration: MAP_ANIMATION.compassDuration,
      });
    } else {
      // Otherwise reset to north
      map.easeTo({
        bearing: 0,
        pitch: 0,
        duration: MAP_ANIMATION.compassDuration,
      });
    }
  };

  const handleHome = () => {
    if (!main) {
      return;
    }
    // Clear selected stations
    dispatch(clearStationSelections());

    // Reset map to initial view
    const map = main.getMap();
    map.easeTo({
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      bearing: INITIAL_VIEW_STATE.bearing,
      pitch: INITIAL_VIEW_STATE.pitch,
      duration: MAP_ANIMATION.defaultDuration,
    });
  };

  return (
    <Styled.Container data-testid="map-zoom-controls-container">
      {/* Primary zoom controls */}
      <Styled.ZoomPanel data-testid="zoom-controls-panel">
        <Styled.ZoomButton onClick={handleZoomIn} aria-label="Zoom in" data-testid="zoom-in-button">
          <AddIcon fontSize="large" />
        </Styled.ZoomButton>
        <Styled.ZoomButton
          onClick={handleZoomOut}
          aria-label="Zoom out"
          data-testid="zoom-out-button"
        >
          <RemoveIcon fontSize="large" />
        </Styled.ZoomButton>
      </Styled.ZoomPanel>

      {/* Secondary controls: compass and home */}
      <Styled.SecondaryPanel data-testid="secondary-controls-panel">
        <Styled.SecondaryButton
          onClick={handleHome}
          aria-label="Reset map to initial position"
          data-testid="home-button"
        >
          <Home size={20} />
        </Styled.SecondaryButton>

        <Styled.SecondaryButton
          onClick={handleCompass}
          aria-label="Reset map orientation"
          data-testid="compass-button"
        >
          <Navigation2
            size={20}
            style={{
              transform: `rotate(${-bearing}deg)`,
              transition: 'transform 0.3s ease-out',
            }}
          />
        </Styled.SecondaryButton>
      </Styled.SecondaryPanel>
    </Styled.Container>
  );
};
