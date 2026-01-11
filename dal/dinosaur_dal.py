from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from models import Dinosaur, Player, player_dinosaurs
from infra.logger import log


async def get_all_dinosaurs(session: Session) -> List[Dinosaur]:
    """
    Get all available dinosaurs in the system.
    """
    try:
        dinosaurs = session.query(Dinosaur).order_by(Dinosaur.id).all()
        return dinosaurs
    except SQLAlchemyError as e:
        log.error(f"Error fetching all dinosaurs: {e}")
        raise


async def get_player_dinosaurs(session: Session, player_id: int) -> List[Dinosaur]:
    """
    Get all dinosaurs unlocked by a specific player.
    """
    try:
        player = session.query(Player).filter(Player.id == player_id).first()
        if not player:
            return []
        return player.dinosaurs
    except SQLAlchemyError as e:
        log.error(f"Error fetching player dinosaurs: {e}")
        raise


async def unlock_dinosaur_for_player(session: Session, player_id: int, dinosaur_id: int) -> bool:
    """
    Unlock a dinosaur for a player (add to their collection).
    Returns True if successful, False if already unlocked.
    """
    try:
        player = session.query(Player).filter(Player.id == player_id).first()
        if not player:
            log.error(f"Player {player_id} not found")
            return False
        
        dinosaur = session.query(Dinosaur).filter(Dinosaur.id == dinosaur_id).first()
        if not dinosaur:
            log.error(f"Dinosaur {dinosaur_id} not found")
            return False
        
        # Check if already unlocked
        if dinosaur in player.dinosaurs:
            log.info(f"Player {player_id} already has dinosaur {dinosaur_id}")
            return False
        
        # Add dinosaur to player's collection
        player.dinosaurs.append(dinosaur)
        session.commit()
        log.info(f"Unlocked dinosaur {dinosaur_id} ({dinosaur.name}) for player {player_id}")
        return True
    except SQLAlchemyError as e:
        session.rollback()
        log.error(f"Error unlocking dinosaur for player: {e}")
        raise


async def select_dinosaur_for_player(session: Session, player_id: int, dinosaur_id: int) -> bool:
    """
    Select a dinosaur as the active one for a player.
    Returns True if successful, False if player doesn't have this dinosaur.
    """
    try:
        player = session.query(Player).filter(Player.id == player_id).first()
        if not player:
            log.error(f"Player {player_id} not found")
            return False
        
        dinosaur = session.query(Dinosaur).filter(Dinosaur.id == dinosaur_id).first()
        if not dinosaur:
            log.error(f"Dinosaur {dinosaur_id} not found")
            return False
        
        # Check if player has this dinosaur
        if dinosaur not in player.dinosaurs:
            log.warning(f"Player {player_id} doesn't have dinosaur {dinosaur_id}")
            return False
        
        # Set as selected dinosaur
        player.selected_dinosaur_id = dinosaur_id
        session.commit()
        log.info(f"Selected dinosaur {dinosaur_id} ({dinosaur.name}) for player {player_id}")
        return True
    except SQLAlchemyError as e:
        session.rollback()
        log.error(f"Error selecting dinosaur for player: {e}")
        raise


async def get_selected_dinosaur(session: Session, player_id: int) -> Optional[Dinosaur]:
    """
    Get the currently selected dinosaur for a player.
    """
    try:
        player = session.query(Player).filter(Player.id == player_id).first()
        if not player or not player.selected_dinosaur_id:
            return None
        return player.selected_dinosaur
    except SQLAlchemyError as e:
        log.error(f"Error fetching selected dinosaur: {e}")
        raise


