# Code Style

## General

### Early return on their own line

- Use early return statements on their own line for better readability. Example:

```tsx
// ❌ NOT allowed
if (!data) return null;
// ✅ Allowed
if (!data) {
  return null;
}
```

## React

### Component directory structure

- Each component should have its own directory.
- Component directory can contain:
  - `<COMPONENT_NAME>.tsx` - main component file
  - `<COMPONENT_NAME>.styles.tsx` - styled components
  - `<COMPONENT_NAME>.test.tsx` - unit tests

### Component styles

- Use can use `sx` syntax for short inline styles.
- Use MUI `styled()` utility for styling.
- Name style files as `<COMPONENT_NAME>.styles.tsx`.
- Export all styled components in a single `Shared` object. E.g:

```tsx
// Calendar.styles.tsx
const Calendar = styled()...

export const Styled = {
  Calendar
}

// Calendar.tsx
import * as Styled from ./Calendar.styles.tsx

<Styled.Calendar />
```

### React static components

- Do not define return type for React static components. Example:

````tsx
```tsx
// ❌ NOT allowed
import type { FC } from 'react';

export const MapPage: FC = () => {
  return <LoadingSpinner message="Peloton" />;
};

// ✅ Allowed
export const MapPage = () => {
  return <LoadingSpinner message="Peloton" />;
};
````

## Maps

- Use `react-map-gl` for Mapbox integration. Most map components can be imported from `react-map-gl/mapbox-gl`.
- Use `Source` and `Layer` components from `react-map-gl` to add data
