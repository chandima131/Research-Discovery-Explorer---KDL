import data from "../../../data/researchers.json";
import type { CountRow, Researcher } from "../types";

function count(values: string[]): CountRow[] {
  const result = new Map<string, number>();
  values.forEach((value) => result.set(value, (result.get(value) ?? 0) + 1));
  return [...result]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Explicit offline preview: no simulated vector scores or silent production fallback.
export function demoRequest(path: string): unknown {
  const url = new URL(path, "http://demo.local");
  const { pathname, searchParams: params } = url;
  if (pathname === "/search/semantic")
    throw new Error(
      "Semantic search needs the Python service and pgvector. This offline preview supports keyword search and browsing only.",
    );
  for (const key of ["departments", "themes", "expertise", "keywords"] as const)
    if (pathname === `/${key}`) return data[key];
  if (pathname.startsWith("/researchers/")) {
    const researcher = data.researchers.find(
      (r) => r.id === Number(pathname.split("/").pop()),
    );
    if (!researcher) throw new Error("Researcher not found");
    return researcher;
  }
  if (pathname === "/statistics/overview")
    return {
      researchers: data.researchers.length,
      publications: data.researchers.reduce(
        (n, r) => n + r.publications.length,
        0,
      ),
      departments: data.departments.length,
      themes: data.themes.length,
      by_department: count(data.researchers.map((r) => r.department.name)),
      by_theme: count(
        data.researchers.flatMap((r) => r.themes.map((x) => x.name)),
      ),
      by_expertise: count(
        data.researchers.flatMap((r) => r.expertise.map((x) => x.name)),
      ),
      by_year: count(
        data.researchers.flatMap((r) =>
          r.publications.map((p) => String(p.publication_year)),
        ),
      ).sort((a, b) => a.name.localeCompare(b.name)),
    };
  const q = params.get("q")?.toLowerCase().trim() ?? "";
  const items = data.researchers
    .filter((r: Researcher) => {
      const text = [
        r.name,
        r.biography,
        ...r.expertise.map((x) => x.name),
        ...r.keywords.map((x) => x.name),
        ...r.publications.map((p) => `${p.title} ${p.abstract}`),
      ]
        .join(" ")
        .toLowerCase();
      return (
        q.split(/\s+/).every((term) => text.includes(term)) &&
        (!params.get("department") ||
          r.department.id === Number(params.get("department"))) &&
        (["theme", "expertise", "keyword"] as const).every(
          (key) =>
            !params.get(key) ||
            r[
              key === "theme"
                ? "themes"
                : key === "keyword"
                  ? "keywords"
                  : "expertise"
            ].some((x) => x.id === Number(params.get(key))),
        )
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const limit = Number(params.get("limit") || 12),
    offset = Number(params.get("offset") || 0);
  return {
    items: items
      .slice(offset, offset + limit)
      .map((researcher) => ({
        researcher,
        similarity: null,
        concepts: [],
        relevant_publication_ids: researcher.publications
          .slice(0, 2)
          .map((p) => p.id),
      })),
    total: items.length,
    limit,
    offset,
    mode: q ? "keyword" : "browse",
  };
}
