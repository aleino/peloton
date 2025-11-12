# Deployment Guide

This guide covers deploying the HSL Citybike Dashboard to production.

## Table of Contents
- [Production Checklist](#production-checklist)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Monitoring](#monitoring)
- [Backups](#backups)

## Production Checklist

Before deploying to production:

- [ ] Set strong database password
- [ ] Use production Mapbox token
- [ ] Enable HTTPS/SSL
- [ ] Set up proper CORS policies
- [ ] Configure environment variables
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Test all functionality
- [ ] Load test the application
- [ ] Set up error tracking
- [ ] Configure reverse proxy
- [ ] Set up firewall rules
- [ ] Document deployment process

## Environment Setup

### Production Environment Variables

**Backend (.env)**
```bash
NODE_ENV=production
PORT=3001

# Database
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=citybike
DB_USER=citybike_user
DB_PASSWORD=strong_password_here

# Connection pooling
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
```

**Frontend (.env.production)**
```bash
VITE_MAPBOX_TOKEN=pk.your_production_token_here
VITE_API_URL=https://api.yourdomain.com
```

### Database Setup

```bash
# Create production database
createdb -h your_db_host -U postgres citybike_prod

# Create dedicated user
psql -h your_db_host -U postgres -c "CREATE USER citybike_user WITH PASSWORD 'strong_password';"
psql -h your_db_host -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE citybike_prod TO citybike_user;"

# Run schema
psql -h your_db_host -U citybike_user -d citybike_prod < backend/schema.sql
```

## Docker Deployment

### Using Docker Compose

1. **Update docker-compose.yml for production:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: citybike-db-prod
    environment:
      POSTGRES_DB: citybike
      POSTGRES_USER: citybike_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - ./backups:/backups
    restart: always
    networks:
      - citybike-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: citybike-backend-prod
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: citybike
      DB_USER: citybike_user
      DB_PASSWORD: ${DB_PASSWORD}
    depends_on:
      - postgres
    restart: always
    networks:
      - citybike-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_MAPBOX_TOKEN: ${VITE_MAPBOX_TOKEN}
    container_name: citybike-frontend-prod
    ports:
      - "80:3000"
      - "443:443"
    depends_on:
      - backend
    restart: always
    networks:
      - citybike-network
    volumes:
      - ./ssl:/etc/nginx/ssl:ro  # SSL certificates

networks:
  citybike-network:
    driver: bridge

volumes:
  postgres_data:
```

2. **Create .env file:**

```bash
DB_PASSWORD=your_strong_password
VITE_MAPBOX_TOKEN=your_production_token
```

3. **Deploy:**

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Docker with SSL/TLS

Update nginx.conf in frontend:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Manual Deployment

### Backend Deployment

1. **Install PM2:**

```bash
npm install -g pm2
```

2. **Create ecosystem file (ecosystem.config.js):**

```javascript
module.exports = {
  apps: [{
    name: 'citybike-backend',
    script: './backend/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    max_memory_restart: '500M'
  }]
};
```

3. **Start with PM2:**

```bash
# Start
pm2 start ecosystem.config.js

# Save process list
pm2 save

# Setup startup script
pm2 startup

# Monitor
pm2 monit

# Logs
pm2 logs citybike-backend
```

### Frontend Deployment

1. **Build:**

```bash
cd frontend
VITE_MAPBOX_TOKEN=your_token npm run build
```

2. **Serve with Nginx:**

Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

Create site configuration:
```bash
sudo nano /etc/nginx/sites-available/citybike
```

Add configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/citybike;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/citybike /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Copy build files:
```bash
sudo mkdir -p /var/www/citybike
sudo cp -r dist/* /var/www/citybike/
sudo chown -R www-data:www-data /var/www/citybike
```

### SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Cloud Platforms

### Heroku

**Backend:**
```bash
# Create app
heroku create citybike-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production

# Deploy
git subtree push --prefix backend heroku main
```

**Frontend:**
```bash
# Create app
heroku create citybike-frontend

# Set buildpack
heroku buildpacks:set heroku/nodejs

# Set environment variables
heroku config:set VITE_MAPBOX_TOKEN=your_token

# Deploy
git subtree push --prefix frontend heroku main
```

### AWS (Elastic Beanstalk)

1. Install EB CLI
2. Initialize: `eb init`
3. Create environment: `eb create citybike-prod`
4. Deploy: `eb deploy`

### DigitalOcean App Platform

1. Connect GitHub repository
2. Select branch
3. Configure build commands
4. Set environment variables
5. Deploy

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

### Railway

1. Connect GitHub repository
2. Select services (frontend, backend, database)
3. Configure environment variables
4. Deploy automatically on push

## Monitoring

### Backend Monitoring

**PM2 Monitoring:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Application Monitoring:**
- Use PM2 Plus (https://pm2.io)
- Or integrate with New Relic, DataDog, etc.

### Database Monitoring

```bash
# Enable logging in postgresql.conf
log_statement = 'all'
log_duration = on
log_min_duration_statement = 1000  # Log slow queries

# Monitor connections
SELECT * FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('citybike'));
```

### Log Aggregation

Use tools like:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Papertrail
- Loggly

## Backups

### Database Backups

**Automated backup script (backup.sh):**
```bash
#!/bin/bash
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="citybike"

pg_dump -h localhost -U citybike_user $DB_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Compress
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Delete backups older than 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
```

**Schedule with cron:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

**Restore:**
```bash
gunzip backup_20241112_020000.sql.gz
psql -h localhost -U citybike_user citybike < backup_20241112_020000.sql
```

### Backup to Cloud Storage

**AWS S3:**
```bash
# Install AWS CLI
aws configure

# Upload backup
aws s3 cp /backups/backup_latest.sql.gz s3://your-bucket/backups/
```

**Google Cloud Storage:**
```bash
gsutil cp /backups/backup_latest.sql.gz gs://your-bucket/backups/
```

## Performance Optimization

### Database
- Add indexes on frequently queried columns
- Use connection pooling
- Enable query caching
- Regular VACUUM and ANALYZE

### Backend
- Enable gzip compression
- Use CDN for static assets
- Implement caching (Redis)
- Rate limiting

### Frontend
- Enable Nginx gzip
- Set cache headers
- Use CDN
- Lazy load components
- Optimize images

## Security

### Checklist
- [ ] HTTPS enabled
- [ ] Strong database passwords
- [ ] Environment variables secured
- [ ] SQL injection protection (parameterized queries)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] Backup encryption
- [ ] Access logs enabled

### Firewall (UFW)

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## Troubleshooting Production

See TROUBLESHOOTING.md for common issues.

Additional production tips:
- Check PM2 logs: `pm2 logs`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check database logs: `sudo tail -f /var/log/postgresql/postgresql-15-main.log`
- Monitor resources: `htop`, `iotop`, `df -h`

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and optimize database queries
- Check disk space
- Review logs for errors
- Test backups
- Security patches
- Performance monitoring

### Scaling

**Horizontal Scaling:**
- Add more backend instances
- Use load balancer (Nginx, HAProxy)
- Database read replicas
- CDN for frontend

**Vertical Scaling:**
- Increase server resources
- Optimize database configuration
- Add caching layer

## Support

For deployment issues:
- Check logs first
- Review TROUBLESHOOTING.md
- Consult platform documentation
- Open GitHub issue if needed
