from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from fastapi import HTTPException

from infra.logger import log
from models import Base
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker
import os

# Load environment variables (in case .env file exists)
from dotenv import load_dotenv
load_dotenv()

DB_NAME = os.getenv("DB_NAME", "tommy_game_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
# Override DB_HOST if it's set to "db" (Docker) and we're running locally
DB_HOST = os.getenv("DB_HOST", "localhost")
if DB_HOST == "db":
    # Check if we're actually in Docker by checking if "db" hostname resolves
    # If not, default to 127.0.0.1 for local development (avoids IPv6 issues)
    import socket
    try:
        socket.gethostbyname("db")
        # If we get here, "db" resolves, so we're probably in Docker
    except socket.gaierror:
        # "db" doesn't resolve, we're running locally
        DB_HOST = "127.0.0.1"
        log.info("DB_HOST was set to 'db' but hostname doesn't resolve. Using '127.0.0.1' instead.")
elif DB_HOST == "localhost":
    # Use 127.0.0.1 instead of localhost to avoid IPv6 connection issues on Windows
    DB_HOST = "127.0.0.1"
DB_PORT = os.getenv("DB_PORT", "5432")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def ensure_database_exists() -> None:
    """
    Ensure the database exists. Creates it if it doesn't exist.
    Raises exception if PostgreSQL server is unreachable.
    """
    # Connect to default 'postgres' database to check/create target database
    postgres_url = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"
    postgres_engine = create_engine(postgres_url, pool_pre_ping=True)
    
    try:
        # Check if database exists
        with postgres_engine.connect() as conn:
            result = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
            )
            exists = result.fetchone() is not None
        
        if not exists:
            log.info(f"Database '{DB_NAME}' does not exist. Creating it...")
            # CREATE DATABASE must be executed in autocommit mode
            # Use raw connection to execute CREATE DATABASE
            raw_conn = postgres_engine.raw_connection()
            try:
                raw_conn.autocommit = True  # Enable autocommit for psycopg2
                cursor = raw_conn.cursor()
                cursor.execute(f'CREATE DATABASE "{DB_NAME}"')
                cursor.close()
                log.info(f"Database '{DB_NAME}' created successfully")
            finally:
                raw_conn.close()
        else:
            log.info(f"Database '{DB_NAME}' already exists")
    except Exception as e:
        error_msg = f"Failed to ensure database exists: {e}"
        log.error(error_msg)
        log.error(f"PostgreSQL server: {DB_USER}@{DB_HOST}:{DB_PORT}")
        log.error("Please ensure PostgreSQL is running and accessible")
        raise RuntimeError(error_msg) from e
    finally:
        postgres_engine.dispose()

def create_tables() -> None:
    """
    Create all database tables. Raises exception if database is unreachable or schema creation fails.
    This function must succeed for the application to start.
    """
    log.info(f"Initializing database: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
    
    # Ensure database exists
    ensure_database_exists()
    
    # Explicitly test connection to target database
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        log.info("Database connection test successful")
    except Exception as e:
        error_msg = f"Failed to connect to database: {e}"
        log.error(error_msg)
        log.error(f"Connection string: postgresql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")
        raise RuntimeError(error_msg) from e
    
    # Create tables
    try:
        log.info("Creating database tables...")
        Base.metadata.create_all(engine)
        log.info("Database tables created successfully")
        # Add any missing columns (for schema evolution)
        add_missing_columns()
    except Exception as e:
        error_msg = f"Failed to create database tables: {e}"
        log.error(error_msg)
        raise RuntimeError(error_msg) from e


def add_missing_columns() -> None:
    """
    Adds missing columns to existing tables if they don't exist.
    This acts as a simple migration for new fields.
    """
    try:
        with SessionLocal() as session:
            # Check and add 'excluded_from_leaderboard' to 'players' table
            try:
                session.execute(text("SELECT excluded_from_leaderboard FROM players LIMIT 1"))
                log.info("Column 'excluded_from_leaderboard' already exists in 'players' table")
            except OperationalError:
                log.info("Column 'excluded_from_leaderboard' does not exist in 'players' table. Adding it...")
                session.execute(text("ALTER TABLE players ADD COLUMN excluded_from_leaderboard BOOLEAN DEFAULT FALSE"))
                session.commit()
                log.info("Column 'excluded_from_leaderboard' added successfully to 'players' table")
            except Exception as e:
                session.rollback()
                # If it's a different error (like table doesn't exist yet), that's fine
                if "does not exist" not in str(e).lower() and "no such table" not in str(e).lower():
                    log.warning(f"Error checking/adding 'excluded_from_leaderboard' column: {e}")
        log.info("Database schema migration check completed")
    except Exception as e:
        # Don't fail startup if migration check fails - just log it
        log.warning(f"Error during schema migration check: {e}")


def get_db():
    db: Session = SessionLocal()
    try:
        # Test connection by executing a simple query
        db.execute(text("SELECT 1"))
        yield db
    except OperationalError as e:
        db.close()
        error_msg = str(e)
        if "could not translate host name" in error_msg or "No such host is known" in error_msg:
            log.error(f"Database host not found. DB_HOST={DB_HOST}. Please ensure PostgreSQL is running or set DB_HOST=localhost")
            raise HTTPException(
                status_code=503,
                detail=f"Database is not available. Please ensure PostgreSQL is running on {DB_HOST}:{DB_PORT} or set DB_HOST=localhost in your environment."
            )
        log.error(f"Database connection error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Database is not available. Please ensure PostgreSQL is running. Error: {error_msg}"
        )
    except HTTPException:
        # Re-raise HTTPExceptions (like 404 Invalid player) - these are intentional
        db.close()
        raise
    except Exception as e:
        db.close()
        # Only log actual database errors, not business logic errors
        log.error(f"Database error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Database error: {str(e)}"
        )
    finally:
        db.close()
