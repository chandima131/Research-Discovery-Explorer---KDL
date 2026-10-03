import re
from typing import Literal

import numpy as np
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.repositories.researchers import search
from app.schemas import ConceptMatch, ResearcherOut, SearchHit, SearchResponse
from app.services.embeddings import get_embedder


def run_search(
    session: Session,
    mode: Literal["browse", "keyword", "semantic"],
    q: str,
    limit: int,
    offset: int,
    **filters,
):
    embedder = get_embedder() if mode == "semantic" else None
    vector = list(embedder.encode(q)) if embedder else None
    rows, total = search(session, mode, q, vector, limit, offset, **filters)
    items = []
    terms = set(re.findall(r"\w+", q.lower()))
    for researcher, similarity in rows:
        concepts = []
        if embedder and vector is not None:
            # Concept similarity is a separate retrieval aid, not a causal attribution.
            labels = {
                x.name for x in [*researcher.expertise, *researcher.keywords, *researcher.themes]
            }
            ranked = sorted(
                ((label, float(np.dot(vector, embedder.encode(label)))) for label in labels),
                key=lambda x: (-x[1], x[0]),
            )
            concepts = [
                ConceptMatch(concept=label, similarity=round(score, 4))
                for label, score in ranked[:3]
            ]
            publications = sorted(
                researcher.publications,
                key=lambda p: -float(np.dot(vector, embedder.encode(f"{p.title}. {p.abstract}"))),
            )
        else:
            publications = sorted(
                researcher.publications,
                key=lambda p: -len(
                    terms & set(re.findall(r"\w+", f"{p.title} {p.abstract}".lower()))
                ),
            )
        items.append(
            SearchHit(
                researcher=ResearcherOut.model_validate(researcher),
                similarity=round(similarity, 4) if similarity is not None else None,
                concepts=concepts,
                relevant_publication_ids=[p.id for p in publications[:2]],
            )
        )
    settings = get_settings()
    return SearchResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
        mode=mode,
        model_name=settings.embedding_model if embedder else None,
        model_revision=settings.embedding_revision if embedder else None,
    )
