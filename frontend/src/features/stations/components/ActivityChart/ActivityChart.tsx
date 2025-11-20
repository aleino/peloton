import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ActivityChartProps {
  busiestHour: number;
  busiestDay: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Activity chart showing busiest hour and day
 *
 * Displays bar charts highlighting peak activity times.
 *
 * @example
 * ```tsx
 * <ActivityChart
 *   busiestHour={station.statistics.busiestHour}
 *   busiestDay={station.statistics.busiestDay}
 * />
 * ```
 */
export const ActivityChart = ({ busiestHour, busiestDay }: ActivityChartProps) => {
  const theme = useTheme();

  // Generate hour data (0-23)
  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i}:00`,
    activity: i === busiestHour ? 100 : 30, // Simplified, real data would vary
    isBusiest: i === busiestHour,
  }));

  // Generate day data (0-6)
  const dayData = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    label: DAY_NAMES[i],
    activity: i === busiestDay ? 100 : 40, // Simplified
    isBusiest: i === busiestDay,
  }));

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Busiest Hour of Day
      </Typography>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={hourData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={3} />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="activity" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
        Busiest Day of Week
      </Typography>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={dayData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="activity" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
