# Data Directory

This folder contains raw data, processed data, and ETL scripts for the Peloton project.

## Structure

```
data/
├── raw/                      # Raw data from HSL API
│   └── 2024/
│       └── od-trips-2024/    # Origin-Destination trip data
├── interim/                  # Intermediate processing results
│   ├── station_coordinates.json
│   └── unique_stations.txt
├── output/                   # Final processed data
│   └── pipeline_report_*.json
├── logs/                     # Pipeline logs and error reports
│   └── invalid_trips.csv
└── scripts/
    ├── etl/                  # ETL pipeline (Python 3.12)
    │   ├── config.yaml       # Pipeline configuration
    │   ├── run_pipeline.py   # Main pipeline orchestrator
    │   ├── csv_reader.py     # CSV data reader
    │   ├── db_writer.py      # Database writer
    │   ├── enricher.py       # Data enrichment
    │   ├── validator.py      # Data validation
    │   ├── models.py         # Data models
    │   ├── station_loader.py # Station data loader
    │   ├── test_pipeline.py  # Pipeline tests
    │   ├── requirements.txt  # Python dependencies
    │   └── README.md
    ├── extract_unique_stations.py
    ├── fetch_hsl_bike_data.py
    └── fetch_station_coordinates.py
```

## Guidelines

- Use Python 3.12 syntax and features
- Before running any Python script, enable pyenv: `pyenv shell 3.12`
- Follow PEP8 for code style
- Store raw data in `raw/`
- Store interim files in `interim/`
- Store final outputs in `output/`
- Document all data sources in Markdown files

## ETL Pipeline

See `scripts/etl/README.md` for detailed pipeline documentation.
