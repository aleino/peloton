import { describe, it, expect } from 'vitest';
import { getStationPropertyName, getClusterPropertyName } from '../metricProperties';
import type { Metric, Direction } from '@/features/map/types';

describe('metricProperties', () => {
  describe('getStationPropertyName', () => {
    it('should return correct property for tripCount + departures', () => {
      expect(getStationPropertyName('tripCount', 'departures')).toBe('departuresCount');
    });

    it('should return correct property for tripCount + arrivals', () => {
      expect(getStationPropertyName('tripCount', 'arrivals')).toBe('returnsCount');
    });

    it('should return correct property for durationAvg + departures', () => {
      expect(getStationPropertyName('durationAvg', 'departures')).toBe('departuresDurationAvg');
    });

    it('should return correct property for durationAvg + arrivals', () => {
      expect(getStationPropertyName('durationAvg', 'arrivals')).toBe('returnsDurationAvg');
    });

    it('should return correct property for distanceAvg + departures', () => {
      expect(getStationPropertyName('distanceAvg', 'departures')).toBe('departuresDistanceAvg');
    });

    it('should return correct property for distanceAvg + arrivals', () => {
      expect(getStationPropertyName('distanceAvg', 'arrivals')).toBe('returnsDistanceAvg');
    });

    describe('difference direction', () => {
      it('should return diffCount for tripCount + diff', () => {
        expect(getStationPropertyName('tripCount', 'diff')).toBe('diffCount');
      });

      it('should return diffDurationAvg for durationAvg + diff', () => {
        expect(getStationPropertyName('durationAvg', 'diff')).toBe('diffDurationAvg');
      });

      it('should return diffDistanceAvg for distanceAvg + diff', () => {
        expect(getStationPropertyName('distanceAvg', 'diff')).toBe('diffDistanceAvg');
      });
    });

    it('should handle all metric/direction combinations', () => {
      const metrics: Metric[] = ['tripCount', 'durationAvg', 'distanceAvg'];
      const directions: Direction[] = ['departures', 'arrivals', 'diff'];

      // Verify all combinations return a non-empty string
      metrics.forEach((metric) => {
        directions.forEach((direction) => {
          const result = getStationPropertyName(metric, direction);
          expect(result).toBeTruthy();
          expect(typeof result).toBe('string');
        });
      });
    });
  });

  describe('getClusterPropertyName', () => {
    it('should return correct property for tripCount + departures', () => {
      expect(getClusterPropertyName('tripCount', 'departures')).toBe('sumDeparturesCount');
    });

    it('should return correct property for tripCount + arrivals', () => {
      expect(getClusterPropertyName('tripCount', 'arrivals')).toBe('sumReturnsCount');
    });

    it('should return correct property for durationAvg + departures', () => {
      expect(getClusterPropertyName('durationAvg', 'departures')).toBe('sumDeparturesDuration');
    });

    it('should return correct property for durationAvg + arrivals', () => {
      expect(getClusterPropertyName('durationAvg', 'arrivals')).toBe('sumReturnsDuration');
    });

    it('should return correct property for distanceAvg + departures', () => {
      expect(getClusterPropertyName('distanceAvg', 'departures')).toBe('sumDeparturesDistance');
    });

    it('should return correct property for distanceAvg + arrivals', () => {
      expect(getClusterPropertyName('distanceAvg', 'arrivals')).toBe('sumReturnsDistance');
    });

    describe('difference direction', () => {
      it('should return avgDiffCount for tripCount + diff', () => {
        expect(getClusterPropertyName('tripCount', 'diff')).toBe('avgDiffCount');
      });

      it('should return avgDiffDurationAvg for durationAvg + diff', () => {
        expect(getClusterPropertyName('durationAvg', 'diff')).toBe('avgDiffDurationAvg');
      });

      it('should return avgDiffDistanceAvg for distanceAvg + diff', () => {
        expect(getClusterPropertyName('distanceAvg', 'diff')).toBe('avgDiffDistanceAvg');
      });
    });

    it('should handle all metric/direction combinations including diff', () => {
      const metrics: Metric[] = ['tripCount', 'durationAvg', 'distanceAvg'];
      const directions: Direction[] = ['departures', 'arrivals', 'diff'];

      metrics.forEach((metric) => {
        directions.forEach((direction) => {
          const result = getClusterPropertyName(metric, direction);
          expect(result).toBeTruthy();
          expect(typeof result).toBe('string');

          // Verify naming pattern
          if (direction === 'diff') {
            expect(result).toMatch(/^avg/);
          } else {
            expect(result).toMatch(/^sum/);
          }
        });
      });
    });

    it('should return different properties than getStationPropertyName', () => {
      // Cluster properties have 'sum' prefix
      expect(getClusterPropertyName('tripCount', 'departures')).toContain('sum');
      expect(getStationPropertyName('tripCount', 'departures')).not.toContain('sum');
    });
  });

  describe('property name consistency', () => {
    it('should use consistent naming patterns', () => {
      // Station properties: {direction}{Metric}
      expect(getStationPropertyName('tripCount', 'departures')).toMatch(/^departures/);
      expect(getStationPropertyName('tripCount', 'arrivals')).toMatch(/^returns/);

      // Cluster properties: sum{Direction}{Metric}
      expect(getClusterPropertyName('tripCount', 'departures')).toMatch(/^sumDepartures/);
      expect(getClusterPropertyName('tripCount', 'arrivals')).toMatch(/^sumReturns/);
    });

    it('should handle metric names correctly', () => {
      // Trip count uses "Count" suffix
      expect(getStationPropertyName('tripCount', 'departures')).toContain('Count');

      // Duration uses "DurationAvg" suffix
      expect(getStationPropertyName('durationAvg', 'departures')).toContain('DurationAvg');

      // Distance uses "DistanceAvg" suffix
      expect(getStationPropertyName('distanceAvg', 'departures')).toContain('DistanceAvg');
    });
  });
});
