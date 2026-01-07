# backend/schemas/asset.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from models.asset import AssetType


class VariantResponse(BaseModel):
    id: int
    name: str
    delta_prompt: str
    created_at: datetime

    class Config:
        from_attributes = True


class AssetBase(BaseModel):
    name: str
    type: AssetType
    base_prompt: str = ""
    is_global: bool = False


class AssetCreate(AssetBase):
    project_id: Optional[int] = None


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    base_prompt: Optional[str] = None


class AssetResponse(AssetBase):
    id: int
    project_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    variants: List[VariantResponse] = []

    class Config:
        from_attributes = True


class AssetListResponse(BaseModel):
    id: int
    name: str
    type: AssetType
    is_global: bool
    project_id: Optional[int]
    variant_count: int = 0

    class Config:
        from_attributes = True
