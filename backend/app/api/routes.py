from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_session
from app.models import (
    Department,
    ExpertiseArea,
    Keyword,
    Publication,
    Researcher,
    ResearcherEmbedding,
    ResearchTheme,
)
from app.schemas import CountRow, Health, Named, Overview, ResearcherOut, SearchResponse, Theme
from app.services.search import run_search

router = APIRouter(prefix="/api")
DB = Annotated[Session, Depends(get_session)]


class SearchParams(BaseModel):
    department: int | None = Field(None, ge=1)
    theme: int | None = Field(None, ge=1)
    expertise: int | None = Field(None, ge=1)
    keyword: int | None = Field(None, ge=1)
    limit: int = Field(12, ge=1, le=60)
    offset: int = Field(0, ge=0, le=10000)


Filters = Annotated[SearchParams, Depends()]


@router.get("/health", response_model=Health)
def health(session: DB):
    session.execute(text("SELECT 1"))
    settings = get_settings()
    count = (
        session.scalar(
            select(func.count())
            .select_from(ResearcherEmbedding)
            .where(
                ResearcherEmbedding.model_name == settings.embedding_model,
                ResearcherEmbedding.model_revision == settings.embedding_revision,
            )
        )
        or 0
    )
    return Health(status="ok", database="connected", indexed_profiles=count)


@router.get("/researchers", response_model=SearchResponse)
def researchers(session: DB, filters: Filters):
    return run_search(session, "browse", "", **filters.model_dump())


@router.get("/researchers/{researcher_id}", response_model=ResearcherOut)
def researcher(researcher_id: int, session: DB):
    result = session.get(Researcher, researcher_id)
    if result is None:
        raise HTTPException(404, "Researcher not found")
    return result


@router.get("/departments", response_model=list[Named])
def departments(session: DB):
    return session.scalars(select(Department).order_by(Department.name)).all()


@router.get("/themes", response_model=list[Theme])
def themes(session: DB):
    return session.scalars(select(ResearchTheme).order_by(ResearchTheme.name)).all()


@router.get("/expertise", response_model=list[Named])
def expertise(session: DB):
    return session.scalars(select(ExpertiseArea).order_by(ExpertiseArea.name)).all()


@router.get("/keywords", response_model=list[Named])
def keywords(session: DB):
    return session.scalars(select(Keyword).order_by(Keyword.name)).all()


@router.get("/search/{mode}", response_model=SearchResponse)
def search(
    mode: Literal["keyword", "semantic"],
    session: DB,
    q: Annotated[str, Query(min_length=1, max_length=500)],
    filters: Filters,
):
    q = q.strip()
    if not q:
        raise HTTPException(422, "Enter a research topic")
    if mode == "semantic":
        settings = get_settings()
        indexed = (
            session.scalar(
                select(func.count())
                .select_from(ResearcherEmbedding)
                .where(
                    ResearcherEmbedding.model_name == settings.embedding_model,
                    ResearcherEmbedding.model_revision == settings.embedding_revision,
                )
            )
            or 0
        )
        profiles = session.scalar(select(func.count()).select_from(Researcher)) or 0
        if not profiles or indexed != profiles:
            raise HTTPException(
                503, "Semantic index is not ready. Use keyword search while indexing completes."
            )
    return run_search(session, mode, q, **filters.model_dump())


def counts(session: Session, model, relation):
    rows = session.execute(
        select(model.name, func.count(Researcher.id))
        .select_from(Researcher)
        .join(relation)
        .group_by(model.name)
        .order_by(func.count(Researcher.id).desc(), model.name)
    )
    return [CountRow(name=name, count=count) for name, count in rows]


@router.get("/statistics/departments", response_model=list[CountRow])
def department_statistics(session: DB):
    return counts(session, Department, Researcher.department)


@router.get("/statistics/themes", response_model=list[CountRow])
def theme_statistics(session: DB):
    return counts(session, ResearchTheme, Researcher.themes)


@router.get("/statistics/overview", response_model=Overview)
def overview(session: DB):
    def total(model):
        return session.scalar(select(func.count()).select_from(model)) or 0

    years = session.execute(
        select(Publication.publication_year, func.count())
        .group_by(Publication.publication_year)
        .order_by(Publication.publication_year)
    )
    return Overview(
        researchers=total(Researcher),
        publications=total(Publication),
        departments=total(Department),
        themes=total(ResearchTheme),
        by_department=department_statistics(session),
        by_theme=theme_statistics(session),
        by_expertise=counts(session, ExpertiseArea, Researcher.expertise),
        by_year=[CountRow(name=str(year), count=count) for year, count in years],
    )
