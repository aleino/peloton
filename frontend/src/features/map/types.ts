/**
 * View state for map positioning and camera
 *
 * Note: This type is kept for reference but react-map-gl's built-in
 * ViewState type should be preferred for new code.
 */
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}
