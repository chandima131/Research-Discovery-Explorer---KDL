import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import SearchForm from "../components/SearchForm";
import ResearcherCard from "../components/ResearcherCard";
import { ErrorState, Loading } from "../components/Status";
import { useResource } from "../hooks/useResource";
import { api } from "../services/api";
import type { Catalog } from "../types";

const filterFields: [string, keyof Catalog, string][] = [
  ["department", "departments", "Department"],
  ["theme", "themes", "Research theme"],
  ["expertise", "expertise", "Expertise area"],
  ["keyword", "keywords", "Keyword"],
];
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const serialized = params.toString();
  const results = useResource(
    useCallback(
      (signal: AbortSignal) =>
        api.search(new URLSearchParams(serialized), signal),
      [serialized],
    ),
  );
  const catalog = useResource(
    useCallback((signal: AbortSignal) => api.catalog(signal), []),
  );
  const query = params.get("q") ?? "",
    mode = params.get("mode") ?? "keyword";
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("offset");
    setParams(next);
  }
  const filtered = filterFields.some(([key]) => params.has(key));
  return (
    <div className="page search-page">
      <div className="page-intro">
        <p className="eyebrow">FIND YOUR NEXT CONNECTION</p>
        <h1>Discover research expertise</h1>
        <p>Find people working on the questions that matter to you.</p>
      </div>
      <SearchForm
        compact
        initialQuery={query}
        initialMode={mode}
        onSearch={(q, nextMode) => {
          const next = new URLSearchParams(params);
          if (q) next.set("q", q);
          else next.delete("q");
          next.set("mode", nextMode);
          next.delete("offset");
          setParams(next);
        }}
      />
      <div className="search-layout">
        <aside className="filters" aria-label="Filter researchers">
          <h2>
            <SlidersHorizontal size={17} /> Refine your search
          </h2>
          {catalog.loading && <Loading label="Loading filters…" />}
          {catalog.error && (
            <ErrorState message={catalog.error} retry={catalog.retry} />
          )}
          {filterFields.map(([key, field, label]) => (
            <div className="filter-field" key={key}>
              <label htmlFor={`filter-${key}`}>{label}</label>
              <select
                id={`filter-${key}`}
                value={params.get(key) ?? ""}
                onChange={(e) => update(key, e.target.value)}
                disabled={!catalog.data}
              >
                <option value="">All {label.toLowerCase()}s</option>
                {catalog.data?.[field].map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {filtered && (
            <button
              className="text-button clear-filters"
              onClick={() => {
                const next = new URLSearchParams(params);
                filterFields.forEach(([key]) => next.delete(key));
                next.delete("offset");
                setParams(next);
              }}
            >
              <X size={16} />
              Clear all filters
            </button>
          )}
          <p className="filter-footnote">
            All researchers and publications in this demonstration are
            fictional.
          </p>
        </aside>
        <section
          className="results"
          aria-label="Researcher results"
          aria-busy={results.loading}
        >
          <div className="results-heading">
            <p role="status" aria-live="polite">
              {results.data ? (
                <>
                  <strong>{results.data.total}</strong> researchers
                  {query ? (
                    <>
                      {" "}
                      for <strong>“{query}”</strong>
                    </>
                  ) : (
                    " to explore"
                  )}
                </>
              ) : (
                "Researcher results"
              )}
            </p>
            <span>
              {query
                ? mode === "semantic"
                  ? "Sorted by similarity"
                  : "Sorted by keyword relevance"
                : "Sorted by name"}
            </span>
          </div>
          {mode === "semantic" && query && (
            <p className="similarity-note">
              Similarity scores indicate how closely the profile content matches
              the semantic meaning of your query. They should be interpreted as
              discovery aids rather than definitive rankings. Switching methods
              and submitting the same query lets you compare results.
            </p>
          )}
          {results.loading && <Loading label="Finding researchers…" />}
          {results.error && (
            <ErrorState message={results.error} retry={results.retry} />
          )}
          {results.data?.total === 0 && (
            <div className="empty-state">
              <h2>No researchers found</h2>
              <p>
                Try a broader topic, remove a filter, or switch search methods.
              </p>
              <button
                className="button secondary"
                onClick={() => setParams({})}
              >
                Browse all researchers
              </button>
            </div>
          )}
          <div className="results-grid">
            {results.data?.items.map((hit) => (
              <ResearcherCard
                key={hit.researcher.id}
                hit={hit}
                query={query}
                mode={mode}
              />
            ))}
          </div>
          {results.data && results.data.total > results.data.limit && (
            <nav className="pagination" aria-label="Search result pages">
              <button
                className="button secondary"
                disabled={results.data.offset === 0}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set(
                    "offset",
                    String(Math.max(0, (results.data?.offset ?? 0) - 12)),
                  );
                  setParams(next);
                }}
              >
                <ArrowLeft size={16} />
                Previous
              </button>
              <span>
                Page {Math.floor(results.data.offset / results.data.limit) + 1}{" "}
                of {Math.ceil(results.data.total / results.data.limit)}
              </span>
              <button
                className="button secondary"
                disabled={
                  results.data.offset + results.data.limit >= results.data.total
                }
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("offset", String((results.data?.offset ?? 0) + 12));
                  setParams(next);
                }}
              >
                Next
                <ArrowRight size={16} />
              </button>
            </nav>
          )}
          {results.data?.model_name && (
            <p className="model-note">
              Model: {results.data.model_name} · Revision:{" "}
              {results.data.model_revision?.slice(0, 12)}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
