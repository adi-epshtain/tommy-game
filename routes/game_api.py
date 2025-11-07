from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
from enum import Enum
from pydantic import BaseModel
from app import templates
from auth_utils import get_current_player
from dal.game_dal import get_game_by_name, create_game, update_winning_score
from dal.player_answer_dal import get_wrong_questions, update_player_answer, \
    PlayerSessionAnswer
from dal.player_dal import get_player_by_name
from dal.player_session_dal import (
    create_player_session, update_score_and_stage_player_session, end_session,
    get_session_by_player_id, get_top_players, PlayerScore,
    get_last_player_sessions, update_player_stage
)
from dal.question_dal import get_random_question_by_game, get_question_by_id
from database import get_db
from logger import log
from models import PlayerSession, Question, Player, Game
from scripts.init_math_game import insert_math_stock_questions
import os


router = APIRouter()


MATH_QUESTIONS_FILE = os.path.join("resources", "math_stock_questions.jsonl")



class GameInfo(Enum):
    MATH_GAME = ("Math Game",
                 "Solve math problems and race for the highest score",
                 2)

    @property
    def name(self):
        return self.value[0]

    @property
    def description(self):
        return self.value[1]

    @property
    def winning_score(self):
        return self.value[2]


@router.get("/game", response_class=HTMLResponse)
async def game_page(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )


@router.post("/start", tags=["Game"])
async def start_game(
    current_player=Depends(get_current_player),
    db: Session = Depends(get_db)
):
    player_name: str = current_player.get("sub")
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    game: Game = await get_game_by_name(db, GameInfo.MATH_GAME.name)
    if not game:
        game: Game = await create_game(db, name=GameInfo.MATH_GAME.name, winning_score=GameInfo.MATH_GAME.winning_score, description=GameInfo.MATH_GAME.description)
    player_session: PlayerSession = await create_player_session(db, player_id=player.id, game_id=game.id)
    question: Question = await get_random_question_by_game(db, game.id, player_session.id)
    if not question:
        try:
            await insert_math_stock_questions(db, filename=MATH_QUESTIONS_FILE, game_name=GameInfo.MATH_GAME.name)
        except Exception as e:
            log.error(f"Insert math stock questions failed with error: {e}")
        question: Question = await get_random_question_by_game(db, game.id, player_session.id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found after insert_math_stock_questions")
    time_limit = 10 + (question.difficulty - 1) * 3
    return {
        "session_id": player_session.id,
        "question": question.text,
        "question_id": question.id,
        "time_limit": time_limit
    }


class AnswerRequest(BaseModel):
    answer: Optional[int] = None
    question_id: int
    game_name: str


@router.post("/answer", tags=["Game"])
async def submit_answer(
    req: AnswerRequest,
    current_player=Depends(get_current_player),
    db: Session = Depends(get_db)
):
    player_name = current_player.get("sub")
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    question: Question = await get_question_by_id(db, req.question_id)
    time_limit = 10 + (question.difficulty - 1) * 3
    if not question:
        raise HTTPException(status_code=404, detail=f"Question not found question id: {req.question_id}")
    player_session: Optional[PlayerSession] = await get_session_by_player_id(db, player.id)
    if not player_session:
        raise HTTPException(status_code=404, detail=f"No active session found for player: {player.name}")
    is_correct: bool = await update_score_and_stage_player_session(db, question, player_session, req.answer)
    await update_player_answer(db, player_session.id, question.id, req.answer, is_correct)
    game: Game = await get_game_by_name(db, req.game_name)
    if player_session.score >= game.winning_score:
        await end_session(db, player_session.id)
        return JSONResponse({"redirect": "/end"})
    new_question: Question = await get_random_question_by_game(db, game.id, player_session.id)
    if not new_question:
        raise HTTPException(status_code=404, detail="Question not found")
    player_session_answers: PlayerSessionAnswer = await get_wrong_questions(player_session)
    return JSONResponse({
        "is_correct": is_correct,
        "score": player_session.score,
        "question": new_question.text,
        "question_id": new_question.id,
        "stage": player_session.stage,
        "wrong_questions": player_session_answers.wrong_answer,
        "time_limit": time_limit
    })


@router.get("/end", response_class=HTMLResponse)
async def end_game(
    request: Request,
    current_player=Depends(get_current_player),
    db: Session = Depends(get_db)
):
    player_name = current_player.get("sub")
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    player_session: Optional[PlayerSession] = await get_session_by_player_id(db, player.id)
    if not player_session:
        raise HTTPException(status_code=404, detail="No active session found for player")
    top_players: List[PlayerScore] = await get_top_players(db, limit=5)
    return templates.TemplateResponse("end.html", {
        "request": request,
        "score": player_session.score,
        "player_name": player_name,
        "top_players": top_players
    })


@router.get("/api/game_end", tags=["Game"])
async def game_end_data(
    current_player=Depends(get_current_player),
    db: Session = Depends(get_db)
):
    player_name = current_player.get("sub")
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    player_session: Optional[PlayerSession] = await get_session_by_player_id(db, player.id)
    if not player_session:
        raise HTTPException(status_code=404, detail="No active session found for player")
    top_players: List[PlayerScore] = await get_top_players(db, limit=5)
    return {
        "score": player_session.score,
        "player_name": player_name,
        "top_players": [{"name": p.name, "score": p.score} for p in top_players]
    }


@router.get("/player_sessions_stats")
async def get_last_player_sessions_data(current_player=Depends(get_current_player),
                                        db: Session = Depends(get_db)):
    player_name = current_player.get("sub")
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    player_sessions: list[PlayerSession] = await get_last_player_sessions(db, player.id)
    player_stats_list: list[PlayerSessionAnswer] = [await get_wrong_questions(player_session) for player_session in player_sessions]

    return {"player_name": player_name, "player_stats": player_stats_list}


@router.get("/player_stats", response_class=HTMLResponse)
async def player_stats(request: Request):
    data = {"player_name": "דינו", "player_stats": []}  # כאן תשלוף ותכניס נתונים אמיתיים
    return templates.TemplateResponse("player_stats.html", {"request": request, **data})


class GameSettingsRequest(BaseModel):
    difficulty: int = 1
    winning_score: int = 5


@router.post("/set_game_settings")
async def set_game_settings(
    req: GameSettingsRequest,
    current_player=Depends(get_current_player),
    db: Session = Depends(get_db)
):
    player_name = current_player.get("sub")
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    player_session = await get_session_by_player_id(db, player.id)
    if not player_session:
        raise HTTPException(status_code=404, detail="No active session")
    await update_player_stage(session=db, player_session=player_session,
                              new_stage=req.difficulty)
    await update_winning_score(session=db, game_id=player_session.game_id,
                               new_winning_score=req.winning_score)

    return {"message": "Settings updated successfully"}
