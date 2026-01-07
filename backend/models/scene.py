# backend/models/scene.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class Scene(Base, TimestampMixin):
    __tablename__ = "scenes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    shot_type_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    style_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    lighting_id = Column(Integer, ForeignKey("assets.id"), nullable=True)
    action_text = Column(Text, nullable=True)
    generated_prompt = Column(Text, nullable=True)

    project = relationship("Project", backref="scenes")
    shot_type = relationship("Asset", foreign_keys=[shot_type_id])
    style = relationship("Asset", foreign_keys=[style_id])
    lighting = relationship("Asset", foreign_keys=[lighting_id])
