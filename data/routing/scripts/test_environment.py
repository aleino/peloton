#!/usr/bin/env python3
"""Test Python environment setup."""

import sys
import os
from dotenv import load_dotenv


def test_imports():
    """Test that all required packages can be imported."""
    try:
        import psycopg2
        import requests
        import polyline
        from dotenv import load_dotenv

        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False


def test_python_version():
    """Verify Python 3.12 is being used."""
    version = sys.version_info
    if version.major == 3 and version.minor == 12:
        print(f"✅ Python version correct: {version.major}.{version.minor}")
        return True
    else:
        print(
            f"❌ Python version incorrect: {version.major}.{version.minor} (expected 3.12)"
        )
        return False


def test_environment():
    """Test that environment variables load."""
    load_dotenv()
    required_vars = [
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
    ]

    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        return False
    else:
        print("✅ All environment variables loaded")
        return True


def test_database_connection():
    """Test database connectivity."""
    load_dotenv()
    try:
        import psycopg2

        conn = psycopg2.connect(
            host=os.getenv("POSTGRES_HOST"),
            port=os.getenv("POSTGRES_PORT"),
            database=os.getenv("POSTGRES_DB"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if result and result[0]:
            print(f"✅ Database connection successful")
            print(f"   PostgreSQL version: {result[0].split(',')[0]}")
        else:
            print(f"✅ Database connection successful")
            print(f"   (version query returned no data)")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


if __name__ == "__main__":
    print("Testing Python environment setup...\n")

    results = [
        test_python_version(),
        test_imports(),
        test_environment(),
        test_database_connection(),
    ]

    if all(results):
        print("\n✅ Environment setup complete!")
        sys.exit(0)
    else:
        print("\n❌ Environment setup incomplete. Fix errors above.")
        sys.exit(1)
