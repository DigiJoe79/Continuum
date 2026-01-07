# backend/services/scene_assembler.py
import json
from dataclasses import dataclass
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from models import Settings
from services.llm_client import get_llm_client, LLMError
from config.image_models import get_preset


@dataclass
class SceneData:
    direction: str  # Original action text WITH [TAGS] - the main instruction
    assets: Dict[str, Dict]  # Referenced assets keyed by tag name
    camera: Dict[str, str]
    lighting: Dict[str, str]
    style: Dict[str, str]


ASSEMBLY_SYSTEM_PROMPT = """You are an expert at assembling image generation prompts.

## INPUT STRUCTURE

You receive:
1. **DIRECTION** - The main instruction with [TAGS] referencing assets (THIS IS THE PRIORITY)
2. **ASSETS** - Detailed descriptions for each referenced tag
3. **CAMERA** - Shot type and framing
4. **LIGHTING** - Light setup
5. **STYLE** - Visual style

## HOW TO READ THE DIRECTION

The DIRECTION is like a film script instruction. Tags in [BRACKETS] reference assets:
- `[NAME]` = Asset with base description only
- `[NAME:VARIANT]` = Asset with variant applied (modifies/overrides base)

Example: "[ANNA:Medieval] reads a book in [LIBRARY:Night]"
- ANNA is a CHARACTER with Medieval variant applied
- LIBRARY is a LOCATION with Night variant applied
- "reads a book" is the ACTION

**IMPORTANT:** If no CHARACTER tags appear in the direction, this is an ENVIRONMENT/ESTABLISHING shot.
Focus entirely on the location - ignore "waist-up" or similar character-focused framing.

## ASSET DETAIL LEVELS

Each asset has layers: CORE (always visible), STANDARD (medium detail), DETAIL (close-up only)

Select layers based on CAMERA:
- CLOSE-UP: CHARACTER face CORE only (no outfit), LOCATION blurred
- MEDIUM: CHARACTER CORE+STANDARD, LOCATION CORE
- WIDE/FULL: All layers for everything
- ESTABLISHING (no characters): LOCATION gets full detail emphasis

## MIXING BASE + VARIANT

When an asset has a variant:
- Variant OVERRIDES matching base properties (e.g., hair color)
- Variant ADDS new properties (e.g., outfit to body)
- Result must be coherent, no contradictions

## OUTPUT STRUCTURE

Transform the DIRECTION into a cinematic prompt:
1. COMPOSITION - Camera/framing from the camera settings
2. SUBJECT(S) - Expand [TAGS] with appropriate detail level
3. ACTION - The action described in the direction
4. SETTING - Location details (if present)
5. ATMOSPHERE - Lighting and mood
6. STYLE - Visual style

**Respect the direction's intent:**
- If direction says "16:9 Format!" - mention widescreen/cinematic aspect ratio
- If direction has no characters - this is a pure environment shot
- If direction emphasizes something - give it prominence

## OUTPUT CONSTRAINTS

- Maximum {max_words} words
- Style: {style} (narrative = sentences, keywords = comma-separated)
- Output ONLY the final prompt text, no explanations"""


NANO_BANANA_ADDITIONS = """
For this image model:
- Use natural flowing sentences, not keyword lists
- Include specific camera terminology (lens, f-stop, angle)
- Describe lighting explicitly (key light direction, color temperature)
- Be generous with detail - this model handles rich descriptions well
"""


def build_assembly_prompt(scene_data: SceneData, max_words: int, style: str) -> str:
    """Build the user prompt for scene assembly."""
    data = {
        "direction": scene_data.direction,
        "assets": scene_data.assets,
        "camera": scene_data.camera,
        "lighting": scene_data.lighting,
        "style": scene_data.style
    }
    return json.dumps(data, indent=2)


def get_assembly_system_prompt(preset_name: str, max_words: int, style: str) -> str:
    """Get the system prompt for scene assembly."""
    base = ASSEMBLY_SYSTEM_PROMPT.format(max_words=max_words, style=style)

    if preset_name == "nano_banana_pro":
        base += NANO_BANANA_ADDITIONS

    return base


async def assemble_scene(
    scene_data: SceneData,
    db: Session,
    preset_name: Optional[str] = None
) -> str:
    """Assemble a scene using LLM to generate the final prompt."""
    # Get image model preset
    if preset_name is None:
        setting = db.query(Settings).filter(Settings.key == "image_model_preset").first()
        preset_name = setting.value if setting else "nano_banana_pro"

    preset = get_preset(preset_name)

    # Build prompts
    system_prompt = get_assembly_system_prompt(
        preset_name,
        preset["max_words"],
        preset["style"]
    )
    user_prompt = build_assembly_prompt(
        scene_data,
        preset["max_words"],
        preset["style"]
    )

    # Call LLM
    try:
        client = get_llm_client(db)
        result = client.complete(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        return result.strip()
    except Exception as e:
        raise LLMError(f"Scene assembly failed: {str(e)}")


def assemble_scene_sync(
    scene_data: SceneData,
    db: Session,
    preset_name: Optional[str] = None
) -> str:
    """Synchronous version of assemble_scene."""
    import asyncio

    # Check if there's already a running event loop
    try:
        loop = asyncio.get_running_loop()
        # If we're already in an async context, we need to run in a new thread
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(
                asyncio.run,
                assemble_scene(scene_data, db, preset_name)
            )
            return future.result()
    except RuntimeError:
        # No running event loop, we can use asyncio.run directly
        return asyncio.run(assemble_scene(scene_data, db, preset_name))
