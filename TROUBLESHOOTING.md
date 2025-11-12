# Troubleshooting Guide

Common issues and their solutions for the HSL Citybike Dashboard.

## Table of Contents
- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Docker Issues](#docker-issues)
- [Development Issues](#development-issues)

## Installation Issues

### npm install fails

**Problem**: Dependencies fail to install

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json
npm install

# Try with legacy peer deps
npm install --legacy-peer-deps

# Update npm
npm install -g npm@latest
```

### Node version issues

**Problem**: Incompatible Node.js version

**Solution**:
```bash
# Check your version
node --version

# Should be 16.x or higher
# Use nvm to switch versions
nvm install 18
nvm use 18
```

## Database Issues

### Cannot create database

**Problem**: `createdb: error: connection to server failed`

**Solutions**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U postgres -c "SELECT version();"

# If authentication fails, check pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Change method to 'trust' for local connections (dev only!)
```

### Schema import fails

**Problem**: `psql: schema.sql: No such file or directory`

**Solution**:
```bash
# Make sure you're in the right directory
cd backend
psql citybike < schema.sql

# Or use absolute path
psql citybike < /path/to/backend/schema.sql

# Or specify connection details
psql -h localhost -U postgres -d citybike -f schema.sql
```

### Permission denied

**Problem**: `ERROR: permission denied for database citybike`

**Solutions**:
```bash
# Grant permissions
psql postgres
GRANT ALL PRIVILEGES ON DATABASE citybike TO postgres;
\q

# Or recreate database with correct owner
dropdb citybike
createdb -O postgres citybike
```

### Connection pool errors

**Problem**: `Error: connection terminated unexpectedly`

**Solutions**:
1. Check database is running
2. Verify credentials in backend/.env
3. Check max_connections in PostgreSQL config
4. Restart PostgreSQL

```bash
# Check max connections
psql citybike -c "SHOW max_connections;"

# Increase if needed (in postgresql.conf)
sudo nano /etc/postgresql/15/main/postgresql.conf
# max_connections = 100
sudo systemctl restart postgresql
```

## Backend Issues

### Port 3001 already in use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3001`

**Solutions**:
```bash
# Find process using port
lsof -i :3001
# or
netstat -tulpn | grep 3001

# Kill the process
kill -9 <PID>

# Or use different port
# Edit backend/.env
PORT=3002
```

### Database connection fails

**Problem**: `Database connection error: ECONNREFUSED`

**Solutions**:
1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Check backend/.env credentials
3. Test connection manually:
```bash
psql -h localhost -U postgres -d citybike -c "SELECT 1;"
```

### CORS errors

**Problem**: Frontend can't access backend API

**Solutions**:
1. Make sure CORS is enabled in backend/server.js
2. Check frontend is using correct API URL
3. Verify proxy in vite.config.js

```javascript
// In backend/server.js, verify:
app.use(cors());

// In frontend/vite.config.js, verify:
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}
```

### Module not found

**Problem**: `Error: Cannot find module 'express'`

**Solution**:
```bash
cd backend
npm install
```

## Frontend Issues

### Mapbox map doesn't load

**Problem**: Map container is blank or shows error

**Solutions**:
1. Check Mapbox token in frontend/.env
2. Verify token is valid at https://account.mapbox.com/
3. Check browser console for errors

```bash
# Make sure .env exists
ls frontend/.env

# Token should look like:
VITE_MAPBOX_TOKEN=pk.eyJ1Ijoi...

# Restart dev server after changing .env
cd frontend
npm run dev
```

### Map markers don't appear

**Problem**: Map loads but no station markers

**Solutions**:
1. Check backend is running: `curl http://localhost:3001/api/stations`
2. Check browser console for API errors
3. Verify database has data:
```bash
psql citybike -c "SELECT COUNT(*) FROM stations;"
```

### Styles not loading

**Problem**: Application looks broken, no styling

**Solutions**:
1. Check CSS files are imported
2. Clear browser cache (Ctrl+Shift+R)
3. Check Vite dev server console for errors
4. Verify mapbox-gl CSS is loaded:
```javascript
// In Map.jsx, verify:
import 'mapbox-gl/dist/mapbox-gl.css'
```

### Build fails

**Problem**: `npm run build` fails

**Solutions**:
```bash
# Clear cache
rm -rf node_modules/.vite

# Rebuild
npm run build

# Check for missing dependencies
npm install

# Verify Vite config
cat vite.config.js
```

### White screen after build

**Problem**: Production build shows blank page

**Solutions**:
1. Check browser console for errors
2. Verify base path in vite.config.js
3. Check .env variables are set:
```bash
# For production build
VITE_MAPBOX_TOKEN=your_token npm run build
```

## Docker Issues

### Docker build fails

**Problem**: `ERROR [build X] failed`

**Solutions**:
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test ./backend
```

### Container won't start

**Problem**: Container exits immediately

**Solutions**:
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check if ports are available
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Remove conflicting containers
docker ps -a
docker rm <container_id>
```

### Database container issues

**Problem**: PostgreSQL container unhealthy

**Solutions**:
```bash
# Check logs
docker-compose logs postgres

# Restart container
docker-compose restart postgres

# Remove volume and restart
docker-compose down -v
docker-compose up -d
```

### Can't connect to database in Docker

**Problem**: Backend can't connect to PostgreSQL

**Solutions**:
1. Verify service names in docker-compose.yml
2. Check environment variables
3. Wait for database to be ready:
```bash
# Check health status
docker-compose ps

# Wait for healthy status
docker-compose up -d postgres
# Wait ~10 seconds
docker-compose up -d backend
```

## Development Issues

### Hot reload not working

**Problem**: Changes don't reflect in browser

**Solutions**:
```bash
# Restart Vite dev server
# Ctrl+C then npm run dev

# Clear cache
rm -rf node_modules/.vite
npm run dev

# Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### API requests failing in dev

**Problem**: 404 or network errors for /api/* requests

**Solutions**:
1. Verify backend is running on port 3001
2. Check Vite proxy configuration
3. Test API directly:
```bash
curl http://localhost:3001/api/health
```

### Environment variables not loading

**Problem**: process.env or import.meta.env returns undefined

**Solutions**:
```bash
# For backend (.env)
# Make sure dotenv is loaded
require('dotenv').config();

# For frontend (.env)
# Variables must start with VITE_
VITE_MAPBOX_TOKEN=...

# Restart dev server after changes
```

### Git issues

**Problem**: Large files or node_modules committed

**Solutions**:
```bash
# Check .gitignore exists
cat .gitignore

# Remove from git but keep locally
git rm -r --cached node_modules
git rm -r --cached dist
git commit -m "Remove ignored files"

# Clean up large files
git filter-branch --tree-filter 'rm -rf node_modules' HEAD
```

## Performance Issues

### Slow map rendering

**Solutions**:
1. Reduce number of markers
2. Use marker clustering
3. Optimize marker icons
4. Reduce popup complexity

### Slow API responses

**Solutions**:
1. Add database indexes
2. Optimize queries
3. Add caching
4. Use connection pooling

### High memory usage

**Solutions**:
```bash
# Backend: Limit connection pool
# In backend/server.js
const pool = new Pool({
  max: 10, // max connections
});

# Frontend: Check for memory leaks
# Use React DevTools Profiler
```

## Getting More Help

If you're still experiencing issues:

1. Check the logs:
   - Backend: Terminal where `npm start` is running
   - Frontend: Browser console (F12)
   - Database: PostgreSQL logs

2. Search for similar issues:
   - GitHub Issues
   - Stack Overflow
   - Vite documentation
   - Mapbox documentation

3. Create a minimal reproduction:
   - Isolate the problem
   - Note exact error messages
   - List steps to reproduce

4. Ask for help:
   - Open a GitHub issue
   - Provide error messages and logs
   - Include system information (OS, Node version, etc.)
