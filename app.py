from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from infra.logger import print_tommy_logo

@asynccontextmanager
async def lifespan(app):
    # Startup: runs when the application starts
    from infra.database import create_tables
    from infra.logger import log
    
    # Create tables - raises exception if database is unreachable or schema creation fails
    create_tables()
    log.info("Database initialized successfully")
    print_tommy_logo()
    
    yield
    
    # Shutdown: cleanup if needed (SQLAlchemy engine handles connection pooling)


app = FastAPI(lifespan=lifespan)

# Mount static files - React build assets will be in static/react
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount React build assets at /assets so the built index.html can find them
react_assets_dir = Path("static/react/assets")
if react_assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(react_assets_dir)), name="react_assets")

