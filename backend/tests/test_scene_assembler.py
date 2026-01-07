# backend/tests/test_scene_assembler.py
import pytest
from services.scene_assembler import build_assembly_prompt, SceneData


def test_build_assembly_prompt_structure():
    """Test that assembly prompt includes all required sections."""
    scene_data = SceneData(
        direction="[ANNA:Party] walks through the garden",
        assets={
            "ANNA:Party": {
                "type": "character",
                "name": "Anna",
                "base": {"core": "young woman", "standard": "blonde", "detail": "freckles"},
                "variant": {"core": "red dress", "standard": "silk", "detail": "lace trim"}
            }
        },
        camera={"core": "medium close-up", "standard": "shallow dof", "detail": "85mm"},
        lighting={"core": "golden hour", "standard": "warm fill", "detail": "rim light"},
        style={"core": "cinematic", "standard": "film grain", "detail": "8k"}
    )

    prompt = build_assembly_prompt(scene_data, max_words=300, style="narrative")

    assert "medium close-up" in prompt
    assert "golden hour" in prompt
    assert "Anna" in prompt
    assert "walks through the garden" in prompt
    assert "direction" in prompt  # New structure includes direction field
