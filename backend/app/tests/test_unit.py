import json
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.routes import SearchParams
from app.db.session import get_session
from app.main import app
from app.services.embeddings import EmbeddingService
from app.services.indexing import profile_text


def test_filter_validation():
    for values in [{"limit": 61}, {"offset": -1}, {"department": 0}, {"theme": -3}]:
        with pytest.raises(ValidationError):
            SearchParams(**values)


def test_query_validation_and_request_guard():
    app.dependency_overrides[get_session] = lambda: None
    try:
        client = TestClient(app)
        assert client.get("/api/search/keyword", params={"q": " "}).status_code == 422
        assert client.get("/api/search/keyword", params={"q": "x" * 501}).status_code == 422
        assert client.get("/api/search/unsupported", params={"q": "test"}).status_code == 422
        assert client.get("/api/researchers", params={"limit": 1000}).status_code == 422
        response = client.request("GET", "/api/health", content=b"x" * 17000)
        assert response.status_code == 413
        assert response.headers["x-content-type-options"] == "nosniff"
    finally:
        app.dependency_overrides.clear()


def test_seed_is_synthetic_and_varied():
    root = Path(__file__).resolve().parents[3]
    path = root / "data/researchers.json"
    if not path.exists():
        path = root.parent / "data/researchers.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert "Synthetic" in data["provenance"]
    assert len(data["researchers"]) == 48
    assert len({x["name"] for x in data["researchers"]}) == 48
    for researcher in data["researchers"]:
        assert 3 <= len(researcher["expertise"]) <= 6
        assert 2 <= len(researcher["publications"]) <= 4
        assert researcher["keywords"] and researcher["themes"]


def test_profile_document_contains_related_records():
    from types import SimpleNamespace as Obj

    profile = Obj(
        name="Invented",
        biography="Biography",
        department=Obj(name="Dept"),
        expertise=[Obj(name="Expertise")],
        keywords=[Obj(name="Keyword")],
        themes=[Obj(name="Theme")],
        publications=[Obj(title="Title", abstract="Abstract")],
    )
    document = profile_text(profile)
    for part in [
        "Invented",
        "Biography",
        "Dept",
        "Expertise",
        "Keyword",
        "Theme",
        "Title",
        "Abstract",
    ]:
        assert part in document


def test_embedding_chunks_long_input_and_normalises_mean():
    class Tokenizer:
        def encode(self, text, **kwargs):
            return list(range(500))

        def decode(self, tokens):
            return str(len(tokens))

    class Model:
        tokenizer = Tokenizer()

        def encode(self, chunks, **kwargs):
            assert chunks == ["220", "220", "60"]
            return np.array([[1, 0], [0, 1], [1, 0]])

    service = EmbeddingService()
    service._model = Model()
    vector = service.encode("long fictional profile")
    assert np.linalg.norm(vector) == pytest.approx(1.0)
    assert vector[0] > vector[1]
