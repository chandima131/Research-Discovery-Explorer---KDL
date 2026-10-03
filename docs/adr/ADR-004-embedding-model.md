# ADR-004: Pin a lightweight sentence-transformer

Status: accepted.

Use `sentence-transformers/all-MiniLM-L6-v2` at immutable revision `c9745ed1d9f207416be6d2e6f8de32d1f16199bf`. The 384-dimensional English model runs on CPU and is appropriate for demonstrating sentence-level semantic retrieval without an external AI service.

Long profile documents exceed the model window. Split tokenised text into 220-token chunks, encode and normalise each, average equally, then normalise again. This simple policy avoids silently dropping late publications but loses order and can dilute specialised concepts. Alternatives include publication-level vectors and weighted aggregation; defer them until an evaluation set justifies the complexity.

Persist model revision, content hash and generation time. The content hash includes the preprocessing version `profile-v1/chunks220/mean-v1`; update that prefix whenever the projection or aggregation changes. Cache query/concept vectors in a bounded process-local cache. Profile embeddings refresh only when content, preprocessing or model changes. A future model upgrade must migrate dimensions if needed and reindex before serving results. The model smoke test is not sufficient for real-world fairness or relevance claims.
