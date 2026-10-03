# Architecture

The application is a single deployable web service plus PostgreSQL, with separately built frontend and backend containers. A read-only discovery domain does not justify microservices, authentication or a separate vector database.

## Boundaries

- `api/routes.py`: validated HTTP inputs, typed outputs and status codes. It does not build embedding vectors.
- `services/search.py`: coordinates retrieval, related concepts and relevant publications.
- `repositories/researchers.py`: composable SQLAlchemy filters and database ranking. All values are bound parameters.
- `services/embeddings.py`: one lazy CPU model per process; immutable revision; bounded LRU text/vector cache. Normalised chunk mean handles long documents.
- `services/indexing.py`: content projection and embedding refresh in the profile edit transaction.
- `models`: canonical relational mappings; `schemas`: stable public API representations.
- React route pages compose small reusable search, result, chart and status components. API access is isolated from presentation and aborts obsolete requests.

URL parameters preserve query, mode and taxonomy filters, so links are shareable and browser Back works. Match metadata is passed in navigation state for immediate display; direct profile links can reconstruct it from the query. This fallback is capped at the current 60-profile API limit and should become a targeted match endpoint when the dataset grows.

## Startup and failure behaviour

Compose waits for PostgreSQL health, runs Alembic, seeds only an empty database, refreshes changed embeddings, then starts Uvicorn. The frontend waits for backend health. The initial model download requires network access; subsequent starts reuse the model volume. A failed seeding transaction rolls back. Partial or wrong-revision indexes cause semantic search to return 503 rather than silently omitting researchers.

Database errors return safe 503 responses; other server failures return a generic 500. The UI distinguishes loading, empty and error states and offers retry. AbortController prevents older responses from overwriting a newer filter state. There is no production fixture fallback.

## Resource choices

One CPU backend worker avoids duplicate model memory. Public deployments should measure latency, constrain CPU/memory, tune concurrency and provide TLS. Nginx limits request rate, but a shared proxy/IP can affect unrelated users; rate policy needs deployment-specific review. Exact pgvector search is intentional at 48 profiles. Query and concept caches are bounded to 256 text keys; they are process-local and cleared on restart.

## Frontend assets and enhancement

Recharts visuals complement data tables. The relationship graphic uses SVG and a full table, with theme selection as the main interaction. Generated static HTML preserves complete research content without JavaScript. The main app still needs JavaScript for routing and search; no claim of full server rendering is made.
