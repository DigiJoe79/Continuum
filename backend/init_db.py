# backend/init_db.py
from loguru import logger
from database import engine
from models import Base, Asset, AssetType, Settings

# Default shot types
DEFAULT_SHOT_TYPES = [
    ("Extreme Wide", '{"core": "extreme wide shot, vast landscape, deep focus, establishing context"}'),
    ("Wide", '{"core": "wide shot, full scene visible, environmental context, full body framing"}'),
    ("Medium", '{"core": "medium shot, waist-up framing, balanced composition"}'),
    ("Medium Close-up", '{"core": "medium close-up, chest and face visible, intimate framing"}'),
    ("Close-up", '{"core": "close-up shot, face filling frame, shallow depth of field, emotional intensity"}'),
    ("Extreme Close-up", '{"core": "extreme close-up, single feature focus, macro detail"}'),
    ("Over-the-Shoulder", '{"core": "over-the-shoulder shot, conversational framing, dialogue scene"}'),
    ("Low Angle", '{"core": "low angle shot, camera looking upward, dramatic perspective, heroic framing"}'),
    ("High Angle", '{"core": "high angle shot, camera looking downward, subject vulnerability"}'),
    ("Dutch Angle", '{"core": "dutch angle shot, tilted camera, diagonal horizon, tension and unease"}'),
    ("Bird\'s Eye", '{"core": "bird\'s eye view, directly overhead, top-down perspective"}'),
    ("POV", '{"core": "point-of-view shot, subjective camera, first-person perspective"}'),
]

# Default styles
DEFAULT_STYLES = [
    ("Cinematic", '{"core": "cinematic film still, professional cinematography, dramatic lighting, color graded"}'),
    ("Photorealistic", '{"core": "photorealistic photograph, ultra detailed, natural lighting, sharp focus"}'),
    ("Anime", '{"core": "anime style, Japanese animation, cel shaded, vibrant colors, clean lines"}'),
    ("Oil Painting", '{"core": "classical oil painting, visible brushstrokes, rich colors, canvas texture"}'),
    ("Comic Book", '{"core": "comic book art style, bold ink outlines, graphic novel aesthetic"}'),
    ("Watercolor", '{"core": "watercolor painting, soft edges, flowing colors, paper texture"}'),
]

# Default lighting setups
DEFAULT_LIGHTINGS = [
    ("Natural Daylight", '{"core": "natural daylight, soft shadows, diffused sunlight, neutral color temperature"}'),
    ("Golden Hour", '{"core": "golden hour lighting, warm tones, low sun angle, long shadows"}'),
    ("Blue Hour", '{"core": "blue hour twilight, cool tones, ambient sky light, soft blue fill"}'),
    ("Studio 3-Point", '{"core": "professional studio lighting, key light, fill light, backlight rim"}'),
    ("Dramatic Noir", '{"core": "high contrast noir lighting, hard shadows, single key light, moody"}'),
    ("Neon Night", '{"core": "neon night lighting, colorful, cyan and magenta accents, urban glow"}'),
    ("High-Key", '{"core": "high-key lighting, bright and even, minimal shadows, clean look"}'),
    ("Silhouette", '{"core": "silhouette lighting, backlit subject, dark foreground, dramatic outline"}'),
    ("Rim Light", '{"core": "rim lighting, edge highlights, glowing outline, subject separation"}'),
]

# Default settings
DEFAULT_SETTINGS = [
    ("llm_provider", "openrouter"),
    ("llm_api_key", ""),
    ("llm_model", "anthropic/claude-4.5-sonnet"),
    ("llm_base_url", "https://openrouter.ai/api/v1"),
    ("image_model_preset", "nano_banana_pro"),
]


def run_migrations():
    """Run any necessary schema migrations."""
    from sqlalchemy import text

    with engine.connect() as conn:
        # Check if style_id column exists in scenes table
        result = conn.execute(text("PRAGMA table_info(scenes)"))
        columns = [row[1] for row in result.fetchall()]

        if 'style_id' not in columns and 'scenes' in [t for t in columns] or len(columns) > 0:
            # Table exists but column doesn't - add it
            try:
                conn.execute(text('ALTER TABLE scenes ADD COLUMN style_id INTEGER REFERENCES assets(id)'))
                conn.commit()
                logger.info("Migration: Added style_id column to scenes table")
            except Exception as e:
                # Column might already exist or table doesn't exist yet
                pass

        # Check if lighting_id column exists in scenes table
        if 'lighting_id' not in columns and len(columns) > 0:
            try:
                conn.execute(text('ALTER TABLE scenes ADD COLUMN lighting_id INTEGER REFERENCES assets(id)'))
                conn.commit()
                logger.info("Migration: Added lighting_id column to scenes table")
            except Exception as e:
                # Column might already exist or table doesn't exist yet
                pass


def init_database():
    """Create tables and seed default data."""
    from sqlalchemy.orm import sessionmaker

    Base.metadata.create_all(bind=engine)

    # Run migrations for existing databases
    run_migrations()

    Session = sessionmaker(bind=engine)
    session = Session()

    # Check if already initialized
    existing_shots = session.query(Asset).filter(
        Asset.type == AssetType.SHOT_TYPE,
        Asset.is_global == True
    ).first()

    if existing_shots:
        # Check if lightings exist, add them if not
        existing_lightings = session.query(Asset).filter(
            Asset.type == AssetType.LIGHTING_SETUP,
            Asset.is_global == True
        ).first()

        if not existing_lightings:
            logger.info("Adding default lighting setups...")
            for name, prompt in DEFAULT_LIGHTINGS:
                asset = Asset(
                    name=name,
                    type=AssetType.LIGHTING_SETUP,
                    base_prompt=prompt,
                    is_global=True
                )
                session.add(asset)
            session.commit()
            logger.info("✓ Default lighting setups added")

        # Check if image_model_preset setting exists
        existing_preset = session.query(Settings).filter(
            Settings.key == "image_model_preset"
        ).first()

        if not existing_preset:
            setting = Settings(key="image_model_preset", value="nano_banana_pro")
            session.add(setting)
            session.commit()
            logger.info("✓ Added image_model_preset setting")

        session.close()
        return

    # Add default shot types
    for name, prompt in DEFAULT_SHOT_TYPES:
        asset = Asset(
            name=name,
            type=AssetType.SHOT_TYPE,
            base_prompt=prompt,
            is_global=True
        )
        session.add(asset)

    # Add default styles
    for name, prompt in DEFAULT_STYLES:
        asset = Asset(
            name=name,
            type=AssetType.STYLE,
            base_prompt=prompt,
            is_global=True
        )
        session.add(asset)

    # Add default lighting setups
    for name, prompt in DEFAULT_LIGHTINGS:
        asset = Asset(
            name=name,
            type=AssetType.LIGHTING_SETUP,
            base_prompt=prompt,
            is_global=True
        )
        session.add(asset)

    # Add default settings
    for key, value in DEFAULT_SETTINGS:
        setting = Settings(key=key, value=value)
        session.add(setting)

    session.commit()
    session.close()
    logger.info("✓ Database initialized with default data")


if __name__ == "__main__":
    init_database()
