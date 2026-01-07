# backend/services/prompt_engine.py
import re
import json
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from models import Scene, Asset, Variant
from models.asset import AssetType
from services.scene_assembler import SceneData


def parse_scene_text(text: str) -> List[dict]:
    """Parse asset references from action text."""
    pattern = r'\[([A-Za-zÄÖÜäöüß0-9_ .\-]+)(?::([^\]]+))?\]'
    refs = []
    for match in re.finditer(pattern, text):
        refs.append({
            "asset": match.group(1),
            "variant": match.group(2),
            "full_match": match.group(0)
        })
    return refs


def parse_layered_prompt(prompt_str: str) -> Dict[str, str]:
    """Parse a layered prompt JSON string to dict."""
    if not prompt_str:
        return {"core": "", "standard": "", "detail": ""}

    try:
        data = json.loads(prompt_str)
        return {
            "core": data.get("core", ""),
            "standard": data.get("standard", ""),
            "detail": data.get("detail", "")
        }
    except json.JSONDecodeError:
        # Legacy: treat as plain text, put everything in core
        return {"core": prompt_str, "standard": "", "detail": ""}


def resolve_asset_ref(ref: dict, project_id: int, db: Session) -> Optional[Dict]:
    """Resolve an asset reference to its full details."""
    asset = db.query(Asset).filter(
        Asset.name.ilike(ref["asset"]),
        (Asset.project_id == project_id) | (Asset.is_global == True)
    ).first()

    if not asset:
        return None

    result = {
        "asset": asset,
        "type": asset.type,
        "name": asset.name,
        "base": parse_layered_prompt(asset.base_prompt),
        "variant": None
    }

    if ref["variant"]:
        variant = db.query(Variant).filter(
            Variant.asset_id == asset.id,
            Variant.name.ilike(ref["variant"])
        ).first()
        if variant:
            result["variant"] = parse_layered_prompt(variant.delta_prompt)

    return result


def aggregate_scene_data(scene: Scene, style_id: Optional[int], db: Session) -> SceneData:
    """Aggregate all scene data into structured format for assembly."""

    # Keep the original direction text WITH tags
    direction = scene.action_text or ""

    # Parse and resolve asset references
    refs = parse_scene_text(direction)

    # Build assets dictionary keyed by tag (e.g., "ANNA:Medieval" or "LIBRARY")
    assets: Dict[str, Dict] = {}

    for ref in refs:
        resolved = resolve_asset_ref(ref, scene.project_id, db)
        if resolved:
            # Build the tag key (NAME or NAME:VARIANT)
            tag_key = ref["asset"]
            if ref["variant"]:
                tag_key = f"{ref['asset']}:{ref['variant']}"

            assets[tag_key] = {
                "type": resolved["type"].value,  # "character", "location", "object"
                "name": resolved["name"],
                "base": resolved["base"],
                "variant": resolved["variant"]
            }

    # Get camera (shot type)
    camera = {"core": "", "standard": "", "detail": ""}
    if scene.shot_type_id:
        shot_type = db.query(Asset).filter(Asset.id == scene.shot_type_id).first()
        if shot_type:
            camera = parse_layered_prompt(shot_type.base_prompt)

    # Get lighting
    lighting = {"core": "", "standard": "", "detail": ""}
    if scene.lighting_id:
        lighting_asset = db.query(Asset).filter(Asset.id == scene.lighting_id).first()
        if lighting_asset:
            lighting = parse_layered_prompt(lighting_asset.base_prompt)

    # Get style
    style = {"core": "", "standard": "", "detail": ""}
    if style_id:
        style_asset = db.query(Asset).filter(Asset.id == style_id).first()
        if style_asset:
            style = parse_layered_prompt(style_asset.base_prompt)

    return SceneData(
        direction=direction,
        assets=assets,
        camera=camera,
        lighting=lighting,
        style=style
    )


# Legacy function for backwards compatibility during transition
def generate_scene_prompt(scene: Scene, style_id: Optional[int], db: Session) -> str:
    """Generate scene prompt - now uses LLM assembly."""
    from services.scene_assembler import assemble_scene_sync

    scene_data = aggregate_scene_data(scene, style_id, db)
    return assemble_scene_sync(scene_data, db)
