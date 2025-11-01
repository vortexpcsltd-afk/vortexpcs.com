import { fetchPCComponents } from "./services/cms.ts";

(async () => {
  try {
    console.log("Testing CMS fetch...");
    const components = await fetchPCComponents();
    console.log("Total components fetched:", components.length);

    const cases = components.filter((c) => c.category === "case");
    const coolings = components.filter((c) => c.category === "cooling");
    const cpus = components.filter((c) => c.category === "cpu");

    console.log("Cases:", cases.length);
    console.log("Coolings:", coolings.length);
    console.log("CPUs:", cpus.length);

    if (cases.length > 0) {
      console.log("Sample case:", cases[0].name, "£" + cases[0].price);
    }
    if (coolings.length > 0) {
      console.log("Sample cooling:", coolings[0].name, "£" + coolings[0].price);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
