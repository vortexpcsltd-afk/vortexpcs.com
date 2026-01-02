import { describe, it, expect } from "vitest";
import { uiReducer, initialUIState } from "../components/PCBuilder/reducer";

describe("PCBuilder uiReducer", () => {
  it("sets view mode", () => {
    const next = uiReducer(initialUIState, {
      type: "SET_VIEW_MODE",
      mode: "list",
    });
    expect(next.viewMode).toBe("list");
  });

  it("sets sort by and preserves other state", () => {
    const next = uiReducer(initialUIState, {
      type: "SET_SORT_BY",
      sortBy: "name",
    });
    expect(next.sortBy).toBe("name");
    expect(next.currentPage).toBe(1);
  });

  it("sets current page", () => {
    const next = uiReducer(initialUIState, {
      type: "SET_CURRENT_PAGE",
      page: 3,
    });
    expect(next.currentPage).toBe(3);
  });

  it("sets category page", () => {
    const next = uiReducer(initialUIState, {
      type: "SET_CATEGORY_PAGE",
      category: "cpu",
      page: 2,
    });
    expect(next.categoryPages.cpu).toBe(2);
  });

  it("sets search query and resets page to 1", () => {
    const start = { ...initialUIState, currentPage: 5 };
    const next = uiReducer(start, { type: "SET_SEARCH_QUERY", query: "intel" });
    expect(next.searchQuery).toBe("intel");
    expect(next.currentPage).toBe(1);
  });

  it("sets global search", () => {
    const next = uiReducer(initialUIState, {
      type: "SET_GLOBAL_SEARCH",
      query: "nvidia",
    });
    expect(next.globalSearchQuery).toBe("nvidia");
    expect(next.currentPage).toBe(1);
  });

  it("sets selected brands and resets page", () => {
    const start = { ...initialUIState, currentPage: 3 };
    const next = uiReducer(start, {
      type: "SET_BRANDS",
      brands: ["ASUS", "MSI"],
    });
    expect(next.selectedBrands).toEqual(["ASUS", "MSI"]);
    expect(next.currentPage).toBe(1);
  });

  it("sets price range", () => {
    const next = uiReducer(initialUIState, {
      type: "SET_PRICE_RANGE",
      range: [100, 500],
    });
    expect(next.priceRange).toEqual([100, 500]);
  });

  it("sets option filters", () => {
    const filters = { socket: ["AM5"], type: ["DDR5"] };
    const next = uiReducer(initialUIState, {
      type: "SET_OPTION_FILTERS",
      filters,
    });
    expect(next.optionFilters).toEqual(filters);
  });

  it("resets all filters and page", () => {
    const dirty = {
      ...initialUIState,
      searchQuery: "test",
      globalSearchQuery: "global",
      selectedBrands: ["B1"],
      priceRange: [10, 20] as [number, number],
      optionFilters: { key: ["val"] },
      currentPage: 5,
    };
    const next = uiReducer(dirty, { type: "RESET_FILTERS" });
    expect(next.searchQuery).toBe("");
    expect(next.globalSearchQuery).toBe("");
    expect(next.selectedBrands).toEqual([]);
    expect(next.priceRange).toEqual([0, 0]);
    expect(next.optionFilters).toEqual({});
    expect(next.currentPage).toBe(1);
  });
});
