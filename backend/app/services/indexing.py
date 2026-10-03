import hashlib
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Researcher, ResearcherEmbedding
from app.services.embeddings import get_embedder


def profile_text(researcher: Researcher) -> str:
    return "\n".join(
        [
            researcher.name,
            researcher.biography,
            researcher.department.name,
            *[x.name for x in researcher.expertise],
            *[x.name for x in researcher.keywords],
            *[x.name for x in researcher.themes],
            *[f"{p.title}. {p.abstract}" for p in researcher.publications],
        ]
    )


def refresh_profile(session: Session, researcher: Researcher, embed: bool = True) -> bool:
    """Call in the same transaction as profile edits. No public write endpoint."""
    document = profile_text(researcher)
    researcher.search_document = document
    digest = hashlib.sha256(("profile-v1/chunks220/mean-v1\n" + document).encode()).hexdigest()
    settings = get_settings()
    existing = session.scalar(
        select(ResearcherEmbedding).where(ResearcherEmbedding.researcher_id == researcher.id)
    )
    if not embed:
        if existing:
            session.delete(existing)
        return False
    if existing and (existing.content_hash, existing.model_name, existing.model_revision) == (
        digest,
        settings.embedding_model,
        settings.embedding_revision,
    ):
        return False
    vector = list(get_embedder().encode(document))
    if existing is None:
        existing = ResearcherEmbedding(researcher_id=researcher.id)
        session.add(existing)
    existing.embedding = vector
    existing.model_name = settings.embedding_model
    existing.model_revision = settings.embedding_revision
    existing.content_hash = digest
    existing.generated_at = datetime.now(UTC)
    return True


def refresh_all() -> None:
    from app.db.session import SessionLocal

    with SessionLocal() as session:
        for researcher in session.scalars(select(Researcher).order_by(Researcher.id)):
            refresh_profile(session, researcher)
        session.commit()


if __name__ == "__main__":
    refresh_all()
