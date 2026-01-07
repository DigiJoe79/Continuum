# backend/routers/settings.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Settings
from schemas import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])

SETTINGS_KEYS = ["llm_provider", "llm_api_key", "llm_model", "llm_base_url"]


def mask_api_key(key: str) -> str:
    if not key or len(key) < 8:
        return "***"
    return key[:4] + "****" + key[-4:]


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings_dict = {}
    for key in SETTINGS_KEYS:
        setting = db.query(Settings).filter(Settings.key == key).first()
        value = setting.value if setting else ""
        if key == "llm_api_key":
            value = mask_api_key(value)
        settings_dict[key] = value

    return SettingsResponse(**settings_dict)


@router.put("", response_model=SettingsResponse)
def update_settings(settings: SettingsUpdate, db: Session = Depends(get_db)):
    for key, value in settings.model_dump(exclude_unset=True).items():
        if value is None:
            continue
        # Skip API key if it's still masked (contains ****)
        if key == "llm_api_key" and "****" in value:
            continue
        db_setting = db.query(Settings).filter(Settings.key == key).first()
        if db_setting:
            db_setting.value = value
        else:
            db_setting = Settings(key=key, value=value)
            db.add(db_setting)

    db.commit()

    # Return updated settings
    return get_settings(db)
