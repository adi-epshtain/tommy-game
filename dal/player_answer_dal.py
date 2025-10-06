from sqlalchemy.orm import Session

from models import PlayerSession, PlayerAnswer


async def get_wrong_questions(player_session: PlayerSession) -> list[str]:
    results = [
        f"{answer.question.text} {answer.player_answer} (תשובה נכונה: {answer.question.correct_answer})"
        for answer in player_session.answers
        if not answer.is_correct
    ]
    return results


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
