# Code Style

## General

## Doc strings

- **DO NOT** add docs string unless they create some significant additional value.

## React

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
