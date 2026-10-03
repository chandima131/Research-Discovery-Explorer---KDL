import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";

export default function SearchForm({
  initialQuery = "",
  initialMode = "keyword",
  onSearch,
  compact = false,
}: {
  initialQuery?: string;
  initialMode?: string;
  onSearch: (query: string, mode: string) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState(initialMode);
  useEffect(() => {
    setQuery(initialQuery);
    setMode(initialMode);
  }, [initialQuery, initialMode]);
  function submit(event: FormEvent) {
    event.preventDefault();
    onSearch(query.trim(), mode);
  }
  return (
    <form
      className={`search-form ${compact ? "compact" : ""}`}
      onSubmit={submit}
      aria-label="Researcher search"
    >
      <fieldset className="search-mode">
        <legend className="sr-only">Search method</legend>
        <label className={mode === "keyword" ? "selected" : ""}>
          <input
            type="radio"
            name="mode"
            value="keyword"
            checked={mode === "keyword"}
            onChange={() => setMode("keyword")}
          />
          <Search size={15} /> Keyword search
        </label>
        <label className={mode === "semantic" ? "selected" : ""}>
          <input
            type="radio"
            name="mode"
            value="semantic"
            checked={mode === "semantic"}
            onChange={() => setMode("semantic")}
          />
          <Sparkles size={15} /> Semantic search
        </label>
      </fieldset>
      <label className="sr-only" htmlFor="research-query">
        Research topic or expertise
      </label>
      <div className="search-input-row">
        <Search size={22} aria-hidden="true" />
        <input
          id="research-query"
          type="search"
          maxLength={500}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            mode === "semantic"
              ? "Describe an idea, question or research interest…"
              : "Search a topic, expertise or researcher…"
          }
          aria-describedby="search-help"
        />
        <button className="button" type="submit">
          Find researchers <ArrowRight size={17} />
        </button>
      </div>
      <p id="search-help" className="search-help">
        {mode === "semantic"
          ? "Search by meaning to discover related expertise, even when the wording is different."
          : "Find matching words and phrases across profiles, expertise and publications."}
      </p>
    </form>
  );
}
