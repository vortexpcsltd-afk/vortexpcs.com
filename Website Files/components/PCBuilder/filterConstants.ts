// Category-specific simple filters (options and ranges)
export const CATEGORY_OPTION_FILTERS: Record<
  string,
  { key: string; label: string }[]
> = {
  cpu: [{ key: "socket", label: "Socket" }],
  motherboard: [
    { key: "socket", label: "Socket" },
    { key: "formFactor", label: "Form Factor" },
  ],
  ram: [{ key: "type", label: "Type" }],
  storage: [{ key: "type", label: "Type" }],
  psu: [
    { key: "efficiency", label: "Efficiency" },
    { key: "modular", label: "Modular" },
  ],
  cooling: [{ key: "type", label: "Type" }],
  case: [{ key: "formFactor", label: "Form Factor" }],
};

export const CATEGORY_RANGE_FILTERS: Record<
  string,
  { key: string; label: string }[]
> = {
  gpu: [{ key: "vram", label: "VRAM (GB)" }],
  psu: [{ key: "wattage", label: "Wattage" }],
  ram: [
    { key: "capacity", label: "Capacity (GB)" },
    { key: "speed", label: "Speed (MHz)" },
  ],
  storage: [{ key: "capacity", label: "Capacity (GB)" }],
  cpu: [
    { key: "cores", label: "Cores" },
    { key: "tdp", label: "TDP (W)" },
  ],
  cooling: [
    { key: "height", label: "Height (mm)" },
    { key: "radiatorSize", label: "Radiator (mm)" },
  ],
};
