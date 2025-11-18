import { AppBar, Toolbar, Typography, Box, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';

interface FloatingHeaderProps {
  /** Title text for the header */
  title?: string;

  /** Left-side content (logo, back button, etc.) */
  leftContent?: ReactNode;

  /** Right-side content (user menu, settings, etc.) */
  rightContent?: ReactNode;

  /** Center content */
  centerContent?: ReactNode;

  /** Additional sx props */
  sx?: SxProps<Theme>;
}

/**
 * Floating header bar that doesn't block map interactions
 *
 * Uses position: absolute instead of sticky/fixed to avoid
 * blocking the map. Floats at top of viewport with semi-transparent
 * background.
 *
 * @example
 * ```tsx
 * <FloatingHeader
 *   title="Peloton"
 *   rightContent={<UserMenu />}
 * />
 * ```
 */
export const FloatingHeader = ({
  title,
  leftContent,
  rightContent,
  centerContent,
  sx = {},
}: FloatingHeaderProps) => {
  return (
    <AppBar
      position="absolute"
      elevation={2}
      sx={{
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        pointerEvents: 'auto',
        ...sx,
      }}
    >
      <Toolbar>
        {/* Left section */}
        {leftContent && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>{leftContent}</Box>
        )}

        {/* Title */}
        {title && (
          <Typography
            variant="h6"
            component="h1"
            sx={{
              flexGrow: centerContent ? 0 : 1,
              ml: leftContent ? 2 : 0,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>
        )}

        {/* Center section */}
        {centerContent && (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>{centerContent}</Box>
        )}

        {/* Right section */}
        {rightContent && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>{rightContent}</Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
