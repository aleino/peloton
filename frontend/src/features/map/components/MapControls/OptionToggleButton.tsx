import { styled } from '@mui/material/styles';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

/**
 * Styled ToggleButtonGroup for control menus
 * Maintains horizontal layout with proper spacing
 */
export const FilterToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  gap: theme.spacing(1),
  display: 'flex',
}));

/**
 * Styled ToggleButton for menu options
 * Square 64x64px buttons with only icons (labels shown below button group)
 */
export const FilterToggleButton = styled(ToggleButton)(({ theme }) => ({
  padding: 8,
  width: 64,
  height: 64,
  minWidth: 64,
  borderRadius: theme.shape.borderRadius,
  // Base styling
  background: theme.palette.mode === 'dark' ? 'rgba(5, 7, 20, 1)' : 'rgba(248, 250, 252, 1)',
  border: `1px solid ${theme.palette.alpha[12]}`,
  color: theme.palette.text.primary,
  // Icon and text styling
  fontSize: '0.8125rem',
  fontWeight: 600,
  lineHeight: 1.3,
  // Transitions
  transition:
    'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1), color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: theme.palette.alpha[12],
    borderColor: theme.palette.alpha[24],
    transform: 'scale(1.02)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  // Selected state
  '&.Mui-selected': {
    background:
      theme.palette.mode === 'dark'
        ? 'rgba(25, 118, 210, 0.16)' // Stronger blue background in dark mode
        : 'rgba(25, 118, 210, 0.12)', // Stronger blue background in light mode
    borderColor: theme.palette.primary.main,
    color: theme.palette.text.primary,
    '&:hover': {
      background:
        theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.20)' : 'rgba(25, 118, 210, 0.16)',
      borderColor: theme.palette.primary.main,
    },
  },
  // Focus indicator
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}));
