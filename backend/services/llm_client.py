# backend/services/llm_client.py
import json
import re
import time
from datetime import datetime
from openai import OpenAI
from sqlalchemy.orm import Session
from models import Settings
from models.asset import AssetType
from typing import List, Optional, Dict
from dataclasses import dataclass, asdict
from collections import deque


@dataclass
class LLMRequestLog:
    timestamp: str
    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    generation_time_ms: int
    status: str  # "success" or "error"
    error_message: Optional[str] = None

    @property
    def tokens_per_second(self) -> float:
        if self.generation_time_ms <= 0:
            return 0
        return (self.output_tokens / self.generation_time_ms) * 1000


# In-memory log storage (max 10 entries)
_request_logs: deque = deque(maxlen=10)


def add_request_log(log: LLMRequestLog):
    _request_logs.append(log)


def get_request_logs() -> List[dict]:
    return [asdict(log) for log in _request_logs]


class LLMError(Exception):
    pass


LAYERED_BASE_PROMPT = """You are an expert at writing prompts for AI image generators.
Your goal is to ensure VISUAL CONSISTENCY across multiple generated images.

Generate a structured description with THREE visibility layers:

CORE: Essential elements visible in ANY shot, defines recognition (~20-40 words)
STANDARD: Additional details visible at medium distance/relevance (~30-50 words)
DETAIL: Fine details only visible in close-ups or with explicit focus (~30-50 words)

Rules:
- CORE should stand alone and be recognizable
- STANDARD adds NEW information only - do not restate anything from CORE
- DETAIL adds NEW information only - do not restate anything from CORE or STANDARD
- ZERO OVERLAP: Once a term appears in one layer, NEVER repeat it in another layer
- Each layer should read as pure additions, not summaries
- Be PRECISE: exact colors, materials, not vague terms

BAD example (overlapping):
- core: "black mock neck top, distressed jeans"
- standard: "mock neck top in stretch fabric, jeans with white threading" ← WRONG: repeats "mock neck", "jeans"

GOOD example (no overlap):
- core: "black mock neck top, distressed medium-wash skinny jeans"
- standard: "matte stretch fabric ending above navel, white threading, intentional knee rips showing underlayer"
- detail: "double-needle topstitching at armholes, copper rivets, frayed edges, subtle hip whiskering"

Output valid JSON only, no markdown, no explanation:
{"core": "...", "standard": "...", "detail": "..."}"""


ASSET_TYPE_INSTRUCTIONS = {
    AssetType.CHARACTER: """
Focus for CHARACTER:
- CORE: Distinctive facial features, age, most recognizable traits
- STANDARD: Body type, hair details, skin tone
- DETAIL: Fine features like freckles, specific eye details

IMPORTANT - Clothing/Outfit Handling:
- The main layers (core/standard/detail) must describe ONLY the person's body
- Extract clothing into "outfit_suggestion" with same layer structure (core/standard/detail)

What counts as CLOTHING (extract to outfit_suggestion):
- Garments: dress, suit, coat, shirt, pants, skirt, uniform, armor, cloak, robe
- Phrases like "in Schwarz/Black", "dressed in...", "wearing a..."
- Footwear: shoes, boots, sandals

What stays in BODY layers (NOT clothing):
- Face accessories: glasses, monocle, eyepatch (these define the face)
- Hair accessories: ribbons, bows, clips (part of hair description)
- Body modifications: tattoos, piercings, scars
- Jewelry on body: earrings, nose rings (but necklaces/bracelets = clothing)

CRITICAL RULES:
1. NEVER invent clothing not mentioned in input - if no clothing described, NO outfit_suggestion
2. Role/profession alone (knight, witch, baker) does NOT imply clothing - only explicit descriptions count
3. "Trägt ein Monokel" = face accessory, stays in body layers, NO outfit_suggestion
4. "Frau in Schwarz" = clothing description, MUST have outfit_suggestion

Example input: "scientist with glasses, wearing a white lab coat"
Example output:
{"core": "woman with rectangular glasses", "standard": "slim build", "detail": "green eyes", "outfit_suggestion": {"core": "white lab coat", "standard": "knee-length, buttoned", "detail": "breast pocket with pens"}}

Example input: "old gentleman with monocle on right eye"
Example output:
{"core": "elderly gentleman, monocle on right eye", "standard": "lean build, pale skin", "detail": "bushy eyebrows"}
(NO outfit_suggestion - monocle is face accessory, no clothing mentioned)

Example input: "mysterious woman in black"
Example output:
{"core": "woman, sharp features, pale skin", "standard": "slender build, dark hair", "detail": "piercing eyes", "outfit_suggestion": {"core": "black attire", "standard": "elegant flowing silhouette", "detail": "matte fabric texture"}}""",

    AssetType.LOCATION: """
Focus for LOCATION:
- CORE: Basic environment type, main architectural elements
- STANDARD: Architectural style, materials, spatial layout
- DETAIL: Ornamental details, textures, small decorative elements""",

    AssetType.OBJECT: """
Focus for OBJECT:
- CORE: Shape, primary color, material type
- STANDARD: Special properties, functional elements
- DETAIL: Fine textures, small details, wear patterns""",

    AssetType.STYLE: """
Focus for STYLE:
- CORE: Primary artistic style, overall mood
- STANDARD: Color palette, lighting mood
- DETAIL: Technical rendering details, specific effects""",

    AssetType.SHOT_TYPE: """
Focus for SHOT_TYPE (camera settings):
- CORE: Basic framing (close-up, wide, etc.), what's visible
- STANDARD: Depth of field, perspective type
- DETAIL: Lens focal length, f-stop, specific angle""",

    AssetType.LIGHTING_SETUP: """
Focus for LIGHTING_SETUP:
- CORE: Main light source type, color temperature
- STANDARD: Key/fill light direction, quality (hard/soft)
- DETAIL: Practical lights, rim lights, specific light ratios"""
}


VARIANT_LAYERED_PROMPT = """You are an expert at writing delta prompts for AI image generators.
Your goal is to ensure VISUAL CONSISTENCY across multiple generated images.

The user has a base asset and wants to create a VARIANT. Generate ONLY the modifications as THREE layers:

CORE: Most important variant changes, always visible (~20-40 words)
STANDARD: Secondary variant details (~30-50 words)
DETAIL: Fine variant details, only visible close-up (~30-50 words)

VARIANT RULES:
- Describe ONLY what CHANGES or ADDS to the base
- Variants can OVERRIDE base properties (e.g., different hair color, different condition)
- Be PRECISE: exact colors, materials, conditions
- DO NOT include: pose, expression, emotion, action (those come from scene context)
- STANDARD adds NEW information only - do not restate anything from CORE
- DETAIL adds NEW information only - do not restate anything from CORE or STANDARD
- ZERO OVERLAP: Once a term appears in one layer, NEVER repeat it in another layer

BAD example (overlapping):
- core: "champagne silk gown, high mandarin collar"
- standard: "silk gown with sleeveless cut, mandarin collar in cream" ← WRONG: repeats "silk gown", "mandarin collar"

GOOD example (no overlap):
- core: "champagne silk column gown, high mandarin collar, sleek high bun"
- standard: "sleeveless cut, low-cut back, diamond teardrop earrings"
- detail: "subtle train at floor-length hem, silver strappy sandals with ankle wraps"

Output valid JSON only, no markdown, no explanation:
{"core": "...", "standard": "...", "detail": "..."}"""


VARIANT_TYPE_INSTRUCTIONS = {
    AssetType.CHARACTER: """
Focus for CHARACTER variants:
- CORE: Main outfit changes, significant appearance changes (hair style/color, accessories)
- STANDARD: Secondary clothing details, styling changes
- DETAIL: Fine fabric textures, small accessories, subtle modifications

Common CHARACTER variants:
- Outfit changes: "Medieval costume", "Business attire", "Casual wear"
- Age changes: "Young version", "Elderly version" (can override hair color, add wrinkles)
- Condition: "Injured", "Dirty", "Wet" (visual state changes)

NEVER describe: facial expressions, emotions, poses, actions

BAD example (repeats base features):
Base: "woman with copper-red wavy hair, freckles, rectangular glasses"
Variant input: "Medieval outfit"
- core: "woman with copper-red hair wearing burgundy velvet robe" ← WRONG: repeats "copper-red hair"

GOOD example (delta only):
- core: "burgundy velvet robe with golden embroidery, wide flowing sleeves"
- standard: "high neckline, gold chain belt at waist, embroidered collar"
- detail: "metallic gold thread patterns, brass clasps, leather boots beneath hem" """,

    AssetType.LOCATION: """
Focus for LOCATION variants:
- CORE: Major environmental changes (time of day, season, condition)
- STANDARD: Secondary atmosphere changes, lighting shifts
- DETAIL: Fine environmental details specific to the variant

Common LOCATION variants:
- Time: "Night version", "Dawn", "Sunset"
- Season: "Winter", "Autumn", "Summer"
- Condition: "Ruined", "Abandoned", "Renovated", "Flooded"
- Weather: "Rainy", "Foggy", "Stormy"

BAD example (repeats base architecture):
Base: "Victorian library with wooden gallery, arched windows"
Variant input: "Night version"
- core: "Victorian library at night with moonlight through arched windows" ← WRONG: repeats "Victorian library", "arched windows"

GOOD example (delta only):
- core: "nighttime setting, silver moonlight streaming through windows, sparse candlelight"
- standard: "cool blue-white lunar glow contrasts with warm candle flames, deep shadows"
- detail: "wax drippings on surfaces, moon-cast window patterns on floor, candle pools of light" """,

    AssetType.OBJECT: """
Focus for OBJECT variants:
- CORE: Major state changes, material variations
- STANDARD: Condition details, functional modifications
- DETAIL: Fine wear patterns, specific damage marks

Common OBJECT variants:
- Condition: "New", "Worn", "Broken", "Rusty"
- Material: "Gold version", "Wooden version"
- State: "Open", "Lit", "Empty", "Full"

BAD example (repeats base form):
Base: "brass pocket compass with hinged lid, engraved wind rose"
Variant input: "Broken version"
- core: "broken brass compass with cracked glass and bent hinge" ← WRONG: repeats "brass compass"

GOOD example (delta only):
- core: "cracked glass face with radial fracture, jammed needle at 45 degrees, bent hinge"
- standard: "2mm gap between case and lid, green oxidation in crevices"
- detail: "hairline cracks from impact point, scratches around hinge, corrosion on edges" """
}


def build_layered_system_prompt(asset_type: AssetType) -> str:
    """Build system prompt for layered enrichment."""
    base = LAYERED_BASE_PROMPT
    specific = ASSET_TYPE_INSTRUCTIONS.get(asset_type, "")
    return base + specific


def build_variant_system_prompt(asset_type: AssetType, base_prompt: str) -> str:
    """Build system prompt for variant enrichment."""
    base = VARIANT_LAYERED_PROMPT
    specific = VARIANT_TYPE_INSTRUCTIONS.get(asset_type, "")
    return f"{base}{specific}\n\nBase asset ({asset_type.value}):\n{base_prompt}"


def parse_layered_response(response: str) -> Dict[str, str]:
    """Parse LLM response to extract layered JSON."""
    # Remove markdown code blocks if present
    cleaned = response.strip()
    if cleaned.startswith("```"):
        # Extract content between code blocks
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1)

    try:
        data = json.loads(cleaned)
        result = {
            "core": data.get("core", ""),
            "standard": data.get("standard", ""),
            "detail": data.get("detail", "")
        }

        # NEU: outfit_suggestion extrahieren wenn vorhanden
        if "outfit_suggestion" in data and data["outfit_suggestion"]:
            result["outfit_suggestion"] = {
                "core": data["outfit_suggestion"].get("core", ""),
                "standard": data["outfit_suggestion"].get("standard", ""),
                "detail": data["outfit_suggestion"].get("detail", "")
            }

        return result
    except json.JSONDecodeError as e:
        raise LLMError(f"Failed to parse layered response: {e}")


class LLMClient:
    def __init__(self, base_url: str, api_key: str, model: str, provider: str = "unknown"):
        self.client = OpenAI(base_url=base_url, api_key=api_key)
        self.model = model
        self.provider = provider

    def _log_request(self, response, generation_time_ms: int, status: str, error_message: Optional[str] = None):
        """Log the request details."""
        input_tokens = 0
        output_tokens = 0

        if response and hasattr(response, 'usage') and response.usage:
            input_tokens = response.usage.prompt_tokens or 0
            output_tokens = response.usage.completion_tokens or 0

        log = LLMRequestLog(
            timestamp=datetime.now().isoformat(),
            provider=self.provider,
            model=self.model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            generation_time_ms=generation_time_ms,
            status=status,
            error_message=error_message
        )
        add_request_log(log)

    def enrich(
        self,
        asset_type: AssetType,
        messages: List[dict],
        current_prompt: Optional[str] = None
    ) -> Dict[str, str]:
        """Enrich asset with layered prompt structure."""
        system_prompt = build_layered_system_prompt(asset_type)

        if current_prompt:
            system_prompt += f"\n\nCurrent description (improve upon this):\n{current_prompt}"

        chat_messages = [{"role": "system", "content": system_prompt}]
        chat_messages.extend([{"role": m["role"], "content": m["content"]} for m in messages])

        start_time = time.time()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=chat_messages
            )
            generation_time_ms = int((time.time() - start_time) * 1000)
            self._log_request(response, generation_time_ms, "success")
            return parse_layered_response(response.choices[0].message.content)
        except Exception as e:
            generation_time_ms = int((time.time() - start_time) * 1000)
            error_msg = str(e)
            self._log_request(None, generation_time_ms, "error", error_msg)
            if isinstance(e, LLMError):
                raise
            raise LLMError(f"LLM request failed: {error_msg}")

    def enrich_variant(
        self,
        asset_type: AssetType,
        base_prompt: str,
        messages: List[dict],
        current_delta: Optional[str] = None
    ) -> Dict[str, str]:
        """Enrich variant with layered delta structure."""
        system_prompt = build_variant_system_prompt(asset_type, base_prompt)

        if current_delta:
            system_prompt += f"\n\nCurrent delta (improve upon this):\n{current_delta}"

        chat_messages = [{"role": "system", "content": system_prompt}]
        chat_messages.extend([{"role": m["role"], "content": m["content"]} for m in messages])

        start_time = time.time()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=chat_messages
            )
            generation_time_ms = int((time.time() - start_time) * 1000)
            self._log_request(response, generation_time_ms, "success")
            return parse_layered_response(response.choices[0].message.content)
        except Exception as e:
            generation_time_ms = int((time.time() - start_time) * 1000)
            error_msg = str(e)
            self._log_request(None, generation_time_ms, "error", error_msg)
            if isinstance(e, LLMError):
                raise
            raise LLMError(f"LLM request failed: {error_msg}")

    def complete(self, messages: List[dict], max_tokens: Optional[int] = None) -> str:
        """General chat completion with logging."""
        start_time = time.time()
        try:
            kwargs = {"model": self.model, "messages": messages}
            if max_tokens:
                kwargs["max_tokens"] = max_tokens
            response = self.client.chat.completions.create(**kwargs)
            generation_time_ms = int((time.time() - start_time) * 1000)
            self._log_request(response, generation_time_ms, "success")
            return response.choices[0].message.content
        except Exception as e:
            generation_time_ms = int((time.time() - start_time) * 1000)
            error_msg = str(e)
            self._log_request(None, generation_time_ms, "error", error_msg)
            raise LLMError(f"LLM request failed: {error_msg}")


def get_llm_client(db: Session) -> LLMClient:
    settings = {}
    for key in ["llm_provider", "llm_api_key", "llm_model", "llm_base_url"]:
        setting = db.query(Settings).filter(Settings.key == key).first()
        settings[key] = setting.value if setting else ""

    # LM Studio doesn't require an API key
    if not settings["llm_api_key"] and settings["llm_provider"] != "lmstudio":
        raise LLMError("LLM API key not configured")

    return LLMClient(
        base_url=settings["llm_base_url"],
        api_key=settings["llm_api_key"] or "not-needed",
        model=settings["llm_model"],
        provider=settings["llm_provider"]
    )
