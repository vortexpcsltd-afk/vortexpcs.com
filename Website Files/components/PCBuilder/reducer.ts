import { SelectedComponentIds, CategoryKey } from "./types";

export type SelectionAction =
  | { type: "SELECT"; category: CategoryKey; id: string }
  | { type: "REMOVE"; category: CategoryKey }
  | { type: "RESET" }
  | { type: "SET_ALL"; payload: SelectedComponentIds }
  | { type: "IMPORT"; payload: Partial<SelectedComponentIds> };

export const initialSelectionState: SelectedComponentIds = {};

// UI state for pagination, sorting, filtering
export interface UIState {
  viewMode: "grid" | "list";
  sortBy: string;
  currentPage: number;
  itemsPerPage: number;
  categoryPages: Record<string, number>;
  searchQuery: string;
  globalSearchQuery: string;
  selectedBrands: string[];
  priceRange: [number, number];
  optionFilters: Record<string, string[]>;
}

export type UIAction =
  | { type: "SET_VIEW_MODE"; mode: "grid" | "list" }
  | { type: "SET_SORT_BY"; sortBy: string }
  | { type: "SET_CURRENT_PAGE"; page: number }
  | { type: "SET_CATEGORY_PAGE"; category: string; page: number }
  | { type: "SET_SEARCH_QUERY"; query: string }
  | { type: "SET_GLOBAL_SEARCH"; query: string }
  | { type: "SET_BRANDS"; brands: string[] }
  | { type: "SET_PRICE_RANGE"; range: [number, number] }
  | { type: "SET_OPTION_FILTERS"; filters: Record<string, string[]> }
  | { type: "RESET_FILTERS" };

export const initialUIState: UIState = {
  viewMode: "grid",
  sortBy: "price",
  currentPage: 1,
  itemsPerPage: 12,
  categoryPages: {},
  searchQuery: "",
  globalSearchQuery: "",
  selectedBrands: [],
  priceRange: [0, 0],
  optionFilters: {},
};

export function selectionReducer(
  state: SelectedComponentIds,
  action: SelectionAction
): SelectedComponentIds {
  switch (action.type) {
    case "SELECT": {
      const { category, id } = action;
      return { ...state, [category]: id };
    }
    case "REMOVE": {
      const { category } = action;
      const { [category]: _removed, ...rest } = state;
      return rest;
    }
    case "RESET": {
      return {};
    }
    case "SET_ALL": {
      return { ...action.payload };
    }
    case "IMPORT": {
      const merged = { ...state, ...action.payload } as SelectedComponentIds;
      // Clean out falsy values ("", null, undefined)
      const cleaned = Object.fromEntries(
        Object.entries(merged).filter(([, v]) => !!v)
      ) as SelectedComponentIds;
      return cleaned;
    }
    default:
      return state;
  }
}

export const getSelectedCount = (state: SelectedComponentIds): number =>
  Object.keys(state).length;

export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode };
    case "SET_SORT_BY":
      return { ...state, sortBy: action.sortBy };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.page };
    case "SET_CATEGORY_PAGE":
      return {
        ...state,
        categoryPages: {
          ...state.categoryPages,
          [action.category]: action.page,
        },
      };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.query, currentPage: 1 };
    case "SET_GLOBAL_SEARCH":
      return { ...state, globalSearchQuery: action.query, currentPage: 1 };
    case "SET_BRANDS":
      return { ...state, selectedBrands: action.brands, currentPage: 1 };
    case "SET_PRICE_RANGE":
      return { ...state, priceRange: action.range, currentPage: 1 };
    case "SET_OPTION_FILTERS":
      return { ...state, optionFilters: action.filters, currentPage: 1 };
    case "RESET_FILTERS":
      return {
        ...state,
        searchQuery: "",
        globalSearchQuery: "",
        selectedBrands: [],
        priceRange: [0, 0],
        optionFilters: {},
        currentPage: 1,
      };
    default:
      return state;
  }
}
