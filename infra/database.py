from databases import Database
from sqlalchemy import create_engine

from infra.logger import log
from models import Base
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker
import os

DB_NAME = os.getenv("DB_NAME", "tommy_game_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

database = Database(DATABASE_URL)

metadata = Base.metadata
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

metadata.create_all(engine)
log.info("DB Tables created")


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
