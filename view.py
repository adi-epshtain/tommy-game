from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from starlette.responses import JSONResponse
from app import Game

app = FastAPI()
templates = Jinja2Templates(directory="templates")

app.mount("/static", StaticFiles(directory="static"), name="static")

games = {}


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/start/{player_name}")
def start_game(player_name: str):
    if player_name not in games:
        games[player_name] = Game(player_name=player_name)
    question = games[player_name].get_question()
    print(question)

    return {"question": question}


@app.post("/answer/{player_name}/{answer}")
def submit_answer(player_name: str, answer: int):
    if player_name not in games:
        raise HTTPException(status_code=404, detail="Player not found")
    game = games[player_name]
    is_correct: bool = game.submit_answer(answer)

    if games[player_name].player.score == game.winning_score:
        return JSONResponse({"redirect": f"/end/{player_name}"})
    return JSONResponse({"is_correct": is_correct,
                         "score": games[player_name].player.score,
                         "question": game.get_question(),
                         "stage": games[player_name].player.stage,
                         "wrong_questions": [q.text for q in game.wrong_questions]
                         })


@app.get("/end/{player_name}", response_class=HTMLResponse)
def end_game(request: Request, player_name: str):
    score = games[player_name].player.score
    return templates.TemplateResponse("end.html", {"request": request,
                                                   "score": score,
                                                   "player_name": player_name})
