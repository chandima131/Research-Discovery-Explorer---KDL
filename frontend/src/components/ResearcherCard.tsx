import { ArrowUpRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import type { SearchHit } from "../types";

export default function ResearcherCard({
  hit,
  query = "",
  mode = "keyword",
}: {
  hit: SearchHit;
  query?: string;
  mode?: string;
}) {
  const r = hit.researcher;
  const initials = r.name
    .replace(/^Dr /, "")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  const publication =
    r.publications.find((p) => p.id === hit.relevant_publication_ids[0]) ??
    r.publications[0];
  const context = new URLSearchParams({ q: query, mode });
  return (
    <article className="researcher-card">
      <div className="card-top">
        <span className={`avatar avatar-${r.id % 4}`} aria-hidden="true">
          {initials}
        </span>
        <span className="small-label">Fictional profile</span>
        {hit.similarity !== null && (
          <span className="score">
            <Sparkle /> {hit.similarity.toFixed(3)}
            <span className="sr-only"> cosine similarity</span>
          </span>
        )}
      </div>
      <h2>
        <Link to={`/researchers/${r.id}?${context}`} state={{ hit, query }}>
          {r.name}
          <ArrowUpRight size={20} />
        </Link>
      </h2>
      <p className="department">{r.department.name}</p>
      <p className="bio-preview">{r.biography}</p>
      <ul className="tags" aria-label="Expertise">
        {r.expertise.slice(0, 3).map((x) => (
          <li key={x.id}>{x.name}</li>
        ))}
      </ul>
      <p className="keyword-line">
        <span>Keywords</span> {r.keywords.map((x) => x.name).join(" · ")}
      </p>
      {publication && (
        <div className="publication-preview">
          <BookOpen size={16} aria-hidden="true" />
          <p>
            <span>{publication.publication_year} · Relevant publication</span>
            {publication.title}
          </p>
        </div>
      )}
    </article>
  );
}
function Sparkle() {
  return <span aria-hidden="true">✧</span>;
}
