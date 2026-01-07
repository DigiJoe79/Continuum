# backend/models/settings.py
from sqlalchemy import Column, Integer, String, Text
from .base import Base, TimestampMixin


class Settings(Base, TimestampMixin):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)
