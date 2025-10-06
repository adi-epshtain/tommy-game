from databases import Database
from sqlalchemy import create_engine
from models import Base
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/tommy_game_db"

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
