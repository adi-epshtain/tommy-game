#!/usr/bin/env python3
"""
Simple script to test PostgreSQL database connection.
Run this to diagnose connection issues.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

DB_NAME = os.getenv("DB_NAME", "tommy_game_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

# Override DB_HOST if it's set to "db" (Docker) and we're running locally
original_host = DB_HOST
if DB_HOST == "db":
    # Check if we're actually in Docker by checking if "db" hostname resolves
    # If not, default to localhost for local development
    import socket
    try:
        socket.gethostbyname("db")
        # If we get here, "db" resolves, so we're probably in Docker
    except (socket.gaierror, socket.herror, OSError):
        # "db" doesn't resolve, we're running locally
        DB_HOST = "localhost"

print("=" * 60)
print("Testing PostgreSQL Connection")
print("=" * 60)
if original_host != DB_HOST:
    print(f"[WARNING] DB_HOST was set to '{original_host}' but hostname doesn't resolve.")
    print(f"          Using 'localhost' instead for local development.")
    print()
print(f"Host: {DB_HOST}")
print(f"Port: {DB_PORT}")
print(f"User: {DB_USER}")
print(f"Database: {DB_NAME}")
print(f"Password: {'*' * len(DB_PASSWORD) if DB_PASSWORD else 'NOT SET'}")
print("=" * 60)

try:
    from sqlalchemy import create_engine, text
    
    # Test 1: Connect to postgres database
    print("\n[1] Testing connection to 'postgres' database...")
    postgres_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"
    postgres_engine = create_engine(postgres_url, pool_pre_ping=True)
    
    try:
        with postgres_engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print("[OK] Connected successfully!")
            print(f"     PostgreSQL version: {version[:50]}...")
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        print("\nPossible issues:")
        print("  - PostgreSQL server is not running")
        print(f"  - Wrong host/port (trying {DB_HOST}:{DB_PORT})")
        print("  - Wrong username/password")
        print("  - Firewall blocking connection")
        sys.exit(1)
    
    # Test 2: Check if target database exists
    print(f"\n[2] Checking if database '{DB_NAME}' exists...")
    try:
        with postgres_engine.connect() as conn:
            result = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
            )
            exists = result.fetchone() is not None
            if exists:
                print(f"[OK] Database '{DB_NAME}' exists")
            else:
                print(f"[INFO] Database '{DB_NAME}' does NOT exist")
                print("       Will be created automatically on app startup")
    except Exception as e:
        print(f"[ERROR] Error checking database: {e}")
        sys.exit(1)
    
    # Test 3: Try to connect to target database
    print(f"\n[3] Testing connection to database '{DB_NAME}'...")
    db_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    db_engine = create_engine(db_url, pool_pre_ping=True)
    
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"[OK] Connected to '{DB_NAME}' successfully!")
    except Exception as e:
        error_str = str(e)
        if "does not exist" in error_str.lower():
            print(f"[INFO] Database '{DB_NAME}' does not exist (this is OK, it will be created)")
        else:
            print(f"[ERROR] Connection failed: {e}")
            sys.exit(1)
    finally:
        db_engine.dispose()
    
    postgres_engine.dispose()
    
    print("\n" + "=" * 60)
    print("[OK] All connection tests passed!")
    print("=" * 60)
    
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    print("        Run: pip install -r requirements.txt")
    print("        Make sure you're in the virtual environment (venv)")
    sys.exit(1)
except Exception as e:
    print(f"[ERROR] Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

