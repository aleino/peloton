-- HSL Citybike Database Schema

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    available_bikes INTEGER DEFAULT 0,
    available_docks INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trips table for historical data
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    departure_time TIMESTAMP NOT NULL,
    return_time TIMESTAMP NOT NULL,
    departure_station_id INTEGER REFERENCES stations(id),
    return_station_id INTEGER REFERENCES stations(id),
    distance_meters INTEGER,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stations_location ON stations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_stations_station_id ON stations(station_id);
CREATE INDEX IF NOT EXISTS idx_trips_departure_time ON trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_trips_return_time ON trips(return_time);
CREATE INDEX IF NOT EXISTS idx_trips_departure_station ON trips(departure_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_return_station ON trips(return_station_id);

-- Insert sample HSL citybike stations data (Helsinki area)
INSERT INTO stations (station_id, name, address, city, latitude, longitude, capacity, available_bikes, available_docks)
VALUES
    ('001', 'Kaivopuisto', 'Meritori 1', 'Helsinki', 60.155371, 24.950390, 30, 12, 18),
    ('002', 'Töölönlahdenpuisto', 'Töölönlahdenkatu', 'Helsinki', 60.177330, 24.926450, 40, 15, 25),
    ('003', 'Rautatientori', 'Kaivokatu 1', 'Helsinki', 60.171320, 24.944450, 50, 20, 30),
    ('004', 'Kamppi', 'Urho Kekkosen katu 1', 'Helsinki', 60.168320, 24.932320, 35, 10, 25),
    ('005', 'Senaatintori', 'Senaatintori', 'Helsinki', 60.169250, 24.951630, 25, 8, 17),
    ('006', 'Hakaniemi', 'Hämeentie 1', 'Helsinki', 60.178960, 24.950890, 30, 14, 16),
    ('007', 'Kaisaniemi', 'Kaisaniemenkatu 3', 'Helsinki', 60.173020, 24.945540, 28, 11, 17),
    ('008', 'Esplanadi', 'Pohjoisesplanadi 11', 'Helsinki', 60.168540, 24.947890, 32, 16, 16),
    ('009', 'Karhupuisto', 'Korkeavuorenkatu 45', 'Helsinki', 60.159610, 24.946210, 22, 9, 13),
    ('010', 'Laivasillankatu', 'Laivasillankatu 14', 'Helsinki', 60.157260, 24.956870, 26, 10, 16)
ON CONFLICT (station_id) DO NOTHING;

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_updated on stations
CREATE TRIGGER update_stations_last_updated
    BEFORE UPDATE ON stations
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();
