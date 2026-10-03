import { useCallback } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { api } from "../services/api";
import { useResource } from "../hooks/useResource";
import { ErrorState, Loading } from "../components/Status";
import type { SearchHit } from "../types";

export default function ProfilePage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const profile = useResource(
    useCallback((signal: AbortSignal) => api.researcher(id, signal), [id]),
  );
  const state = location.state as { hit?: SearchHit; query?: string } | null;
  const q = params.get("q") ?? "",
    semantic = params.get("mode") === "semantic" && Boolean(q);
  const recovered = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        if (!semantic || state?.hit) return null;
        const response = await api.search(
          new URLSearchParams({ q, mode: "semantic", limit: "60" }),
          signal,
        );
        return (
          response.items.find((hit) => hit.researcher.id === Number(id)) ?? null
        );
      },
      [id, q, semantic, state?.hit],
    ),
  );
  const hit = state?.hit ?? recovered.data;
  const r = profile.data;
  return (
    <div className="page profile-page">
      <Link className="text-link back-link" to={`/researchers?${params}`}>
        <ArrowLeft size={16} />
        Back to researchers
      </Link>
      {profile.loading && <Loading />}
      {profile.error && (
        <ErrorState message={profile.error} retry={profile.retry} />
      )}
      {r && (
        <>
          <header className="profile-heading">
            <span
              className={`avatar large avatar-${r.id % 4}`}
              aria-hidden="true"
            >
              {r.name
                .replace(/^Dr /, "")
                .split(" ")
                .map((x) => x[0])
                .join("")}
            </span>
            <div>
              <p className="eyebrow">SYNTHETIC RESEARCHER PROFILE</p>
              <h1>{r.name}</h1>
              <p>{r.department.name}</p>
            </div>
          </header>
          <div className="profile-layout">
            <div>
              <section className="profile-section">
                <h2>Research interests</h2>
                <p>{r.biography}</p>
              </section>
              {semantic && (
                <section className="match-panel">
                  <h2>
                    <Sparkles size={20} />
                    About this match
                  </h2>
                  <p>
                    Retrieved for “{q}”.{" "}
                    {hit?.similarity != null && (
                      <>
                        Profile cosine similarity:{" "}
                        <strong>{hit.similarity.toFixed(3)}</strong>.
                      </>
                    )}
                  </p>
                  {recovered.loading && !hit && (
                    <Loading label="Recovering match context…" />
                  )}
                  {recovered.error && (
                    <ErrorState
                      message={recovered.error}
                      retry={recovered.retry}
                    />
                  )}
                  {hit && (
                    <>
                      <p>Related concepts from this profile:</p>
                      <ul className="tags">
                        {hit.concepts.map((x) => (
                          <li key={x.concept}>
                            {x.concept} · {x.similarity.toFixed(3)}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <p className="small-copy">
                    Concept scores compare each label with your query
                    separately. They suggest associations; they are not a causal
                    explanation of the profile ranking. Similarity is not
                    researcher quality.
                  </p>
                </section>
              )}
              <section className="profile-section">
                <div className="section-heading">
                  <h2>Selected publications</h2>
                  <span className="small-label">
                    {r.publications.length} fictional publications
                  </span>
                </div>
                <div className="publications">
                  {r.publications.map((p) => (
                    <article key={p.id}>
                      <span className="publication-year">
                        {p.publication_year}
                      </span>
                      <div>
                        <h3>
                          <BookOpen size={18} />
                          {p.title}
                        </h3>
                        <p>{p.abstract}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
            <aside className="profile-sidebar">
              <section>
                <h2>Expertise</h2>
                <ul className="tags">
                  {r.expertise.map((x) => (
                    <li key={x.id}>{x.name}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h2>Research themes</h2>
                {r.themes.map((x) => (
                  <Link
                    className="theme-profile-link"
                    key={x.id}
                    to={`/researchers?theme=${x.id}`}
                  >
                    {x.name} <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </section>
              <section>
                <h2>Keywords</h2>
                <ul className="keyword-list">
                  {r.keywords.map((x) => (
                    <li key={x.id}>
                      <Link to={`/researchers?keyword=${x.id}`}>{x.name}</Link>
                    </li>
                  ))}
                </ul>
              </section>
              <p className="small-copy">
                This is an invented profile for demonstration. It does not
                represent a real person or institution.
              </p>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
