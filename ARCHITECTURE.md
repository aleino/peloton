# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       User Browser                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         React Frontend (Vite + Mapbox GL)             │ │
│  │  - Interactive map with station markers               │ │
│  │  - Station list sidebar with search/filter            │ │
│  │  - Real-time statistics dashboard                     │ │
│  │  - Auto-refresh every 30 seconds                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           │ HTTP/REST API                   │
│                           ▼                                 │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           │        Backend Server            │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │         Express.js API Server (Node.js)              │ │
│  │                                                       │ │
│  │  Routes:                                              │ │
│  │  - GET /api/stations      (all stations)             │ │
│  │  - GET /api/stations/:id  (single station)           │ │
│  │  - GET /api/stats         (system statistics)        │ │
│  │  - GET /api/health        (health check)             │ │
│  │                                                       │ │
│  │  Middleware:                                          │ │
│  │  - CORS (Cross-Origin Resource Sharing)              │ │
│  │  - JSON body parser                                  │ │
│  │  - Error handling                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           │ SQL Queries                     │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         PostgreSQL Connection Pool (pg)              │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ TCP/IP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                       │
│                                                             │
│  Tables:                                                    │
│  ┌────────────────────┐    ┌──────────────────────────┐   │
│  │    stations        │    │        trips             │   │
│  ├────────────────────┤    ├──────────────────────────┤   │
│  │ - id (PK)          │    │ - id (PK)                │   │
│  │ - station_id       │◄───┤ - departure_station_id   │   │
│  │ - name             │    │ - return_station_id      │   │
│  │ - address          │    │ - departure_time         │   │
│  │ - latitude         │    │ - return_time            │   │
│  │ - longitude        │    │ - distance_meters        │   │
│  │ - capacity         │    │ - duration_seconds       │   │
│  │ - available_bikes  │    └──────────────────────────┘   │
│  │ - available_docks  │                                    │
│  │ - last_updated     │                                    │
│  └────────────────────┘                                    │
│                                                             │
│  Indexes:                                                   │
│  - stations: location (lat/lng), station_id                │
│  - trips: departure_time, return_time, station references  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Layer
- **Vite**: Build tool and dev server
  - Fast HMR (Hot Module Replacement)
  - Optimized production builds
  - ES modules support
  
- **React 19**: UI library
  - Component-based architecture
  - Hooks for state management
  - Virtual DOM for performance
  
- **Mapbox GL JS**: Interactive maps
  - Vector tiles for smooth rendering
  - Custom markers and popups
  - Fly-to animations
  - Navigation controls

- **CSS3**: Styling
  - Responsive design
  - Flexbox layouts
  - Custom color themes

### Backend Layer
- **Node.js 18+**: Runtime environment
  - Non-blocking I/O
  - Event-driven architecture
  
- **Express 5**: Web framework
  - RESTful routing
  - Middleware support
  - Error handling

- **pg**: PostgreSQL client
  - Connection pooling
  - Prepared statements
  - Transaction support

- **CORS**: Cross-Origin Resource Sharing
  - Allow frontend to access API
  
- **dotenv**: Environment configuration
  - Secure credential management

### Database Layer
- **PostgreSQL 15**: Relational database
  - ACID compliance
  - Spatial data support (lat/lng)
  - Efficient indexing
  - Triggers and functions

## Data Flow

### Station List Request

```
1. User opens application
2. React useEffect hook triggers on mount
3. Fetch request to /api/stations
4. Vite dev server proxies to backend:3001
5. Express route handler receives request
6. pg pool executes SELECT query
7. PostgreSQL returns station rows
8. Express sends JSON response
9. React updates state with data
10. Map component renders markers
11. Sidebar component renders list
```

### Station Selection

```
1. User clicks station marker/card
2. React updates selectedStation state
3. Map component receives new props
4. Map.flyTo() animates to location
5. Marker popup opens
6. Sidebar highlights selected station
```

### Auto-refresh Cycle

```
Every 30 seconds:
1. setInterval triggers
2. Fetch /api/stations
3. Fetch /api/stats
4. Update React state
5. Re-render components
6. Map markers update colors
7. Statistics bar updates values
```

## Deployment Options

### Development
- Frontend: Vite dev server (port 3000)
- Backend: Node.js (port 3001)
- Database: Local PostgreSQL

### Docker Compose
- All services containerized
- Automatic service discovery
- Volume persistence for database
- Network isolation

### Production
- Frontend: Static build served by Nginx
- Backend: PM2 or similar process manager
- Database: Managed PostgreSQL service
- Reverse proxy: Nginx/Apache

## Security Considerations

1. **Environment Variables**
   - Database credentials in .env
   - API tokens not committed
   - Different configs for dev/prod

2. **Database**
   - Connection pooling
   - Prepared statements (SQL injection prevention)
   - Limited user permissions

3. **API**
   - CORS configuration
   - Input validation
   - Error message sanitization

4. **Frontend**
   - No sensitive data in client code
   - HTTPS in production
   - Content Security Policy

## Performance Optimizations

1. **Database**
   - Indexes on frequently queried columns
   - Connection pooling
   - Efficient query design

2. **Backend**
   - Caching headers
   - Compression middleware
   - Async/await patterns

3. **Frontend**
   - Code splitting
   - Lazy loading
   - Optimized map rendering
   - Debounced search

## Scalability

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Read replicas for database
- CDN for frontend assets

### Vertical Scaling
- Increase database resources
- Optimize queries
- Add caching layer (Redis)

### Monitoring
- Backend logs
- Database query performance
- Frontend error tracking
- API response times
