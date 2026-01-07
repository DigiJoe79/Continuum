# backend/routers/variants.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Variant, Asset
from schemas import VariantCreate, VariantUpdate, VariantDetailResponse

router = APIRouter(prefix="/api/variants", tags=["variants"])


@router.post("", response_model=VariantDetailResponse, status_code=status.HTTP_201_CREATED)
def create_variant(variant: VariantCreate, db: Session = Depends(get_db)):
    # Verify asset exists
    asset = db.query(Asset).filter(Asset.id == variant.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    db_variant = Variant(**variant.model_dump())
    db.add(db_variant)
    db.commit()
    db.refresh(db_variant)
    return db_variant


@router.get("/{variant_id}", response_model=VariantDetailResponse)
def get_variant(variant_id: int, db: Session = Depends(get_db)):
    variant = db.query(Variant).filter(Variant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    return variant


@router.put("/{variant_id}", response_model=VariantDetailResponse)
def update_variant(variant_id: int, variant: VariantUpdate, db: Session = Depends(get_db)):
    db_variant = db.query(Variant).filter(Variant.id == variant_id).first()
    if not db_variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    for key, value in variant.model_dump(exclude_unset=True).items():
        setattr(db_variant, key, value)

    db.commit()
    db.refresh(db_variant)
    return db_variant


@router.delete("/{variant_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_variant(variant_id: int, db: Session = Depends(get_db)):
    variant = db.query(Variant).filter(Variant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    db.delete(variant)
    db.commit()
