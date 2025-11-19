import { useState } from 'react';
import { Box, Select, MenuItem, Paper, FormControl, InputLabel } from '@mui/material';
import { useMapContext } from '../../hooks/useMapContext';
import { MAP_STYLES, type MapStyleKey } from '@/config/mapbox';

interface MapStyleSwitcherProps {
  /** Position of the style switcher */
  position?: {
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
  };
}

/**
 * Map style switcher control
 *
 * Allows users to switch between different Mapbox map styles
 * (light, dark, streets, outdoors, satellite).
 *
 * @example
 * ```tsx
 * <BaseMap>
 *   <MapStyleSwitcher position={{ top: 10, right: 10 }} />
 * </BaseMap>
 * ```
 */
export const MapStyleSwitcher = ({ position = { top: 10, right: 10 } }: MapStyleSwitcherProps) => {
  const { mapRef } = useMapContext();
  const [currentStyle, setCurrentStyle] = useState<MapStyleKey>('light');

  const handleStyleChange = (style: MapStyleKey) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.setStyle(MAP_STYLES[style]);
    setCurrentStyle(style);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        ...position,
        zIndex: 1,
        pointerEvents: 'auto',
      }}
    >
      <Paper elevation={2} sx={{ p: 1, minWidth: 150 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Map Style</InputLabel>
          <Select
            value={currentStyle}
            label="Map Style"
            onChange={(e) => handleStyleChange(e.target.value as MapStyleKey)}
          >
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="streets">Streets</MenuItem>
            <MenuItem value="outdoors">Outdoors</MenuItem>
            <MenuItem value="satellite">Satellite</MenuItem>
          </Select>
        </FormControl>
      </Paper>
    </Box>
  );
};
