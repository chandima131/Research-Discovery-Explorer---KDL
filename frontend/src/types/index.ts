export interface Named {
  id: number;
  name: string;
}
export interface Theme extends Named {
  description: string;
}
export interface Publication {
  id: number;
  title: string;
  abstract: string;
  publication_year: number;
}
export interface Researcher {
  id: number;
  name: string;
  biography: string;
  department: Named;
  expertise: Named[];
  keywords: Named[];
  themes: Theme[];
  publications: Publication[];
  updated_at: string;
}
export interface SearchHit {
  researcher: Researcher;
  similarity: number | null;
  concepts: { concept: string; similarity: number }[];
  relevant_publication_ids: number[];
}
export interface SearchResponse {
  items: SearchHit[];
  total: number;
  limit: number;
  offset: number;
  mode: "browse" | "keyword" | "semantic";
  model_name?: string;
  model_revision?: string;
}
export interface CountRow {
  name: string;
  count: number;
}
export interface Overview {
  researchers: number;
  publications: number;
  departments: number;
  themes: number;
  by_department: CountRow[];
  by_theme: CountRow[];
  by_expertise: CountRow[];
  by_year: CountRow[];
}
export interface Catalog {
  departments: Named[];
  themes: Theme[];
  expertise: Named[];
  keywords: Named[];
}
