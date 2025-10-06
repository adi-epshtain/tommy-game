from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi import Depends
from enum import Enum

from app import app, templates
from dal.game_dal import get_game_by_name, create_game
from dal.player_answer_dal import get_wrong_questions
from dal.player_dal import get_player_by_name, create_player
from dal.player_session_dal import create_player_session, update_player_session
from dal.question_dal import list_questions_by_game, \
    get_random_question_by_game, get_question_by_id
from database import get_db
from models import PlayerSession, Question


class GameName(Enum):
    MATH_GAME = "Math Game"


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/start/{player_name}")
async def start_game(player_name: str, db: Session = Depends(get_db)):
    player = get_player_by_name(db, player_name)
    if not player:
        player = create_player(db, name=player_name, age=0)  # TODO: add age

    game = get_game_by_name(db, GameName.MATH_GAME.value)
    if not game:
        game = create_game(db, name=GameName.MATH_GAME.value,
                           description="Default")

    player_session = create_player_session(db, player_id=player.id,
                                           game_id=game.id)

    question = list_questions_by_game(db, game_id=game.id)[0]

    return {
        "session_id": player_session.id,
        "question": question.text,
        "question_id": question.id
    }


class AnswerRequest(BaseModel):
    player_name: str
    answer: int
    question_id: int
    game_name: str


@app.post("/answer")
async def submit_answer(req: AnswerRequest, db: Session = Depends(get_db)):
    player = get_player_by_name(db, req.player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    question = get_question_by_id(db, req.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    player_session = db.query(PlayerSession).filter(
        PlayerSession.player_id == player.id,
        PlayerSession.ended_at == None
    ).first()

    if not player_session:
        raise HTTPException(status_code=404,
                            detail="No active session found for player")

    is_correct: bool = update_player_session(db, question, player_session,
                                             req.answer)

    game = get_game_by_name(db, req.game_name)
    if player_session.score >= game.winning_score:
        return JSONResponse({"redirect": f"/end/{req.player_name}"})

    new_question: Question = await get_random_question_by_game(db, game.id)
    return JSONResponse({"is_correct": is_correct,
                         "score": player_session.score,
                         "question": new_question.text,
                         "question_id": new_question.id,
                         "stage": player_session.stage,
                         "wrong_questions": await get_wrong_questions(player_session)
                         })


@app.get("/end/{player_name}", response_class=HTMLResponse)
async def end_game(request: Request, player_name: str, db: Session = Depends(get_db)):
    player = get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    player_session = db.query(PlayerSession).filter(
        PlayerSession.player_id == player.id,
        PlayerSession.ended_at == None
    ).first()

    if not player_session:
        raise HTTPException(status_code=404,
                            detail="No active session found for player")

    return templates.TemplateResponse("end.html", {"request": request,
                                                   "score":  player_session.score,
                                                   "player_name": player_name})