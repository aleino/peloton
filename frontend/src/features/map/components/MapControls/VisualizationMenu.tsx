import { Box } from '@mui/material';
import { FilterToggleButtonGroup, FilterToggleButton } from './OptionToggleButton';
import { Styled } from './MapControls.styles';
import { VISUALIZATION_OPTIONS, MENU_OPTION_ICON_SIZE, type Visualization } from './config';

interface VisualizationMenuProps {
  selectedVisualization: Visualization;
  onSelect: (visualization: Visualization) => void;
}

export const VisualizationMenu = ({ selectedVisualization, onSelect }: VisualizationMenuProps) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newVisualization: Visualization | null
  ) => {
    if (newVisualization !== null) {
      onSelect(newVisualization);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <FilterToggleButtonGroup
        value={selectedVisualization}
        exclusive
        onChange={handleChange}
        orientation="horizontal"
        aria-label="Visualization selection"
      >
        {VISUALIZATION_OPTIONS.map(({ value, icon: Icon }) => (
          <FilterToggleButton key={value} value={value} aria-label={`${value} visualization`}>
            <Icon size={MENU_OPTION_ICON_SIZE} />
          </FilterToggleButton>
        ))}
      </FilterToggleButtonGroup>
      <Styled.LabelRow>
        {VISUALIZATION_OPTIONS.map(({ value, label }) => (
          <Styled.OptionLabel key={value} isSelected={selectedVisualization === value}>
            {label}
          </Styled.OptionLabel>
        ))}
      </Styled.LabelRow>
    </Box>
  );
};
