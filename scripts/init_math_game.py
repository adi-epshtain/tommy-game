from typing import List, Optional
import json
from dal.game_dal import get_game_by_name
from infra.logger import log
from models import Question, Game
from sqlalchemy.orm import Session

BATCH_SIZE = 100


async def insert_math_stock_questions(session: Session, filename: str,
                                      game_name: str):
    game: Optional[Game] = await get_game_by_name(session, game_name)
    if not game:
        raise ValueError(f"Game '{game_name}'"
                         f" does not exist. Please create it first.")

    questions_batch: List[Question] = []
    try:
        with open(filename, encoding="utf-8") as f:
            for line in f:
                q: dict = json.loads(line)
                question = Question(
                    game_id=game.id,
                    text=q["text"],
                    correct_answer=q["correct_answer"],
                    difficulty=q.get("difficulty", 1)
                )
                questions_batch.append(question)

                if len(questions_batch) == BATCH_SIZE:
                    session.bulk_save_objects(questions_batch)
                    session.commit()
                    questions_batch.clear()

            # Save remaining questions in the last batch
            if questions_batch:
                session.bulk_save_objects(questions_batch)
                session.commit()
        log.info("Stock questions inserted successfully.")
    except FileNotFoundError:
        log.error(f"File '{filename}' not found.")
    except Exception as e:
        session.rollback()
        log.error(f"insert math stock questions failed with error: {e}")

