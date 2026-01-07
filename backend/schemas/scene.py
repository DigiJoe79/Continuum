# backend/schemas/scene.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SceneBase(BaseModel):
    name: str
    action_text: str = ""
    shot_type_id: Optional[int] = None
    style_id: Optional[int] = None
    lighting_id: Optional[int] = None


class SceneCreate(SceneBase):
    project_id: int


class SceneUpdate(BaseModel):
    name: Optional[str] = None
    action_text: Optional[str] = None
    shot_type_id: Optional[int] = None
    style_id: Optional[int] = None
    lighting_id: Optional[int] = None


class SceneResponse(SceneBase):
    id: int
    project_id: int
    generated_prompt: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GeneratePromptRequest(BaseModel):
    style_id: Optional[int] = None
    lighting_id: Optional[int] = None
