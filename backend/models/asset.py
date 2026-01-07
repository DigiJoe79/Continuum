# backend/models/asset.py
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from .base import Base, TimestampMixin


class AssetType(str, enum.Enum):
    CHARACTER = "character"
    LOCATION = "location"
    OBJECT = "object"
    STYLE = "style"
    SHOT_TYPE = "shot_type"
    LIGHTING_SETUP = "lighting_setup"


class Asset(Base, TimestampMixin):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(AssetType), nullable=False)
    base_prompt = Column(Text, nullable=False, default="")
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    is_global = Column(Boolean, default=False, nullable=False)

    project = relationship("Project", backref="assets")
    variants = relationship("Variant", back_populates="asset")
