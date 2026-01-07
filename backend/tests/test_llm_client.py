# backend/tests/test_llm_client.py
import pytest
from services.llm_client import build_layered_system_prompt, parse_layered_response
from models.asset import AssetType


def test_build_layered_system_prompt_character():
    """Test that layered system prompt includes 3-layer instructions."""
    prompt = build_layered_system_prompt(AssetType.CHARACTER)

    assert "CORE" in prompt
    assert "STANDARD" in prompt
    assert "DETAIL" in prompt
    assert "JSON" in prompt


def test_parse_layered_response_valid():
    """Test parsing valid JSON layered response."""
    response = '{"core": "test core", "standard": "test standard", "detail": "test detail"}'
    result = parse_layered_response(response)

    assert result["core"] == "test core"
    assert result["standard"] == "test standard"
    assert result["detail"] == "test detail"


def test_parse_layered_response_with_markdown():
    """Test parsing JSON wrapped in markdown code blocks."""
    response = '```json\n{"core": "a", "standard": "b", "detail": "c"}\n```'
    result = parse_layered_response(response)

    assert result["core"] == "a"
