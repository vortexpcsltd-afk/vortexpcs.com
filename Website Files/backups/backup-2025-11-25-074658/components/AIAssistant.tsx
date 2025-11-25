import { useState, useRef, useEffect } from "react";
import { logger } from "../services/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Cpu,
  Monitor,
  HardDrive,
  Zap,
  DollarSign,
} from "lucide-react";

interface RecommendedComponent {
  category: string;
  name: string;
  rationale: string;
  approxPrice?: string;
}

interface AIResponse {
  content: string;
  suggestions: string[];
  recommendedBuild?: RecommendedComponent[];
}

interface Message {
  id: number;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  recommendedBuild?: RecommendedComponent[];
  mode?: "concise" | "detailed";
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "bot",
      content:
        "Hello! I'm VortexAI, your professional IT consultant. I specialise in helping you build your dream PC with expert component recommendations and troubleshooting PC issues. Whether you're planning a gaming rig, workstation, or need help diagnosing problems, I'm here to guide you with professional advice.\n\nI can help with:\n• Custom PC builds tailored to your budget and needs\n• Component compatibility and upgrade planning\n• Performance troubleshooting and diagnostics\n• Technical questions about hardware and software\n\nWhat can I help you with today?",
      timestamp: new Date(),
      suggestions: [
        "Build a gaming PC under £1500",
        "My PC won't boot - help diagnose",
        "Compare AMD vs Intel for my needs",
        "Plan an upgrade path",
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [expertMode, setExpertMode] = useState(false);
  const [aiMode, setAiMode] = useState<"rules" | "hybrid" | "ai-only">(
    "hybrid"
  );
  const [_responseDensity, _setResponseDensity] = useState<
    "balanced" | "concise" | "deep"
  >("balanced");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load persisted conversation on initial mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vortexAI_chat");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.every((m) => m && typeof m.content === "string")
        ) {
          // Rehydrate timestamps
          type PersistedMsg = {
            id?: number;
            type?: string;
            content: string;
            timestamp?: string;
            suggestions?: string[];
            recommendedBuild?: RecommendedComponent[];
            mode?: "concise" | "detailed";
          };
          const restored: Message[] = (parsed as PersistedMsg[]).map(
            (m, idx: number) => ({
              id: m.id ?? idx + 1,
              type:
                m.type === "user" || m.type === "bot" || m.type === "system"
                  ? m.type
                  : "bot",
              content: m.content,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
              suggestions: m.suggestions,
              recommendedBuild: m.recommendedBuild,
              mode: m.mode,
            })
          );
          if (restored.length) {
            setMessages((prev) => [
              prev[0],
              ...restored.slice(1).filter((m) => m.id !== prev[0].id),
            ]);
          }
        }
      }
    } catch (e) {
      logger.warn("Failed to load VortexAI conversation", { error: e });
    }
  }, []);

  // Persist messages (excluding first greeting) whenever they change
  useEffect(() => {
    try {
      const toPersist = messages.slice(0, 50).map((m) => ({
        id: m.id,
        type: m.type,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        suggestions: m.suggestions,
        recommendedBuild: m.recommendedBuild,
        mode: m.mode,
      }));
      localStorage.setItem("vortexAI_chat", JSON.stringify(toPersist));
    } catch (e) {
      logger.warn("Failed saving VortexAI conversation", { error: e });
    }
  }, [messages]);

  // Knowledge heuristics are embedded within responses; external KB can be linked later if needed.

  const predefinedResponses = {
    gaming: {
      content:
        "For a gaming PC, the key components are your GPU (most important for FPS) and CPU (important for high refresh rates and simulation games). Let me help you build a balanced system.\n\nCould you tell me:\n• What's your budget range?\n• What resolution and refresh rate will you game at? (1080p/1440p/4K)\n• Any specific games or genres you focus on?\n\nThis will help me recommend the perfect components for your needs.",
      suggestions: [
        "Budget gaming £600-900",
        "1440p high refresh gaming",
        "4K gaming build",
        "Competitive esports setup",
      ],
    },
    budget: {
      content:
        "I'll help you build an excellent PC within your budget. To provide the best recommendations, I need to understand your priorities.\n\nPlease share:\n• Your budget range (e.g., £800-1200)\n• Primary use case (gaming, work, content creation, general use)\n• Any specific requirements (resolution target, software you'll run)\n\nWith this info, I can suggest a balanced build that maximises value for your specific needs.",
      suggestions: [
        "£500-800 budget build",
        "£800-1500 mid-range",
        "£1500-2500 high-end",
        "£2500+ enthusiast",
      ],
    },
    compatibility: {
      content:
        "I'll help verify your component compatibility. Key checks include:\n\n**Critical Compatibility:**\n• CPU socket matches motherboard (AM5, LGA1700, LGA1851)\n• RAM type supported (DDR4 vs DDR5)\n• PSU has enough wattage + correct connectors\n• GPU fits in case (length, width, height)\n• CPU cooler clearance (RAM, case height)\n\nPlease list your components or describe what you're planning, and I'll check for any issues.",
      suggestions: [
        "Check my full build list",
        "Will X CPU work with Y motherboard?",
        "PSU wattage calculation",
        "GPU clearance check",
      ],
    },
    workstation: {
      content:
        "For professional workstation builds, the priorities differ from gaming systems. I'll focus on:\n\n**Key Considerations:**\n• CPU: Core count and single-thread performance based on your software\n• RAM: Capacity more important than speed (32GB minimum, often 64GB+)\n• Storage: Fast NVMe for project files, large capacity for archives\n• GPU: Depends on workload (NVIDIA for CUDA, AMD for raw compute)\n\nWhat type of work will you be doing? (e.g., video editing, 3D rendering, CAD, software development, data analysis)",
      suggestions: [
        "Video editing workstation",
        "3D rendering build",
        "Software development setup",
        "CAD/Engineering workstation",
      ],
    },
    troubleshooting: {
      content:
        "I'll help diagnose your PC issue systematically. To start troubleshooting, please describe:\n\n**Essential Information:**\n• What's happening? (won't boot, crashing, slow performance, etc.)\n• When did it start? (after new hardware, Windows update, suddenly, etc.)\n• Any error messages or beep codes?\n• Recent changes to the system?\n\nWith these details, I can guide you through targeted diagnostics to identify and fix the problem.",
      suggestions: [
        "PC won't turn on / no POST",
        "Random crashes or freezing",
        "Poor gaming performance",
        "Boot errors or BSOD",
      ],
    },
    upgrade: {
      content:
        "I'll help plan your upgrade path for maximum value and compatibility.\n\n**Smart Upgrade Strategy:**\n• Identify your current bottleneck (CPU, GPU, RAM, storage)\n• Check compatibility with existing components\n• Consider cost-effectiveness vs full rebuild\n• Plan for future upgrades (platform longevity)\n\nWhat's your current system, and what's not meeting your needs? (e.g., 'low FPS in games', 'slow rendering', 'running out of storage')",
      suggestions: [
        "What should I upgrade first?",
        "GPU upgrade recommendations",
        "CPU + motherboard upgrade",
        "RAM and storage upgrades",
      ],
    },
  };

  const classifyIntent = (text: string) => {
    const t = text.toLowerCase();

    // Troubleshooting keywords
    if (
      /won't boot|no post|not starting|black screen|won't turn on|boot loop|beep|crash|freeze|bsod|blue screen|error|problem|issue|fix|broken|diagnose|troubleshoot|slow|lag|stutter|overheat|thermal|driver/.test(
        t
      )
    )
      return "troubleshooting";

    // Component comparison
    if (/compare|vs|versus|difference between|better|which/.test(t))
      return "compare";

    // Compatibility checks
    if (/compatib|socket|fit|clearance|psu enough|will.*work|can.*use/.test(t))
      return "compatibility";

    // Upgrade planning
    if (/upgrade|improve|replace|bottleneck|future|path/.test(t))
      return "upgrade";

    // Budget/pricing
    if (/budget|£|cost|price|cheap|affordable|value/.test(t)) return "budget";

    // Workstation/productivity
    if (
      /render|editing|workstation|productiv|work|professional|cad|video|stream/.test(
        t
      )
    )
      return "workstation";

    // Gaming
    if (/game|gaming|fps|1440p|4k|1080p|play|esports|competitive/.test(t))
      return "gaming";

    // Power/PSU specific
    if (/power|psu|watt|supply/.test(t)) return "power";

    return "general";
  };

  const parseBudget = (text: string): number | undefined => {
    const match = text.match(/£\s?(\d{3,5})/);
    if (match) return parseInt(match[1], 10);
    return undefined;
  };

  const buildRecommendationFromBudget = (
    budget: number
  ): RecommendedComponent[] => {
    // Very simplified heuristic
    if (budget < 800) {
      return [
        {
          category: "CPU",
          name: "Ryzen 5 7500F",
          rationale: "Strong value gaming",
          approxPrice: "£140",
        },
        {
          category: "GPU",
          name: "RX 7600",
          rationale: "1080p high settings",
          approxPrice: "£240",
        },
        {
          category: "RAM",
          name: "16GB DDR5-5600",
          rationale: "Gaming sweet spot",
          approxPrice: "£60",
        },
        {
          category: "Storage",
          name: "1TB NVMe Gen4",
          rationale: "Fast OS + games",
          approxPrice: "£60",
        },
        {
          category: "Motherboard",
          name: "B650",
          rationale: "Upgrade path AM5",
          approxPrice: "£120",
        },
        {
          category: "PSU",
          name: "650W 80+ Gold",
          rationale: "Headroom & efficiency",
          approxPrice: "£75",
        },
        {
          category: "Case",
          name: "Airflow Mid-Tower",
          rationale: "Thermals & future space",
          approxPrice: "£70",
        },
      ];
    } else if (budget < 1300) {
      return [
        {
          category: "CPU",
          name: "Ryzen 5 7600",
          rationale: "Great 1440p pairing",
          approxPrice: "£200",
        },
        {
          category: "GPU",
          name: "RTX 4070",
          rationale: "1440p ultra + DLSS3",
          approxPrice: "£500",
        },
        {
          category: "RAM",
          name: "32GB DDR5-6000",
          rationale: "Multitask & future-proof",
          approxPrice: "£120",
        },
        {
          category: "Storage",
          name: "2TB NVMe Gen4",
          rationale: "Room for large library",
          approxPrice: "£130",
        },
        {
          category: "Motherboard",
          name: "B650 Performance",
          rationale: "PCIe Gen4 lanes",
          approxPrice: "£160",
        },
        {
          category: "PSU",
          name: "750W 80+ Gold Modular",
          rationale: "Efficiency & upgrade headroom",
          approxPrice: "£95",
        },
        {
          category: "Cooling",
          name: "240mm AIO",
          rationale: "Low noise sustained boost",
          approxPrice: "£85",
        },
      ];
    } else if (budget < 2000) {
      return [
        {
          category: "CPU",
          name: "Intel i7-13700K",
          rationale: "High FPS + creation",
          approxPrice: "£380",
        },
        {
          category: "GPU",
          name: "RTX 4080",
          rationale: "4K / 1440p high refresh",
          approxPrice: "£1050",
        },
        {
          category: "RAM",
          name: "32GB DDR5-6400",
          rationale: "High bandwidth tasks",
          approxPrice: "£180",
        },
        {
          category: "Storage",
          name: "2TB NVMe Gen4 + 2TB HDD",
          rationale: "Fast + bulk media",
          approxPrice: "£190",
        },
        {
          category: "Motherboard",
          name: "Z790",
          rationale: "Robust VRM & IO",
          approxPrice: "£260",
        },
        {
          category: "PSU",
          name: "850W 80+ Gold",
          rationale: "Ample for RTX 4080",
          approxPrice: "£130",
        },
        {
          category: "Cooling",
          name: "360mm AIO",
          rationale: "Thermal overhead",
          approxPrice: "£150",
        },
      ];
    }
    // Enthusiast
    return [
      {
        category: "CPU",
        name: "Ryzen 9 7950X3D",
        rationale: "Elite gaming & creation",
        approxPrice: "£600",
      },
      {
        category: "GPU",
        name: "RTX 4090",
        rationale: "Top-tier 4K + RT",
        approxPrice: "£1500",
      },
      {
        category: "RAM",
        name: "64GB DDR5-6000",
        rationale: "Heavy multitask / VMs",
        approxPrice: "£300",
      },
      {
        category: "Storage",
        name: "4TB NVMe Gen4",
        rationale: "Large fast library",
        approxPrice: "£300",
      },
      {
        category: "Motherboard",
        name: "X670E",
        rationale: "PCIe Gen5 readiness",
        approxPrice: "£350",
      },
      {
        category: "PSU",
        name: "1000W 80+ Platinum",
        rationale: "Efficiency at high draw",
        approxPrice: "£230",
      },
      {
        category: "Cooling",
        name: "Custom loop / 420mm AIO",
        rationale: "Thermal + acoustic headroom",
        approxPrice: "£250",
      },
    ];
  };

  const buildComparison = (text: string) => {
    const match = text.match(
      /(\b\w+\s?[\d]{3,4}\w?\b)[^a-zA-Z0-9]+vs[^a-zA-Z0-9]+(\b\w+\s?[\d]{3,4}\w?\b)/i
    );
    if (!match) return undefined;
    const a = match[1].toLowerCase();
    const b = match[2].toLowerCase();

    // Specific CPU comparisons
    const cpuComparisons: Record<string, string> = {
      "9800x3d_7800x3d":
        "**9800X3D vs 7800X3D** (Gaming CPU Showdown - Nov 2025)\n\n🔴 **Ryzen 7 9800X3D:**\n• 8C/16T + 3D V-Cache\n• £450-480\n• 5-10% faster than 7800X3D\n• Better thermals\n• **Current gaming champion**\n• Unlocked for overclocking\n\n🔴 **Ryzen 7 7800X3D:**\n• 8C/16T + 3D V-Cache\n• £360-390 (price dropped)\n• Still excellent gaming\n• More mature, better availability\n• **Best value gaming CPU**\n\n**Winner:** 9800X3D if budget allows, 7800X3D for best value",
      "9600x_14600k":
        "**9600X vs 14600K** (Mid-Range Gaming)\n\n� **Ryzen 5 9600X:**\n• 6C/12T Zen 5\n• £250-280\n• Better efficiency\n• AM5 longevity\n• Great 1440p\n\n🔵 **i5-14600K:**\n• 14C/20T\n• £260-290\n• Better productivity\n• Mature platform\n• More cores\n\n**Winner:** 14600K for all-around, 9600X for pure gaming efficiency",
      "7600x_13600k":
        "**7600X vs 13600K** (Previous Gen Comparison)\n\n🔴 **Ryzen 5 7600X:**\n• 6C/12T, up to 5.3GHz\n• £200-220\n• Lower power (105W TDP)\n• AM5 upgrade path\n• Great 1440p gaming\n\n🔵 **Intel i5-13600K:**\n• 14C/20T (6P+8E), up to 5.1GHz  \n• £250-270\n• Better productivity (more cores)\n• Slight gaming lead (3-5%)\n• More heat/power\n\n**Winner:** 13600K for all-rounder, 7600X for value + longevity",
      "7800x3d_14700k":
        "**7800X3D vs 14700K** (High-End Battle - Nov 2025)\n\n🔴 **Ryzen 7 7800X3D:**\n• 8C/16T + 3D V-Cache\n• £360-390 (price dropped)\n• **Best gaming value**\n• Low power, runs cool\n• Locked (no OC)\n\n🔵 **Intel i7-14700K:**\n• 20C/28T (8P+12E)\n• £340-370\n• Better productivity (more cores)\n• Good deals now\n• Overclockable\n\n**Winner:** 7800X3D for pure gaming, 14700K for mixed use at similar price",
      "4070super_7800xt":
        "**RTX 4070 Super vs RX 7800 XT**\n\n💚 **RTX 4070 Super:**\n• £550-600\n• 12GB VRAM\n• DLSS 3 Frame Gen\n• Superior RT\n• 200W TDP\n\n� **RX 7800 XT:**\n• £480-530\n• 16GB VRAM\n• Better raster\n• More VRAM\n• £70 cheaper\n\n**Winner:** 7800 XT for value/VRAM, 4070 Super for RT/DLSS",
      "4070_4070ti":
        "**RTX 4070 vs 4070 Ti** (Superseded by Super variants)\n\nNote: These have been replaced by 4070 Super and 4070 Ti Super.\n\n💚 **RTX 4070:**\n• £500-550 (older stock)\n• 12GB VRAM\n• Good 1440p\n\n💚 **RTX 4070 Ti:**\n• £700-750 (older stock)\n• 15-20% faster\n\n**Recommendation:** Get the newer Super variants instead for better value",
      "4080super_4090":
        "**RTX 4080 Super vs RTX 4090** (4K Powerhouses)\n\n💚 **RTX 4080 Super:**\n• £1000-1100\n• 16GB VRAM\n• 320W TDP\n• Excellent 4K\n• Better value\n\n� **RTX 4090:**\n• £1500-1700\n• 24GB VRAM\n• 450W TDP\n• 25-30% faster\n• Futureproof\n\n**Winner:** 4080 Super for sensible 4K, 4090 for no compromises",
    };

    // Try to match known comparisons
    const key = `${a.replace(/\s+/g, "")}_${b.replace(/\s+/g, "")}`;
    const reverseKey = `${b.replace(/\s+/g, "")}_${a.replace(/\s+/g, "")}`;

    if (cpuComparisons[key]) return cpuComparisons[key];
    if (cpuComparisons[reverseKey]) return cpuComparisons[reverseKey];

    // Generic fallback
    return `Comparison: ${a} vs ${b}\n\n**Key Factors to Consider:**\n• Architecture & IPC (instructions per clock)\n• Core / thread count\n• Gaming turbo frequencies\n• Productivity scaling (multi-core)\n• Thermals & power efficiency\n• Price & availability\n\n**General Guidance:**\n- Raw gaming FPS? → Favour higher single-core boost\n- Streaming/rendering? → Prioritise core/thread count\n- Future-proofing? → Check platform upgrade path\n\nTell me your specific use case for a detailed recommendation!`;
  };

  // Parse a pasted parts list like:
  // CPU: Ryzen 5 7600
  // GPU: RTX 4070
  // PSU: 650W
  // Motherboard: B650 (AM5)
  // Returns a simple spec object
  const parsePartsList = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const entries = lines.filter((l) => /:\s+/.test(l));
    if (entries.length < 3) return undefined;
    const spec: Record<string, string> = {};
    for (const line of entries) {
      const [k, v] = line.split(/:\s+/, 2);
      if (k && v) spec[k.toLowerCase()] = v;
    }
    // heuristics
    const cpu = spec["cpu"];
    const gpu = spec["gpu"];
    const psu = spec["psu"] || spec["power"] || spec["power supply"];
    const mobo = spec["motherboard"] || spec["mobo"];
    const cooler = spec["cooler"];
    const _case = spec["case"];
    const ram = spec["ram"] || spec["memory"];
    const storage = spec["storage"] || spec["drive"];
    return { cpu, gpu, psu, mobo, cooler, case: _case, ram, storage };
  };

  const evaluateCompatibility = (spec: {
    cpu?: string;
    gpu?: string;
    psu?: string;
    mobo?: string;
    cooler?: string;
    case?: string;
    ram?: string;
    storage?: string;
  }) => {
    const notes: string[] = [];
    const actions: string[] = [];

    // PSU sizing based on GPU hints
    const gpu = spec.gpu || "";
    const psuStr = spec.psu || "";
    const psuWatts = parseInt(psuStr.replace(/[^\d]/g, "")) || 0;
    const gpuPSU: Array<{ test: RegExp; need: number }> = [
      { test: /4090|4080|7900\s?xtx/i, need: 850 },
      { test: /4070|7800\s?xt/i, need: 750 },
      { test: /4060|7600/i, need: 650 },
    ];
    for (const rule of gpuPSU) {
      if (rule.test.test(gpu)) {
        if (psuWatts && psuWatts < rule.need) {
          notes.push(
            `PSU may be undersized for ${gpu}. Recommended ${rule.need}W+.`
          );
          actions.push("Consider higher wattage PSU (Gold-rated)");
        }
        break;
      }
    }

    // Socket sanity: very rough heuristic
    const cpu = spec.cpu || "";
    const mobo = spec.mobo || "";
    if (/ryzen|amd/i.test(cpu) && !/am5|am4/i.test(mobo)) {
      notes.push("Motherboard socket may not match AMD CPU (expect AM5/AM4).");
      actions.push("Verify CPU socket support in motherboard specs");
    }
    if (
      /intel|i[3579]-\d{4,5}/i.test(cpu) &&
      !/lga\s?1700|z790|b760|h770/i.test(mobo)
    ) {
      notes.push(
        "Motherboard may not list LGA1700/compatible chipset for Intel CPU."
      );
      actions.push("Confirm chipset generation matches CPU (e.g., Z790/B760)");
    }

    // Cooling and case
    if (spec.cooler && spec.case) {
      notes.push("Ensure cooler height/radiator size fits the case limits.");
      actions.push("Check case CPU cooler max height / radiator clearance");
    }

    if (!notes.length) {
      notes.push("No critical issues detected from the list provided.");
    }

    return { notes, actions };
  };

  const computeUpgradePlan = (spec: {
    cpu?: string;
    gpu?: string;
    psu?: string;
    mobo?: string;
    cooler?: string;
    case?: string;
    ram?: string;
    storage?: string;
  }) => {
    const phases: { title: string; items: string[] }[] = [];
    const diffs: string[] = [];
    const currentCPU = spec.cpu || "(unspecified)";
    const currentGPU = spec.gpu || "(unspecified)";
    const currentPSU = spec.psu || "(unspecified)";
    const currentRAM = spec.ram || "(unspecified)";
    const currentStorage = spec.storage || "(unspecified)";

    const p1: string[] = [];
    if (/gtx|rx\s?(4|5)\d{2}|1050|1060|1070|1080/i.test(currentGPU)) {
      p1.push(
        "Upgrade GPU to RTX 4070 (1440p) or RTX 4060 (1080p) for major FPS gains"
      );
      diffs.push(`GPU: ${currentGPU} → RTX 4070/4060`);
    }
    if (!/nvme|gen4|gen\s?4/i.test(currentStorage)) {
      p1.push("Add 1–2TB NVMe Gen4 SSD as primary drive for OS/games");
      diffs.push(`Storage: ${currentStorage} → 1–2TB NVMe Gen4`);
    }
    if (/8\s?gb/i.test(currentRAM) || currentRAM === "(unspecified)") {
      p1.push("Increase RAM to 16–32GB DDR4/DDR5 depending on platform");
      diffs.push(`RAM: ${currentRAM} → 16–32GB`);
    }
    if (p1.length)
      phases.push({
        title: "Phase 1 – Immediate FPS & responsiveness",
        items: p1,
      });

    const p2: string[] = [];
    if (
      /ryzen\s?[1-3]|i[3-7]-?\d{3,4}\b/i.test(currentCPU) ||
      /am4\b|lga\s?115|lga\s?1200/i.test(spec.mobo || "")
    ) {
      p2.push("Move to a modern platform (AM5 or Intel 13th/14th gen)");
      p2.push("CPU: Ryzen 5 7600 or Intel i5-13600K");
      p2.push("Motherboard: B650 (AM5) or B760/Z790 (LGA1700)");
      p2.push("Memory: 32GB DDR5-6000 EXPO/XMP");
      diffs.push(
        `CPU/Mobo/RAM: ${currentCPU} → Ryzen 5 7600 + B650 + 32GB DDR5-6000`
      );
    }
    if (p2.length)
      phases.push({
        title: "Phase 2 – Platform longevity & smoothness",
        items: p2,
      });

    const p3: string[] = [];
    const psuWatts = parseInt(currentPSU.replace(/[^\d]/g, "")) || 0;
    if (psuWatts && psuWatts < 750) {
      p3.push("Upgrade PSU to 750–850W 80+ Gold (ATX 3.0 ready)");
      diffs.push(`PSU: ${currentPSU} → 750–850W 80+ Gold`);
    }
    if (spec.cooler)
      p3.push("Consider 240/360mm AIO or premium air for lower noise");
    if (spec.case) p3.push("High-airflow case for sustained boost & acoustics");
    if (p3.length)
      phases.push({
        title: "Phase 3 – Silence, thermals & headroom",
        items: p3,
      });

    if (!phases.length)
      phases.push({
        title: "Plan",
        items: [
          "System already balanced. Provide target resolution/games for nuance.",
        ],
      });
    return { phases, diffs };
  };

  const getAIResponse = (userMessage: string): AIResponse => {
    const lowerMessage = userMessage.toLowerCase();

    // PRIORITY 0: Handle variant/refinement suggestions directly
    if (
      /^(silent|rgb|small form factor|budget|productivity)\s*variant$/i.test(
        lowerMessage.trim()
      )
    ) {
      const variantType = lowerMessage.replace(/\s*variant$/i, "").trim();
      return {
        content: `To apply a ${variantType} variant, click the "${variantType}" refinement chip above the chat input. This will transform the latest recommended build with optimised components.`,
        suggestions: [
          "Show latest build",
          "Start new build",
          "Compare options",
        ],
      };
    }

    // Handle PSU modular question
    if (/modular\s*(vs|versus)?\s*non.?modular/i.test(lowerMessage)) {
      return {
        content:
          "**Modular vs Non-Modular PSU:**\n\n✅ **Modular Advantages:**\n• Cleaner cable management\n• Better airflow (no unused cables)\n• Easier installation\n• Premium aesthetic\n\n💰 **Non-Modular:**\n• £10-20 cheaper\n• All cables permanently attached\n• Fine for budget builds\n\n**Recommendation:** Go modular if budget allows (most 750W+ PSUs are modular anyway). It's worth the £15 premium for cleaner builds.",
        suggestions: [
          "PSU wattage calculator",
          "Best PSU brands",
          "80+ ratings explained",
        ],
      };
    }

    // Handle platform comparison
    if (
      /am5\s*(vs|versus)?\s*lga\s?1700/i.test(lowerMessage) ||
      /amd\s*(vs|versus)?\s*intel\s*platform/i.test(lowerMessage)
    ) {
      return {
        content:
          "**AM5 (AMD) vs LGA1700 (Intel) Platform Comparison:**\n\n🔴 **AM5 Advantages:**\n• Longer upgrade path (AMD commits to 2025+)\n• Better value CPUs (7600/7700X)\n• PCIe Gen5 on more boards\n• Lower motherboard entry cost\n\n🔵 **LGA1700 Advantages:**\n• Slight gaming lead (13600K/14600K)\n• Better DDR4 compatibility (budget option)\n• Mature platform, more board choices\n\n**Verdict:** AM5 for longevity, LGA1700 for peak gaming FPS. Both excellent in 2024.",
        suggestions: [
          "7600X vs 13600K",
          "Best AM5 motherboard",
          "Best Z790 board",
        ],
      };
    }

    // PRIORITY 1: Budget detection with resolution/use case → IMMEDIATE BUILD
    const budget = parseBudget(userMessage);
    if (budget) {
      const build = buildRecommendationFromBudget(budget);

      // Extract context from the message for personalized response
      let context = "";
      if (/4k|2160p/i.test(lowerMessage)) context = " optimised for 4K gaming";
      else if (/1440p/i.test(lowerMessage)) context = " balanced for 1440p";
      else if (/1080p/i.test(lowerMessage)) context = " tuned for 1080p";

      if (/rgb|light|aesthetic/i.test(lowerMessage))
        context += " with RGB emphasis";
      if (/silent|quiet/i.test(lowerMessage))
        context += " with low-noise components";
      if (/compact|sff|small/i.test(lowerMessage))
        context += " in compact form factor";
      if (/render|creat|edit/i.test(lowerMessage))
        context += " for content creation";

      const header = context
        ? `Here's your ~£${budget} build${context}:`
        : `Proposed build for ~£${budget} (balanced performance):`;

      return {
        content: `${header}\n\n${build
          .map((c) => `• ${c.category}: ${c.name}\n  → ${c.rationale}`)
          .join(
            "\n\n"
          )}\n\n💡 Want variations? Try Silent, RGB, or Small Form Factor refinements!`,
        suggestions: [
          "Show pricing",
          "Silent variant",
          "RGB variant",
          "Upgrade path",
        ],
        recommendedBuild: build,
      };
    }

    // PRIORITY 2: Comparison requests
    const comparison = buildComparison(userMessage);
    if (comparison) {
      return {
        content: comparison,
        suggestions: [
          "Gaming focus",
          "Productivity focus",
          "Thermal differences",
        ],
      };
    }

    // PRIORITY 3: Upgrade path request
    if (
      /upgrade\s?path|upgrade\s?plan|phase/i.test(lowerMessage) ||
      /\bcurrent:\b/i.test(lowerMessage)
    ) {
      const spec = parsePartsList(userMessage);
      if (!spec) {
        return {
          content:
            "To create a phased upgrade plan, paste your current specs like:\n\nCPU: [your CPU]\nGPU: [your GPU]\nPSU: [your PSU wattage]\nMotherboard: [your board]\nRAM: [your RAM]\n\nI'll analyse and suggest optimal upgrade priorities.",
          suggestions: ["£1200 new build instead", "Check compatibility first"],
        };
      }
      const plan = computeUpgradePlan(spec);
      const content = `Upgrade plan based on your current spec:\n\n${plan.phases
        .map((ph) => `• ${ph.title}\n  - ${ph.items.join("\n  - ")}`)
        .join("\n\n")}${
        plan.diffs.length
          ? `\n\nDiff summary:\n${plan.diffs.map((d) => `• ${d}`).join("\n")}`
          : ""
      }\n\nAsk for pricing or a silent/RGB variant to refine further.`;
      return {
        content,
        suggestions: ["Show pricing", "Silent variant", "RGB variant"],
      };
    }

    // PRIORITY 4: Multi-line parts list compatibility check
    const maybeSpec = parsePartsList(userMessage);
    if (maybeSpec) {
      const result = evaluateCompatibility(maybeSpec);
      return {
        content:
          `Compatibility review:\n` +
          result.notes.map((n) => `• ${n}`).join("\n") +
          (result.actions.length
            ? `\n\nSuggested next steps:\n${result.actions
                .map((a) => `• ${a}`)
                .join("\n")}`
            : "") +
          `\n\nPaste more details (exact models) for a deeper check.`,
        suggestions: [
          "Check PSU sizing",
          "Verify cooler clearance",
          "BIOS/Chipset compatibility",
        ],
      };
    }

    // PRIORITY 5: Specific detailed questions (Quick Actions)
    if (
      lowerMessage.includes("what cpu should i choose") ||
      lowerMessage.includes("cpu recommendations")
    ) {
      return {
        content:
          "For CPU recommendations, here's what I suggest based on different use cases:\n\n🎮 **Gaming**: AMD Ryzen 7 9800X3D (£450-480, best gaming CPU) or Ryzen 7 7800X3D (£380-420, excellent value)\n💻 **Mid-Range**: AMD Ryzen 5 9600X (£250-280) or Intel i5-14600K (£260-290)\n� **Productivity**: AMD Ryzen 9 9900X (£450-500) or Intel i7-14700K (£360-400) for content creation\n🚀 **High-End**: AMD Ryzen 9 9950X (£600-650) or Intel i9-14900K (£500-550) for maximum performance\n\nWhat's your primary use case and budget range?",
        suggestions: [
          "Gaming CPU under £300",
          "Best productivity CPU",
          "9800X3D vs 7800X3D",
        ],
      };
    } else if (
      lowerMessage.includes("best graphics card for gaming") ||
      lowerMessage.includes("gpu for gaming")
    ) {
      return {
        content:
          "Here are my top GPU recommendations for gaming (November 2025):\n\n🎯 **1080p/1440p**: RTX 5070 (£600-700, DLSS 4) or Intel Arc B580 (£200-240, best budget)\n🎮 **1440p/4K**: RTX 5070 Ti (£800-900) or RTX 4070 Ti Super (£650-750, good deals)\n🚀 **4K Ultra**: RTX 5080 (£1100-1300) or RTX 5090 (£1800-2000, absolute best)\n💎 **Best Value**: RX 7900 XT (£600-700, excellent raster) or RTX 4080 Super (£850-950, prev gen deal)\n\n**RTX 50-series** brings DLSS 4, better RT, lower power. **Previous gen** (4070S/4080S) now excellent value. What resolution and budget?",
        suggestions: [
          "RTX 5070 vs 4070 Ti Super",
          "Best 4K gaming GPU",
          "Should I buy RTX 50-series or wait?",
        ],
      };
    } else if (
      lowerMessage.includes("ssd vs hdd") ||
      lowerMessage.includes("storage options")
    ) {
      return {
        content:
          "Here's the breakdown between SSD and HDD storage:\n\n⚡ **SSD Advantages**:\n• 10x faster loading times\n• Silent operation\n• More reliable\n• Better for OS and games\n\n💾 **HDD Advantages**:\n• Much cheaper per GB\n• Great for mass storage\n• Good for backups\n\n**Recommendation**: 1TB NVMe SSD for OS + games, 2TB HDD for storage",
        suggestions: [
          "Best gaming SSDs",
          "NVMe vs SATA",
          "Storage capacity planning",
        ],
      };
    } else if (
      lowerMessage.includes("power supply") ||
      lowerMessage.includes("psu") ||
      lowerMessage.includes("how much power")
    ) {
      return {
        content:
          "PSU wattage depends on your components:\n\n⚡ **Budget Build** (RTX 4060): 650W PSU\n🎮 **Mid-Range** (RTX 4070): 750W PSU\n🚀 **High-End** (RTX 4080/4090): 850W+ PSU\n\n**Key factors**: GPU power draw, CPU power, future upgrades\n**Recommended brands**: Corsair, EVGA, Seasonic (80+ Gold rated)\n\nWhat GPU are you planning to use?",
        suggestions: [
          "PSU calculator",
          "Modular vs non-modular",
          "80+ efficiency ratings",
        ],
      };
    } else if (
      lowerMessage.includes("best pc build for £1000") ||
      lowerMessage.includes("budget builds")
    ) {
      return {
        content:
          "Here's an excellent £1000 gaming build:\n\n🎮 **£1000 Gaming Build**:\n• CPU: AMD Ryzen 5 7600 (£200)\n• GPU: RTX 4060 Ti (£400)\n• RAM: 16GB DDR5-5600 (£80)\n• Storage: 1TB NVMe SSD (£60)\n• Motherboard: B650 (£120)\n• PSU: 650W 80+ Gold (£80)\n• Case: Mid-tower (£60)\n\nThis build handles 1440p gaming at high settings beautifully!",
        suggestions: [
          "£800 budget build",
          "£1500 high-end build",
          "Upgrade priority order",
        ],
      };
    } else if (
      lowerMessage.includes("gaming") ||
      lowerMessage.includes("game")
    ) {
      return predefinedResponses.gaming;
    } else if (
      lowerMessage.includes("budget") ||
      lowerMessage.includes("price") ||
      lowerMessage.includes("cost")
    ) {
      return predefinedResponses.budget;
    } else if (
      lowerMessage.includes("compatible") ||
      lowerMessage.includes("compatibility")
    ) {
      return predefinedResponses.compatibility;
    } else if (
      lowerMessage.includes("work") ||
      lowerMessage.includes("professional") ||
      lowerMessage.includes("editing")
    ) {
      return predefinedResponses.workstation;
    } else if (
      lowerMessage.includes("ryzen") ||
      lowerMessage.includes("intel")
    ) {
      return {
        content:
          "Great choice! Both AMD Ryzen and Intel offer excellent processors. Ryzen typically offers better value and more cores, while Intel often has slightly better gaming performance. What's your specific use case?",
        suggestions: ["Ryzen vs Intel", "Best gaming CPU", "Productivity CPU"],
      };
    } else if (
      lowerMessage.includes("rtx") ||
      lowerMessage.includes("nvidia") ||
      lowerMessage.includes("graphics")
    ) {
      return {
        content:
          "NVIDIA RTX cards are excellent for gaming and creative work with features like ray tracing and DLSS. The RTX 4070 is great for 1440p, while the RTX 4080/4090 handle 4K gaming beautifully.",
        suggestions: ["RTX 4070 vs 4080", "Ray tracing games", "DLSS benefits"],
      };
    } else if (
      lowerMessage.includes("cooling") ||
      lowerMessage.includes("temperature")
    ) {
      return {
        content:
          "Good cooling is essential! For most CPUs, a quality air cooler like the Noctua NH-D15 is sufficient. For high-end CPUs or compact builds, consider AIO liquid cooling.",
        suggestions: [
          "Air vs liquid cooling",
          "Best CPU coolers",
          "Case airflow tips",
        ],
      };
    }

    // PRIORITY 6: Advanced intent classification for edge cases
    const intent = classifyIntent(userMessage);

    switch (intent) {
      case "troubleshooting":
        return predefinedResponses.troubleshooting;
      case "compatibility":
        return {
          content:
            "Compatibility checklist:\n1. CPU socket matches motherboard (e.g. AM5 vs LGA1700)\n2. BIOS version supports chosen CPU\n3. Case GPU clearance vs GPU length\n4. PSU wattage & 12VHPWR connectors (if needed)\n5. RAM speed supported (EXPO/XMP)\n6. Cooler height vs case limit\n\nWant me to validate a specific list? Paste it in.",
          suggestions: [
            "Check PSU sizing",
            "Verify cooler clearance",
            "BIOS update steps",
          ],
        };
      case "upgrade":
        return predefinedResponses.upgrade;
      case "power":
        return {
          content:
            "Power sizing: Aim for 40–50% typical load for peak efficiency on Gold units. Provide GPU + CPU and I can estimate transient spikes. Consider ATX 3.0 for next-gen GPUs.",
          suggestions: [
            "Transient spike info",
            "ATX 3.0 benefits",
            "Efficiency curves",
          ],
        };
      case "workstation":
        return {
          content:
            "For professional workstations, let's optimise based on your workflow:\n\n**Core Components:**\n• CPU: High core count (Ryzen 9 / i7-i9) for parallel tasks\n• RAM: 32-64GB minimum for heavy multitasking\n• Storage: NVMe Gen4 for scratch disk performance\n• GPU: VRAM matters (24GB for 3D/AI, 8GB+ for video)\n\n**What's your budget and primary workload?** (Video editing, 3D rendering, CAD, programming, AI/ML?)",
          suggestions: [
            "£2000 video editing rig",
            "£3500 3D rendering beast",
            "Programming workstation",
          ],
        };
      case "gaming": {
        // Only hit this if no budget was detected - ask intelligently
        const hasResolution = /1080p|1440p|4k|2160p|ultra|high|low/i.test(
          lowerMessage
        );
        if (hasResolution) {
          // They mentioned resolution but no budget - suggest price points
          return {
            content:
              "Great! For the best gaming experience at your target resolution, I need to know your budget to recommend the right GPU/CPU tier.\n\n**Typical price points:**\n• £800-1000: Solid 1080p/1440p gaming\n• £1200-1800: High-end 1440p / entry 4K\n• £2000+: Premium 4K / high refresh\n\nWhat's your budget range?",
            suggestions: [
              "£1200 1440p build",
              "£2000 4K gaming rig",
              "£800 budget gaming",
            ],
          };
        }
        return {
          content:
            "Let's build you an amazing gaming PC! To give you the perfect recommendation, I need two details:\n\n**1. Budget:** What's your total budget? (£)\n**2. Target:** What resolution/refresh rate? (1080p, 1440p, 4K)\n\nExample: *'£1500 for 1440p high refresh'* or *'£2500 4K gaming monster'*",
          suggestions: [
            "£1200 1440p gaming",
            "£2000 4K ultra",
            "£800 1080p esports",
          ],
        };
      }
      case "compare":
        return {
          content:
            "I can compare CPUs or GPUs head-to-head! Format your request like:\n\n• 'Compare 7600X vs 13600K for gaming'\n• 'RTX 4070 vs RX 7800 XT'\n• '7900X vs 13900K productivity'\n\nOr just tell me what you're deciding between!",
          suggestions: [
            "7600X vs 13600K",
            "RTX 4070 vs 4070 Ti",
            "AM5 vs LGA1700",
          ],
        };
      default: {
        // Intelligent fallback - detect what they might be asking about
        if (
          /top|best|high.end|extreme|monster|beast/i.test(lowerMessage) &&
          /gaming/i.test(lowerMessage)
        ) {
          return {
            content:
              "Building a top-tier gaming rig! Let's aim high:\n\n**Elite Gaming Spec:**\n• RTX 4090 or 4080 Super (4K powerhouse)\n• Ryzen 9 7950X3D or i9-14900K\n• 32-64GB DDR5-6000+\n• Gen4 NVMe 2TB+\n• 1000W+ Platinum PSU\n\n**What's your budget ceiling?** This helps me fine-tune the exact components.",
            suggestions: [
              "£3000 elite build",
              "£4000+ no compromise",
              "£2500 sweet spot",
            ],
          };
        }

        return {
          content:
            "I'm your AI PC building consultant! I can:\n\n✅ Generate full custom builds from your budget\n✅ Compare CPUs/GPUs with real-world context  \n✅ Check part compatibility & identify issues\n✅ Map multi-phase upgrade paths\n\n**Try asking:**\n• '*£1500 silent 1440p gaming build*'\n• '*Compare 7800X3D vs 13700K*'\n• '*Upgrade path for my i5-10400 + GTX 1660*'\n\nWhat can I help you build today?",
          suggestions: [
            "Generate 1440p build",
            "Compare two CPUs",
            "Check PSU sizing",
            "Plan upgrade phases",
          ],
        };
      }
    }
  };

  // Check if response is generic fallback (should trigger AI)
  const isGenericFallback = (response: AIResponse): boolean => {
    return (
      response.content.includes("I'm your AI PC building consultant") ||
      response.content.includes("I can generate tailored builds") ||
      (response.suggestions?.includes("Generate 1440p build") &&
        !response.recommendedBuild)
    );
  };

  // Call real AI via API
  const callRealAI = async (userMessage: string): Promise<string> => {
    try {
      const conversationHistory = messages.slice(-6).map((m) => ({
        type: m.type,
        content: m.content,
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...conversationHistory,
            { type: "user", content: userMessage },
          ],
          expertMode,
        }),
      });

      if (!response.ok) {
        // Attempt to parse structured error for better user feedback
        let serverError: unknown = null;
        try {
          serverError = await response.json();
        } catch {
          /* ignore */
        }
        const code =
          serverError &&
          typeof serverError === "object" &&
          "code" in serverError
            ? (serverError as { code?: string }).code
            : undefined;
        logger.error("AI API non-OK response", {
          status: response.status,
          statusText: response.statusText,
          body: serverError,
        });
        throw new Error(code ? `AI API failed (${code})` : "AI API failed");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) {
        logger.error("No readable stream available");
        throw new Error("Stream not available");
      }

      logger.debug("Starting AI stream read");
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          logger.debug("Stream complete", { length: fullText.length });
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullText += parsed.content;
              }
            } catch {
              // Ignore JSON parse errors for incomplete chunks
              logger.debug("Chunk parse skipped", {
                sample: line.substring(0, 50),
              });
            }
          }
        }
      }

      if (!fullText) {
        logger.error("Stream completed but no content received");
        throw new Error("Empty response from AI");
      }

      return fullText;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Real AI error", { message });
      return message.includes("insufficient_quota")
        ? "AI quota exceeded (429). Using rule-based responses for now."
        : message.includes("invalid_api_key")
        ? "AI key issue detected. Please verify server configuration. Falling back to rule-based responses."
        : "AI mode temporarily unavailable. Using rule-based responses.";
    }
  };

  const streamBotMessage = (
    fullText: string,
    baseMessage: Omit<Message, "content" | "id" | "timestamp"> & {
      suggestions?: string[];
      recommendedBuild?: RecommendedComponent[];
    }
  ) => {
    setIsStreaming(true);
    const chunks = fullText.split(/(\n\n+)/); // paragraph-level streaming
    let assembled = "";
    let idx = 0;
    const streamId = messages.length + 2;
    const ts = new Date();
    const pushChunk = () => {
      if (idx >= chunks.length) {
        setIsStreaming(false);
        return;
      }
      assembled += chunks[idx];
      const partial: Message = {
        id: streamId,
        type: "bot",
        content: assembled,
        timestamp: ts,
        suggestions: baseMessage.suggestions,
        recommendedBuild: baseMessage.recommendedBuild,
        mode: expertMode ? "detailed" : "concise",
      };
      setMessages((prev) => {
        const withoutExisting = prev.filter((m) => m.id !== streamId);
        return [...withoutExisting, partial];
      });
      idx++;
      setTimeout(pushChunk, 180 + Math.random() * 140);
    };
    pushChunk();
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulated delay before streaming
    setTimeout(async () => {
      const response = getAIResponse(userMessage.content);

      // Hybrid Mode: Check if we should fallback to real AI
      const shouldUseAI =
        aiMode === "ai-only" ||
        (aiMode === "hybrid" && isGenericFallback(response));

      if (shouldUseAI) {
        // Use real AI
        setIsTyping(false);
        setIsStreaming(true);

        const aiResponse = await callRealAI(userMessage.content);

        streamBotMessage(aiResponse, {
          type: "bot",
          suggestions: [
            "Tell me more",
            "Another option",
            "Compare alternatives",
          ],
        });
      } else {
        // Use rule-based response
        setIsTyping(false);
        streamBotMessage(response.content, {
          type: "bot",
          suggestions: response.suggestions,
          recommendedBuild: response.recommendedBuild,
        });

        // After initial build recommendation, attempt pricing enrichment
        if (response.recommendedBuild) {
          const pricingIntro: Message = {
            id: Date.now(),
            type: "bot",
            content: "Fetching live pricing adjustments...",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, pricingIntro]);
          try {
            const { fetchPrices } = await import("../services/pricing");
            const updated = await fetchPrices(response.recommendedBuild);
            const pricingMsg: Message = {
              id: Date.now() + 1,
              type: "bot",
              content: `Updated component prices:\n${updated
                .map((c) => `• ${c.category}: ${c.name} — ${c.approxPrice}`)
                .join("\n")}\n\n(Prices are simulated and may vary.)`,
              timestamp: new Date(),
              recommendedBuild: updated,
            };
            setMessages((prev) => [...prev, pricingMsg]);
          } catch {
            const failMsg: Message = {
              id: Date.now() + 2,
              type: "bot",
              content: "Pricing service unavailable. Skipping live updates.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, failMsg]);
          }
        }
      }
    }, 450 + Math.random() * 400);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isStreaming) return;
    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: suggestion,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setTimeout(async () => {
      const response = getAIResponse(suggestion);
      setIsTyping(false);
      streamBotMessage(response.content, {
        type: "bot",
        suggestions: response.suggestions,
        recommendedBuild: response.recommendedBuild,
      });

      // After initial build recommendation, attempt pricing enrichment
      if (response.recommendedBuild) {
        const pricingIntro: Message = {
          id: Date.now(),
          type: "bot",
          content: "Fetching live pricing adjustments...",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, pricingIntro]);
        try {
          const { fetchPrices } = await import("../services/pricing");
          const updated = await fetchPrices(response.recommendedBuild);
          const pricingMsg: Message = {
            id: Date.now() + 1,
            type: "bot",
            content: `Updated component prices:\n${updated
              .map((c) => `• ${c.category}: ${c.name} — ${c.approxPrice}`)
              .join("\n")}\n\n(Prices are simulated and may vary.)`,
            timestamp: new Date(),
            recommendedBuild: updated,
          };
          setMessages((prev) => [...prev, pricingMsg]);
        } catch {
          const failMsg: Message = {
            id: Date.now() + 2,
            type: "bot",
            content: "Pricing service unavailable. Skipping live updates.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, failMsg]);
        }
      }
    }, 350 + Math.random() * 400);
  };

  const handleQuickActionClick = async (message: string) => {
    if (isStreaming) return;
    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setTimeout(async () => {
      const response = getAIResponse(message);
      setIsTyping(false);
      streamBotMessage(response.content, {
        type: "bot",
        suggestions: response.suggestions,
        recommendedBuild: response.recommendedBuild,
      });

      // After initial build recommendation, attempt pricing enrichment
      if (response.recommendedBuild) {
        const pricingIntro: Message = {
          id: Date.now(),
          type: "bot",
          content: "Fetching live pricing adjustments...",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, pricingIntro]);
        try {
          const { fetchPrices } = await import("../services/pricing");
          const updated = await fetchPrices(response.recommendedBuild);
          const pricingMsg: Message = {
            id: Date.now() + 1,
            type: "bot",
            content: `Updated component prices:\n${updated
              .map((c) => `• ${c.category}: ${c.name} — ${c.approxPrice}`)
              .join("\n")}\n\n(Prices are simulated and may vary.)`,
            timestamp: new Date(),
            recommendedBuild: updated,
          };
          setMessages((prev) => [...prev, pricingMsg]);
        } catch {
          const failMsg: Message = {
            id: Date.now() + 2,
            type: "bot",
            content: "Pricing service unavailable. Skipping live updates.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, failMsg]);
        }
      }
    }, 350 + Math.random() * 400);
  };

  const quickActions = [
    {
      icon: Cpu,
      label: "CPU Guide",
      message: "What CPU should I choose for my build?",
    },
    {
      icon: Monitor,
      label: "GPU Selection",
      message: "Best graphics card for my needs?",
    },
    {
      icon: Zap,
      label: "Troubleshooting",
      message: "My PC won't boot - help me diagnose the issue",
    },
    {
      icon: HardDrive,
      label: "Storage Guide",
      message: "What storage should I get?",
    },
    {
      icon: DollarSign,
      label: "Build Planning",
      message: "Help me plan a complete PC build",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="z-[80] w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[65vw] 2xl:w-[60vw] max-w-[1400px] max-w-none sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-none 2xl:max-w-none h-[90vh] sm:h-[85vh] bg-gradient-to-br from-black/95 via-slate-900/95 to-blue-950/95 backdrop-blur-xl border-sky-500/20 text-white flex flex-col p-0">
        <DialogHeader className="border-b border-sky-500/20 pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-lg sm:text-xl bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent block truncate">
                VortexAI - IT Professional Assistant
              </span>
              <div className="text-xs sm:text-sm text-gray-400 font-normal truncate">
                Expert PC Building & Technical Support
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            VortexAI is your professional IT consultant specialising in custom
            PC builds, component recommendations, compatibility checks, and
            troubleshooting PC issues. Get expert guidance for building your
            dream PC or diagnosing technical problems.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {/* Contextual refinement chips when a build is present in the last bot message */}
              {messages.some((m) => m.type === "bot" && m.recommendedBuild) && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    "Silent",
                    "RGB",
                    "Small Form Factor",
                    "Budget",
                    "Productivity",
                  ].map((tag) => (
                    <Button
                      key={tag}
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[10px] sm:text-[11px] border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white"
                      onClick={() => {
                        // Find latest build message to modify
                        const lastBuildMsg = [...messages]
                          .reverse()
                          .find((m) => m.recommendedBuild);
                        if (!lastBuildMsg?.recommendedBuild) return;
                        const base = lastBuildMsg.recommendedBuild;
                        let modified = [...base];

                        const swap = (
                          category: string,
                          name: string,
                          rationale: string
                        ) => {
                          modified = modified.map((c) =>
                            c.category === category
                              ? { ...c, name, rationale }
                              : c
                          );
                        };

                        switch (tag) {
                          case "Silent":
                            swap(
                              "Cooling",
                              "High-end Air Cooler",
                              "Low-noise thermal performance"
                            );
                            swap(
                              "Case",
                              "Silent Optimised Mid-Tower",
                              "Sound-dampened panels & airflow balance"
                            );
                            break;
                          case "RGB":
                            swap(
                              "Case",
                              "Tempered Glass RGB Mid-Tower",
                              "Showcase lighting & fans"
                            );
                            swap(
                              "Cooling",
                              "240mm RGB AIO",
                              "Enhanced aesthetics + cooling"
                            );
                            break;
                          case "Small Form Factor":
                            swap(
                              "Case",
                              "Compact SFF Case",
                              "Space-efficient footprint"
                            );
                            swap(
                              "Cooling",
                              "Low-profile Air Cooler",
                              "Fits SFF constraints"
                            );
                            break;
                          case "Budget":
                            swap(
                              "GPU",
                              "RTX 4060",
                              "Cost-saving while retaining 1080p performance"
                            );
                            swap(
                              "CPU",
                              "Ryzen 5 7500F",
                              "Lower cost balanced gaming CPU"
                            );
                            break;
                          case "Productivity":
                            swap(
                              "CPU",
                              "Ryzen 7 7700X",
                              "More cores for creation workloads"
                            );
                            swap(
                              "RAM",
                              "64GB DDR5-6000",
                              "Heavy multitasking & editing capacity"
                            );
                            break;
                        }

                        const variantMsg: Message = {
                          id: Date.now(),
                          type: "bot",
                          content: `${tag} variant applied. Adjusted key components for target preference. Ask for pricing to refresh costs.`,
                          timestamp: new Date(),
                          recommendedBuild: modified,
                          suggestions: [
                            "Show pricing",
                            "Another variant",
                            "Copy build",
                          ],
                        };
                        setMessages((prev) => [...prev, variantMsg]);
                      }}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-[80%] md:max-w-[70%] ${
                      message.type === "user"
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 mt-1 flex-shrink-0">
                      <AvatarFallback
                        className={
                          message.type === "user"
                            ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white"
                            : "bg-gradient-to-r from-sky-500 to-blue-600 text-white"
                        }
                      >
                        {message.type === "user" ? (
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`flex flex-col space-y-2 min-w-0 flex-1 ${
                        message.type === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <Card
                        className={`p-3 sm:p-4 backdrop-blur-sm whitespace-pre-line break-words ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-sky-600/90 to-blue-600/90 text-white border-sky-500/30"
                            : "bg-white/10 border-white/20 text-white"
                        }`}
                      >
                        <p className="leading-relaxed text-xs sm:text-sm md:text-[15px]">
                          {message.content}
                        </p>
                        {message.recommendedBuild && (
                          <div className="mt-3 sm:mt-4 space-y-2">
                            <div className="text-[10px] sm:text-xs uppercase tracking-wide text-sky-300 font-semibold">
                              Recommended Build Breakdown
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {message.recommendedBuild.map((comp, i) => (
                                <div
                                  key={i}
                                  className="bg-white/5 border border-white/10 rounded-md p-2 flex flex-col gap-1 hover:border-sky-500/30 transition"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium truncate">
                                      {comp.category}
                                    </span>
                                    {comp.approxPrice && (
                                      <span className="text-[10px] sm:text-[11px] text-sky-300 flex-shrink-0">
                                        {comp.approxPrice}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] sm:text-xs text-white font-semibold break-words">
                                    {comp.name}
                                  </div>
                                  <div className="text-[10px] sm:text-[11px] text-gray-400 break-words">
                                    {comp.rationale}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const buildText = (
                                    message.recommendedBuild ?? []
                                  )
                                    .map(
                                      (c) =>
                                        `${c.category}: ${c.name} (${
                                          c.rationale
                                        }${
                                          c.approxPrice
                                            ? ", " + c.approxPrice
                                            : ""
                                        })`
                                    )
                                    .join("\n");
                                  navigator.clipboard?.writeText(buildText);
                                }}
                                className="text-[10px] sm:text-[11px] h-6 sm:h-7 px-1.5 sm:px-2 bg-white/5 border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white"
                              >
                                Copy Build
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const data = JSON.stringify(
                                    message.recommendedBuild ?? [],
                                    null,
                                    2
                                  );
                                  const blob = new Blob([data], {
                                    type: "application/json",
                                  });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `vortex-build-${message.id}.json`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="text-[10px] sm:text-[11px] h-6 sm:h-7 px-1.5 sm:px-2 bg-white/5 border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white"
                              >
                                Export JSON
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const lines = (
                                    message.recommendedBuild ?? []
                                  ).map(
                                    (c) =>
                                      `${c.category}: ${c.name} - ${
                                        c.rationale
                                      }${
                                        c.approxPrice
                                          ? " (" + c.approxPrice + ")"
                                          : ""
                                      }`
                                  );
                                  const blob = new Blob([lines.join("\n")], {
                                    type: "text/plain",
                                  });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `vortex-build-${message.id}.txt`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="text-[10px] sm:text-[11px] h-6 sm:h-7 px-1.5 sm:px-2 bg-white/5 border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white"
                              >
                                Export TXT
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>

                      {message.suggestions && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-w-full">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-[10px] sm:text-xs border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white hover:border-sky-400/50"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}

                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {(isTyping || isStreaming) && (
                <div className="flex justify-start">
                  <div className="flex space-x-3">
                    <Avatar className="w-10 h-10 mt-1">
                      <AvatarFallback className="bg-gradient-to-r from-sky-500 to-blue-600 text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>

                    <Card className="bg-white/10 border-white/20 p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-sky-500/20 p-3 sm:p-4">
              <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3">
                <Button
                  variant={expertMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpertMode((v) => !v)}
                  className={
                    expertMode
                      ? "bg-gradient-to-r from-sky-600 to-blue-600 text-[10px] sm:text-xs h-7 sm:h-8"
                      : "border-sky-500/30 text-sky-300 text-[10px] sm:text-xs h-7 sm:h-8"
                  }
                >
                  {expertMode ? "Expert: ON" : "Expert"}
                </Button>
                <Button
                  variant={aiMode !== "rules" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setAiMode((current) => {
                      if (current === "rules") return "hybrid";
                      if (current === "hybrid") return "ai-only";
                      return "rules";
                    });
                  }}
                  className={
                    aiMode !== "rules"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-[10px] sm:text-xs h-7 sm:h-8"
                      : "border-purple-500/30 text-purple-300 text-[10px] sm:text-xs h-7 sm:h-8"
                  }
                  title="Rules: Fast, free responses | Hybrid: Smart fallback to AI | AI-Only: Full AI power"
                >
                  {aiMode === "rules" && "🔧 Rules"}
                  {aiMode === "hybrid" && "🤖 Hybrid"}
                  {aiMode === "ai-only" && "✨ AI"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMessages([
                      messages[0],
                      {
                        id: Date.now(),
                        type: "system",
                        content: "Context cleared. Ask a fresh question!",
                        timestamp: new Date(),
                      },
                    ]);
                  }}
                  className="border-red-500/40 text-red-300 hover:bg-red-500/20 text-[10px] sm:text-xs h-7 sm:h-8"
                >
                  Reset
                </Button>
              </div>
              <div className="flex space-x-2 sm:space-x-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask me anything about PC building..."
                  className="flex-1 bg-white/10 border-sky-500/30 text-white placeholder-gray-400 text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar - Hidden on mobile, shown on large screens */}
          <div className="hidden lg:block lg:w-72 xl:w-80 border-l border-sky-500/20 p-4 overflow-y-auto">
            <h3 className="font-bold text-white mb-4 flex items-center text-sm">
              <Sparkles className="w-4 h-4 mr-2 text-sky-400" />
              Quick Actions
            </h3>

            <div className="space-y-2.5">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => handleQuickActionClick(action.message)}
                  className="w-full justify-start text-left p-2.5 h-auto border border-sky-500/20 hover:bg-sky-500/10 hover:border-sky-400/30"
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <action.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-white text-xs truncate">
                        {action.label}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                        {action.message}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-sky-600/10 to-blue-600/10 border border-sky-500/20 rounded-lg space-y-2">
              <h4 className="font-medium text-sky-300 mb-2 text-xs">
                💡 Tips & Capabilities
              </h4>
              <ul className="text-[11px] text-gray-300 space-y-1 list-disc list-inside">
                <li className="line-clamp-2">
                  Ask: "Compare 7600X vs 13600K gaming" for head-to-head
                  guidance.
                </li>
                <li className="line-clamp-2">
                  Provide budget: "£1300 quiet 1440p build" for tailored parts.
                </li>
                <li className="line-clamp-2">
                  Paste your part list to get compatibility sanity-checks.
                </li>
                <li>Toggle Expert Mode for deeper technical nuance.</li>
                <li>Use Reset Context to start a fresh planning thread.</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
