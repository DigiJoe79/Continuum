# backend/routers/scenes.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Scene, Asset, AssetType
from schemas import SceneCreate, SceneUpdate, SceneResponse, GeneratePromptRequest

router = APIRouter(prefix="/api/scenes", tags=["scenes"])


@router.get("", response_model=List[SceneResponse])
def list_scenes(
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Scene)
    if project_id is not None:
        query = query.filter(Scene.project_id == project_id)
    return query.order_by(Scene.created_at).all()


@router.post("", response_model=SceneResponse, status_code=status.HTTP_201_CREATED)
def create_scene(scene: SceneCreate, db: Session = Depends(get_db)):
    db_scene = Scene(**scene.model_dump())
    db.add(db_scene)
    db.commit()
    db.refresh(db_scene)
    return db_scene


@router.get("/{scene_id}", response_model=SceneResponse)
def get_scene(scene_id: int, db: Session = Depends(get_db)):
    scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.put("/{scene_id}", response_model=SceneResponse)
def update_scene(scene_id: int, scene: SceneUpdate, db: Session = Depends(get_db)):
    db_scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not db_scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    for key, value in scene.model_dump(exclude_unset=True).items():
        setattr(db_scene, key, value)

    db.commit()
    db.refresh(db_scene)
    return db_scene


@router.delete("/{scene_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_scene(scene_id: int, db: Session = Depends(get_db)):
    scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    db.delete(scene)
    db.commit()


@router.post("/{scene_id}/generate", response_model=SceneResponse)
def generate_prompt(
    scene_id: int,
    request: GeneratePromptRequest,
    db: Session = Depends(get_db)
):
    from services.prompt_engine import generate_scene_prompt

    scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    # Get default style if not specified
    style_id = request.style_id
    if style_id is None and scene.style_id:
        style_id = scene.style_id
    if style_id is None:
        default_style = db.query(Asset).filter(
            Asset.type == AssetType.STYLE,
            Asset.is_global == True,
            Asset.name == "Cinematic"
        ).first()
        if default_style:
            style_id = default_style.id

    # Update scene lighting if provided
    if request.lighting_id is not None:
        scene.lighting_id = request.lighting_id

    generated = generate_scene_prompt(scene, style_id, db)
    scene.generated_prompt = generated
    db.commit()
    db.refresh(scene)

    return scene
