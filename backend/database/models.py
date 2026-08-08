from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime

from backend.database.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )


class Interview(Base):

    __tablename__ = "interviews"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    interview_type = Column(
        String(100),
        nullable=False
    )

    difficulty = Column(
        String(50),
        nullable=False
    )

    pdf_name = Column(
        String(255),
        nullable=True
    )

    conversation = Column(
        Text,
        nullable=True
    )

    report = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )