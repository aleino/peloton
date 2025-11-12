# Quick Start Guide

This guide will help you get the HSL Citybike Dashboard up and running quickly.

## Option 1: Using Docker (Recommended)

The easiest way to run the entire stack:

```bash
# Set your Mapbox token in environment
export VITE_MAPBOX_TOKEN=your_mapbox_token_here

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/health

## Option 2: Manual Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Mapbox access token (get free at https://account.mapbox.com/access-tokens/)

### Step 1: Database Setup

```bash
# Create database (using psql)
createdb citybike

# Or if you need to specify connection details:
createdb -h localhost -U postgres citybike

# Run schema
psql citybike < backend/schema.sql

# Verify tables were created
psql citybike -c "\dt"
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
# nano .env  (or use your preferred editor)

# Start server
npm start
```

The backend should now be running on http://localhost:3001

Test it:
```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/stations
```

### Step 3: Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your Mapbox token
# nano .env
# VITE_MAPBOX_TOKEN=your_token_here

# Start dev server
npm run dev
```

The frontend should now be running on http://localhost:3000

## Verifying the Setup

1. Open http://localhost:3000 in your browser
2. You should see:
   - A header with "HSL Citybike Dashboard"
   - Statistics showing 10 stations
   - A sidebar with a list of stations
   - A map centered on Helsinki with station markers

3. Test interactivity:
   - Click on a station in the sidebar - the map should fly to that location
   - Click on a marker on the map - a popup should appear with station details
   - Search for a station using the search box
   - Sort stations using the dropdown

## Common Issues

### Database Connection Error
- Make sure PostgreSQL is running
- Check your database credentials in backend/.env
- Verify the database exists: `psql -l | grep citybike`

### Mapbox Map Not Loading
- Check your VITE_MAPBOX_TOKEN in frontend/.env
- Make sure it's a valid token from https://account.mapbox.com/
- Check browser console for errors

### Port Already in Use
- Backend (3001): Stop any other service using port 3001
- Frontend (3000): Stop any other service using port 3000
- Database (5432): Make sure no other PostgreSQL instance is running

### Frontend Can't Connect to Backend
- Make sure backend is running on port 3001
- Check Vite proxy configuration in frontend/vite.config.js
- Try accessing backend directly: http://localhost:3001/api/stations

## Next Steps

- Add real HSL citybike data (see data/README.md)
- Customize the map style in frontend/src/components/Map.jsx
- Add more API endpoints in backend/server.js
- Set up automatic data updates
- Deploy to production

## Development Tips

### Running Both Services Together

From the root directory:
```bash
# Install concurrently if not already installed
npm install

# Run both frontend and backend together
npm run dev
```

### Debugging

Backend logs:
```bash
cd backend
npm run dev
# Logs will appear in terminal
```

Frontend logs:
- Open browser developer console (F12)
- Check Console tab for errors
- Check Network tab for API requests

Database queries:
```bash
# Connect to database
psql citybike

# Check stations
SELECT * FROM stations;

# Check statistics
SELECT COUNT(*) as total, SUM(available_bikes) as bikes FROM stations;
```

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Changes to .jsx/.css files will update automatically
- Backend: You may need to restart the server for changes to take effect
  - Consider using `nodemon` for auto-restart: `npx nodemon server.js`

## Production Deployment

See README.md for production build instructions.
