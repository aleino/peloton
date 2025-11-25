import { Box } from '@mui/material';
import { FilterToggleButtonGroup, FilterToggleButton } from './OptionToggleButton';
import { Styled } from './MapControls.styles';
import { STYLE_OPTIONS, MENU_OPTION_ICON_SIZE, type MapStyle } from './config';

interface StyleMenuProps {
  selectedStyle: MapStyle;
  onSelect: (style: MapStyle) => void;
}

export const StyleMenu = ({ selectedStyle, onSelect }: StyleMenuProps) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newStyle: MapStyle | null) => {
    if (newStyle !== null) {
      onSelect(newStyle);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <FilterToggleButtonGroup
        value={selectedStyle}
        exclusive
        onChange={handleChange}
        orientation="horizontal"
        aria-label="Map style selection"
      >
        {STYLE_OPTIONS.map(({ value, icon: Icon }) => (
          <FilterToggleButton key={value} value={value} aria-label={`${value} map style`}>
            <Icon size={MENU_OPTION_ICON_SIZE} />
          </FilterToggleButton>
        ))}
      </FilterToggleButtonGroup>
      <Styled.LabelRow>
        {STYLE_OPTIONS.map(({ value, label }) => (
          <Styled.OptionLabel key={value} isSelected={selectedStyle === value}>
            {label}
          </Styled.OptionLabel>
        ))}
      </Styled.LabelRow>
    </Box>
  );
};
