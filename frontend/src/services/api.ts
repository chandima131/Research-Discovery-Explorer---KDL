import type { Catalog, Overview, Researcher, SearchResponse } from "../types";

export const demoMode = import.meta.env.VITE_DEMO_MODE === "true";

export async function request<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  if (demoMode) {
    const { demoRequest } = await import("./demo");
    return demoRequest(path) as T;
  }
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error(
      "Cannot reach the research service. Check your connection and try again.",
    );
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      typeof error?.detail === "string"
        ? error.detail
        : `The request could not be completed (${response.status}). Please try again.`,
    );
  }
  return response.json() as Promise<T>;
}

export const api = {
  search: (params: URLSearchParams, signal?: AbortSignal) => {
    const q = params.get("q")?.trim();
    const mode = params.get("mode") === "semantic" ? "semantic" : "keyword";
    const query = new URLSearchParams(params);
    query.delete("mode");
    if (!q) query.delete("q");
    return request<SearchResponse>(
      `${q ? `/search/${mode}` : "/researchers"}?${query}`,
      signal,
    );
  },
  researcher: (id: string, signal?: AbortSignal) =>
    request<Researcher>(`/researchers/${id}`, signal),
  overview: (signal?: AbortSignal) =>
    request<Overview>("/statistics/overview", signal),
  catalog: async (signal?: AbortSignal): Promise<Catalog> => {
    const [departments, themes, expertise, keywords] = await Promise.all([
      request<Catalog["departments"]>("/departments", signal),
      request<Catalog["themes"]>("/themes", signal),
      request<Catalog["expertise"]>("/expertise", signal),
      request<Catalog["keywords"]>("/keywords", signal),
    ]);
    return { departments, themes, expertise, keywords };
  },
};
