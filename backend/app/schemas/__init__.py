from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Named(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class Theme(Named):
    description: str


class PublicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    abstract: str
    publication_year: int


class ResearcherOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    biography: str
    department: Named
    expertise: list[Named]
    keywords: list[Named]
    themes: list[Theme]
    publications: list[PublicationOut]
    updated_at: datetime


class ConceptMatch(BaseModel):
    concept: str
    similarity: float


class SearchHit(BaseModel):
    researcher: ResearcherOut
    similarity: float | None = None
    concepts: list[ConceptMatch] = Field(default_factory=list)
    relevant_publication_ids: list[int] = Field(default_factory=list)


class SearchResponse(BaseModel):
    items: list[SearchHit]
    total: int
    limit: int
    offset: int
    mode: Literal["browse", "keyword", "semantic"]
    model_name: str | None = None
    model_revision: str | None = None


class CountRow(BaseModel):
    name: str
    count: int


class Overview(BaseModel):
    researchers: int
    publications: int
    departments: int
    themes: int
    by_department: list[CountRow]
    by_theme: list[CountRow]
    by_expertise: list[CountRow]
    by_year: list[CountRow]


class Health(BaseModel):
    status: str
    database: str
    indexed_profiles: int
