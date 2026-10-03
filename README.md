# Research Discovery Explorer

An independent, full-stack research software demonstration for discovering expertise through **structured data, keyword search and semantic retrieval**. It contains 48 fictional researchers in 12 fictional departments, six cross-disciplinary themes and 144 fictional publications. No private university code, records, branding or real researcher profiles are used. Any resemblance to a real person is coincidental.

The research problem is vocabulary mismatch: someone asking about computational analysis of historical documents may benefit from expertise described as natural language processing, archival analysis or digital humanities. This application lets a user run the same query through keyword and semantic search, inspect the profiles and compare the evidence. It is not a chatbot or a researcher-quality ranking system.

## Features

- Search by words or meaning, with department, theme, expertise and keyword filters, pagination and shareable query URLs.
- Detailed profiles, relevant publications, cosine scores and separately scored related concepts.
- Department, theme, expertise and publication-year charts, with complete table alternatives.
- Theme-centred researcher networks with an equivalent relationship table.
- Methodology, accessibility, ethics and privacy pages, plus a complete JavaScript-free HTML directory.
- Read-only, typed OpenAPI API; normalised SQLAlchemy models; Alembic migrations; indexed PostgreSQL full-text search and pgvector exact cosine retrieval.
- Cached CPU embedding service, immutable model revision and transactional refresh by content hash.

## Quick start with Docker

Requirements: Docker Desktop/Engine with Compose v2, internet access for the initial images and public model download, and approximately 4 GB of free memory. The initial build can take several minutes.

1. Copy `.env.example` to `.env`.
2. Replace `POSTGRES_PASSWORD` with a locally generated password using URL-safe characters (for example a random hexadecimal string). The value is also interpolated into the database URL. Never commit `.env`.
3. Run from the repository root:

```sh
docker compose up --build
```

Open **http://localhost:8080**. The API is available through the same origin under `/api`; health is at `/api/health`. The container starts by applying migrations, seeding an empty database and indexing profiles. No public write endpoint exists. A database and model cache persist in named volumes. Existing research profiles are never overwritten by seeding. If startup fails, inspect `docker compose logs backend` and retry after fixing the cause.

`docker compose down` stops services and preserves data. Do not add `--volumes` unless you intend to delete the database and model cache. Ports bind to loopback for this local demonstration. There is no automatic public deployment.

The backend exposes OpenAPI at `/openapi.json` and Swagger at `/docs` on port 8000 inside the Compose network. For development, use the local backend at http://localhost:8000/docs. Nginx intentionally only forwards `/api` in the normal browser-facing build.

## Local development

Use Node 22 LTS and Python 3.11. A running PostgreSQL 16 database with the pgvector extension is required for the full application. Docker and CI use `backend/uv.lock` with uv 0.12.22, including the CPU-only PyTorch index.

```sh
pip install uv==0.12.22
cd backend
uv sync --frozen --extra dev
# Activate backend/.venv for your shell, or prefix commands with uv run --no-sync.
# Set DATABASE_URL to postgresql+psycopg://user:password@localhost:5432/research
# Linux/macOS: export DATABASE_URL='...'
# PowerShell: $env:DATABASE_URL = '...'
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --no-access-log
```

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:4173. Vite proxies `/api` to port 8000. The Python embedding model is loaded lazily and performs CPU inference; it is not an external hosted AI API.

### Offline interface preview

```sh
cd frontend
npm ci
npm run dev:demo
```

This explicit preview loads the same synthetic JSON, shows a prominent banner and provides basic all-term substring keyword matching. **It is not PostgreSQL full-text search and does not simulate semantic scores.** Choosing semantic search explains that the backend is required. Production builds do not enable this mode. It exists for interface development and fast browser tests, not as a hidden service fallback.

## Architecture and stack

```text
Browser: React + TypeScript + Vite + Recharts
   │ same-origin /api (Nginx in Docker)
   ▼
FastAPI / Pydantic routes
   │
Search + embedding + indexing services
   │
SQLAlchemy repositories → PostgreSQL 16 + pgvector
   └─ sentence-transformers / CPU / pinned all-MiniLM-L6-v2 revision
```

```text
backend/app/{api,core,db,models,repositories,schemas,services,tests}
backend/migrations/       versioned schema history
frontend/src/{components,hooks,pages,services,tests,types}
frontend/e2e/             Playwright and axe tests
data/researchers.json     versioned, synthetic source dataset
scripts/                 deterministic dataset and text-directory generators
docs/                    architecture, data model, risks and decision records
```

Shared taxonomy tables model expertise, keywords and themes as many-to-many relationships. Publications belong to one profile in this demonstration. `researcher.search_document` is a derived projection, not the canonical data model; a stored `tsvector` and GIN index support keyword retrieval. Embeddings record model name/revision, content hash and generation time. See [data model](docs/data-model.md) and [architecture](docs/architecture.md).

## Search methodology

Keyword search uses PostgreSQL `websearch_to_tsquery('english', q)` and `ts_rank_cd`. Unquoted terms are ANDed; quoted phrases, `OR` and exclusions are supported. All profile and publication text is indexed. Filters use numeric taxonomy IDs and parameterised expressions.

Semantic search uses `sentence-transformers/all-MiniLM-L6-v2`, revision `c9745ed1d9f207416be6d2e6f8de32d1f16199bf`, with 384 dimensions. Text is split into 220-token chunks to avoid silent truncation. Chunk embeddings are normalised, averaged and normalised again. Cosine similarity is `1 - cosine_distance`, calculated **in pgvector**. At 48 profiles, an exact scan is simpler and yields complete filtered results; an approximate HNSW index is deferred until benchmarked scale justifies it.

Scores are not probabilities or quality measures. There is no unvalidated minimum score: semantic search orders all filtered profiles. Related-concept and publication scores are computed separately to help users inspect possible associations; they are not causal explanations. Compare the same query using each mode and read the source profile.

Refresh embeddings after changing data through a trusted administrative workflow:

```sh
cd backend
python -m app.services.indexing
```

Programmatic profile edits should call `refresh_profile(session, researcher)` in the same transaction. Changes in model revision or content invalidate an embedding. No embeddings are refreshed on search requests. Modifying preprocessing requires an explicit reindex policy; see ADR-004.

## Reproducible data

```sh
node scripts/generate-data.mjs
node scripts/generate-directory.mjs
```

The generator is deterministic and uses only locally authored fictional content. Keep the JSON and text directory committed so consumers do not depend on generation tools. Four methodological perspectives per discipline create variation; the dataset is intentionally small and cannot validate fairness or broad retrieval quality.

## Quality checks

```sh
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

```sh
cd backend
ruff check .
mypy app
pytest -m "not integration"
# Against a disposable, migrated PostgreSQL database:
# Set RUN_INTEGRATION=1, then:
pytest -m integration
```

Integration tests seed an empty database and exercise actual PostgreSQL text search, relationships and pgvector ranking. Controlled vectors isolate database retrieval correctness from model quality. The optional `RUN_MODEL_TESTS=1` test downloads the pinned model and checks a related-versus-unrelated semantic example. Do not run integration tests against a database containing valuable data. See [testing](docs/testing.md) for exact commands and verification boundaries.

## Accessibility, privacy and security

Semantic landmarks, skip link, native labelled controls, keyboard focus states, responsive layouts, reduced-motion support, live search feedback, table alternatives and the static directory support WCAG 2.2 AA principles. Automated axe checks are included; they do not constitute a conformance audit. Manual assistive-technology testing is still required.

No accounts, analytics, cookies or real researcher data. Query text remains in browser URLs/history and briefly in the bounded in-process embedding cache. Uvicorn and Nginx access logs are disabled. Application errors omit query text and database details. Model downloads contact the public model host. See [privacy and ethics](docs/ethics.md).

ORM parameters, bounded queries/pagination/bodies, restricted CORS, security headers, Nginx request throttling, non-root app containers and environment-based secrets form the baseline. Public deployment additionally requires TLS, operational monitoring, resource limits, abuse testing and current dependency review. See [security](docs/security.md).

## CI/CD

[GitHub Actions](.github/workflows/ci.yml) runs frontend lint/type/test/build, backend Ruff/mypy/Pytest with a PostgreSQL pgvector service, Playwright/axe checks, dependency scans and Docker builds on push and pull request. It does not deploy. A manual model-evaluation job enables the real-model smoke check. Lockfiles record dependency resolution; update them intentionally and inspect scan results before release.

## Screenshots

Captured from the labelled offline interface preview (these do not demonstrate backend semantic retrieval):

![Homepage with search and research themes](docs/screenshots/home.png)

[Search](docs/screenshots/search.png) · [Explore](docs/screenshots/explore.png) · [Network](docs/screenshots/network.png) · [Mobile](docs/screenshots/mobile.png)

## Limitations and future work

- A measured retrieval evaluation set, multilingual assessment and stakeholder-led bias/accessibility review.
- Publication co-authorship and ORCID-style identifiers only with appropriate public data provenance and consent.
- Operational migration/backup procedures, observability without query logging, model upgrade evaluation and public deployment hardening.
- Benchmark-driven HNSW adoption, contextual snippets and relevance judgements.
- Server-rendered profile pages if progressive enhancement needs to go beyond the static directory.

## Technical references

Implementation follows the primary documentation for [pgvector’s SQLAlchemy integration](https://github.com/pgvector/pgvector-python), [SentenceTransformer encoding and model revisions](https://www.sbert.net/docs/package_reference/sentence_transformer/model.html), [PostgreSQL full-text search](https://www.postgresql.org/docs/16/textsearch.html) and [FastAPI](https://fastapi.tiangolo.com/).
#   R e s e a r c h - D i s c o v e r y - E x p l o r e r - - - K D L  
 