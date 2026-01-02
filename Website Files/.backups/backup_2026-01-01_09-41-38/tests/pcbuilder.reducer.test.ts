import { describe, it, expect } from "vitest";
import {
  selectionReducer,
  initialSelectionState,
  getSelectedCount,
} from "../components/PCBuilder/reducer";
import type {
  SelectedComponentIds,
  CategoryKey,
} from "../components/PCBuilder/types";

describe("PCBuilder selectionReducer", () => {
  it("selects components by category", () => {
    let state = initialSelectionState;
    state = selectionReducer(state, {
      type: "SELECT",
      category: "cpu" as CategoryKey,
      id: "cpu-1",
    });
    state = selectionReducer(state, {
      type: "SELECT",
      category: "gpu" as CategoryKey,
      id: "gpu-1",
    });
    expect(state.cpu).toBe("cpu-1");
    expect(state.gpu).toBe("gpu-1");
    expect(getSelectedCount(state)).toBe(2);
  });

  it("removes a selected component", () => {
    const withCpu: SelectedComponentIds = { cpu: "cpu-1" };
    const next = selectionReducer(withCpu, {
      type: "REMOVE",
      category: "cpu" as CategoryKey,
    });
    expect(next.cpu).toBeUndefined();
    expect(getSelectedCount(next)).toBe(0);
  });

  it("resets all selections", () => {
    const withMany: SelectedComponentIds = { cpu: "c1", gpu: "g1", ram: "r1" };
    const next = selectionReducer(withMany, { type: "RESET" });
    expect(next).toEqual({});
    expect(getSelectedCount(next)).toBe(0);
  });

  it("sets all selections via SET_ALL", () => {
    const payload: SelectedComponentIds = { cpu: "c2", gpu: "g2" };
    const next = selectionReducer({}, { type: "SET_ALL", payload });
    expect(next).toEqual(payload);
  });

  it("imports and cleans falsy entries", () => {
    const start: SelectedComponentIds = { cpu: "c1" };
    const next = selectionReducer(start, {
      type: "IMPORT",
      payload: { gpu: "g1", ram: "" as unknown as string, caseFans: undefined },
    });
    expect(next).toEqual({ cpu: "c1", gpu: "g1" });
    expect(next.ram).toBeUndefined();
  });
});
