# Peloton Frontend

React 18 + TypeScript + Vite web application for visualizing HSL city bike trip data.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tool and dev server
- **Material-UI (MUI)** for UI components
- **React Router** for routing
- **Redux Toolkit** for state management
- **Mapbox GL JS** for map visualization
- **TanStack Query (React Query)** for API data fetching
- **Vitest** for testing

## 🚀 Quick Start

### Prerequisites

- Node.js v22 or higher
- npm or yarn
- Mapbox API token (for map visualization)
- Backend API running (see `backend/README.md`)

### Setup

1. **Install Dependencies**

```bash
npm install
```

2. **Configure Environment**

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Required environment variables:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_ENV=development
```

3. **Run Development Server**

```bash
npm run dev
```

Application will be available at `http://localhost:5173`

## Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

### Project Structure

```
frontend/
├── src/
│   ├── app/                  # App configuration (router, theme, providers)
│   │   ├── router.tsx
│   │   ├── theme.ts
│   │   └── ThemeProvider.tsx
│   ├── components/           # Reusable components
│   │   └── ui/               # UI components
│   ├── config/               # Configuration files
│   │   ├── env.ts
│   │   ├── layout.ts
│   │   └── mapbox.ts
│   ├── features/             # Feature-based modules
│   │   ├── stations/         # Station feature module
│   │   │   ├── api/          # Station API hooks
│   │   │   ├── components/   # Station-specific components
│   │   │   ├── config/       # Station configuration
│   │   │   ├── hooks/        # Station-specific hooks
│   │   │   └── overlays/     # Map overlays
│   │   ├── filters/          # Filter components and logic
│   │   ├── map/              # Map components and controls
│   │   └── settings/         # Settings components
│   ├── layouts/              # Layout components
│   │   ├── AppLayout/
│   │   ├── ContentOverlay/
│   │   ├── FloatingHeader/
│   │   ├── FloatingPanel/
│   │   └── MapBackground/
│   ├── pages/                # Page components
│   │   ├── MapPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/             # API client and query configuration
│   ├── store/                # Redux store configuration
│   ├── types/                # TypeScript types
│   ├── utils/                # Utility functions
│   ├── test/                 # Test utilities
│   ├── App.tsx               # Main App component
│   ├── main.tsx              # Entry point
│   └── assets/               # Static assets
├── public/                   # Public static assets
├── CODE_STYLE.md             # Frontend code style guide
└── README.md
```

## Component Styling

- **MUI styled()** utility for component styling
- **Style files**: Named `<ComponentName>.styles.tsx`
- **Export pattern**: Export all styled components in a single `Styled` object

See `CODE_STYLE.md` for detailed styling guidelines.

## Testing

### Run All Tests

```bash
npm test
```

### Run with Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

**Target Coverage**: >80%

## Building for Production

```bash
npm run build
```

Build output will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Configuration

### Environment Variables

| Variable            | Description             | Default                        |
| ------------------- | ----------------------- | ------------------------------ |
| `VITE_API_BASE_URL` | Backend API base URL    | `http://localhost:3000/api/v1` |
| `VITE_MAPBOX_TOKEN` | Mapbox API access token | **required**                   |
| `VITE_ENV`          | Environment (dev/prod)  | `development`                  |

## Troubleshooting

### Backend Connection Failed

1. Ensure backend is running: `cd ../backend && npm run dev`
2. Verify `VITE_API_BASE_URL` in `.env`
3. Check CORS configuration in backend

### Map Not Loading

1. Verify `VITE_MAPBOX_TOKEN` is set in `.env`
2. Check token validity at [Mapbox Account](https://account.mapbox.com/)

### Port Already in Use

Change port in `vite.config.ts` or kill existing process:

```bash
lsof -ti:5173 | xargs kill -9
```
