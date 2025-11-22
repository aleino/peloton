import { Box, CircularProgress, Typography, Paper } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  /** Variant: 'fullscreen' blocks everything, 'floating' appears as overlay */
  variant?: 'fullscreen' | 'floating';
}

export const LoadingSpinner = ({
  message = 'Loading...',
  size = 40,
  variant = 'floating',
}: LoadingSpinnerProps) => {
  // Floating variant - appears as a card overlay
  if (variant === 'floating') {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          pointerEvents: 'auto',
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            backgroundColor: 'background.paper',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            minWidth: 200,
          }}
        >
          <CircularProgress size={size} />
          {message && (
            <Typography variant="h6" color="text.secondary">
              {message}
            </Typography>
          )}
        </Paper>
      </Box>
    );
  }

  // Fullscreen variant - original behavior
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="h6" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};
