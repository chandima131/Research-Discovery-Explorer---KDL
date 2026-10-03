import os
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select, text

from app.core.config import get_settings
from app.db.seed import seed
from app.db.session import SessionLocal, engine
from app.main import app
from app.models import Researcher, ResearcherEmbedding

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        not os.getenv("RUN_INTEGRATION"),
        reason="Set RUN_INTEGRATION=1 with a disposable migrated PostgreSQL database",
    ),
]


@pytest.fixture(scope="module")
def client():
    # Never truncate the configured database. CI creates a disposable empty database.
    path = Path(__file__).resolve().parents[4] / "data/researchers.json"
    if not path.exists():
        path = Path("data/researchers.json")
    seed(path, embed=False)
    return TestClient(app)


def test_researchers_relationships_and_missing_profile(client):
    response = client.get("/api/researchers?limit=5")
    assert response.status_code == 200
    assert response.json()["total"] == 48
    assert len(response.json()["items"]) == 5
    profile = client.get("/api/researchers/1").json()
    assert profile["department"]["name"] == "Digital Humanities"
    assert len(profile["expertise"]) == 4
    assert len(profile["publications"]) == 2
    assert client.get("/api/researchers/99999").status_code == 404


def test_keyword_search_includes_abstracts_and_filters(client):
    response = client.get("/api/search/keyword", params={"q": "nineteenth correspondence"})
    assert response.status_code == 200
    assert 1 in [x["researcher"]["id"] for x in response.json()["items"]]
    assert client.get("/api/search/keyword?q=unfindablewordzz").json()["total"] == 0
    for key, value in [("department", 1), ("expertise", 1), ("theme", 1), ("keyword", 1)]:
        response = client.get("/api/researchers", params={key: value})
        assert response.status_code == 200
        assert response.json()["total"] > 0
        for hit in response.json()["items"]:
            r = hit["researcher"]
            assert (
                r["department"]["id"] == value
                if key == "department"
                else any(
                    x["id"] == value
                    for x in r[
                        {"expertise": "expertise", "theme": "themes", "keyword": "keywords"}[key]
                    ]
                )
            )
    assert (
        client.get("/api/search/keyword", params={"q": "'; DROP TABLE researcher; --"}).status_code
        == 200
    )


def test_statistics_and_health(client):
    data = client.get("/api/statistics/overview").json()
    assert data["researchers"] == 48
    assert data["publications"] == 144
    assert sum(x["count"] for x in data["by_department"]) == 48
    assert sum(x["count"] for x in data["by_year"]) == 144
    assert client.get("/api/health").json()["database"] == "connected"


def test_pgvector_cosine_retrieval_and_filters(client, monkeypatch):
    settings = get_settings()
    with SessionLocal() as session:
        # Only this test's transaction modifies embeddings; clean up after assertions.
        assert session.scalar(select(func.count()).select_from(ResearcherEmbedding)) == 0
        for researcher in session.scalars(select(Researcher)):
            vector = [0.0] * 384
            vector[0 if researcher.id == 1 else 1] = 1.0
            session.add(
                ResearcherEmbedding(
                    researcher_id=researcher.id,
                    model_name=settings.embedding_model,
                    model_revision=settings.embedding_revision,
                    content_hash="test",
                    embedding=vector,
                )
            )
        session.commit()

    class TestEmbedder:
        def encode(self, value):
            return [1.0] + [0.0] * 383

    monkeypatch.setattr("app.services.search.get_embedder", lambda: TestEmbedder())
    try:
        response = client.get(
            "/api/search/semantic", params={"q": "invented query", "department": 1}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items"][0]["researcher"]["id"] == 1
        assert data["items"][0]["similarity"] == pytest.approx(1)
        assert data["total"] == 4
        assert len(data["items"][0]["concepts"]) == 3
    finally:
        with engine.begin() as connection:
            connection.execute(text("DELETE FROM researcher_embedding WHERE content_hash = 'test'"))
    assert client.get("/api/search/semantic?q=archives").status_code == 503


@pytest.mark.model
@pytest.mark.skipif(not os.getenv("RUN_MODEL_TESTS"), reason="Opt-in real model download")
def test_real_model_connects_related_concepts():
    from app.services.embeddings import get_embedder

    model = get_embedder()
    query = model.encode("AI methods for analysing historical documents")
    related = model.encode(
        "Natural language processing and machine learning for archival text analysis"
    )
    unrelated = model.encode("Coastal excavation and satellite surveys of ancient settlements")
    assert len(query) == 384
    assert np.dot(query, related) > np.dot(query, unrelated)
