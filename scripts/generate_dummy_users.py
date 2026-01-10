#!/usr/bin/env python3
"""
Script to generate dummy users with game sessions and statistics.
Creates 20 users with various game sessions and answers.
"""
import asyncio
import random
import sys
from pathlib import Path
from datetime import datetime, timedelta
import bcrypt
from sqlalchemy.orm import Session

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from infra.database import SessionLocal
from models import Player, Game, PlayerSession, PlayerAnswer, Question
from dal.player_dal import create_player
from dal.game_dal import get_game_by_name, create_game
from dal.player_session_dal import create_player_session, end_session
from dal.player_answer_dal import update_player_answer
from dal.question_dal import create_question, get_question_by_id
from infra.logger import log


# Hebrew names for dummy users
HEBREW_NAMES = [
    "יוסי", "שרה", "דני", "מיכל", "אורי", "נועה", "תומר", "ליאן",
    "רונן", "טל", "אלון", "מיכל", "יניב", "רותם", "עמית", "נועם",
    "ליאל", "תום", "גל", "יעל"
]

# Math questions templates for creating dummy questions
MATH_QUESTIONS = [
    ("מה זה 2 + 3?", 5, 1),
    ("מה זה 5 + 4?", 9, 1),
    ("מה זה 7 - 2?", 5, 1),
    ("מה זה 3 × 4?", 12, 2),
    ("מה זה 10 ÷ 2?", 5, 2),
    ("מה זה 6 + 8?", 14, 1),
    ("מה זה 9 - 5?", 4, 1),
    ("מה זה 4 × 3?", 12, 2),
    ("מה זה 15 ÷ 3?", 5, 2),
    ("מה זה 7 + 9?", 16, 1),
    ("מה זה 12 - 6?", 6, 1),
    ("מה זה 5 × 5?", 25, 2),
    ("מה זה 20 ÷ 4?", 5, 2),
    ("מה זה 8 + 7?", 15, 1),
    ("מה זה 11 - 4?", 7, 1),
    ("מה זה 6 × 4?", 24, 3),
    ("מה זה 18 ÷ 3?", 6, 2),
    ("מה זה 9 + 8?", 17, 1),
    ("מה זה 15 - 7?", 8, 1),
    ("מה זה 7 × 3?", 21, 3),
]


async def ensure_game_exists(db: Session) -> Game:
    """Ensure Math Game exists, create if not."""
    game = await get_game_by_name(db, "Math Game")
    if not game:
        game = await create_game(
            db,
            name="Math Game",
            winning_score=2,
            description="Solve math problems and race for the highest score"
        )
        log.info("Created Math Game")
    return game


async def ensure_questions_exist(db: Session, game_id: int) -> list[Question]:
    """Ensure we have questions for the game."""
    existing_questions = db.query(Question).filter(Question.game_id == game_id).all()
    
    if len(existing_questions) < 20:
        # Create questions if we don't have enough
        questions_to_create = []
        for text, correct_answer, difficulty in MATH_QUESTIONS:
            question = Question(
                game_id=game_id,
                text=text,
                correct_answer=correct_answer,
                difficulty=difficulty
            )
            questions_to_create.append(question)
            db.add(question)
        db.commit()
        for q in questions_to_create:
            db.refresh(q)
        log.info(f"Created {len(MATH_QUESTIONS)} questions")
        existing_questions = db.query(Question).filter(Question.game_id == game_id).all()
    
    return existing_questions


async def create_dummy_user(db: Session, name: str, age: int) -> Player:
    """Create a dummy user with hashed password."""
    hashed_password = bcrypt.hashpw("123456".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    player = await create_player(db, name=name, age=age, hashed_password=hashed_password)
    return player


async def create_dummy_session(
    db: Session,
    player: Player,
    game: Game,
    questions: list[Question],
    num_questions: int = None
) -> PlayerSession:
    """Create a dummy game session with answers."""
    if num_questions is None:
        num_questions = random.randint(3, 12)  # 3-12 questions per session
    
    # Create session
    session = await create_player_session(db, player_id=player.id, game_id=game.id)
    
    # Calculate start time (sessions spread over last 30 days)
    days_ago = random.randint(0, 30)
    hours_ago = random.randint(0, 23)
    start_time = datetime.now() - timedelta(days=days_ago, hours=hours_ago)
    session.started_at = start_time
    db.commit()
    
    score = 0
    stage = 1
    
    # Answer questions
    session_questions = random.sample(questions, min(num_questions, len(questions)))
    for i, question in enumerate(session_questions):
        # Higher chance of correct answer (60-80%)
        is_correct = random.random() > random.choice([0.2, 0.3, 0.4])
        
        if is_correct:
            player_answer = question.correct_answer
            score += 1
        else:
            # Wrong answer - random number close to correct
            player_answer = question.correct_answer + random.choice([-2, -1, 1, 2])
            if player_answer < 0:
                player_answer = abs(player_answer)
        
        # Update stage based on score
        if score > 9:
            stage = 2
        if score > 19:
            stage = 3
        
        # Create answer directly
        answer = PlayerAnswer(
            session_id=session.id,
            question_id=question.id,
            player_answer=player_answer,
            is_correct=is_correct,
            answered_at=start_time + timedelta(minutes=i * 2)
        )
        db.add(answer)
        session.score = score
        session.stage = stage
    
    db.commit()
    
    # End session (some sessions are completed, some not)
    if random.random() > 0.2:  # 80% of sessions are completed
        end_time = start_time + timedelta(minutes=num_questions * 2 + random.randint(1, 10))
        session.ended_at = end_time
        db.commit()
        # Clear leaderboard cache
        try:
            from infra.redis_client import redis_client
            import redis
            for limit in [10, 20, 50, 100]:
                cache_key = f"leaderboard:top:{limit}"
                redis_client.delete(cache_key)
        except (redis.ConnectionError, redis.TimeoutError, AttributeError):
            pass
    
    db.refresh(session)
    return session


async def generate_dummy_users(num_users: int = 20):
    """Generate dummy users with game sessions."""
    db: Session = SessionLocal()
    
    try:
        log.info(f"Starting to generate {num_users} dummy users...")
        
        # Ensure game exists
        game = await ensure_game_exists(db)
        log.info(f"Game ID: {game.id}")
        
        # Ensure questions exist
        questions = await ensure_questions_exist(db, game.id)
        log.info(f"Available questions: {len(questions)}")
        
        # Create users
        for i, name in enumerate(HEBREW_NAMES[:num_users]):
            try:
                # Check if user already exists
                existing = db.query(Player).filter(Player.name == name).first()
                if existing:
                    log.info(f"User '{name}' already exists, skipping...")
                    continue
                
                age = random.randint(5, 12)
                player = await create_dummy_user(db, name=name, age=age)
                log.info(f"Created user: {player.name} (ID: {player.id}, Age: {age})")
                
                # Create 1-5 sessions per user
                num_sessions = random.randint(1, 5)
                for session_num in range(num_sessions):
                    num_questions = random.randint(3, 15)
                    await create_dummy_session(db, player, game, questions, num_questions)
                    log.info(f"  Created session {session_num + 1}/{num_sessions} for {player.name}")
                
            except Exception as e:
                log.error(f"Error creating user {name}: {e}")
                db.rollback()
                continue
        
        log.info("Successfully generated dummy users!")
        
    except Exception as e:
        log.error(f"Error generating dummy users: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    num_users = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    asyncio.run(generate_dummy_users(num_users))

