# HSL Citybike Data Directory

This directory contains data files for the HSL citybike dashboard.

## Sample Data

The application uses PostgreSQL as the primary database, but you can place additional data files here:

- CSV files with historical trip data
- JSON files with station configurations
- Backup files
- Import/export scripts

## Data Sources

HSL Citybike data can be obtained from:
- [Helsinki Region Transport (HSL) Open Data](https://www.hsl.fi/en/hsl/open-data)
- [City Bike Finland](https://www.citybikefinland.fi/)

## Usage

To import data into the database:

1. Place your CSV/JSON files in this directory
2. Create import scripts in the `backend` directory
3. Run the import scripts to populate the database

Example data format for stations CSV:
```
station_id,name,address,city,latitude,longitude,capacity
001,Kaivopuisto,Meritori 1,Helsinki,60.155371,24.950390,30
```

Example data format for trips CSV:
```
departure_time,return_time,departure_station_id,return_station_id,distance_meters,duration_seconds
2024-01-01 10:00:00,2024-01-01 10:15:00,001,002,1500,900
```
