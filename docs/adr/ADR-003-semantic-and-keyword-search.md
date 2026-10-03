# ADR-003: Keep semantic and keyword retrieval distinct

Status: accepted.

Keyword search is precise for identifiable terms and publication titles; it misses conceptual synonyms. Embedding retrieval can bridge vocabulary but introduces bias and unexpected associations. Neither subsumes the other.

The interface preserves the query while users switch methods and resubmit, making sequential comparison possible without an opaque combined score. PostgreSQL text relevance and cosine similarity are not put on the same scale. Semantic scores appear only for actual vector retrieval and are described as discovery aids. No chatbot or unvalidated minimum score is introduced.
