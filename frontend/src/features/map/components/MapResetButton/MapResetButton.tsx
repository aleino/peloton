import { IconButton, Tooltip, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { useMapContext } from '../../hooks/useMapContext';

export const MapResetButton = () => {
  const { resetView } = useMapContext();

  return (
    <Paper elevation={2} sx={{ pointerEvents: 'auto' }}>
      <Tooltip title="Reset to initial view" placement="left">
        <IconButton onClick={resetView} size="small" aria-label="Reset map view">
          <HomeIcon />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};
