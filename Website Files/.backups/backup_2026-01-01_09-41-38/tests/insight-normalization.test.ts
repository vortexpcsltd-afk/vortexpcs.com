import { describe, it, expect } from "vitest";
import { getCoolingInsight } from "../components/data/coolingInsightVariations";
import { getCompetitiveContext } from "../components/data/competitiveContext";

// Minimal CPU context for cooling messages
const cpuName = "Intel Core i7-14700K";

describe("Kevin's Insight - Cooling normalization (CMS fields)", () => {
  it("detects 360mm AIO from CMS fields (coolerType + radiatorSize string)", () => {
    const cmsCooling = {
      coolerType: "AIO",
      radiatorSize: "360mm",
      name: "Cooler Master MasterLiquid 360 Core II AIO",
    };
    const msg = getCoolingInsight(cmsCooling as any, cpuName, 16);
    expect(msg).toBeTruthy();
    expect(msg!).toContain("360mm AIO");
  });

  it("detects 280mm AIO when coolerType is 'Liquid' and radiatorSize is numeric", () => {
    const cmsCooling = {
      coolerType: "Liquid",
      radiatorSize: 280,
      name: "NZXT Kraken Elite RGB",
    };
    const msg = getCoolingInsight(cmsCooling as any, cpuName, 12);
    expect(msg).toBeTruthy();
    expect(msg!).toContain("280mm AIO");
  });

  it("detects Air cooling from CMS field", () => {
    const airCooling = {
      coolerType: "Air",
      name: "Noctua NH-D15 chromax.black",
    };
    const msg = getCoolingInsight(airCooling as any, cpuName, 8);
    expect(msg).toBeTruthy();
    expect(msg!).toContain("Air cooling");
  });
});

describe("Kevin's Insight - PSU modularity using CMS modular property", () => {
  it("recognizes fully modular PSUs", () => {
    const psu = { name: "Corsair RM850x 80+ Gold", modular: "Fully" } as any;
    const msgs = getCompetitiveContext("psu", psu);
    const joined = msgs.join(" \n ");
    expect(joined).toContain("Fully Modular");
  });

  it("recognizes semi-modular PSUs", () => {
    const psu = { name: "be quiet! Pure Power 12 M", modular: "Semi" } as any;
    const msgs = getCompetitiveContext("psu", psu);
    const joined = msgs.join(" \n ");
    expect(joined).toContain("Semi-Modular");
  });

  it("recognizes non-modular PSUs", () => {
    const psu = { name: "Budget 650W", modular: "None" } as any;
    const msgs = getCompetitiveContext("psu", psu);
    const joined = msgs.join(" \n ");
    expect(joined).toContain("Non-Modular PSU");
  });
});
