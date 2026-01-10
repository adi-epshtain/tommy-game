from sqlalchemy.exc import SQLAlchemyError
from infra.redis_client import redis_client
import redis
from infra.logger import log
from models import Player, PlayerSession, PlayerAnswer
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
    """
    Delete player and all related data (sessions, answers).
    Returns the deleted player if found, None otherwise.
    """
    try:
        player = session.query(Player).filter(Player.id == player_id).first()
        if not player:
            return None

        # Delete all player answers (through sessions)
        player_sessions = session.query(PlayerSession).filter(
            PlayerSession.player_id == player_id
        ).all()
        
        for ps in player_sessions:
            # Delete all answers for this session
            session.query(PlayerAnswer).filter(
                PlayerAnswer.session_id == ps.id
            ).delete()

        # Delete all player sessions
        session.query(PlayerSession).filter(
            PlayerSession.player_id == player_id
        ).delete()

        # Delete the player
        session.delete(player)
        session.commit()

        # Clear Redis cache for this player
        try:
            redis_client.delete(f"player:name:{player.name}")
            redis_client.delete(f"player:{player_id}:last_sessions:*")
            # Clear leaderboard cache
            for limit in [10, 20, 50, 100]:
                redis_client.delete(f"leaderboard:top:{limit}")
        except (redis.ConnectionError, redis.TimeoutError, AttributeError):
            pass  # Redis unavailable, skip cache clearing

        log.info(f"Deleted player {player_id} ({player.name}) and all related data")
        return player
    except SQLAlchemyError as e:
        session.rollback()
        log.error(f"Error deleting player {player_id}: {e}")
        raise


async def exclude_player_from_leaderboard(session: Session, player_id: int) -> Optional[Player]:
    """
    Exclude player from leaderboard.
    Returns the updated player if found, None otherwise.
    """
    try:
        player = session.query(Player).filter(Player.id == player_id).first()
        if not player:
            return None
        
        player.excluded_from_leaderboard = True
        session.commit()
        
        # Clear leaderboard cache since player was excluded
        try:
            for limit in [10, 20, 50, 100]:
                redis_client.delete(f"leaderboard:top:{limit}")
        except (redis.ConnectionError, redis.TimeoutError, AttributeError):
            pass  # Redis unavailable, skip cache clearing
        
        log.info(f"Excluded player {player_id} ({player.name}) from leaderboard")
        return player
    except SQLAlchemyError as e:
        session.rollback()
        log.error(f"Error excluding player {player_id} from leaderboard: {e}")
        raise


async def include_player_in_leaderboard(session: Session, player_id: int) -> Optional[Player]:
    """
    Include player back in leaderboard (remove exclusion).
    Returns the updated player if found, None otherwise.
    """
    try:
        player = session.query(Player).filter(Player.id == player_id).first()
        if not player:
            return None
        
        player.excluded_from_leaderboard = False
        session.commit()
        
        # Clear leaderboard cache since player was included back
        try:
            for limit in [10, 20, 50, 100]:
                redis_client.delete(f"leaderboard:top:{limit}")
        except (redis.ConnectionError, redis.TimeoutError, AttributeError):
            pass  # Redis unavailable, skip cache clearing
        
        log.info(f"Included player {player_id} ({player.name}) back in leaderboard")
        return player
    except SQLAlchemyError as e:
        session.rollback()
        log.error(f"Error including player {player_id} back in leaderboard: {e}")
        raise
