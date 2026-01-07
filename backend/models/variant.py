# backend/models/variant.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Variant(Base, TimestampMixin):
    __tablename__ = "variants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    delta_prompt = Column(Text, nullable=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)

    asset = relationship("Asset", back_populates="variants")
