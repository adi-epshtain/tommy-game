from fastapi import APIRouter, Request, Depends, HTTPException
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
from auth_utils import create_access_token, get_current_player
from dal.player_dal import get_player_by_name, create_player
from database import get_db

router = APIRouter()


class SignupRequest(BaseModel):
    name: str
    age: int
    password: str


class LoginRequest(BaseModel):
    name: str
    password: str


@router.get("/api/player_info")
async def player_info(current_player=Depends(get_current_player)):
    return {"name": current_player["sub"]}


@router.post("/signup")
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = await get_player_by_name(db, req.name)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    hashed_password = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    await create_player(db, name=req.name, age=req.age, hashed_password=hashed_password)
    return {"message": f"User created successfully"}


@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    player = await get_player_by_name(db, req.name)
    is_correct = bcrypt.checkpw(req.password.encode("utf-8"),
                                player.password.encode("utf-8"))
    if not is_correct:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = await create_access_token({"sub": player.name, "player_id": player.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(request: Request):
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie("token")
    return response
