from dataclasses import asdict, dataclass
import json
from sqlalchemy import desc
from infra.logger import log
from models import PlayerSession, Question, Player
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import datetime
from infra.redis_client import redis_client
import redis


async def should_advance_stage(session: Session, player_id: int, current_stage: int) -> bool:
    """
    בודק אם השחקן מוכן לעלות רמה לפי ביצועים בסשנים קודמים.
    תנאים לעלייה ברמה:
    - לפחות 3 סשנים ברמה הנוכחית
    - אחוז הצלחה של לפחות 75% בכל הסשנים
    - רק סשנים שנסיימו (ended_at לא null)
    """
    from models import PlayerAnswer
    
    # קבל את כל הסשנים שנסיימו ברמה הנוכחית
    completed_sessions = (
        session.query(PlayerSession)
        .filter(
            PlayerSession.player_id == player_id,
            PlayerSession.stage == current_stage,
            PlayerSession.ended_at.isnot(None)
        )
        .order_by(PlayerSession.ended_at.desc())
        .limit(5)  # בודק את 5 הסשנים האחרונים
        .all()
    )
    
    # צריך לפחות 3 סשנים
    if len(completed_sessions) < 3:
        return False
    
    # בדוק אחוז הצלחה בכל הסשנים
    total_correct = 0
    total_answers = 0
    
    for ps in completed_sessions:
        answers = (
            session.query(PlayerAnswer)
            .filter(PlayerAnswer.session_id == ps.id)
            .all()
        )
        
        for answer in answers:
            total_answers += 1
            if answer.is_correct:
                total_correct += 1
    
    if total_answers == 0:
        return False
    
    success_rate = (total_correct / total_answers) * 100
    
    # צריך לפחות 75% הצלחה
    return success_rate >= 75.0


async def create_player_session_with_stage(session: Session, player_id: int, game_id: int, stage: int) -> PlayerSession:
    """
    יוצר סשן חדש ברמה ספציפית (בשימוששחקן מאשר לעלות רמה).
    """
    new_session = PlayerSession(player_id=player_id, game_id=game_id, stage=stage)
    session.add(new_session)
    session.commit()
    session.refresh(new_session)
    log.info(f"Created session for player {player_id} at stage {stage}")
    return new_session


async def create_player_session(session: Session, player_id: int, game_id: int) -> PlayerSession:
    """
    יוצר סשן חדש עם רמה שנקבעת לפי ביצועים בסשנים קודמים.
    בודק הדרגתית: אם השחקן מוכן לרמה גבוהה יותר, מתחיל ברמה הזו.
    - מתחיל ברמה 1
    - אם היו 3+ סשנים טובים ברמה 1 (75%+ הצלחה), הסשן הבא יתחיל ברמה 2
    - אם היו 3+ סשנים טובים ברמה 2, הסשן הבא יתחיל ברמה 3
    - וכן הלאה...
    """
    initial_stage = 1
    
    # בדוק הדרגתית מה הרמה הגבוהה ביותר שהשחקן מוכן לה
    # מתחילים מרמה 1 ובודקים עד כמה אפשר לעלות
    max_stage_to_check = 5  # בודקים עד רמה 5
    
    for stage in range(1, max_stage_to_check + 1):
        if await should_advance_stage(session, player_id, current_stage=stage):
            initial_stage = stage + 1
            log.info(f"Player {player_id} ready for stage {initial_stage} based on {stage} performance")
        else:
            # אם לא מוכן לרמה הבאה, נשארים ברמה הנוכחית
            break
    
    new_session = PlayerSession(player_id=player_id, game_id=game_id, stage=initial_stage)
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
    player_session.ended_at = datetime.now()
    session.commit()
    
    # Clear leaderboard cache when a game ends
    try:
        # Delete all leaderboard cache keys (for different limits)
        for limit in [10, 20, 50, 100]:
            cache_key = f"leaderboard:top:{limit}"
            redis_client.delete(cache_key)
    except (redis.ConnectionError, redis.TimeoutError, AttributeError):
        pass  # Redis unavailable, skip cache clearing
    
    return player_session


async def update_score_and_stage_player_session(session: Session, question: Question,
                                                player_session: PlayerSession, answer: int) -> bool:
    """
    מעדכן ניקוד בלבד - הרמה לא עולה בתוך סשן בודד.
    הרמה נקבעת רק בתחילת סשן חדש לפי ביצועים בסשנים קודמים.
    """
    is_correct: bool = question.correct_answer == answer
    if is_correct:
        player_session.score += 1
    else:
        if player_session.score > 0:
            player_session.score -= 1
    
    # לא מעלים רמה בתוך סשן - הרמה נשארת קבועה לכל הסשן
    # הרמה תיקבע רק בתחילת סשן חדש לפי ביצועים בסשנים קודמים
    
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
    cache_key = f"leaderboard:top:{limit}"
    
    # Try to get from cache
    try:
        cached = redis_client.get(cache_key)
        if cached:
            data = json.loads(cached)
            return [PlayerScore(**row) for row in data]
    except (redis.ConnectionError, redis.TimeoutError, AttributeError):
        pass  # Redis unavailable, skip caching and continue with database query
    
    # מסנן רק sessions שנסיימו ומשפר את הביצועים
    top_players: List[tuple[str, int]] = (
        session.query(Player.name, PlayerSession.score)
        .join(Player, Player.id == PlayerSession.player_id)  # type: ignore
        .filter(PlayerSession.ended_at.isnot(None))  # רק sessions שנסיימו
        .order_by(PlayerSession.score.desc(),
                  PlayerSession.ended_at.desc())
        .limit(limit)
        .all()
    )
    result = [PlayerScore(name=row[0], score=row[1]) for row in top_players]

    # Try to cache the result
    try:
        redis_client.setex(
            cache_key,
            300,  # 5 דקות
            json.dumps([asdict(r) for r in result]),
        )
    except (redis.ConnectionError, redis.TimeoutError, AttributeError):
        pass  # Redis unavailable, skip caching

    return result

async def get_last_player_sessions(
    session: Session,
    player_id: int,
    limit_num: int = 10,
) -> list[PlayerSession]:
    cache_key = f"player:{player_id}:last_sessions:{limit_num}"

    # Try to get from cache
    try:
        cached = redis_client.get(cache_key)
        if cached:
            ids: list[int] = json.loads(cached)
            return (
                session.query(PlayerSession)
                .options(joinedload(PlayerSession.answers))
                .filter(PlayerSession.id.in_(ids))
                .filter(PlayerSession.ended_at.isnot(None))  # Only completed sessions
                .order_by(desc(PlayerSession.ended_at))
                .all()
            )
    except (redis.ConnectionError, redis.TimeoutError, AttributeError):
        pass  # Redis unavailable, continue without cache

    player_sessions = (
        session.query(PlayerSession)
        .options(joinedload(PlayerSession.answers))
        .filter(PlayerSession.player_id == player_id)
        .filter(PlayerSession.ended_at.isnot(None))  # Only completed sessions
        .order_by(desc(PlayerSession.ended_at))
        .limit(limit_num)
        .all()
    )

    # Try to cache the result
    try:
        redis_client.setex(
            cache_key,
            120,
            json.dumps([ps.id for ps in player_sessions]),
        )
    except (redis.ConnectionError, redis.TimeoutError, AttributeError):
        pass  # Redis unavailable, skip caching

    return player_sessions