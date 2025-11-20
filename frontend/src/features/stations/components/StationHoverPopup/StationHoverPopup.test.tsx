import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { act } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { StationHoverPopup } from './StationHoverPopup';
import { stationsReducer } from '../../stations.store';
import type { StationMapEventData } from '../../types';
import type { StationsState } from '../../stations.store';

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
function createTestStore(hoveredStation: StationMapEventData | null = null) {
  return configureStore({
    reducer: {
      stations: stationsReducer,
    },
    preloadedState: {
      stations: {
        hoveredStation,
        selectedDepartureStationId: null,
        selectedReturnStationId: null,
      } as StationsState,
    },
  });
}

// Helper function to render with Redux Provider
function renderWithStore(hoveredStation: StationMapEventData | null = null) {
  const store = createTestStore(hoveredStation);
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
    },
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

    it('should remove old popup and create new one when hover data changes', async () => {
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
        expect(firstInstance.remove).toHaveBeenCalled();
      });

      // Should have created new popup
      expect(MockPopupConstructor.mock.calls.length).toBeGreaterThan(firstCallCount);
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

    it('should handle special characters in station name', () => {
      const specialNameData: StationMapEventData = {
        ...mockHoverData,
        properties: {
          stationId: '501',
          name: 'Käpylä / Kottby',
        },
      };

      renderWithStore(specialNameData);

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain('Käpylä / Kottby');
    });

    it('should handle very long station names', () => {
      const longNameData: StationMapEventData = {
        ...mockHoverData,
        properties: {
          stationId: '501',
          name: 'This Is A Very Long Station Name That Should Be Displayed Properly',
        },
      };

      renderWithStore(longNameData);

      const instance = MockPopupConstructor.mock.results[0]?.value;
      const htmlContent = instance.setHTML.mock.calls[0]?.[0] as string;
      expect(htmlContent).toContain(
        'This Is A Very Long Station Name That Should Be Displayed Properly'
      );
    });
  });

  describe('Component Rendering', () => {
    it('should not render any DOM elements', () => {
      const { container } = renderWithStore(mockHoverData);

      // Component manages popup imperatively, so container should be empty
      expect(container.firstChild).toBeNull();
    });
  });
});
