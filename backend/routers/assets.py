# backend/routers/assets.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Asset, AssetType
from schemas import AssetCreate, AssetUpdate, AssetResponse, AssetListResponse

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("", response_model=List[AssetResponse])
def list_assets(
    project_id: Optional[int] = Query(None),
    type: Optional[AssetType] = Query(None),
    is_global: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Asset)

    if project_id is not None:
        query = query.filter(Asset.project_id == project_id)
    if type is not None:
        query = query.filter(Asset.type == type)
    if is_global is not None:
        query = query.filter(Asset.is_global == is_global)

    assets = query.order_by(Asset.name).all()
    return assets


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    db_asset = Asset(**asset.model_dump())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(asset_id: int, asset: AssetUpdate, db: Session = Depends(get_db)):
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    for key, value in asset.model_dump(exclude_unset=True).items():
        setattr(db_asset, key, value)

    db.commit()
    db.refresh(db_asset)
    return db_asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
