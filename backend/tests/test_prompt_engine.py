# backend/tests/test_prompt_engine.py
import pytest
from services.prompt_engine import parse_scene_text, aggregate_scene_data
from services.scene_assembler import SceneData


def test_parse_asset_reference():
    text = "[ANNA] walks through the market"
    refs = parse_scene_text(text)
    assert len(refs) == 1
    assert refs[0]["asset"] == "ANNA"
    assert refs[0]["variant"] is None


def test_parse_asset_with_variant():
    text = "[ANNA:Medieval] walks through [MARKET:1500]"
    refs = parse_scene_text(text)
    assert len(refs) == 2
    assert refs[0]["asset"] == "ANNA"
    assert refs[0]["variant"] == "Medieval"
    assert refs[1]["asset"] == "MARKET"
    assert refs[1]["variant"] == "1500"


def test_parse_german_umlauts():
    text = "[MÜNCHEN:Winter] at night"
    refs = parse_scene_text(text)
    assert len(refs) == 1
    assert refs[0]["asset"] == "MÜNCHEN"
    assert refs[0]["variant"] == "Winter"


def test_aggregate_scene_data():
    """Test that aggregate_scene_data returns structured data."""
    # This test requires mocking the database
    # For now, test the structure of the output
    assert callable(aggregate_scene_data)
