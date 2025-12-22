from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app):
    # Startup: runs when the application starts
    from infra.database import database
    await database.connect()
    yield
    # Shutdown: runs when the application stops
    await database.disconnect()


app = FastAPI(lifespan=lifespan)

templates = Jinja2Templates(directory="templates")

app.mount("/static", StaticFiles(directory="static"), name="static")

