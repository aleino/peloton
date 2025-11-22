import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/mapbox';
import { generateAllStationIcons } from '../utils/generateStationIconSVG';

/**
 * Hook to load station icons into Mapbox map
 *
 * Loads all icon variants (default, hover, active) on mount.
 * Uses a ref to prevent duplicate loads in React StrictMode.
 */
export const useStationIcons = () => {
  const { current: map } = useMap();
  const loadingRef = useRef(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!map || loadingRef.current || loadedRef.current) {
      return;
    }

    loadingRef.current = true;

    const loadIcons = async () => {
      const icons = generateAllStationIcons(32);

      // Load each icon variant
      for (const [name, dataUrl] of Object.entries(icons)) {
        // Double-check in case of race condition
        if (map.hasImage(name)) continue;

        const img = new Image();
        img.src = dataUrl;

        await new Promise((resolve, reject) => {
          img.onload = () => {
            // Check again right before adding in case another load finished
            if (!map.hasImage(name)) {
              map.addImage(name, img);
            }
            resolve(null);
          };
          img.onerror = reject;
        });
      }

      loadedRef.current = true;
    };

    loadIcons().catch((error) => {
      console.error('Failed to load station icons:', error);
      loadingRef.current = false;
    });
  }, [map]);
};
