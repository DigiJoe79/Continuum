# backend/config/image_models.py

IMAGE_MODEL_PRESETS = {
    "nano_banana_pro": {
        "name": "Nano Banana Pro",
        "max_words": 300,
        "style": "narrative",
        "structure": ["composition", "subject", "action", "setting", "atmosphere", "style"]
    },
    "midjourney": {
        "name": "Midjourney",
        "max_words": 80,
        "style": "keywords",
        "structure": ["subject", "style", "parameters"]
    },
    "dall_e": {
        "name": "DALL-E",
        "max_words": 120,
        "style": "narrative",
        "structure": ["subject", "action", "setting", "style"]
    },
    "stable_diffusion": {
        "name": "Stable Diffusion",
        "max_words": 75,
        "style": "keywords",
        "structure": ["subject", "style", "quality"]
    }
}

DEFAULT_IMAGE_MODEL = "nano_banana_pro"


def get_preset(name: str) -> dict:
    """Get image model preset by name, fallback to default."""
    return IMAGE_MODEL_PRESETS.get(name, IMAGE_MODEL_PRESETS[DEFAULT_IMAGE_MODEL])
