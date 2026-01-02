from sqlalchemy.exc import SQLAlchemyError
from infra.redis_client import redis_client
import redis
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


async def get_player_by_name(
    session: Session,
    player_name: str,
) -> Optional[Player]:
    cache_key = f"player:name:{player_name}"

    # Try to get from cache
    try:
        cached = redis_client.get(cache_key)
        if cached:
            player_id = int(cached)
            return session.get(Player, player_id)
    except (redis.ConnectionError, redis.TimeoutError, AttributeError):
        pass  # Redis unavailable, skip caching and continue with database query


    player = (
        session.query(Player)
        .filter(Player.name == player_name)
        .first()
    )

    if not player:
        return None

    # Try to cache the result
    try:
        redis_client.setex(
            cache_key,
            120,
            str(player.id),
        )
    except (redis.ConnectionError, redis.TimeoutError, AttributeError):
        pass  # Redis unavailable, skip caching

    return player


async def delete_player(session: Session, player_id: int) -> Optional[Player]:
    player = session.query(Player).filter(Player.id == player_id).first()
    if player:
        session.delete(player)
        session.commit()
    return player
