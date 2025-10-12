from typing import Optional, List
from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi import Depends
from enum import Enum
from app import app, templates
from dal.game_dal import get_game_by_name, create_game
from dal.player_answer_dal import get_wrong_questions, update_player_answer
from dal.player_dal import get_player_by_name, create_player
from dal.player_session_dal import create_player_session, \
    update_player_session, end_session, get_session_by_player_id, \
    get_top_players, PlayerScore
from dal.question_dal import get_random_question_by_game, get_question_by_id
from database import get_db
from models import PlayerSession, Question, Player, Game
from scripts.init_math_game import add_math_game_if_not_exists, \
    insert_math_stock_questions


class GameName(Enum):
    MATH_GAME = "Math Game"


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


class StartRequest(BaseModel):
    player_name: str
    player_age: int


@app.post("/start")
async def start_game(req: StartRequest, db: Session = Depends(get_db)):
    player: Player = await get_player_by_name(db, req.player_name)
    if not player:
        player = await create_player(db, name=req.player_name, age=req.player_age)

    game: Game = await get_game_by_name(db, GameName.MATH_GAME.value)
    if not game:
        game = await create_game(db, name=GameName.MATH_GAME.value,
                                 description="Default")

    player_session: PlayerSession = await create_player_session(db, player_id=player.id,
                                                                game_id=game.id)

    question: Question = await get_random_question_by_game(db, game.id, player_session.id)
    if not question:
        try:
            math_questions_file = r".\resources\math_stock_questions.jsonl"
            await add_math_game_if_not_exists(db,
                                              game_name="Math Game",
                                              description="Default")
            await insert_math_stock_questions(db,
                                              filename=math_questions_file)
        except Exception as e:
            print(f"Error: {e}")

        question: Question = await get_random_question_by_game(db, game.id,
                                                               player_session.id)

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
    player: Player = await get_player_by_name(db, req.player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    question: Question = await get_question_by_id(db, req.question_id)
    if not question:
        raise HTTPException(status_code=404,
                            detail=f"Question not found question id:"
                                   f" {req.question_id}")

    player_session: Optional[PlayerSession] = await get_session_by_player_id(db,  player.id)
    if not player_session:
        raise HTTPException(status_code=404,
                            detail=f"No active session found for player: "
                                   f"{player.name}")

    is_correct: bool = await update_player_session(db, question, player_session,
                                             req.answer)

    await update_player_answer(session=db, player_session_id=player_session.id,
                               question_id=question.id,
                               player_answer=req.answer,
                               is_correct=is_correct)

    game: Game = await get_game_by_name(db, req.game_name)
    if player_session.score >= game.winning_score:
        await end_session(db, player_session.id)
        return JSONResponse({"redirect": f"/end/{req.player_name}"})

    new_question: Question = await get_random_question_by_game(db, game.id, player_session.id)
    return JSONResponse({"is_correct": is_correct,
                         "score": player_session.score,
                         "question": new_question.text,
                         "question_id": new_question.id,
                         "stage": player_session.stage,
                         "wrong_questions": await get_wrong_questions(player_session)
                         })


@app.get("/end/{player_name}", response_class=HTMLResponse)
async def end_game(request: Request, player_name: str, db: Session = Depends(get_db)):
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    player_session: Optional[PlayerSession] = await get_session_by_player_id(
        db, player.id)
    if not player_session:
        raise HTTPException(status_code=404,
                            detail="No active session found for player")

    top_players: List[PlayerScore] = await get_top_players(db, limit=5)
    return templates.TemplateResponse("end.html", {"request": request,
                                                   "score": player_session.score,
                                                   "player_name": player_name,
                                                   "top_players": top_players})
