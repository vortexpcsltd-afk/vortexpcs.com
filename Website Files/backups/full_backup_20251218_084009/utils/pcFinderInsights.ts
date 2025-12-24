// utils/pcFinderInsights.ts
// World-class, highly varied insight templates for PCFinder

export interface InsightCategory {
  [key: string]: string[];
}

export interface PCFinderInsights {
  gaming: string[];
  creative: string[];
  development: string[];
  professional: string[];
  home: string[];
  priority: InsightCategory;
  budget: InsightCategory;
  aesthetics: InsightCategory;
  timeline: InsightCategory;
}

export const pcFinderInsights: PCFinderInsights = {
  gaming: [
    "You're not here to compromise. This build is engineered for absolute gaming dominance.",
    "Unleash maximum frame rates and visual fidelity—your setup is built for competitive legends.",
    "Flagship graphics and high-core CPUs mean you conquer every title, every time.",
    "240+ FPS in shooters, buttery-smooth 4K ray tracing—no bottlenecks, no limits.",
    "Gen5 NVMe storage means instant load times—fast travel is truly instant.",
    "High-speed DDR5 memory keeps open worlds stutter-free, even with mods and overlays.",
    "Your system is ready for marathon gaming sessions and next-gen releases alike.",
    "Every component is hand-picked for reliability and peak performance under pressure.",
    "This is the build for those who demand the best—no shortcuts, no compromises.",
    // ...add 90+ more lines here for full variety
  ],
  creative: [
    "Built for creators who can't afford to wait—real-time 4K editing, instant renders.",
    "Multi-core CPUs and powerful GPUs accelerate your workflow beyond expectation.",
    "Effortlessly handle 8K footage, complex 3D scenes, and massive Photoshop files.",
    "Export times are measured in minutes, not hours—your time is valuable.",
    "Generous RAM and fast NVMe storage mean you never hit a creative bottleneck.",
    "Work with hundreds of layers, nodes, and effects without a single hitch.",
    "This system is designed for professionals who demand speed and reliability.",
    // ...add 90+ more lines here for full variety
  ],
  development: [
    "Code compiles, containers, and chaos—handled with ease.",
    "Multi-core CPUs demolish build times and keep Docker containers responsive.",
    "Massive node_modules and database writes are no match for NVMe speed.",
    "Run local Kubernetes clusters, VMs, and heavy databases without slowdowns.",
    "50+ Chrome tabs for docs? No problem—RAM headroom for true multitasking.",
    // ...add 90+ more lines here for full variety
  ],
  professional: [
    "Enterprise-grade reliability for serious work—built for sustained loads.",
    "ECC-ready memory and pro CPUs ensure accuracy and uptime.",
    "Open enormous datasets, CAD files, and Excel sheets instantly.",
    "Perfect for simulations, financial modelling, and large-scale analysis.",
    // ...add 90+ more lines here for full variety
  ],
  home: [
    "Versatility is the name of the game—balanced for every task.",
    "Efficient processors sip power but accelerate when needed.",
    "Seamless multitasking and fast storage keep your system snappy for years.",
    // ...add 90+ more lines here for full variety
  ],
  priority: {
    gpu: [
      "You prioritised graphics power—higher resolutions, better ray tracing, future-proofed gaming.",
      // ...add more lines
    ],
    cpu: [
      "CPU-focused builds age like fine wine—extra cores for future software and longevity.",
      // ...add more lines
    ],
    memory: [
      "RAM headroom is peace of mind—never see low memory warnings, even with dozens of apps running.",
      // ...add more lines
    ],
    storage: [
      "Fast storage is the unsung hero—every interaction is noticeably quicker.",
      // ...add more lines
    ],
  },
  budget: {
    premium: [
      "Premium Build Standard: Every component receives 24-hour stress testing before assembly.",
      // ...add more lines
    ],
    enthusiast: [
      "Enthusiast Sweet Spot: 90% of flagship performance at 60% of the cost.",
      // ...add more lines
    ],
    value: [
      "Value Optimised: Proven reliability and strong real-world benchmarks—no compromises.",
      // ...add more lines
    ],
  },
  aesthetics: {
    rgb_max: [
      "RGB Done Right: Synchronized lighting, custom profiles, and showcase cases.",
      // ...add more lines
    ],
    minimal: [
      "Stealth Performance: No flashy lights, just pure capability.",
      // ...add more lines
    ],
  },
  timeline: {
    rush: [
      "Express Priority: Your build jumps the queue—assembly starts within 24 hours.",
      // ...add more lines
    ],
    flexible: [
      "Patient Perfectionism: Flexibility lets me source optimal batches and save you money.",
      // ...add more lines
    ],
  },
};
