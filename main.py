import uvicorn
from routes.game_api import router as game_router
from routes.auth_routes import router as auth_router
from routes.pages import router as pages_router
from app import app
from database import database


app.include_router(game_router)
app.include_router(auth_router)
app.include_router(pages_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
