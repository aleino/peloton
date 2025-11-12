# PostgreSQL Database for Peloton HSL Trip Data

FROM postgis/postgis:17-3.4

# Set default environment variables (can be overridden)
ENV POSTGRES_DB=peloton_db
ENV POSTGRES_USER=peloton
ENV POSTGRES_PASSWORD=peloton_dev_password

# Create directory for initialization scripts
RUN mkdir -p /docker-entrypoint-initdb.d

# Copy initialization scripts
COPY ./init-scripts/*.sql /docker-entrypoint-initdb.d/

EXPOSE 5432

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB