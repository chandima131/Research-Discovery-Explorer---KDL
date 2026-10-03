import argparse
import json
from pathlib import Path

from sqlalchemy import func, select, text

from app.db.session import SessionLocal
from app.models import Department, ExpertiseArea, Keyword, Publication, Researcher, ResearchTheme
from app.services.indexing import refresh_profile


def seed(data_path: Path, embed: bool = True):
    data = json.loads(data_path.read_text(encoding="utf-8"))
    with SessionLocal() as session:
        if session.scalar(select(func.count()).select_from(Researcher)):
            return  # Never overwrite an existing database.
        catalogs = {}
        for key, model in [
            ("departments", Department),
            ("expertise", ExpertiseArea),
            ("keywords", Keyword),
            ("themes", ResearchTheme),
        ]:
            catalogs[key] = {item["id"]: model(**item) for item in data[key]}
            session.add_all(catalogs[key].values())
        session.flush()
        for item in data["researchers"]:
            researcher = Researcher(
                id=item["id"],
                name=item["name"],
                biography=item["biography"],
                department=catalogs["departments"][item["department"]["id"]],
            )
            for relation in ["expertise", "keywords", "themes"]:
                setattr(
                    researcher,
                    relation,
                    [catalogs[relation][value["id"]] for value in item[relation]],
                )
            researcher.publications = [
                Publication(**publication) for publication in item["publications"]
            ]
            session.add(researcher)
            session.flush()
            refresh_profile(session, researcher, embed=embed)
        # Explicit fixture IDs must not leave sequences behind future inserts.
        for table in [
            "department",
            "expertise_area",
            "keyword",
            "research_theme",
            "researcher",
            "publication",
        ]:
            session.execute(
                text(
                    f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                    f"COALESCE((SELECT MAX(id) FROM {table}), 1), true)"
                )
            )
        session.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    root = Path(__file__).resolve().parents[3]
    default_data = root / "data" / "researchers.json"
    if not default_data.exists():
        default_data = root.parent / "data" / "researchers.json"
    parser.add_argument("--data", type=Path, default=default_data)
    parser.add_argument(
        "--skip-embeddings",
        action="store_true",
        help="For integration tests only; semantic endpoint remains unavailable.",
    )
    args = parser.parse_args()
    seed(args.data, embed=not args.skip_embeddings)
