from dataclasses import dataclass

from models import PlayerSession, Question, Player
from sqlalchemy.orm import Session
from typing import Optional, List
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


async def update_session_score(session: Session, session_id: int, new_score: int) -> Optional[PlayerSession]:
    player_session: Optional[PlayerSession] = (
        session.query(PlayerSession)
        .filter(PlayerSession.id == session_id)
        .first()
    )
    if not player_session:
        return None
    player_session.score = new_score
    session.commit()
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


async def update_player_session(session: Session, question: Question,
                                player_session: PlayerSession, answer: int) -> bool:
    is_correct: bool = question.correct_answer == answer
    if is_correct:
        player_session.score += 1
    else:
        if player_session.score > 0:
            player_session.score -= 1
    if player_session.score > 2:
        player_session.stage += 1
    session.commit()
    return is_correct


@dataclass
class PlayerScore:
    name: str
    score: int


async def get_top_players(db: Session, limit: int = 10) -> List[PlayerScore]:
    top_players: List[tuple[str, int]] = (
        db.query(Player.name, PlayerSession.score)
        .join(Player, Player.id == PlayerSession.player_id)  # type: ignore
        .order_by(PlayerSession.score.desc(),
                  PlayerSession.ended_at.desc())
        .limit(limit)
        .all()
    )
    return [PlayerScore(name=row[0], score=row[1]) for row in top_players]
