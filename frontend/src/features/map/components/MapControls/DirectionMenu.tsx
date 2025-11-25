import { Box } from '@mui/material';
import { FilterToggleButtonGroup, FilterToggleButton } from './OptionToggleButton';
import { Styled } from './MapControls.styles';
import { DIRECTION_OPTIONS, MENU_OPTION_ICON_SIZE, type Direction } from './config';

interface DirectionMenuProps {
  selectedDirection: Direction;
  onSelect: (direction: Direction) => void;
}

export const DirectionMenu = ({ selectedDirection, onSelect }: DirectionMenuProps) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newDirection: Direction | null) => {
    if (newDirection !== null) {
      onSelect(newDirection);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <FilterToggleButtonGroup
        value={selectedDirection}
        exclusive
        onChange={handleChange}
        orientation="horizontal"
        aria-label="Direction selection"
      >
        {DIRECTION_OPTIONS.map(({ value, icon: Icon }) => (
          <FilterToggleButton key={value} value={value} aria-label={value}>
            <Icon size={MENU_OPTION_ICON_SIZE} />
          </FilterToggleButton>
        ))}
      </FilterToggleButtonGroup>
      <Styled.LabelRow>
        {DIRECTION_OPTIONS.map(({ value, label }) => (
          <Styled.OptionLabel key={value} isSelected={selectedDirection === value}>
            {label}
          </Styled.OptionLabel>
        ))}
      </Styled.LabelRow>
    </Box>
  );
};
