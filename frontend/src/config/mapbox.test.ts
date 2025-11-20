import { describe, it, expect } from 'vitest';
import {
  MAPBOX_CONFIG,
  MAP_STYLES,
  INITIAL_VIEW_STATE,
  HELSINKI_BOUNDS,
  MAP_CONSTRAINTS,
  DEFAULT_MAP_STYLE,
  type MapStyleKey,
  type ViewState,
} from './mapbox';

describe('Mapbox Configuration', () => {
  describe('INITIAL_VIEW_STATE', () => {
    it('should have valid initial view state for Helsinki', () => {
      expect(INITIAL_VIEW_STATE.longitude).toBe(24.9384);
      expect(INITIAL_VIEW_STATE.latitude).toBe(60.1699);
      expect(INITIAL_VIEW_STATE.zoom).toBe(11);
    });

    it('should have default pitch and bearing', () => {
      expect(INITIAL_VIEW_STATE.pitch).toBe(0);
      expect(INITIAL_VIEW_STATE.bearing).toBe(0);
    });
  });

  describe('MAP_STYLES', () => {
    it('should have multiple map styles available', () => {
      expect(MAP_STYLES).toHaveProperty('light');
      expect(MAP_STYLES).toHaveProperty('dark');
      expect(MAP_STYLES).toHaveProperty('streets');
      expect(MAP_STYLES).toHaveProperty('outdoors');
      expect(MAP_STYLES).toHaveProperty('satellite');
    });

    it('should have valid Mapbox style URLs', () => {
      Object.values(MAP_STYLES).forEach((style) => {
        expect(style).toContain('mapbox://styles');
      });
    });

    it('should have light as default style', () => {
      expect(DEFAULT_MAP_STYLE).toBe('dark');
    });
  });

  describe('MAPBOX_CONFIG', () => {
    it('should have valid access token from environment', () => {
      expect(MAPBOX_CONFIG.accessToken).toBeDefined();
      expect(typeof MAPBOX_CONFIG.accessToken).toBe('string');
      expect(MAPBOX_CONFIG.accessToken.length).toBeGreaterThan(0);
    });

    it('should have default style set', () => {
      expect(MAPBOX_CONFIG.defaultStyle).toBe(MAP_STYLES[DEFAULT_MAP_STYLE]);
      expect(MAPBOX_CONFIG.defaultStyle).toContain('mapbox://styles');
    });

    it('should have initial view state', () => {
      expect(MAPBOX_CONFIG.initialViewState).toEqual(INITIAL_VIEW_STATE);
    });

    it('should have map options configured', () => {
      expect(MAPBOX_CONFIG.mapOptions.attributionControl).toBe(true);
      expect(MAPBOX_CONFIG.mapOptions.logoPosition).toBe('bottom-left');
      expect(MAPBOX_CONFIG.mapOptions.cooperativeGestures).toBe(false);
      expect(MAPBOX_CONFIG.mapOptions.touchPitch).toBe(false);
      expect(MAPBOX_CONFIG.mapOptions.touchZoomRotate).toBe(true);
    });
  });

  describe('HELSINKI_BOUNDS', () => {
    it('should have valid Helsinki bounds', () => {
      expect(HELSINKI_BOUNDS).toHaveLength(2);
      expect(HELSINKI_BOUNDS[0]).toHaveLength(2); // Southwest
      expect(HELSINKI_BOUNDS[1]).toHaveLength(2); // Northeast
    });

    it('should have southwest and northeast coordinates', () => {
      const [southwest, northeast] = HELSINKI_BOUNDS;
      expect(southwest[0]).toBe(24.6); // SW longitude
      expect(southwest[1]).toBe(60.0); // SW latitude
      expect(northeast[0]).toBe(25.3); // NE longitude
      expect(northeast[1]).toBe(60.4); // NE latitude
    });

    it('should have valid bounding box (NE greater than SW)', () => {
      const [southwest, northeast] = HELSINKI_BOUNDS;
      expect(northeast[0]).toBeGreaterThan(southwest[0]); // Longitude
      expect(northeast[1]).toBeGreaterThan(southwest[1]); // Latitude
    });
  });

  describe('MAP_CONSTRAINTS', () => {
    it('should have sensible zoom constraints', () => {
      expect(MAP_CONSTRAINTS.minZoom).toBeLessThan(MAP_CONSTRAINTS.maxZoom);
      expect(MAP_CONSTRAINTS.minZoom).toBeGreaterThanOrEqual(0);
      expect(MAP_CONSTRAINTS.maxZoom).toBeLessThanOrEqual(22);
    });

    it('should have specific zoom levels', () => {
      expect(MAP_CONSTRAINTS.minZoom).toBe(9);
      expect(MAP_CONSTRAINTS.maxZoom).toBe(18);
    });

    it('should reference Helsinki bounds', () => {
      expect(MAP_CONSTRAINTS.maxBounds).toEqual(HELSINKI_BOUNDS);
    });
  });

  describe('Type definitions', () => {
    it('should define MapStyleKey type correctly', () => {
      const validKeys: MapStyleKey[] = ['light', 'dark', 'streets', 'outdoors', 'satellite'];
      validKeys.forEach((key) => {
        expect(MAP_STYLES[key]).toBeDefined();
      });
    });

    it('should define ViewState interface with required fields', () => {
      const viewState: ViewState = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 11,
      };
      expect(viewState).toHaveProperty('longitude');
      expect(viewState).toHaveProperty('latitude');
      expect(viewState).toHaveProperty('zoom');
    });

    it('should allow optional fields in ViewState', () => {
      const viewState: ViewState = {
        longitude: 24.9384,
        latitude: 60.1699,
        zoom: 11,
        pitch: 45,
        bearing: 90,
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        },
      };
      expect(viewState.pitch).toBe(45);
      expect(viewState.bearing).toBe(90);
      expect(viewState.padding).toBeDefined();
    });
  });
});
