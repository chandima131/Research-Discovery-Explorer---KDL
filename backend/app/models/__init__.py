from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Column,
    Computed,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


researcher_expertise = Table(
    "researcher_expertise",
    Base.metadata,
    Column("researcher_id", ForeignKey("researcher.id", ondelete="CASCADE"), primary_key=True),
    Column("expertise_area_id", ForeignKey("expertise_area.id"), primary_key=True),
)
researcher_keyword = Table(
    "researcher_keyword",
    Base.metadata,
    Column("researcher_id", ForeignKey("researcher.id", ondelete="CASCADE"), primary_key=True),
    Column("keyword_id", ForeignKey("keyword.id"), primary_key=True),
)
researcher_theme = Table(
    "researcher_theme",
    Base.metadata,
    Column("researcher_id", ForeignKey("researcher.id", ondelete="CASCADE"), primary_key=True),
    Column("research_theme_id", ForeignKey("research_theme.id"), primary_key=True),
)


class Department(Base):
    __tablename__ = "department"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)


class ExpertiseArea(Base):
    __tablename__ = "expertise_area"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)


class Keyword(Base):
    __tablename__ = "keyword"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)


class ResearchTheme(Base):
    __tablename__ = "research_theme"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str] = mapped_column(Text)


class Researcher(Base):
    __tablename__ = "researcher"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    biography: Mapped[str] = mapped_column(Text)
    department_id: Mapped[int] = mapped_column(ForeignKey("department.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    # Materialised search document is refreshed with the profile by the indexing service.
    search_document: Mapped[str] = mapped_column(Text, default="")
    search_vector: Mapped[object] = mapped_column(
        TSVECTOR, Computed("to_tsvector('english', search_document)", persisted=True)
    )
    department: Mapped[Department] = relationship(lazy="selectin")
    expertise: Mapped[list[ExpertiseArea]] = relationship(
        secondary=researcher_expertise, lazy="selectin"
    )
    keywords: Mapped[list[Keyword]] = relationship(secondary=researcher_keyword, lazy="selectin")
    themes: Mapped[list[ResearchTheme]] = relationship(secondary=researcher_theme, lazy="selectin")
    publications: Mapped[list["Publication"]] = relationship(
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Publication.publication_year.desc()",
    )
    __table_args__ = (Index("ix_researcher_search", "search_vector", postgresql_using="gin"),)


class Publication(Base):
    __tablename__ = "publication"
    id: Mapped[int] = mapped_column(primary_key=True)
    researcher_id: Mapped[int] = mapped_column(
        ForeignKey("researcher.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(Text)
    abstract: Mapped[str] = mapped_column(Text)
    publication_year: Mapped[int] = mapped_column(Integer, index=True)


class ResearcherEmbedding(Base):
    __tablename__ = "researcher_embedding"
    id: Mapped[int] = mapped_column(primary_key=True)
    researcher_id: Mapped[int] = mapped_column(
        ForeignKey("researcher.id", ondelete="CASCADE"), unique=True
    )
    model_name: Mapped[str] = mapped_column(String(200))
    model_revision: Mapped[str] = mapped_column(String(64))
    content_hash: Mapped[str] = mapped_column(String(64))
    embedding: Mapped[list[float]] = mapped_column(Vector(384))
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    __table_args__ = (UniqueConstraint("researcher_id", "model_name", "model_revision"),)
