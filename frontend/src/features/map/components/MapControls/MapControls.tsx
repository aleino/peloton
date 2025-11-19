import { NavigationControl } from 'react-map-gl/mapbox';
import { Styled } from './MapControls.styles';

interface MapControlsProps {
  showNavigation?: boolean;
  showGeolocate?: boolean;
}

export const MapControls = ({ showNavigation = true }: MapControlsProps) => {
  return (
    <Styled.Container data-testid="map-controls-container">
      {showNavigation && <NavigationControl visualizePitch showCompass position="right" />}
    </Styled.Container>
  );
};
