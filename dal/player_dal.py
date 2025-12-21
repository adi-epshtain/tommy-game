from sqlalchemy.exc import SQLAlchemyError

from infra.logger import log
from models import Player
from sqlalchemy.orm import Session
from typing import Optional


async def create_player(session: Session, name: str, age: int,  hashed_password: str) -> Optional[Player]:
    try:
        player = Player(name=name, age=age, password=hashed_password)
        session.add(player)
        session.commit()
        return player
    except SQLAlchemyError as e:
        session.rollback()
        log.error(f"Error creating player: {e}")
        return None


async def get_player_by_id(session: Session, player_id: int) -> Optional[Player]:
    player = session.query(Player).filter(Player.id == player_id).first() or None
    return player


async def get_player_by_name(session: Session, player_name: str) -> Optional[Player]:
    player = session.query(Player).filter(Player.name == player_name).first() or None
    return player


async def delete_player(session: Session, player_id: int) -> Optional[Player]:
    player = session.query(Player).filter(Player.id == player_id).first()
    if player:
        session.delete(player)
        session.commit()
    return player
