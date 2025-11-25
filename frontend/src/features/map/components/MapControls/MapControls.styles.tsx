import { styled } from '@mui/material/styles';
import { Box, IconButton } from '@mui/material';

const Container = styled(Box)(() => ({
  position: 'absolute',
  top: 80, // Header height (64px) + margin (16px)
  right: 16,
  zIndex: 2,
  display: 'flex',
  flexDirection: 'row-reverse',
  gap: 12,
  alignItems: 'flex-start',
  pointerEvents: 'none',
}));

const InnerContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  alignItems: 'flex-end',
  pointerEvents: 'auto',
}));

const ButtonWithMenuRow = styled(Box)(() => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}));

const CollapsedMenuWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isFirst',
})<{ isFirst?: boolean }>(({ isFirst }) => ({
  position: 'absolute',
  right: 'calc(100% + 16px)',
  top: isFirst ? '-48px' : 'calc(50% - 16px)',
  transform: isFirst ? 'translateY(0)' : 'translateY(-50%)',
  display: 'flex',
}));

const ButtonGroup = styled(Box)(({ theme }) => ({
  padding: 10,
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.mode === 'dark' ? 'rgba(5, 8, 22, 0.15)' : 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  border: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'
  }`,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}));

const FilterButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'isOpen',
})<{ isOpen?: boolean }>(({ theme, isOpen }) => ({
  width: 56,
  height: 56,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${isOpen ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.24)'}`,
  background:
    theme.palette.mode === 'dark'
      ? isOpen
        ? 'radial-gradient(circle at 30% 0%, rgba(255, 255, 255, 0.16), rgba(11, 16, 40, 0.92))'
        : 'radial-gradient(circle at 30% 0%, rgba(255, 255, 255, 0.06), rgba(11, 16, 40, 0.92))'
      : 'radial-gradient(circle at 30% 0%, rgba(255, 255, 255, 0.2), rgba(230, 238, 245, 0.95))',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : theme.palette.text.primary,
  // Material Design transitions - 200ms with standard easing
  transition:
    'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover:not([aria-expanded="true"])': {
    background:
      theme.palette.mode === 'dark'
        ? 'radial-gradient(circle at 30% 0%, rgba(255, 255, 255, 0.2), rgba(11, 16, 40, 0.95))'
        : 'radial-gradient(circle at 30% 0%, rgba(255, 255, 255, 0.3), rgba(230, 238, 245, 1))',
    transform: 'scale(1.02)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  // WCAG 2.1 AA focus indicator
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
}));

const MenuContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '8px 16px',
  borderRadius: 16,
  ...theme.palette.glassmorphism,
  alignItems: 'flex-start',
  whiteSpace: 'nowrap',
  marginTop: 32,
  // Material Design transitions matching Collapse animation
  transition:
    'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
}));

const SubGroup = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'flex-start',
}));

const SubGroupLabel = styled(Box)(({ theme }) => ({
  fontSize: '0.875rem', // 14px - matches StatLabel
  fontWeight: 600,
  color: theme.palette.mode === 'dark' ? 'rgba(200, 210, 220, 1)' : 'rgba(60, 80, 100, 1)',
  paddingRight: 0,
  letterSpacing: '0.01em',
}));

const LabelRow = styled(Box)(() => ({
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-start',
  alignItems: 'flex-start',
  minHeight: 28,
}));

const OptionLabel = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isSelected',
})<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
  fontSize: '0.75rem', // 12px
  fontWeight: isSelected ? 600 : 500,
  color: isSelected
    ? theme.palette.mode === 'dark'
      ? 'rgba(200, 210, 220, 1)'
      : 'rgba(60, 80, 100, 1)'
    : theme.palette.mode === 'dark'
      ? 'rgba(150, 160, 170, 1)'
      : 'rgba(100, 120, 140, 1)',
  textAlign: 'center',
  width: 64,
  maxWidth: 64,
  lineHeight: 1.2,
  wordBreak: 'break-all',
  overflowWrap: 'break-word',
  transition:
    'color 200ms cubic-bezier(0.4, 0, 0.2, 1), font-weight 200ms cubic-bezier(0.4, 0, 0.2, 1)',
}));

export const Styled = {
  Container,
  InnerContainer,
  ButtonWithMenuRow,
  CollapsedMenuWrapper,
  ButtonGroup,
  ControlButton: FilterButton,
  MenuContainer,
  SubGroup,
  SubGroupLabel,
  LabelRow,
  OptionLabel,
};
