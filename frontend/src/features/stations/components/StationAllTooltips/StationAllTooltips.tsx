import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { Popup } from 'mapbox-gl';
import { useStations } from '../../useStations';
import '../StationHoverPopup/StationHoverPopup.css';

/**
 * Component to show tooltips for all visible stations when mouse button is pressed
 *
 * Uses Mapbox GL JS native Popup API to render multiple popups simultaneously.
 * Displays station name for each visible station on the map.
 *
 * @example
 * ```tsx
 * <StationAllTooltips />
 * ```
 */
export const StationAllTooltips = () => {
  const { main: mainMap } = useMap();
  const { showAllTooltips, visibleStationsForTooltips } = useStations();
  const popupsRef = useRef<Popup[]>([]);

  useEffect(() => {
    if (!mainMap) {
      return;
    }

    // Clear existing popups
    popupsRef.current.forEach((popup) => popup.remove());
    popupsRef.current = [];

    // Create popups for all visible stations if enabled
    if (showAllTooltips && visibleStationsForTooltips.length > 0) {
      const newPopups = visibleStationsForTooltips.map((station) => {
        const { coordinates, properties } = station;

        const popupHTML = `
          <div class="station-hover-popup">
            <div class="station-hover-popup__name">${properties.name}</div>
          </div>
        `;

        const popup = new Popup({
          closeButton: false,
          closeOnClick: false,
          anchor: 'bottom',
          offset: 20,
          maxWidth: '300px',
          className: 'station-hover-popup-container',
        })
          .setLngLat(coordinates)
          .setHTML(popupHTML)
          .addTo(mainMap.getMap());

        return popup;
      });

      popupsRef.current = newPopups;
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      popupsRef.current.forEach((popup) => popup.remove());
      popupsRef.current = [];
    };
  }, [mainMap, showAllTooltips, visibleStationsForTooltips]);

  // This component doesn't render anything - it manages the native popups imperatively
  return null;
};
