from typing import List
import json

from dal.game_dal import get_game_by_name
from database import SessionLocal
from models import Question
from sqlalchemy.orm import Session
from dal.game_dal import create_game


def add_math_game_if_not_exists(session: Session,
                                game_name: str,
                                description: str):
    game = get_game_by_name(session, game_name)
    if not game:

        game = await create_game(session, name=game_name, description=description)
        print(f"Game '{game_name}' created.")
    else:
        print(f"Game '{game_name}' already exists.")
    return game


def insert_math_stock_questions(session: Session, filename: str,
                                game_name: str="Math Game"):
    game = get_game_by_name(session, game_name)
    if not game:
        raise ValueError(f"Game '{game_name}'"
                         f" does not exist. Please create it first.")

    questions_batch: List[Question] = []
    batch_size = 100
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

                if len(questions_batch) == batch_size:
                    session.bulk_save_objects(questions_batch)
                    session.commit()
                    questions_batch.clear()

            # Save remaining questions in the last batch
            if questions_batch:
                session.bulk_save_objects(questions_batch)
                session.commit()
        print("Stock questions inserted successfully.")
    except FileNotFoundError:
        print(f"File '{filename}' not found.")
    except Exception as e:
        session.rollback()
        print(f"An error occurred: {e}")


def main():
    session: Session = SessionLocal()
    math_questions_file = r"..\resources\math_stock_questions.jsonl"
    try:
        add_math_game_if_not_exists(session,
                                    game_name="Math Game",
                                    description="Default")
        insert_math_stock_questions(session,
                                    filename=math_questions_file)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()


if __name__ == "__main__":
    main()
