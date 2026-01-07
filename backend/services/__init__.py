# backend/services/__init__.py
from .llm_client import LLMClient, LLMError, get_llm_client
from .prompt_engine import parse_scene_text, generate_scene_prompt
