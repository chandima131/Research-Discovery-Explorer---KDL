"""Initial relational schema; explicit SQL freezes this migration independently of ORM changes."""

from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    for table in ["department", "expertise_area", "keyword"]:
        op.execute(
            f"CREATE TABLE {table} (id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE)"
        )
    op.execute(
        "CREATE TABLE research_theme (id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL UNIQUE, description TEXT NOT NULL)"
    )
    op.execute("""CREATE TABLE researcher (
      id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, biography TEXT NOT NULL,
      department_id INTEGER NOT NULL REFERENCES department(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      search_document TEXT NOT NULL DEFAULT '',
      search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', search_document)) STORED)""")
    op.execute("CREATE INDEX ix_researcher_department_id ON researcher(department_id)")
    op.execute("CREATE INDEX ix_researcher_search ON researcher USING gin(search_vector)")
    for relation, target, column in [
        ("expertise", "expertise_area", "expertise_area_id"),
        ("keyword", "keyword", "keyword_id"),
        ("theme", "research_theme", "research_theme_id"),
    ]:
        op.execute(
            f"CREATE TABLE researcher_{relation} (researcher_id INTEGER REFERENCES researcher(id) ON DELETE CASCADE, {column} INTEGER REFERENCES {target}(id), PRIMARY KEY(researcher_id, {column}))"
        )
        op.execute(
            f"CREATE INDEX ix_researcher_{relation}_reverse ON researcher_{relation}({column}, researcher_id)"
        )
    op.execute("""CREATE TABLE publication (id SERIAL PRIMARY KEY, researcher_id INTEGER NOT NULL REFERENCES researcher(id) ON DELETE CASCADE,
      title TEXT NOT NULL, abstract TEXT NOT NULL, publication_year INTEGER NOT NULL CHECK(publication_year BETWEEN 1500 AND 2200))""")
    op.execute("CREATE INDEX ix_publication_researcher_id ON publication(researcher_id)")
    op.execute("CREATE INDEX ix_publication_publication_year ON publication(publication_year)")
    op.execute("""CREATE TABLE researcher_embedding (id SERIAL PRIMARY KEY,
      researcher_id INTEGER NOT NULL UNIQUE REFERENCES researcher(id) ON DELETE CASCADE,
      model_name VARCHAR(200) NOT NULL, model_revision VARCHAR(64) NOT NULL,
      content_hash VARCHAR(64) NOT NULL, embedding vector(384) NOT NULL,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(researcher_id, model_name, model_revision))""")
    # Exact vector scan is intentional for 48 profiles. Add HNSW after measured growth.


def downgrade():
    for table in [
        "researcher_embedding",
        "publication",
        "researcher_theme",
        "researcher_keyword",
        "researcher_expertise",
        "researcher",
        "research_theme",
        "keyword",
        "expertise_area",
        "department",
    ]:
        op.execute(f"DROP TABLE {table}")
