# Testing strategy

## Frontend

Vitest and React Testing Library test semantic method selection, trimmed query submission, filters, result rendering, empty/error recovery, score explanations and offline-mode honesty. Fixtures mock the HTTP service boundary, not the component implementation. Playwright covers the discovery journey through profiles, charts and the network; axe scans all principal routes. Offline E2E uses explicit local data so routine UI checks do not download a model.

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` in `frontend`. Install Chromium with `npx playwright install chromium`, then run `npm run test:e2e`. Browser tests start the labelled offline preview automatically. Browser screenshots are useful visual QA but do not prove backend integration.

## Backend

Run `uv sync --frozen --extra dev`, then `uv run --no-sync ruff check .`, `uv run --no-sync mypy app`, and `uv run --no-sync pytest -m 'not integration'` in `backend`. Unit tests cover validation, real body-size enforcement, deterministic data constraints, complete profile text and chunk normalisation. They require no database or downloaded model.

Integration tests require a **disposable, empty** PostgreSQL database with pgvector and migration `001`. Set `DATABASE_URL`, run `alembic upgrade head`, set `RUN_INTEGRATION=1`, and run `pytest -m integration`. Tests do not truncate a pre-existing database; they seed only when empty and use temporary marked embedding records for deterministic distance tests. Run them only in an isolated test database.

These tests check actual API serialisation, relationships, filters, full-text retrieval, injection-shaped input, statistics, index readiness and pgvector cosine ordering. Controlled orthogonal 384-dimensional vectors are appropriate for asserting mathematical ranking and database plumbing. They do **not** establish embedding-model relevance.

Enable `RUN_MODEL_TESTS=1` alongside `RUN_INTEGRATION=1` and run `pytest -m model` to download the pinned model and compare related/unrelated research concepts. This is a smoke check, not a relevance benchmark. The manual CI workflow performs it separately from routine PR checks.

## Release gates and limitations

- Run both the actual pgvector integration suite and the real-model smoke check before claiming the full semantic path is verified.
- Build/start Compose and check `/api/health`, semantic search and a profile from the browser.
- Run manual screen-reader, zoom and keyboard checks described in `accessibility.md`.
- Review dependency scans, privacy controls and operational configuration.
- Inspect desktop/mobile screenshots for clipping, density and typography.

The local verification report in `verification.md` records what was actually executed for the initial build. Written tests and configured CI are not equivalent to passing checks.
