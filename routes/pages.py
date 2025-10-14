from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from app import templates

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
def home_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/signup", response_class=HTMLResponse)
def signup_page(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})


@router.get("/game", response_class=HTMLResponse)
async def game_page(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "player_name": ""}
    )
