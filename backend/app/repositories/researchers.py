from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import ExpertiseArea, Keyword, Researcher, ResearcherEmbedding, ResearchTheme


def filtered(statement, department=None, theme=None, expertise=None, keyword=None):
    if department:
        statement = statement.where(Researcher.department_id == department)
    if theme:
        statement = statement.where(Researcher.themes.any(ResearchTheme.id == theme))
    if expertise:
        statement = statement.where(Researcher.expertise.any(ExpertiseArea.id == expertise))
    if keyword:
        statement = statement.where(Researcher.keywords.any(Keyword.id == keyword))
    return statement


def search(session: Session, mode: str, q: str, vector, limit: int, offset: int, **filters):
    statement = select(Researcher)
    score = None
    if mode == "keyword":
        query = func.websearch_to_tsquery("english", q)
        statement = statement.where(Researcher.search_vector.op("@@")(query))
        score = func.ts_rank_cd(Researcher.search_vector, query)
        statement = statement.order_by(score.desc(), Researcher.id)
    elif mode == "semantic":
        settings = get_settings()
        distance = ResearcherEmbedding.embedding.cosine_distance(vector)
        score = 1 - distance
        statement = (
            statement.join(ResearcherEmbedding)
            .where(
                ResearcherEmbedding.model_name == settings.embedding_model,
                ResearcherEmbedding.model_revision == settings.embedding_revision,
            )
            .order_by(distance, Researcher.id)
        )
    else:
        statement = statement.order_by(Researcher.name, Researcher.id)
    statement = filtered(statement, **filters)
    total = (
        session.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
    )
    if score is not None:
        statement = statement.add_columns(score)
    rows = session.execute(statement.limit(limit).offset(offset)).all()
    return [(row[0], float(row[1]) if mode == "semantic" else None) for row in rows], total
