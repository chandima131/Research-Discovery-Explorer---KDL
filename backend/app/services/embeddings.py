from functools import lru_cache
from threading import Lock

import numpy as np

from app.core.config import get_settings


class EmbeddingService:
    """Lazy, CPU-only model. Profiles are chunked to avoid silent 256-token truncation."""

    def __init__(self):
        self._model = None
        self._lock = Lock()
        self._encode_cached = lru_cache(maxsize=256)(self._encode)

    def _get_model(self):
        with self._lock:
            if self._model is None:
                from sentence_transformers import SentenceTransformer

                settings = get_settings()
                self._model = SentenceTransformer(
                    settings.embedding_model,
                    revision=settings.embedding_revision,
                    device="cpu",
                    trust_remote_code=False,
                )
        return self._model

    def encode(self, text: str) -> tuple[float, ...]:
        return self._encode_cached(text)

    def _encode(self, text: str) -> tuple[float, ...]:
        model = self._get_model()
        tokens = model.tokenizer.encode(text, add_special_tokens=False)
        chunks = [
            model.tokenizer.decode(tokens[i : i + 220]) for i in range(0, len(tokens), 220)
        ] or [""]
        vectors = model.encode(chunks, normalize_embeddings=True, show_progress_bar=False)
        vector = np.mean(vectors, axis=0)
        norm = np.linalg.norm(vector)
        if norm == 0 or not np.isfinite(norm):
            raise ValueError("Embedding model returned an invalid vector")
        return tuple(float(value) for value in vector / norm)


@lru_cache
def get_embedder() -> EmbeddingService:
    return EmbeddingService()
