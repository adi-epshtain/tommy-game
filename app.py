from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app):
    # Startup: runs when the application starts
    from infra.database import database, create_tables
    from infra.logger import log
    try:
        await database.connect()
        create_tables()  # Create tables after connection
        log.info("Database connected successfully")
        from infra.logger import print_tommy_logo
        print_tommy_logo()
    except Exception as e:
        log.warning(f"Could not connect to database on startup: {e}")
        log.warning("App will continue, but database features may not work until database is available")
    
    yield
    
    # Shutdown: runs when the application stops
    try:
        await database.disconnect()
    except Exception as e:
        log.warning(f"Database disconnect on shutdown failed: {e}")
        # We pass here to allow the app to shut down gracefully even if
        # disconnect fails.
        pass


app = FastAPI(lifespan=lifespan)

# Mount static files - React build assets will be in static/react
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount React build assets at /assets so the built index.html can find them
react_assets_dir = Path("static/react/assets")
if react_assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(react_assets_dir)), name="react_assets")

