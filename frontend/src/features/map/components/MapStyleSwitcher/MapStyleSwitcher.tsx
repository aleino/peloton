import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import CheckIcon from '@mui/icons-material/Check';
import { useMap } from 'react-map-gl/mapbox';
import { MAP_STYLES, type MapStyleKey } from '@/config/mapbox';

const STYLE_LABELS: Record<MapStyleKey, string> = {
  light: 'Light',
  dark: 'Dark',
  streets: 'Streets',
  outdoors: 'Outdoors',
  satellite: 'Satellite',
};

/**
 * Map style switcher control
 *
 * Allows users to switch between different Mapbox map styles
 * (light, dark, streets, outdoors, satellite) via a menu.
 *
 * @example
 * ```tsx
 * <FloatingHeader
 *   rightContent={<MapStyleSwitcher />}
 * />
 * ```
 */
export const MapStyleSwitcher = () => {
  const { main } = useMap();
  const [currentStyle, setCurrentStyle] = useState<MapStyleKey>('dark');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStyleChange = (style: MapStyleKey) => {
    if (!main) return;

    main.getMap().setStyle(MAP_STYLES[style]);
    setCurrentStyle(style);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Map Style">
        <IconButton
          onClick={handleClick}
          size="medium"
          aria-label="map style"
          aria-controls={open ? 'map-style-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <MapIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="map-style-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': 'map-style-button',
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((style) => (
          <MenuItem
            key={style}
            onClick={() => handleStyleChange(style)}
            selected={style === currentStyle}
          >
            <ListItemIcon>{style === currentStyle && <CheckIcon />}</ListItemIcon>
            <ListItemText>{STYLE_LABELS[style]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
