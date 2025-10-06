import uvicorn

from app import app
from database import database

if __name__ == "__main__":
    uvicorn.run("view:app", host="127.0.0.1", port=8000, reload=True)


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()
