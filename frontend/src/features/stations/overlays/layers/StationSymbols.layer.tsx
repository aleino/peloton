import { Layer } from 'react-map-gl/mapbox';
import { useStations } from '@/features/stations';
import { useStationIcons, useIconExpression } from '../hooks';
import { createSymbolLayerStyle } from '../utils';
import type { ExpressionSpecification } from 'mapbox-gl';
import { STATIONS_SYMBOLS_LAYER_ID } from '@/features/stations/config/layers';

/**
 * Symbol layer component for station icons
 * Displays icon overlays on top of circle markers
 *
 * Responsibilities:
 * - Load station icon images into map
 * - Update icon expression based on hover/selection
 * - Define symbol layer paint/layout properties
 */
export const StationSymbolsLayer = () => {
  const { selectedDepartureStationId, hoveredStation } = useStations();
  const hoveredStationId = hoveredStation?.stationId ?? null;

  // Load icon images
  useStationIcons();

  // Update icon expression based on state
  useIconExpression({
    layerId: STATIONS_SYMBOLS_LAYER_ID,
    selectedStationId: selectedDepartureStationId,
    hoveredStationId,
  });

  // Get layer configuration from pure function (filter out clusters)
  const layerStyle = createSymbolLayerStyle([
    '!',
    ['has', 'point_count'],
  ] as ExpressionSpecification);

  return <Layer {...layerStyle} />;
};
