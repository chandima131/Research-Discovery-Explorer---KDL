import { useCallback } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Fingerprint,
  Globe2,
  Layers3,
  Network,
  Sprout,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SearchForm from "../components/SearchForm";
import { ErrorState, Loading } from "../components/Status";
import { useResource } from "../hooks/useResource";
import { api } from "../services/api";

const icons = [BookOpen, Fingerprint, Layers3, Globe2, Sprout, Network];
export default function Home() {
  const navigate = useNavigate();
  const overview = useResource(
    useCallback((signal: AbortSignal) => api.overview(signal), []),
  );
  const catalog = useResource(
    useCallback((signal: AbortSignal) => api.catalog(signal), []),
  );
  return (
    <>
      <section className="home-hero page">
        <div className="hero-heading">
          <div>
            <p className="eyebrow">
              <span className="tiny-line" /> CONNECT PEOPLE, IDEAS & EXPERTISE
            </p>
            <h1>
              Research starts
              <br />
              with a <em>connection.</em>
            </h1>
            <p className="hero-description">
              Find expertise across disciplines. Explore shared interests.
              <br className="desktop-break" /> Discover the people behind new
              possibilities.
            </p>
          </div>
          <div className="orbital" aria-hidden="true">
            <div className="orbit o1" />
            <div className="orbit o2" />
            <div className="orbit o3" />
            <span className="orbital-center">
              <Network size={34} strokeWidth={1.2} />
            </span>
            <span className="orbit-node n1" />
            <span className="orbit-node n2" />
            <span className="orbit-node n3" />
            <span className="orbit-label l1">ideas</span>
            <span className="orbit-label l2">people</span>
            <span className="orbit-label l3">discovery</span>
            <span className="orbital-caption">A wider view of research.</span>
          </div>
        </div>
        <div className="home-search">
          <SearchForm
            onSearch={(q, mode) =>
              navigate(`/researchers?${new URLSearchParams({ q, mode })}`)
            }
          />
          <div className="try-search">
            <span>TRY A TOPIC</span>
            {[
              "Historical archives",
              "Climate adaptation",
              "Machine learning",
            ].map((topic) => (
              <button
                key={topic}
                onClick={() =>
                  navigate(
                    `/researchers?${new URLSearchParams({ q: topic, mode: "keyword" })}`,
                  )
                }
              >
                {topic}
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>
        </div>
        {overview.data && (
          <div className="stats-strip">
            {[
              [overview.data.researchers, "Fictional researchers"],
              [overview.data.departments, "Departments"],
              [overview.data.themes, "Research themes"],
              [overview.data.publications, "Sample publications"],
            ].map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
            <span className="stats-note">
              A small dataset.
              <br />A connected research landscape.
            </span>
          </div>
        )}
        {overview.error && (
          <ErrorState message={overview.error} retry={overview.retry} />
        )}
      </section>
      <section className="themes-section">
        <div className="page">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FOLLOW YOUR CURIOSITY</p>
              <h2>Explore research themes</h2>
              <p>Start with a field you know. See where it takes you.</p>
            </div>
            <Link className="text-link" to="/explore">
              Explore the landscape <ArrowRight size={17} />
            </Link>
          </div>
          {catalog.loading && <Loading />}
          {catalog.error && (
            <ErrorState message={catalog.error} retry={catalog.retry} />
          )}
          <div className="theme-grid">
            {catalog.data?.themes.map((theme, index) => {
              const Icon = icons[index % icons.length];
              return (
                <Link
                  className={`theme-card theme-${index % 3}`}
                  to={`/researchers?theme=${theme.id}`}
                  key={theme.id}
                >
                  <span className="theme-icon">
                    <Icon size={23} strokeWidth={1.4} />
                  </span>
                  <ArrowUpRight className="theme-arrow" size={19} />
                  <h3>{theme.name}</h3>
                  <p>{theme.description}</p>
                  <span className="theme-count">
                    {overview.data?.by_theme.find((x) => x.name === theme.name)
                      ?.count ?? "—"}{" "}
                    researchers
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="page methods-section">
        <div>
          <p className="eyebrow">TWO WAYS TO DISCOVER</p>
          <h2>
            Look beyond
            <br />
            the exact words.
          </h2>
          <Link className="text-link" to="/methodology">
            Read our methodology <ArrowRight size={16} />
          </Link>
        </div>
        <div className="method-note">
          <span className="number">01</span>
          <h3>Search by keyword</h3>
          <p>
            Have a specific term in mind? Find matching words in biographies,
            expertise and publications.
          </p>
          <span className="method-example">“digital archives”</span>
        </div>
        <div className="method-note">
          <span className="number">02</span>
          <h3>Search by meaning</h3>
          <p>
            Describe a research question. Semantic search connects your idea
            with related concepts and expertise.
          </p>
          <span className="method-example">
            “AI methods for analysing historical documents”
          </span>
        </div>
      </section>
      <div className="integrity-note page">
        <span className="integrity-mark">i</span>
        <p>
          <strong>Built for exploration, with care.</strong> All profiles are
          fictional. Similarity is a discovery aid, never a measure of
          researcher quality.{" "}
          <Link to="/ethics">
            Our approach to ethics <ArrowUpRight size={14} />
          </Link>
        </p>
      </div>
    </>
  );
}
