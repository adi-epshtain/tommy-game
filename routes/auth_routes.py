from typing import Optional

from fastapi import APIRouter, Request, Depends, HTTPException
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
from auth_utils import create_access_token, get_current_player
from dal.player_dal import get_player_by_name, create_player
from database import get_db
from models import Player
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()


class SignupRequest(BaseModel):
    name: str
    age: int
    password: str


class LoginRequest(BaseModel):
    name: str
    password: str


@router.get("/api/player_info", tags=["Auth"])
async def player_info(current_player=Depends(get_current_player)):
    return {"name": current_player.get("sub")}


@router.post("/signup", tags=["Auth"])
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing_player: Optional[Player] = await get_player_by_name(db, req.name)
    if existing_player:
        raise HTTPException(status_code=400, detail="User already exists")
    hashed_password = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    await create_player(db, name=req.name, age=req.age, hashed_password=hashed_password)
    return {"message": f"User created successfully"}


@router.post("/login", tags=["Auth"])
async def login(req: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    player: Optional[Player] = await get_player_by_name(db, req.username)
    is_correct: bool = bcrypt.checkpw(req.password.encode("utf-8"),
                                      player.password.encode("utf-8"))
    if not is_correct:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = await create_access_token({"sub": player.name, "player_id": player.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", tags=["Auth"])
async def logout():
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie("token")
    return response
