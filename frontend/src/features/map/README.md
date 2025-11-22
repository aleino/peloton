# Generic Map Utilities

This feature provides reusable utilities and hooks for working with Mapbox GL JS layers in React. All utilities are generic and work with ANY layer type.

## Hooks

### useLayerEvents

Attach event handlers to any Mapbox layer with automatic cleanup.

**Features:**

- Type-safe event handlers
- Automatic layer readiness handling
- Proper cleanup on unmount
- Conditional event attachment

**Usage:**

```typescript
import { useLayerEvents } from '@/features/map/hooks';

const MyLayerComponent = () => {
  useLayerEvents({
    layerId: 'my-layer',
    handlers: {
      onClick: (e) => {
        const feature = e.features?.[0];
        console.log('Clicked:', feature);
      },
      onMouseMove: (e) => {
        console.log('Hovering');
      },
    },
  });

  return <Layer id="my-layer" />;
};
```

### useMapFeatureState

Manage feature states for any layer with batched updates.

**Features:**

- Type-safe state objects
- Batched updates for performance
- Works with any layer/source
- Conditional updates

**Usage:**

```typescript
import { useMapFeatureState } from '@/features/map/hooks';

interface MyFeatureState {
  active: boolean;
  color: string;
}

const MyComponent = () => {
  const updates = [
    { featureId: 'feature-1', state: { active: true, color: '#ff0000' } },
    { featureId: 'feature-2', state: { active: false, color: '#0000ff' } },
  ];

  useMapFeatureState<MyFeatureState>({
    sourceId: 'my-source',
    layerId: 'my-layer',
    updates,
  });
};
```

### useMapSource

Access GeoJSON data from a map source.

**Usage:**

```typescript
import { useMapSource } from '@/features/map/hooks';

const MyComponent = () => {
  const data = useMapSource<GeoJSON.FeatureCollection>('my-source');

  if (!data) return null;

  return <div>Loaded {data.features.length} features</div>;
};
```

## Utilities

### Map Readiness

Wait for layers or sources to be ready before executing code.

**Functions:**

- `waitForLayer(map, layerId, callback)` - Execute when layer is ready
- `waitForSource(map, sourceId, callback)` - Execute when source is ready

**Usage:**

```typescript
import { waitForLayer } from '@/features/map/utils';

useEffect(() => {
  if (!map) return;

  return waitForLayer(map, 'my-layer', () => {
    console.log('Layer is ready!');
    return () => console.log('Cleanup');
  });
}, [map]);
```

### Feature State Management

Batch feature state operations for better performance.

**Functions:**

- `batchUpdateFeatureStates(map, sourceId, updates)` - Apply multiple states
- `clearFeatureStateProperties(map, sourceId, featureIds, properties)` - Clear specific properties
- `clearAllFeatureStates(map, sourceId)` - Clear all states for source

**Usage:**

```typescript
import { batchUpdateFeatureStates } from '@/features/map/utils';

batchUpdateFeatureStates(map, 'stations-source', [
  { featureId: 'station-1', state: { hover: true } },
  { featureId: 'station-2', state: { selected: true } },
]);
```

## Best Practices

1. **Use hooks for React components**: Prefer `useLayerEvents` and `useMapFeatureState` in components
2. **Use utilities for imperative code**: Use raw utilities in callbacks or non-React code
3. **Type your states**: Always provide type parameters for type-safe feature states
4. **Batch updates**: Use batch operations instead of individual feature state updates
5. **Conditional enabling**: Use `enabled` prop to conditionally attach events or apply states

## Examples

See station overlay implementation: `features/stations/overlay/`
