# ADR-001: Use PostgreSQL

Status: accepted.

Researcher metadata has strong relational structure and needs reliable transactions, constraints, migrations, filtering and aggregation. PostgreSQL supplies these alongside mature full-text search and an extension mechanism. Keeping canonical data and search projections together avoids synchronisation across services.

SQLite would simplify a toy install but cannot demonstrate the requested pgvector and PostgreSQL text-search behaviour. A document database weakens the natural shared-taxonomy model. The tradeoff is a database service and operational migration responsibility, handled locally by Compose.
