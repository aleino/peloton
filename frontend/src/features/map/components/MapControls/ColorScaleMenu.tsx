import { Box } from '@mui/material';
import { FilterToggleButtonGroup, FilterToggleButton } from './OptionToggleButton';
import { Styled } from './MapControls.styles';
import { COLOR_SCALE_OPTIONS, MENU_OPTION_ICON_SIZE, type ColorScale } from './config';

interface ColorScaleMenuProps {
  selectedColorScale: ColorScale;
  onSelect: (colorScale: ColorScale) => void;
}

/**
 * Color scale selection menu
 *
 * Displays options for different color mapping functions:
 * - Linear: Even distribution across value range
 * - Sqrt: Moderate compression of high values (good for count data)
 * - Log: Strong compression for highly skewed data
 * - Quantile: Equal-sized buckets (deciles)
 *
 * Used in MapControls to let users choose how metric values
 * are mapped to colors in station visualizations.
 */
export const ColorScaleMenu = ({ selectedColorScale, onSelect }: ColorScaleMenuProps) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newScale: ColorScale | null) => {
    if (newScale !== null) {
      onSelect(newScale);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <FilterToggleButtonGroup
        value={selectedColorScale}
        exclusive
        onChange={handleChange}
        orientation="horizontal"
        aria-label="Color scale selection"
      >
        {COLOR_SCALE_OPTIONS.map(({ value, icon: Icon, label, description }) => (
          <FilterToggleButton
            key={value}
            value={value}
            aria-label={label}
            title={`${label}: ${description}`}
          >
            <Icon size={MENU_OPTION_ICON_SIZE} />
          </FilterToggleButton>
        ))}
      </FilterToggleButtonGroup>
      <Styled.LabelRow>
        {COLOR_SCALE_OPTIONS.map(({ value, label }) => (
          <Styled.OptionLabel key={value} isSelected={selectedColorScale === value}>
            {label}
          </Styled.OptionLabel>
        ))}
      </Styled.LabelRow>
    </Box>
  );
};
