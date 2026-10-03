import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchForm from "../components/SearchForm";
import SearchPage from "../pages/SearchPage";
import { api } from "../services/api";
import data from "../../../data/researchers.json";

vi.mock("../services/api", () => ({
  api: { search: vi.fn(), catalog: vi.fn() },
}));
const mockedSearch = vi.mocked(api.search);
const response = {
  items: [
    {
      researcher: data.researchers[0],
      similarity: null,
      concepts: [],
      relevant_publication_ids: [1],
    },
  ],
  total: 1,
  limit: 12,
  offset: 0,
  mode: "keyword" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.catalog).mockResolvedValue(data);
  mockedSearch.mockResolvedValue(response);
});

describe("search discovery", () => {
  it("submits a trimmed query and the chosen search method using labelled controls", async () => {
    const user = userEvent.setup(),
      submit = vi.fn();
    render(<SearchForm onSearch={submit} />);
    await user.type(screen.getByRole("searchbox"), "  historical archives  ");
    await user.click(screen.getByRole("radio", { name: /semantic search/i }));
    await user.click(screen.getByRole("button", { name: /find researchers/i }));
    expect(submit).toHaveBeenCalledWith("historical archives", "semantic");
  });
  it("renders researcher cards and relevant publications", async () => {
    render(
      <MemoryRouter initialEntries={["/researchers?q=archives"]}>
        <SearchPage />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("link", { name: /Dr Maya Bennett/ }),
    ).toHaveAttribute("href", expect.stringContaining("/researchers/1"));
    expect(
      screen.getByText(
        "Computational Analysis of Nineteenth-Century Correspondence",
      ),
    ).toBeInTheDocument();
  });
  it("applies a department filter and removes it through clear filters", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>,
    );
    await screen.findByRole("link", { name: /Dr Maya Bennett/ });
    await user.selectOptions(screen.getByLabelText("Department"), "1");
    await waitFor(() =>
      expect(mockedSearch.mock.calls.at(-1)?.[0].get("department")).toBe("1"),
    );
    await user.click(
      screen.getByRole("button", { name: /clear all filters/i }),
    );
    await waitFor(() =>
      expect(mockedSearch.mock.calls.at(-1)?.[0].has("department")).toBe(false),
    );
  });
  it("explains empty results and offers recovery", async () => {
    mockedSearch.mockResolvedValue({ ...response, items: [], total: 0 });
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "No researchers found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Browse all researchers" }),
    ).toBeInTheDocument();
  });
  it("shows safe error feedback and retries", async () => {
    const user = userEvent.setup();
    mockedSearch.mockRejectedValueOnce(new Error("Service unavailable"));
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Service unavailable",
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("link", { name: /Dr Maya Bennett/ }),
    ).toBeInTheDocument();
  });
  it("keeps the query when switching to semantic search and explains scores", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue({
      ...response,
      mode: "semantic",
      items: [{ ...response.items[0], similarity: 0.8123 }],
    });
    render(
      <MemoryRouter initialEntries={["/researchers?q=historical"]}>
        <SearchPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("radio", { name: /semantic search/i }));
    await user.click(screen.getByRole("button", { name: /find researchers/i }));
    await waitFor(() =>
      expect(mockedSearch.mock.calls.at(-1)?.[0].get("mode")).toBe("semantic"),
    );
    expect(mockedSearch.mock.calls.at(-1)?.[0].get("q")).toBe("historical");
    expect(
      screen.getByText(/discovery aids rather than definitive rankings/),
    ).toBeInTheDocument();
    expect(await screen.findByText("0.812")).toBeInTheDocument();
  });
});
