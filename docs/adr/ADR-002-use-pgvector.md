# ADR-002: Store vectors in PostgreSQL with pgvector

Status: accepted.

Profile vectors must be filtered by relational taxonomy and refreshed consistently with canonical content. pgvector supports cosine distance in the existing database and removes a separate vector-service deployment and synchronisation problem.

At 48 profiles an exact distance scan is fast enough and avoids approximate-recall surprises, especially under restrictive filters. Existing text and relation indexes cover other queries. Add HNSW with `vector_cosine_ops` only after measuring dataset growth, latency and recall. The consequence is less independent vector-service scaling, which is acceptable for this domain.
