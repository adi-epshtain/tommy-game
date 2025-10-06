from sqlalchemy import func

from models import Question
from sqlalchemy.orm import Session
from typing import Optional, List, Dict


def create_question(
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


def get_question_by_id(session: Session, question_id: int) -> Optional[Question]:
    return session.query(Question).filter(Question.id == question_id).first()


def list_questions_by_game(session: Session, game_id: int) -> List[Question]:
    return session.query(Question).filter(Question.game_id == game_id).all()


async def get_random_question_by_game(session: Session, game_id: int) -> Question | None:
    question = session.query(Question).filter(Question.game_id == game_id)\
        .order_by(func.random()).first()
    return question if question else None


def delete_question(session: Session, question_id: int) -> Optional[Question]:
    question = session.query(Question).filter(Question.id == question_id).first()
    if question:
        session.delete(question)
        session.commit()
    return question
