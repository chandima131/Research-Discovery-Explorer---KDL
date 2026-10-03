# Security and operational boundaries

The API is public-read-only by design. There are no accounts, uploads, profile editing routes or privileged browser features to protect with artificial authentication.

## Controls

- Pydantic bounds taxonomy IDs, query length (500), pagination (maximum 60, offset 10,000). Only keyword/semantic modes are accepted.
- SQLAlchemy binds values; table names in migrations are fixed developer-authored constants.
- ASGI middleware limits actual streamed request bodies to 16 KiB, not merely the declared Content-Length. Query strings are capped at 8 KiB.
- CORS is limited to configured local frontend origins and GET methods. CORS is not an authentication control.
- Nginx and FastAPI set MIME-sniffing, framing, referrer and permissions headers. Nginx supplies the frontend CSP. Inline styles remain allowed for Recharts layout; scripts are self-only.
- Nginx throttles API traffic; Docker exposes only the frontend on loopback. The database and backend are internal to Compose.
- Backend and frontend processes run as non-root. PostgreSQL image startup performs its normal volume ownership initialisation then drops privileges.
- `.env` is ignored and secrets are injected by environment. A password is required rather than baked into Compose. Use URL-safe passwords because Compose constructs a connection URL.
- No raw query or SQL parameter logging; server access logs are disabled. Error responses omit stack traces and implementation details.
- CI runs dependency audits. An audit finding must be reviewed and resolved before release; passing tests does not establish dependency safety.

## Before exposing publicly

Terminate TLS and then enable HSTS at the public gateway; do not blindly set it for the localhost demo. Add deployment-specific CPU/memory/time limits, global rate and concurrency policy, trusted-host/proxy configuration, backups and restore testing. Restrict the database runtime role and run migrations using a separate elevated role. Consider model cache warming and cap inference concurrency based on load tests. Review proxy logging because URLs can include personal search text.

The initial public model download requires outbound network access; model remote code execution is disabled. Pin and verify model revision and dependency resolution. Container image tags should be promoted to reviewed immutable digests during release management. No public deployment is configured or claimed.
