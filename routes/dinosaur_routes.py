from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from infra.database import get_db
from auth_utils import get_current_player
from dal.dinosaur_dal import (
    get_all_dinosaurs,
    get_player_dinosaurs,
    unlock_dinosaur_for_player,
    select_dinosaur_for_player,
    get_selected_dinosaur
)
from dal.player_dal import get_player_by_name

router = APIRouter()


class DinosaurResponse(BaseModel):
    id: int
    name: str
    image_path: str
    description: str | None
    rarity: str

    class Config:
        from_attributes = True


class UnlockDinosaurRequest(BaseModel):
    dinosaur_id: int


class SelectDinosaurRequest(BaseModel):
    dinosaur_id: int


@router.get("/dinosaurs/available", tags=["Dinosaurs"], response_model=List[DinosaurResponse])
async def get_available_dinosaurs(
    current_player: dict = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    """
    Get all available dinosaurs in the system.
    """
    try:
        dinosaurs = await get_all_dinosaurs(db)
        return [DinosaurResponse(
            id=d.id,
            name=d.name,
            image_path=d.image_path,
            description=d.description,
            rarity=d.rarity
        ) for d in dinosaurs]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dinosaurs: {str(e)}"
        )


@router.get("/dinosaurs/my-collection", tags=["Dinosaurs"], response_model=List[DinosaurResponse])
async def get_my_dinosaurs(
    current_player: dict = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    """
    Get all dinosaurs unlocked by the current player.
    """
    try:
        player_name = current_player.get("sub")
        player = await get_player_by_name(db, player_name)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        dinosaurs = await get_player_dinosaurs(db, player.id)
        return [DinosaurResponse(
            id=d.id,
            name=d.name,
            image_path=d.image_path,
            description=d.description,
            rarity=d.rarity
        ) for d in dinosaurs]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching player dinosaurs: {str(e)}"
        )


@router.get("/dinosaurs/selected", tags=["Dinosaurs"], response_model=DinosaurResponse | None)
async def get_my_selected_dinosaur(
    current_player: dict = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    """
    Get the currently selected dinosaur for the current player.
    """
    try:
        player_name = current_player.get("sub")
        player = await get_player_by_name(db, player_name)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        dinosaur = await get_selected_dinosaur(db, player.id)
        if not dinosaur:
            return None
        
        return DinosaurResponse(
            id=dinosaur.id,
            name=dinosaur.name,
            image_path=dinosaur.image_path,
            description=dinosaur.description,
            rarity=dinosaur.rarity
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching selected dinosaur: {str(e)}"
        )


@router.post("/dinosaurs/unlock", tags=["Dinosaurs"])
async def unlock_dinosaur(
    req: UnlockDinosaurRequest,
    current_player: dict = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    """
    Unlock a dinosaur for the current player (add to their collection).
    This is typically called after a player wins a game.
    If the dinosaur is already unlocked, it will just be selected.
    """
    try:
        player_name = current_player.get("sub")
        player = await get_player_by_name(db, player_name)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Check if dinosaur exists
        from dal.dinosaur_dal import get_all_dinosaurs
        dinosaurs = await get_all_dinosaurs(db)
        dinosaur = next((d for d in dinosaurs if d.id == req.dinosaur_id), None)
        if not dinosaur:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dinosaur not found"
            )
        
        # Try to unlock (if already unlocked, this will return False but that's OK)
        success = await unlock_dinosaur_for_player(db, player.id, req.dinosaur_id)
        
        # If already unlocked, just select it
        if not success:
            # Check if player actually has this dinosaur
            player_dinosaurs = await get_player_dinosaurs(db, player.id)
            has_dinosaur = any(d.id == req.dinosaur_id for d in player_dinosaurs)
            if not has_dinosaur:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to unlock dinosaur"
                )
            # Already has it, just select it
            await select_dinosaur_for_player(db, player.id, req.dinosaur_id)
            return {"message": "Dinosaur already unlocked, selected successfully", "dinosaur_id": req.dinosaur_id, "already_unlocked": True}
        
        # Newly unlocked, also select it
        await select_dinosaur_for_player(db, player.id, req.dinosaur_id)
        return {"message": "Dinosaur unlocked and selected successfully", "dinosaur_id": req.dinosaur_id, "already_unlocked": False}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error unlocking dinosaur: {str(e)}"
        )


@router.post("/dinosaurs/select", tags=["Dinosaurs"])
async def select_dinosaur(
    req: SelectDinosaurRequest,
    current_player: dict = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    """
    Select a dinosaur as the active one for the current player.
    The player must already have this dinosaur in their collection.
    """
    try:
        player_name = current_player.get("sub")
        player = await get_player_by_name(db, player_name)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        success = await select_dinosaur_for_player(db, player.id, req.dinosaur_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Dinosaur not found in player's collection"
            )
        
        return {"message": "Dinosaur selected successfully", "dinosaur_id": req.dinosaur_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error selecting dinosaur: {str(e)}"
        )

