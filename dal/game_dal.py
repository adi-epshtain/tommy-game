from models import Game
from sqlalchemy.orm import Session
from typing import Optional, List


def create_game(session: Session, name: str, description: Optional[str] = None) -> Game:
    new_game = Game(name=name, description=description)
    session.add(new_game)
    session.commit()
    session.refresh(new_game)
    return new_game


def get_game_by_name(session: Session, game_name: str) -> Optional[Game]:
    return session.query(Game).filter(Game.name == game_name).first()
#
#
# def list_games(session: Session) -> List[Game]:
#     return session.query(Game).all()
#
#
# def update_game(session: Session, game_id: int, name: Optional[str] = None, description: Optional[str] = None) -> Optional[Game]:
#     game = session.query(Game).filter(Game.id == game_id).first()
#     if not game:
#         return None
#     if name is not None:
#         game.name = name
#     if description is not None:
#         game.description = description
#     session.commit()
#     return game
#
#
# def delete_game(session: Session, game_id: int) -> Optional[Game]:
#     game = session.query(Game).filter(Game.id == game_id).first()
#     if game:
#         session.delete(game)
#         session.commit()
#     return game
