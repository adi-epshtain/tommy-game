from dataclasses import dataclass

from sqlalchemy import desc

from logger import log
from models import PlayerSession, Question, Player
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Type
from datetime import datetime


async def create_player_session(session: Session, player_id: int, game_id: int) -> PlayerSession:
    new_session = PlayerSession(player_id=player_id, game_id=game_id)
    session.add(new_session)
    session.commit()
    session.refresh(new_session)
    return new_session


async def get_session_by_player_id(session: Session, player_id: int) -> Optional[PlayerSession]:
    player_session: Optional[PlayerSession] = (
        session.query(PlayerSession)
        .filter(PlayerSession.player_id == player_id)
        .order_by(
            PlayerSession.id.desc())
        .first()
    )
    return player_session


async def end_session(session: Session, session_id: int) -> Optional[PlayerSession]:
    player_session: Optional[PlayerSession] = (
        session.query(PlayerSession)
        .filter(PlayerSession.id == session_id)
        .first()
    )
    if not player_session:
        return None
    player_session.ended_at = datetime.utcnow()
    session.commit()
    return player_session


async def update_score_and_stage_player_session(session: Session, question: Question,
                                                player_session: PlayerSession, answer: int) -> bool:
    is_correct: bool = question.correct_answer == answer
    if is_correct:
        player_session.score += 1
    else:
        if player_session.score > 0:
            player_session.score -= 1
    if player_session.score > 2:  # TODO:
        player_session.stage += 1
    session.commit()
    return is_correct


async def update_player_stage(session: Session, player_session: PlayerSession, new_stage: int=1):
    player_session.stage = new_stage
    session.commit()
    log.info(f"player session update stage : {new_stage}")


@dataclass
class PlayerScore:
    name: str
    score: int


async def get_top_players(session: Session, limit: int = 10) -> List[PlayerScore]:
    top_players: List[tuple[str, int]] = (
        session.query(Player.name, PlayerSession.score)
        .join(Player, Player.id == PlayerSession.player_id)  # type: ignore
        .order_by(PlayerSession.score.desc(),
                  PlayerSession.ended_at.desc())
        .limit(limit)
        .all()
    )
    return [PlayerScore(name=row[0], score=row[1]) for row in top_players]


async def get_last_player_sessions(session: Session, player_id: int,
                                   limit_num=10) -> list[PlayerSession]:
    player_sessions = (
        session.query(PlayerSession)
        .options(joinedload(PlayerSession.answers))
        .filter(PlayerSession.player_id == player_id)
        .order_by(desc(PlayerSession.ended_at))
        .limit(limit_num)
        .all()
    )
    return player_sessions
