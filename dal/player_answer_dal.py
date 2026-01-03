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
    
    # Return ISO format timestamp (UTC) - frontend will format to local time
    if player_session.started_at:
        # Ensure UTC timezone and return ISO format string
        if player_session.started_at.tzinfo is None:
            # If timezone-naive, assume UTC
            from datetime import timezone
            utc_time = player_session.started_at.replace(tzinfo=timezone.utc)
        else:
            # Convert to UTC if not already
            utc_time = player_session.started_at.astimezone(timezone.utc)
        formatted_time = utc_time.isoformat()
    else:
        formatted_time = ""
    
    return PlayerSessionAnswer(wrong_answer=wrong_questions,
                               correct_count=correct_count,
                               incorrect_count=incorrect_count,
                               started_at=formatted_time)




