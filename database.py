from databases import Database
from sqlalchemy import create_engine
from models import Base
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

DB_NAME = "tommy_game_db"
DB_USER = "postgres"
DB_PASSWORD = "postgres"
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@localhost:5432/{DB_NAME}"

database = Database(DATABASE_URL)

metadata = Base.metadata
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

metadata.create_all(engine)
print("DB Tables created")


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
