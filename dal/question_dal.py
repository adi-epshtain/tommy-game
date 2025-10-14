from sqlalchemy import func, select

from models import Question, PlayerAnswer, PlayerSession
from sqlalchemy.orm import Session
from typing import Optional, List, Dict


async def create_question(
    session: Session,
    game_id: int,
    text: str,
    correct_answer: int,
    difficulty: int = 1,
    extra_data: Optional[Dict] = None
) -> Question:
    new_question = Question(
        game_id=game_id,
        text=text,
        correct_answer=correct_answer,
        difficulty=difficulty,
        extra_data=extra_data
    )
    session.add(new_question)
    session.commit()
    session.refresh(new_question)
    return new_question


async def get_question_by_id(session: Session, question_id: int) -> Optional[Question]:
    return session.query(Question).filter(Question.id == question_id).first()


async def list_questions_by_game(session: Session, game_id: int) -> List[Question]:
    questions = session.scalars(
        select(Question).where(Question.game_id == game_id)
    )
    return list(questions)


async def get_random_question_by_game(session: Session, game_id: int,
                                      player_session_id: int) -> Question | None:
    # Get player's current stage
    player_stage: int = (
        session.query(PlayerSession.stage)
        .filter(PlayerSession.id == player_session_id)
        .scalar()
    )

    # Select a random question matching the stage (difficulty)
    question = (
        session.query(Question)
        .filter(
            Question.game_id == game_id,
            Question.difficulty == player_stage,  # match stage difficulty
            ~Question.id.in_(
                session.query(PlayerAnswer.question_id)
                .filter(PlayerAnswer.session_id == player_session_id)
            ),
        )
        .order_by(func.random())
        .first()
    )

    return question


async def delete_question(session: Session, question_id: int) -> Optional[Question]:
    question = session.query(Question).filter(Question.id == question_id).first()
    if question:
        session.delete(question)
        session.commit()
    return question
