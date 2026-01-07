# backend/schemas/llm.py
from pydantic import BaseModel
from typing import List, Optional
from models.asset import AssetType


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class LayeredPrompt(BaseModel):
    core: str
    standard: str
    detail: str


class EnrichRequest(BaseModel):
    asset_type: AssetType
    messages: List[ChatMessage]
    current_prompt: Optional[str] = None


class EnrichVariantRequest(BaseModel):
    asset_type: AssetType
    base_prompt: str
    messages: List[ChatMessage]
    current_delta: Optional[str] = None


class EnrichLayeredResponse(BaseModel):
    layers: LayeredPrompt
    outfit_suggestion: Optional[LayeredPrompt] = None  # NEU


class LLMRequestLogResponse(BaseModel):
    timestamp: str
    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    generation_time_ms: int
    status: str  # "success" or "error"
    error_message: Optional[str] = None


class LLMLogsResponse(BaseModel):
    logs: List[LLMRequestLogResponse]


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    model: Optional[str] = None
