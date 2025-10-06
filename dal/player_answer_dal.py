from sqlalchemy.orm import Session

from models import PlayerSession


async def get_wrong_questions(player_session: PlayerSession) -> list[str]:
    results = [
        answer.question.text
        for answer in player_session.answers
        if not answer.is_correct
    ]
    return results
