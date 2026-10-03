import { describe, expect, it } from "vitest";
import { demoRequest } from "../services/demo";
import type { Overview, SearchResponse } from "../types";

describe("explicit offline dataset", () => {
  it("never fabricates semantic scores", () => {
    expect(() => demoRequest("/search/semantic?q=archives")).toThrow(
      "Semantic search needs",
    );
  });
  it("filters profiles with pagination and reports complete totals", () => {
    const result = demoRequest(
      "/researchers?department=1&limit=2",
    ) as SearchResponse;
    expect(result.total).toBe(4);
    expect(result.items).toHaveLength(2);
    expect(
      result.items.every(
        (x) => x.researcher.department.id === 1 && x.similarity === null,
      ),
    ).toBe(true);
  });
  it("has consistent aggregate statistics", () => {
    const result = demoRequest("/statistics/overview") as Overview;
    expect(result.researchers).toBe(48);
    expect(result.publications).toBe(144);
    expect(result.by_department.reduce((sum, x) => sum + x.count, 0)).toBe(48);
    expect(result.by_year.reduce((sum, x) => sum + x.count, 0)).toBe(144);
  });
});
