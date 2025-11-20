import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { Popup } from 'mapbox-gl';
import { useStations } from '../../useStations';
import './StationHoverPopup.css';

/**
 * Hover popup showing basic station information
 *
 * Uses Mapbox GL JS native Popup API for full control over styling and behavior.
 * Displays station name using only data already available from the stations layer.
 *
 * @example
 * ```tsx
 * <StationHoverPopup />
 * ```
 */
export const StationHoverPopup = () => {
  const { main: mainMap } = useMap();
  const { hoveredStation } = useStations();
  const popupRef = useRef<Popup | null>(null);

  useEffect(() => {
    if (!mainMap) {
      return;
    }

    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    // Create new popup if we have hover data
    if (hoveredStation) {
      const { coordinates, properties } = hoveredStation;

      const popupHTML = `
        <div class="station-hover-popup">
          <div class="station-hover-popup__name">${properties.name}</div>
          <div class="station-hover-popup__id">ID: ${properties.stationId}</div>
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

      popupRef.current = popup;
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, [mainMap, hoveredStation]);

  // This component doesn't render anything - it manages the native popup imperatively
  return null;
};
