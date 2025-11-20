import { IconButton, Tooltip, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { useMap } from 'react-map-gl/mapbox';
import { resetView } from '../../utils';
import { INITIAL_VIEW_STATE } from '@/config/mapbox';

export const MapResetButton = () => {
  const { main } = useMap();

  const handleReset = () => {
    resetView(main, INITIAL_VIEW_STATE);
  };

  return (
    <Paper elevation={2} sx={{ pointerEvents: 'auto' }}>
      <Tooltip title="Reset to initial view" placement="left">
        <IconButton onClick={handleReset} size="small" aria-label="Reset map view">
          <HomeIcon />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};
