import { Typography, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { Styled } from './FloatingHeader.styles';

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
    <Styled.AppBar elevation={0} sx={sx}>
      <Styled.Toolbar>
        {/* Left section */}
        {leftContent && <Styled.LeftSection>{leftContent}</Styled.LeftSection>}

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
        {centerContent && <Styled.CenterSection>{centerContent}</Styled.CenterSection>}

        {/* Right section */}
        {rightContent && <Styled.RightSection>{rightContent}</Styled.RightSection>}
      </Styled.Toolbar>
    </Styled.AppBar>
  );
};
