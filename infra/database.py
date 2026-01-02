from databases import Database
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
    # If not, default to localhost for local development
    import socket
    try:
        socket.gethostbyname("db")
        # If we get here, "db" resolves, so we're probably in Docker
    except socket.gaierror:
        # "db" doesn't resolve, we're running locally
        DB_HOST = "localhost"
        log.info("DB_HOST was set to 'db' but hostname doesn't resolve. Using 'localhost' instead.")
DB_PORT = os.getenv("DB_PORT", "5432")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

database = Database(DATABASE_URL)

metadata = Base.metadata
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Lazy table creation - only create tables when actually connecting
def create_tables():
    try:
        metadata.create_all(engine)
        log.info("DB Tables created")
    except Exception as e:
        log.warning(f"Could not create tables (database may not be available): {e}")


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
