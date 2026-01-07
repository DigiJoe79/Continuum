# backend/schemas/settings.py
from pydantic import BaseModel
from typing import Optional


class SettingsResponse(BaseModel):
    llm_provider: str
    llm_api_key: str  # Will be masked in response
    llm_model: str
    llm_base_url: str


class SettingsUpdate(BaseModel):
    llm_provider: Optional[str] = None
    llm_api_key: Optional[str] = None
    llm_model: Optional[str] = None
    llm_base_url: Optional[str] = None
