# HSL Citybike Dashboard

A real-time dashboard for monitoring HSL (Helsinki Region Transport) citybike stations, built with Vite, React, Mapbox GL, Node.js, Express, and PostgreSQL.

## Features

- 🗺️ Interactive map showing all citybike stations
- 📊 Real-time availability data for bikes and docks
- 🔍 Search and filter stations
- 📱 Responsive design for mobile and desktop
- 🔄 Auto-refresh every 30 seconds
- 🎨 Color-coded availability indicators

## Tech Stack

### Frontend
- **Vite** - Fast build tool and dev server
- **React** - UI framework
- **Mapbox GL JS** - Interactive maps
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Database
- **pg** - PostgreSQL client for Node.js

## Project Structure

```
peloton/
├── frontend/          # Vite + React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.jsx       # Mapbox map component
│   │   │   ├── Map.css
│   │   │   ├── Sidebar.jsx   # Station list sidebar
│   │   │   └── Sidebar.css
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/           # Node.js + Express API
│   ├── server.js      # Express server
│   ├── schema.sql     # Database schema
│   ├── package.json
│   └── .env.example
├── data/              # Data files and documentation
│   └── README.md
└── README.md
```

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Mapbox account and access token (free tier available)

## Setup Instructions

### 1. Database Setup

Install and start PostgreSQL, then create the database:

```bash
# Create database
createdb citybike

# Run schema
psql citybike < backend/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database credentials

# Start the server
npm start
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env and add your Mapbox access token
# Get a free token at https://account.mapbox.com/access-tokens/

# Start the dev server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Environment Variables

### Backend (.env)
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=citybike
DB_USER=postgres
DB_PASSWORD=postgres
```

### Frontend (.env)
```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

## API Endpoints

- `GET /api/stations` - Get all bike stations
- `GET /api/stations/:id` - Get specific station by ID
- `GET /api/stats` - Get overall statistics
- `GET /api/health` - Health check

## Database Schema

### Stations Table
- `id` - Primary key
- `station_id` - Unique station identifier
- `name` - Station name
- `address` - Street address
- `city` - City name
- `latitude` - GPS latitude
- `longitude` - GPS longitude
- `capacity` - Total bike capacity
- `available_bikes` - Currently available bikes
- `available_docks` - Currently available docks
- `last_updated` - Last update timestamp

### Trips Table
- `id` - Primary key
- `departure_time` - Trip start time
- `return_time` - Trip end time
- `departure_station_id` - Start station
- `return_station_id` - End station
- `distance_meters` - Trip distance
- `duration_seconds` - Trip duration

## Development

The frontend uses Vite's proxy feature to forward API requests to the backend during development. This is configured in `frontend/vite.config.js`.

## Production Build

### Frontend
```bash
cd frontend
npm run build
# Built files will be in frontend/dist
```

### Backend
The backend doesn't require a build step. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start backend/server.js
```

## Data Sources

Sample data is included in the database schema. For real HSL citybike data:
- [HSL Open Data](https://www.hsl.fi/en/hsl/open-data)
- [City Bike Finland](https://www.citybikefinland.fi/)

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
