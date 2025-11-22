import type { ExpressionSpecification } from 'mapbox-gl';

/**
 * Generate Mapbox expression for station icon based on state
 * Pure function - easily testable
 *
 * @param selectedId - ID of selected station (or null)
 * @param hoveredId - ID of hovered station (or null)
 * @returns Icon image expression or static string
 */
export const createIconExpression = (
  selectedId: string | null,
  hoveredId: string | null
): string | ExpressionSpecification => {
  if (!selectedId && !hoveredId) {
    return 'station-icon-default';
  }

  const conditions: unknown[] = ['case'];

  if (selectedId) {
    conditions.push(['==', ['get', 'stationId'], selectedId], 'station-icon-active');
  }
  if (hoveredId) {
    conditions.push(['==', ['get', 'stationId'], hoveredId], 'station-icon-hover');
  }

  conditions.push('station-icon-default');
  return conditions as ExpressionSpecification;
};
