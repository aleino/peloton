import { Box } from '@mui/material';
import { FilterToggleButtonGroup, FilterToggleButton } from './OptionToggleButton';
import { Styled } from './MapControls.styles';
import { METRIC_OPTIONS, MENU_OPTION_ICON_SIZE, type Metric } from './config';

interface MetricMenuProps {
  selectedMetric: Metric;
  onSelect: (metric: Metric) => void;
}

export const MetricMenu = ({ selectedMetric, onSelect }: MetricMenuProps) => {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newMetric: Metric | null) => {
    if (newMetric !== null) {
      onSelect(newMetric);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <FilterToggleButtonGroup
        value={selectedMetric}
        exclusive
        onChange={handleChange}
        orientation="horizontal"
        aria-label="Metric selection"
      >
        {METRIC_OPTIONS.map(({ value, icon: Icon }) => (
          <FilterToggleButton key={value} value={value} aria-label={value}>
            <Icon size={MENU_OPTION_ICON_SIZE} />
          </FilterToggleButton>
        ))}
      </FilterToggleButtonGroup>
      <Styled.LabelRow>
        {METRIC_OPTIONS.map(({ value, label }) => (
          <Styled.OptionLabel key={value} isSelected={selectedMetric === value}>
            {label}
          </Styled.OptionLabel>
        ))}
      </Styled.LabelRow>
    </Box>
  );
};
