from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from models import PlayerSession, PlayerAnswer


async def update_player_answer(session: Session, player_session_id: int,
                               question_id: int, player_answer: int,
                               is_correct: bool) -> None:
    player_answer = PlayerAnswer(
        session_id=player_session_id,
        question_id=question_id,
        player_answer=player_answer,
        is_correct=is_correct
    )
    session.add(player_answer)
    session.commit()


@dataclass
class PlayerSessionAnswer:
    wrong_answer: list[str]
    correct_count: int
    incorrect_count: int
    started_at: Optional[str]


async def get_wrong_questions(player_session: PlayerSession) -> PlayerSessionAnswer:
    incorrect_count = 0
    correct_count = 0
    wrong_questions = []

    for answer in player_session.answers:
        if answer.is_correct:
            correct_count += 1
        else:
            incorrect_count += 1
            wrong_questions.append(f"{answer.question.text} {answer.player_answer} (תשובה נכונה: {answer.question.correct_answer})")
    formatted_time = player_session.started_at.strftime("%d/%m/%Y %H:%M") if player_session.started_at else ""
    return PlayerSessionAnswer(wrong_answer=wrong_questions,
                               correct_count=correct_count,
                               incorrect_count=incorrect_count,
                               started_at=formatted_time)




