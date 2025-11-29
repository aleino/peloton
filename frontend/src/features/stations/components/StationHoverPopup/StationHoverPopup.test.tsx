import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { act } from 'react';
import { Provider } from 'react-redux';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { StationHoverPopup } from './StationHoverPopup';
import { stationsReducer } from '../../stations.store';
import {
  mapControlsReducer,
  setMetric,
  setDirection,
  setVisualization,
} from '@/features/map/mapControls.store';
import type { StationMapEventData } from '../../types';
import type { StationsState } from '../../stations.store';
import type { MapControlsState } from '@/features/map/mapControls.store';

// Mock Mapbox GL JS Popup
vi.mock('mapbox-gl', () => {
  return {
    Popup: vi.fn(function MockPopup() {
      return {
        remove: vi.fn().mockReturnThis(),
        setLngLat: vi.fn().mockReturnThis(),
        setHTML: vi.fn().mockReturnThis(),
        addTo: vi.fn().mockReturnThis(),
      };
    }),
  };
});

// Mock react-map-gl useMap hook
vi.mock('react-map-gl/mapbox', () => ({
  useMap: vi.fn(() => ({
    main: {
      getMap: vi.fn(() => ({})),
    },
  })),
}));

// Get reference to mocked Popup after import
const mapboxGl = await import('mapbox-gl');
const MockPopupConstructor = vi.mocked(mapboxGl.Popup);

// Helper function to create a test store with initial state
function createTestStore(
  hoveredStation: StationMapEventData | null = null,
  mapControls: Partial<MapControlsState> = {}
) {
  const initialMapControlsState = {
    style: 'dark' as const,
    visualization: 'points' as const,
    direction: 'departures' as const,
    metric: 'tripCount' as const,
    openMenu: null,
    ...mapControls,
  };

  return configureStore({
    reducer: {
      stations: stationsReducer,
      map: combineReducers({
        controls: mapControlsReducer,
      }),
    },
    preloadedState: {
      stations: {
        hoveredStation,
        selectedDepartureStationId: null,
        selectedReturnStationId: null,
      } as StationsState,
      map: {
        controls: initialMapControlsState,
      },
    },
  });
}

// Helper function to render with Redux Provider
function renderWithStore(
  hoveredStation: StationMapEventData | null = null,
  mapControls: Partial<MapControlsState> = {}
) {
  const store = createTestStore(hoveredStation, mapControls);
  return {
    ...render(
      <Provider store={store}>
        <StationHoverPopup />
      </Provider>
    ),
    store,
  };
}

describe('StationHoverPopup', () => {
  const mockHoverData: StationMapEventData = {
    stationId: '501',
    coordinates: [24.9384, 60.1699],
    properties: {
      stationId: '501',
      name: 'Hanasaari',
      tripStatistics: {
        departures: {
          tripsCount: 1250,
          durationSecondsAvg: 900, // 15 minutes in seconds
          distanceMetersAvg: 2500, // 2.5 km in meters
        },
        returns: {
          tripsCount: 980,
          durationSecondsAvg: 720, // 12 minutes in seconds
          distanceMetersAvg: 1800, // 1.8 km in meters
        },
      },
      // Flattened properties for Mapbox expressions
      departuresCount: 1250,
      departuresDurationAvg: 900,
      departuresDistanceAvg: 2500,
      returnsCount: 980,
      returnsDurationAvg: 720,
      returnsDistanceAvg: 1800,
      diffCount: 0.12162162162162163, // (1250 - 980) / (1250 + 980) ≈ 0.1216
      diffDurationAvg: 0.111111111111111, // (900 - 720) / (900 + 720) ≈ 0.1111
      diffDistanceAvg: 0.1627906976744186, // (2500 - 1800) / (2500 + 1800) ≈ 0.1628
    } as unknown as StationMapEventData['properties'], // Include both nested and flattened for testing
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Popup Creation', () => {
    it('should create popup with correct configuration when hover data is provided', () => {
      renderWithStore(mockHoverData);

      expect(MockPopupConstructor).toHaveBeenCalledWith({
        closeButton: false,
        closeOnClick: false,
        anchor: 'bottom',
        offset: 20,
        maxWidth: '300px',
        className: 'station-hover-popup-container',
      });
    });

    it('should not create popup when hover data is null', () => {
      renderWithStore(null);

      expect(MockPopupConstructor).not.toHaveBeenCalled();
    });

    it('should set correct coordinates', () => {
      renderWithStore(mockHoverData);

      const instance = MockPopupConstructor.mock.results[0]?.value;
      expect(instance.setLngLat).toHaveBeenCalledWith([24.9384, 60.1699]);
    });

    it('should set HTML content with station name and ID', () => {
      renderWithStore(mockHoverData);

      const instance = MockPopupConstructor.mock.results[0]?.value;
      expect(instance.setHTML).toHaveBeenCalledWith(expect.stringContaining('Hanasaari'));
      expect(instance.setHTML).toHaveBeenCalledWith(expect.stringContaining('ID: 501'));
    });

    it('should add popup to map', () => {
      renderWithStore(mockHoverData);

      const instance = MockPopupConstructor.mock.results[0]?.value;
      expect(instance.addTo).toHaveBeenCalledWith({});
    });
  });

  describe('Popup Lifecycle', () => {
    it('should remove popup when component unmounts', () => {
      const { unmount } = renderWithStore(mockHoverData);

      const instance = MockPopupConstructor.mock.results[0]?.value;
      unmount();

      expect(instance.remove).toHaveBeenCalled();
    });

    it('should REUSE existing popup when hover data changes', async () => {
      const { store } = renderWithStore(mockHoverData);

      const firstCallCount = MockPopupConstructor.mock.calls.length;
      const firstInstance = MockPopupConstructor.mock.results[0]?.value;

      const newHoverData: StationMapEventData = {
        stationId: '502',
        coordinates: [25.0, 60.2],
        properties: {
          stationId: '502',
          name: 'Another Station',
        },
      };

      // Update the store state
      await act(async () => {
        store.dispatch({ type: 'stations/setHoveredStation', payload: newHoverData });
      });

      // Wait for effects to run
      await waitFor(() => {
        // Should NOT have removed the popup
        expect(firstInstance.remove).not.toHaveBeenCalled();
        // Should have updated coordinates and HTML
        expect(firstInstance.setLngLat).toHaveBeenCalledWith([25.0, 60.2]);
        expect(firstInstance.setHTML).toHaveBeenCalledWith(
          expect.stringContaining('Another Station')
        );
      });

      // Should NOT have created a new popup
      expect(MockPopupConstructor.mock.calls.length).toBe(firstCallCount);
    });

    it('should remove popup when hover data changes to null', async () => {
      const { store } = renderWithStore(mockHoverData);

      const instance = MockPopupConstructor.mock.results[0]?.value;

      // Update the store state to null
      await act(async () => {
        store.dispatch({ type: 'stations/setHoveredStation', payload: null });
      });

      // Wait for effects to run
      await waitFor(() => {
        expect(instance.remove).toHaveBeenCalled();
      });
    });
  });

  describe('HTML Content Generation', () => {
    it('should include station-hover-popup class in HTML', () => {
      renderWithStore(mockHoverData);

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('station-hover-popup');
    });

    it('should include station name with correct class', () => {
      renderWithStore(mockHoverData);

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('station-hover-popup__name');
      expect(htmlContent).toContain('Hanasaari');
    });

    it('should include station ID with correct class', () => {
      renderWithStore(mockHoverData);

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('station-hover-popup__id');
      expect(htmlContent).toContain('ID: 501');
    });
  });

  describe('Voronoi Mode - Context-Aware Content', () => {
    it('should show context text in Voronoi mode', () => {
      renderWithStore(mockHoverData, { visualization: 'voronoi' });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('station-hover-popup--voronoi');
      expect(htmlContent).toContain('Closest station in this area');
    });

    it('should show trip count metric in Voronoi mode', () => {
      renderWithStore(mockHoverData, {
        visualization: 'voronoi',
        metric: 'tripCount',
        direction: 'departures',
      });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('1,250 trips');
      expect(htmlContent).toContain('departures');
    });

    it('should show "Popular Station" story for high trip count', () => {
      const highTrafficData = {
        ...mockHoverData,
        properties: {
          ...mockHoverData.properties,
          departuresCount: 2500,
        } as unknown as StationMapEventData['properties'],
      };

      renderWithStore(highTrafficData, {
        visualization: 'voronoi',
        metric: 'tripCount',
        direction: 'departures',
      });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('Popular Station');
    });

    it('should show "Major Hub" story for very high trip count', () => {
      const majorHubData = {
        ...mockHoverData,
        properties: {
          ...mockHoverData.properties,
          departuresCount: 6000,
        } as unknown as StationMapEventData['properties'],
      };

      renderWithStore(majorHubData, {
        visualization: 'voronoi',
        metric: 'tripCount',
        direction: 'departures',
      });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('Major Hub');
    });

    it('should show duration metric in Voronoi mode with minutes conversion', () => {
      renderWithStore(mockHoverData, {
        visualization: 'voronoi',
        metric: 'durationAvg',
        direction: 'departures',
      });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('15 min avg');
      expect(htmlContent).toContain('departures');
    });

    it('should show distance metric in Voronoi mode with km conversion', () => {
      renderWithStore(mockHoverData, {
        visualization: 'voronoi',
        metric: 'distanceAvg',
        direction: 'departures',
      });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('2.5 km avg');
      expect(htmlContent).toContain('departures');
    });

    it('should show diff direction as "net flow" with percentage', () => {
      renderWithStore(mockHoverData, {
        visualization: 'voronoi',
        metric: 'tripCount',
        direction: 'diff',
      });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('+12.2%');
      expect(htmlContent).toContain('net flow');
    });

    it('should show "Balanced flow" story for small diff', () => {
      const balancedData = {
        ...mockHoverData,
        properties: {
          ...mockHoverData.properties,
          diffCount: 0.02,
        } as unknown as StationMapEventData['properties'],
      };

      renderWithStore(balancedData, {
        visualization: 'voronoi',
        metric: 'tripCount',
        direction: 'diff',
      });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('Balanced flow');
    });

    it('should update popup content when metric changes', async () => {
      const { store } = renderWithStore(mockHoverData, {
        visualization: 'voronoi',
        metric: 'tripCount',
        direction: 'departures',
      });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const firstHtml = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(firstHtml).toContain('1,250 trips');

      // Change metric
      await act(async () => {
        store.dispatch(setMetric('durationAvg'));
      });

      await waitFor(() => {
        // Should reuse instance
        const lastHtml = instance.setHTML.mock.calls[
          instance.setHTML.mock.calls.length - 1
        ]?.[0] as string;
        expect(lastHtml).toContain('15 min avg');
      });
    });

    it('should update popup content when direction changes', async () => {
      const { store } = renderWithStore(mockHoverData, {
        visualization: 'voronoi',
        metric: 'tripCount',
        direction: 'departures',
      });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const firstHtml = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(firstHtml).toContain('1,250 trips');
      expect(firstHtml).toContain('departures');

      // Change direction
      await act(async () => {
        store.dispatch(setDirection('arrivals'));
      });

      await waitFor(() => {
        const instances = MockPopupConstructor.mock.results;
        const lastInstance = instances[instances.length - 1]?.value;
        const lastHtml = lastInstance.setHTML.mock.calls[0]?.[0] as string;
        expect(lastHtml).toContain('980 trips');
        expect(lastHtml).toContain('arrivals');
      });
    });

    it('should switch content format when visualization mode changes', async () => {
      const { store } = renderWithStore(mockHoverData, { visualization: 'points' });

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const firstHtml = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(firstHtml).toContain('ID: 501');
      expect(firstHtml).not.toContain('Closest station in this area');

      // Change to Voronoi mode
      await act(async () => {
        store.dispatch(setVisualization('voronoi'));
      });

      await waitFor(() => {
        const lastHtml = instance.setHTML.mock.calls[
          instance.setHTML.mock.calls.length - 1
        ]?.[0] as string;
        expect(lastHtml).toContain('Closest station in this area');
        expect(lastHtml).not.toContain('ID: 501');
      });
    });
  });
});
