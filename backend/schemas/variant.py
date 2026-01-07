# backend/schemas/variant.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class VariantBase(BaseModel):
    name: str
    delta_prompt: str = ""


class VariantCreate(VariantBase):
    asset_id: int


class VariantUpdate(BaseModel):
    name: Optional[str] = None
    delta_prompt: Optional[str] = None


class VariantDetailResponse(VariantBase):
    id: int
    asset_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
