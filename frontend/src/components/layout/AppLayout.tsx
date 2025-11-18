import { Box, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

export const AppLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        component="header"
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          boxShadow: 1,
        }}
      >
        <Typography variant="h4" component="h1">
          Peloton
        </Typography>
      </Box>

      <Box component="main" sx={{ flex: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};
