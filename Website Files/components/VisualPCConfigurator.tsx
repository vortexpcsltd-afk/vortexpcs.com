import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Settings,
  Zap,
  Shield,
  Gamepad,
  Briefcase,
  Video,
  TrendingUp,
  Trophy,
  CheckCircle,
  RotateCcw,
  Eye,
  ShoppingCart,
  Loader2,
  Package,
} from "lucide-react";
import { logger } from "../services/logger";
import { fetchPCComponents, PCComponent } from "../services/cms";

// Component database now fetched from CMS via fetchPCComponents

interface Component {
  id: string;
  name: string;
  brand?: string;
  price: number;
  image?: string;
  performance?: number | string; // Can be numeric score or tier string
  powerDraw?: number;
  features?: string[];
  // CMS fields for flexible integration
  rating?: number;
  stockLevel?: number;
  images?: string[];
  description?: string;
  // CPU fields
  cores?: number;
  threads?: number;
  tdp?: number;
  // GPU fields
  vram?: number;
  power?: number;
  // RAM fields
  capacity?: number;
  speed?: string;
  // Storage fields
  interface?: string;
  driveType?: string;
  // Additional CMS fields for compatibility checks
  socket?: string;
  ramSupport?: string;
  maxRam?: number;
  ramSlots?: number;
  type?: string;
  wattage?: number;
  length?: number;
  maxGpuLength?: number;
  radiatorSize?: string;
  coolerType?: string;
  formFactor?: string;
  tdpSupport?: number;
  // Index signature for other PCComponent fields
  [key: string]: unknown;
}

interface BuildConfiguration {
  case?: Component;
  motherboard?: Component;
  cpu?: Component;
  memory?: Component;
  gpu?: Component;
  storage?: Component;
  psu?: Component;
  cooling?: Component;
}

const CATEGORIES = [
  { id: "case", name: "Case", icon: Monitor },
  { id: "motherboard", name: "Motherboard", icon: Settings },
  { id: "cpu", name: "CPU", icon: Cpu },
  { id: "memory", name: "Memory", icon: MemoryStick },
  { id: "gpu", name: "Graphics Card", icon: Video },
  { id: "storage", name: "Storage", icon: HardDrive },
  { id: "psu", name: "Power Supply", icon: Zap },
  { id: "cooling", name: "Cooling", icon: Shield },
];

export function VisualPCConfigurator() {
  const [buildConfig, setBuildConfig] = useState<BuildConfiguration>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("case");
  const [viewMode, setViewMode] = useState<"3d" | "exploded" | "compact">("3d");
  const [viewAngle, setViewAngle] = useState(15);
  const configuratorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // CMS Integration: fetch components from Contentful
  const [cmsComponents, setCmsComponents] = useState<
    Record<string, PCComponent[]>
  >({
    case: [],
    motherboard: [],
    cpu: [],
    memory: [],
    gpu: [],
    storage: [],
    psu: [],
    cooling: [],
  });
  const [isLoadingComponents, setIsLoadingComponents] = useState(true);

  // Fetch CMS components on mount
  useEffect(() => {
    const loadComponents = async () => {
      setIsLoadingComponents(true);
      const categories = [
        "case",
        "motherboard",
        "cpu",
        "memory",
        "gpu",
        "storage",
        "psu",
        "cooling",
      ];
      const results: Record<string, PCComponent[]> = {};

      logger.debug(
        "🔧 VisualPCConfigurator: Starting to load components from CMS..."
      );

      for (const cat of categories) {
        try {
          const items = await fetchPCComponents({
            category: cat === "memory" ? "ram" : cat,
          });
          results[cat] = items || [];
          logger.debug(
            `Loaded ${items?.length || 0} components for category: ${cat}`,
            { count: items?.length || 0 }
          );
        } catch (error) {
          logger.error(`Failed to load ${cat}`, {
            error: error instanceof Error ? error.message : String(error),
          });
          results[cat] = [];
        }
      }

      logger.debug("All components loaded", {
        categories: Object.keys(results),
        totalCount: Object.values(results).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
      });
      setCmsComponents(results);
      setIsLoadingComponents(false);
    };

    loadComponents();
  }, []);

  // Compatibility checks derived from current build configuration
  const compatibility = useMemo(() => {
    const issues: string[] = [];
    const warnings: string[] = [];

    const pcCase = buildConfig.case;
    const motherboard = buildConfig.motherboard;
    const cpu = buildConfig.cpu;
    const memory = buildConfig.memory;
    const gpu = buildConfig.gpu;
    const psu = buildConfig.psu;
    const cooling = buildConfig.cooling;

    // CPU ↔ Motherboard socket
    if (
      cpu?.socket &&
      motherboard?.socket &&
      cpu.socket !== motherboard.socket
    ) {
      issues.push(
        `CPU socket (${cpu.socket}) does not match motherboard socket (${motherboard.socket}).`
      );
    }

    // RAM type vs motherboard RAM support (e.g., DDR4/DDR5)
    if (memory?.type && motherboard?.ramSupport) {
      const memType = String(memory.type).toUpperCase();
      const support = String(motherboard.ramSupport).toUpperCase();
      if (!support.includes(memType)) {
        issues.push(
          `Motherboard RAM support (${motherboard.ramSupport}) does not include selected memory type (${memory.type}).`
        );
      }
    }

    // RAM capacity vs motherboard maxRam
    if (
      memory?.capacity &&
      motherboard?.maxRam &&
      memory.capacity > motherboard.maxRam
    ) {
      issues.push(
        `Memory capacity ${memory.capacity}GB exceeds motherboard max RAM ${motherboard.maxRam}GB.`
      );
    }

    // RAM modules vs RAM slots (soft warning)
    const memModules = (memory &&
      (memory as unknown as { modules?: number }).modules) as
      | number
      | undefined;
    if (
      memModules &&
      motherboard?.ramSlots &&
      memModules > motherboard.ramSlots
    ) {
      warnings.push(`Selected memory modules may exceed available RAM slots.`);
    }

    // GPU length vs Case max GPU length
    if (
      gpu?.length &&
      pcCase?.maxGpuLength &&
      gpu.length > pcCase.maxGpuLength
    ) {
      issues.push(
        `GPU length ${gpu.length}mm exceeds case max GPU length ${pcCase.maxGpuLength}mm.`
      );
    }

    // PSU wattage vs estimated system power (CPU TDP + GPU power + 100W, with 25% headroom)
    const cpuTdp = cpu?.tdp || 0;
    const gpuPower = (gpu?.power as number | undefined) || 0;
    const baseOther = 100;
    const estimated = cpuTdp + gpuPower + baseOther;
    const recommended = Math.round(estimated * 1.25);
    if (psu?.wattage) {
      if (psu.wattage < estimated) {
        issues.push(
          `PSU wattage ${psu.wattage}W is below estimated system draw ${estimated}W.`
        );
      } else if (psu.wattage < recommended) {
        warnings.push(
          `PSU wattage ${psu.wattage}W may be low; recommended ~${recommended}W for headroom.`
        );
      }
    }

    // Cooling radiator vs Case support (best-effort string check)
    const radStr = (cooling?.radiatorSize as string | undefined) || "";
    const radNum = parseInt(radStr.replace(/[^0-9]/g, ""));
    if (pcCase?.coolingSupport && radNum) {
      const supportStr = String(pcCase.coolingSupport).toLowerCase();
      const explicitSizes =
        supportStr.match(/(120|140|240|280|360|420)mm/g) || [];
      if (explicitSizes.length > 0) {
        const sizes = explicitSizes.map((s) => parseInt(s.replace(/mm/, "")));
        if (!sizes.includes(radNum)) {
          issues.push(
            `${radNum}mm radiator not listed in case cooling support (${sizes.join(
              ", "
            )}).`
          );
        }
      } else if (!supportStr.includes(String(radNum))) {
        warnings.push(
          `Case cooling support may not include ${radNum}mm radiator (verify case specs).`
        );
      }
    }

    return { issues, warnings, recommendedPsu: recommended };
  }, [buildConfig]);

  const selectComponent = useCallback(
    (category: string, component: Component) => {
      setBuildConfig((prev) => ({
        ...prev,
        [category]: component,
      }));
    },
    []
  );

  const removeComponent = useCallback((category: string) => {
    setBuildConfig((prev) => {
      const newConfig = { ...prev };
      delete newConfig[category as keyof BuildConfiguration];
      return newConfig;
    });
  }, []);

  // Calculate totals and performance
  const totalPrice = Object.values(buildConfig).reduce(
    (sum, component) => sum + (component?.price || 0),
    0
  );

  // Calculate power draw from various component fields
  const totalPowerDraw = (() => {
    let draw = 0;

    // CPU TDP
    if (buildConfig.cpu?.tdp) {
      draw += buildConfig.cpu.tdp;
    }

    // GPU power consumption
    if (buildConfig.gpu?.power) {
      draw += buildConfig.gpu.power;
    }

    // Base system components (motherboard, RAM, storage, fans, etc.)
    const baseSystemPower = 100;
    draw += baseSystemPower;

    return draw;
  })();

  // Helper to derive performance score from CMS component data
  const getComponentPerformanceScore = (
    component: Component | undefined,
    category: string
  ): number => {
    if (!component) return 0;

    // Use rating as a base (0-5 scale -> 0-100)
    let score = (component.rating || 3) * 20;

    // Adjust based on category-specific metrics
    switch (category) {
      case "cpu":
        // More cores = better performance
        if (component.cores) {
          if (component.cores >= 16) score = Math.min(95, score + 20);
          else if (component.cores >= 12) score = Math.min(90, score + 15);
          else if (component.cores >= 8) score = Math.min(80, score + 10);
        }
        break;

      case "gpu":
        // Map performance tiers to scores
        if (component.performance === "extreme") score = 95;
        else if (component.performance === "high") score = 85;
        else if (component.performance === "mid") score = 70;
        else if (component.performance === "entry") score = 55;
        // Boost by VRAM
        if (component.vram && component.vram >= 24)
          score = Math.min(95, score + 5);
        else if (component.vram && component.vram >= 16)
          score = Math.min(90, score + 3);
        break;

      case "memory":
        // More RAM = better
        if (component.capacity && component.capacity >= 64) score = 90;
        else if (component.capacity && component.capacity >= 32) score = 80;
        else if (component.capacity && component.capacity >= 16) score = 65;
        else score = 50;
        break;

      case "storage":
        // Faster storage = better
        if (component.interface?.includes("PCIe 5.0")) score = 95;
        else if (component.interface?.includes("PCIe 4.0")) score = 85;
        else if (component.interface?.includes("PCIe 3.0")) score = 70;
        else if (component.driveType?.includes("SSD")) score = 75;
        else score = 50;
        break;

      default:
        // For other components, use rating-based score
        break;
    }

    return Math.min(95, Math.max(0, score));
  };

  const performanceBenchmarks = {
    gaming: Math.min(
      95,
      Math.max(
        0,
        getComponentPerformanceScore(buildConfig.gpu, "gpu") * 0.6 +
          getComponentPerformanceScore(buildConfig.cpu, "cpu") * 0.4
      )
    ),
    productivity: Math.min(
      95,
      Math.max(
        0,
        getComponentPerformanceScore(buildConfig.cpu, "cpu") * 0.7 +
          getComponentPerformanceScore(buildConfig.memory, "memory") * 0.3
      )
    ),
    streaming: Math.min(
      95,
      Math.max(
        0,
        getComponentPerformanceScore(buildConfig.cpu, "cpu") * 0.5 +
          getComponentPerformanceScore(buildConfig.gpu, "gpu") * 0.5
      )
    ),
    overall: (() => {
      const components = Object.entries(buildConfig).filter(
        ([_, comp]) => comp
      );
      if (components.length === 0) return 0;

      const totalScore = components.reduce(
        (sum, [category, component]) =>
          sum + getComponentPerformanceScore(component, category),
        0
      );
      return Math.min(95, Math.max(0, totalScore / components.length));
    })(),
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return "text-green-400";
    if (performance >= 60) return "text-yellow-400";
    if (performance >= 40) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-sky-900/20 animate-gradient"></div>
      <div
        className="fixed inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
            Visual PC Configurator
          </h1>
          <p
            className="text-base sm:text-lg md:text-xl text-gray-300 mx-auto max-w-full sm:max-w-2xl md:max-w-3xl px-2 sm:px-0 break-words"
            style={{ wordBreak: "break-word", whiteSpace: "normal" }}
          >
            Custom PCs built for speed, power, and precision. Delivered within 5
            days.
          </p>
          <p
            className="text-base sm:text-lg md:text-xl text-gray-300 mx-auto max-w-full sm:max-w-2xl md:max-w-3xl px-2 sm:px-0 break-words mt-2"
            style={{ wordBreak: "break-word", whiteSpace: "normal" }}
          >
            Build your dream PC with our interactive 3D visualisation tool
          </p>
        </div>

        {/* Status Indicators - Responsive badges */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 mb-8 w-full">
          <Badge
            className={`px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base ${
              Object.values(buildConfig).length === 0
                ? "bg-red-500/20 border-red-500/40 text-red-400"
                : Object.values(buildConfig).length < 6
                ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                : "bg-green-500/20 border-green-500/40 text-green-400"
            }`}
          >
            {Object.values(buildConfig).length === 0
              ? "Build Incomplete"
              : Object.values(buildConfig).length < 6
              ? "Build In Progress"
              : "Build Complete"}
          </Badge>
          {/* Compatibility Pill */}
          <Badge
            className={`px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base ${
              Object.values(buildConfig).filter(Boolean).length === 0
                ? "bg-gray-500/20 border-gray-500/40 text-gray-400"
                : compatibility.issues.length > 0
                ? "bg-red-500/20 border-red-500/40 text-red-400"
                : compatibility.warnings.length > 0
                ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400"
                : "bg-green-500/20 border-green-500/40 text-green-400"
            }`}
          >
            {Object.values(buildConfig).filter(Boolean).length === 0
              ? "No Components"
              : compatibility.issues.length > 0
              ? `${compatibility.issues.length} Issue${
                  compatibility.issues.length > 1 ? "s" : ""
                }`
              : compatibility.warnings.length > 0
              ? `${compatibility.warnings.length} Warning${
                  compatibility.warnings.length > 1 ? "s" : ""
                }`
              : "Compatible"}
          </Badge>
          <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overall Score: {performanceBenchmarks.overall.toFixed(0)}%
          </Badge>
          <Badge className="bg-purple-500/20 border-purple-500/40 text-purple-400 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm md:text-base">
            £{totalPrice.toLocaleString()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-3 px-0">
          {/* 3D Visualization */}
          <div className="xl:col-span-2 w-full">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-1 sm:p-2 md:p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  The Vortex 3D PC Visualisation Tool
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewAngle((prev) => (prev + 45) % 360)}
                    className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Rotate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (viewMode === "3d") {
                        setViewMode("exploded");
                      } else if (viewMode === "exploded") {
                        setViewMode("compact");
                      } else {
                        setViewMode("3d");
                      }
                    }}
                    className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {viewMode === "3d"
                      ? "3D View"
                      : viewMode === "exploded"
                      ? "Exploded"
                      : "Compact"}
                  </Button>
                </div>
              </div>

              {/* 3D PC Visualization Container */}
              <div
                ref={configuratorRef}
                className="relative bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-xl p-1 sm:p-2 md:p-4 min-h-[180px] sm:min-h-[320px] md:min-h-[600px] flex items-center justify-center overflow-hidden"
                style={{ perspective: "1200px" }}
              >
                {/* 3D PC Build Visualization */}
                <div
                  className="relative w-[220px] sm:w-[350px] md:w-[600px] h-[120px] sm:h-[220px] md:h-[500px] transition-transform duration-700"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${viewAngle}deg) rotateX(-5deg)`,
                  }}
                >
                  {/* PC Case - Always visible as foundation - LARGER */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/80 border-2 border-slate-600/50 rounded-lg backdrop-blur-md shadow-2xl"
                      style={{
                        width: "100%",
                        maxWidth: "700px",
                        height: "100%",
                        maxHeight: "400px",
                        minWidth: "180px",
                        minHeight: "100px",
                        transform: `translateZ(0) ${
                          viewMode === "exploded"
                            ? "scale(1.05)"
                            : viewMode === "compact"
                            ? "scale(0.95)"
                            : "scale(1)"
                        }`,
                        transition: "transform 0.5s ease",
                        boxShadow:
                          "0 30px 60px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(255, 255, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {/* Tempered Glass Side Panel */}
                      <div
                        className="absolute inset-3 bg-black/30 border-2 border-slate-500/30 rounded backdrop-blur-sm"
                        style={{
                          boxShadow:
                            "inset 0 0 120px rgba(0, 0, 0, 0.9), inset 0 -4px 8px rgba(255, 255, 255, 0.1)",
                          background:
                            "linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%)",
                        }}
                      >
                        {/* Interior lighting effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-700/10 via-transparent to-blue-900/20 rounded" />

                        {/* Glass reflection highlight */}
                        <div
                          className="absolute top-0 left-0 right-0 h-32 rounded-t"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)",
                          }}
                        />
                      </div>

                      {/* Metal Frame Edges */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 opacity-60" />
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 opacity-60" />
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-slate-600 via-slate-400 to-slate-600 opacity-60" />
                      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-slate-600 via-slate-400 to-slate-600 opacity-60" />

                      {/* Case Badge */}
                      <div className="absolute top-4 left-4 bg-slate-800/90 px-3 py-1.5 rounded-md text-sm text-slate-200 font-bold border border-slate-600/50 shadow-lg">
                        {buildConfig.case
                          ? buildConfig.case.brand
                          : "VORTEX CASE"}
                      </div>

                      {/* Power Button & Front I/O Panel */}
                      <div className="absolute top-4 right-4 flex items-center gap-3">
                        {/* Power Button */}
                        <div className="relative">
                          <div className="w-8 h-8 bg-slate-900/80 rounded-full border-2 border-slate-600/60 flex items-center justify-center shadow-lg">
                            <div className="w-4 h-4 bg-blue-500/80 rounded-full border border-blue-400/60 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                          </div>
                        </div>

                        {/* USB & Audio Ports */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex gap-1">
                            <div className="w-5 h-3 bg-slate-700/80 rounded-sm border border-slate-500/40" />
                            <div className="w-5 h-3 bg-slate-700/80 rounded-sm border border-slate-500/40" />
                          </div>
                          <div className="flex gap-1">
                            <div className="w-3 h-3 bg-slate-600/80 rounded-full border border-slate-500/40" />
                            <div className="w-3 h-3 bg-red-600/60 rounded-full border border-red-500/40" />
                          </div>
                        </div>
                      </div>

                      {/* Motherboard - Realistic ATX Layout - LARGER */}
                      <div
                        className="absolute rounded-lg backdrop-blur-sm"
                        style={{
                          width: "620px",
                          height: "400px",
                          left: "40px",
                          top: "60px",
                          transform: `translateZ(8px) ${
                            viewMode === "exploded"
                              ? "translateY(-20px)"
                              : "translateY(0)"
                          }`,
                          transition: "all 0.5s ease",
                          background: buildConfig.motherboard
                            ? "linear-gradient(135deg, rgba(16, 35, 25, 0.95) 0%, rgba(5, 46, 22, 0.95) 50%, rgba(20, 83, 45, 0.9) 100%)"
                            : "linear-gradient(135deg, rgba(30, 30, 35, 0.8) 0%, rgba(20, 20, 25, 0.85) 100%)",
                          border: buildConfig.motherboard
                            ? "2px solid rgba(34, 197, 94, 0.6)"
                            : "2px solid rgba(75, 85, 99, 0.4)",
                          boxShadow: buildConfig.motherboard
                            ? "0 8px 32px rgba(34, 197, 94, 0.3), inset 0 0 40px rgba(34, 197, 94, 0.15)"
                            : "0 8px 32px rgba(0, 0, 0, 0.5)",
                        }}
                      >
                        {/* PCB Circuit Traces - Subtle grid pattern */}
                        <div
                          className="absolute inset-0 opacity-15 rounded-lg"
                          style={{
                            background: buildConfig.motherboard
                              ? `
                                linear-gradient(90deg, transparent 48%, rgba(34, 197, 94, 0.4) 49%, rgba(34, 197, 94, 0.4) 51%, transparent 52%),
                                linear-gradient(0deg, transparent 48%, rgba(34, 197, 94, 0.4) 49%, rgba(34, 197, 94, 0.4) 51%, transparent 52%)
                              `
                              : `
                                linear-gradient(90deg, transparent 48%, rgba(75, 85, 99, 0.3) 49%, rgba(75, 85, 99, 0.3) 51%, transparent 52%),
                                linear-gradient(0deg, transparent 48%, rgba(75, 85, 99, 0.3) 49%, rgba(75, 85, 99, 0.3) 51%, transparent 52%)
                              `,
                            backgroundSize: "20px 20px, 20px 20px",
                          }}
                        />

                        {/* Additional Circuit Traces */}
                        <div
                          className="absolute inset-0 opacity-10 rounded-lg"
                          style={{
                            background: buildConfig.motherboard
                              ? "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(34, 197, 94, 0.3) 40px, rgba(34, 197, 94, 0.3) 42px)"
                              : "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(75, 85, 99, 0.2) 40px, rgba(75, 85, 99, 0.2) 42px)",
                          }}
                        />

                        {/* Top Row Layout: VRM | CPU+Cooler | RAM | 8-pin | 24-pin */}
                        {/* Define column helper locally for clarity (motherboard inner width minus padding) */}
                        {(() => {
                          const boardWidth = 620;
                          const usableWidth = boardWidth - 40; // subtract approximate right side clearance
                          const col = (i: number) =>
                            20 + (usableWidth / 12) * i; // base offset + column width * index
                          // Row y positions
                          const rowTop = 25; // top row y
                          const middleRowTop = 180; // middle row y anchor
                          return (
                            <>
                              {/* VRM Heatsink - Column 0 */}
                              <div
                                className="absolute rounded-md"
                                style={{
                                  width: "90px",
                                  height: "35px",
                                  left: col(0),
                                  top: rowTop + 10, // moved down by 10px
                                  background:
                                    "linear-gradient(135deg, rgba(70, 70, 80, 0.95), rgba(50, 50, 60, 0.98))",
                                  border: "1px solid rgba(110, 110, 130, 0.7)",
                                  boxShadow:
                                    "0 3px 10px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.25)",
                                }}
                              >
                                <div
                                  className="absolute inset-1 opacity-40"
                                  style={{
                                    background:
                                      "repeating-linear-gradient(90deg, transparent, transparent 2.5px, rgba(255, 255, 255, 0.2) 2.5px, rgba(255, 255, 255, 0.2) 3.5px)",
                                  }}
                                />
                                <div className="absolute -bottom-4 left-0 right-0 text-[8px] text-center text-slate-300/70 tracking-wide">
                                  VRM
                                </div>
                              </div>

                              {/* CMOS Battery - just below VRM heatsink */}
                              <div
                                className="absolute rounded-full"
                                style={{
                                  width: "26px",
                                  height: "26px",
                                  left: col(0) + 12,
                                  top: rowTop + 88, // moved down by additional 30px and 20px left
                                  transform: "translateZ(3px)",
                                  background:
                                    "radial-gradient(circle at 30% 30%, rgba(200,200,210,0.95) 0%, rgba(130,130,140,0.95) 55%, rgba(90,90,100,0.9) 100%)",
                                  border: "2px solid rgba(190, 190, 200, 0.85)",
                                  boxShadow:
                                    "0 4px 12px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.35)",
                                }}
                              >
                                {/* Polarity mark */}
                                <div className="absolute top-0.5 left-1 right-1 h-px bg-white/60 opacity-70" />
                                {/* Tiny label */}
                                <div className="absolute bottom-0.5 left-0 right-0 text-[7px] text-slate-200/80 text-center tracking-wider">
                                  CMOS
                                </div>
                              </div>

                              {/* CPU Socket - Positioned Column 3 */}
                              <div
                                className="absolute rounded"
                                style={{
                                  width: "100px",
                                  height: "100px",
                                  left: col(3),
                                  top: rowTop + 15,
                                  transform: `translateZ(4px) ${
                                    viewMode === "exploded" && buildConfig.cpu
                                      ? "translateY(-15px)"
                                      : "translateY(0)"
                                  }`,
                                  transition: "all 0.5s ease",
                                  background: buildConfig.cpu
                                    ? "linear-gradient(135deg, rgba(180, 150, 50, 0.9) 0%, rgba(150, 120, 30, 0.95) 100%)"
                                    : "linear-gradient(135deg, rgba(40, 40, 45, 0.8), rgba(25, 25, 30, 0.9))",
                                  border: buildConfig.cpu
                                    ? "2px solid rgba(200, 170, 60, 0.7)"
                                    : "2px solid rgba(60, 60, 70, 0.5)",
                                  boxShadow: buildConfig.cpu
                                    ? "0 6px 24px rgba(251, 191, 36, 0.4), inset 0 2px 4px rgba(255, 220, 100, 0.3)"
                                    : "0 4px 16px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.05)",
                                }}
                              >
                                <div
                                  className="absolute inset-2 opacity-40"
                                  style={{
                                    background: buildConfig.cpu
                                      ? "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255, 215, 0, 0.3) 4px, rgba(255, 215, 0, 0.3) 5px), repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255, 215, 0, 0.3) 4px, rgba(255, 215, 0, 0.3) 5px)"
                                      : "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(100, 100, 110, 0.3) 4px, rgba(100, 100, 110, 0.3) 5px), repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(100, 100, 110, 0.3) 4px, rgba(100, 100, 110, 0.3) 5px)",
                                  }}
                                />
                                {buildConfig.cpu && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-sm text-yellow-200 font-bold tracking-wider">
                                      CPU
                                    </div>
                                    <div className="text-xs text-yellow-300/70 font-mono mt-1">
                                      {buildConfig.cpu.brand}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* CPU Cooler - Surrounding CPU (offset) */}
                              {buildConfig.cpu && buildConfig.cooling && (
                                <div
                                  className="absolute"
                                  style={{
                                    width: "120px",
                                    height: "120px",
                                    left: col(3) - 10,
                                    top: rowTop + 5,
                                    transform: `translateZ(20px) ${
                                      viewMode === "exploded"
                                        ? "translateY(-35px)"
                                        : "translateY(0)"
                                    }`,
                                    transition: "all 0.5s ease",
                                  }}
                                >
                                  <div
                                    className="absolute inset-2 rounded-lg"
                                    style={{
                                      background:
                                        "linear-gradient(135deg, rgba(100, 116, 139, 0.9), rgba(71, 85, 105, 0.95))",
                                      border:
                                        "2px solid rgba(148, 163, 184, 0.6)",
                                      boxShadow:
                                        "0 8px 32px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.2)",
                                    }}
                                  >
                                    <div className="absolute -top-1 left-4 w-2 h-16 bg-gradient-to-b from-amber-700/80 to-amber-900/80 rounded-full opacity-70" />
                                    <div className="absolute -top-1 left-8 w-2 h-16 bg-gradient-to-b from-amber-700/80 to-amber-900/80 rounded-full opacity-70" />
                                    <div className="absolute -top-1 right-8 w-2 h-16 bg-gradient-to-b from-amber-700/80 to-amber-900/80 rounded-full opacity-70" />
                                    <div className="absolute -top-1 right-4 w-2 h-16 bg-gradient-to-b from-amber-700/80 to-amber-900/80 rounded-full opacity-70" />
                                  </div>
                                  <div
                                    className="absolute rounded-full border-2 border-slate-400/60"
                                    style={{
                                      width: "70px",
                                      height: "70px",
                                      left: "20px",
                                      top: "20px",
                                      background:
                                        "radial-gradient(circle, rgba(30, 41, 59, 0.9) 20%, rgba(51, 65, 85, 0.85) 100%)",
                                      boxShadow:
                                        "0 4px 16px rgba(0, 0, 0, 0.8)",
                                    }}
                                  >
                                    <div
                                      className="absolute inset-3 rounded-full animate-spin"
                                      style={{ animationDuration: "2s" }}
                                    >
                                      <div className="absolute top-1/2 left-1/2 w-6 h-1 bg-slate-300/70 -translate-x-1/2 -translate-y-1/2 rounded" />
                                      <div className="absolute top-1/2 left-1/2 w-6 h-1 bg-slate-300/70 -translate-x-1/2 -translate-y-1/2 rounded rotate-45" />
                                      <div className="absolute top-1/2 left-1/2 w-6 h-1 bg-slate-300/70 -translate-x-1/2 -translate-y-1/2 rounded rotate-90" />
                                      <div className="absolute top-1/2 left-1/2 w-6 h-1 bg-slate-300/70 -translate-x-1/2 -translate-y-1/2 rounded -rotate-45" />
                                    </div>
                                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-slate-700 rounded-full -translate-x-1/2 -translate-y-1/2 border border-slate-500" />
                                  </div>
                                </div>
                              )}

                              {/* RAM Slots - Columns 8-11 */}
                              {[0, 1, 2, 3].map((slotIndex) => {
                                const hasRAM =
                                  buildConfig.memory &&
                                  (slotIndex === 0 || slotIndex === 2);
                                return (
                                  <div
                                    key={slotIndex}
                                    className="absolute rounded-sm"
                                    style={{
                                      width: "22px",
                                      height: "110px",
                                      left: col(8 + slotIndex),
                                      top: rowTop + 10,
                                      transform: `translateZ(6px) ${
                                        viewMode === "exploded" && hasRAM
                                          ? "translateY(-12px)"
                                          : "translateY(0)"
                                      }`,
                                      transition: "all 0.5s ease",
                                      background: hasRAM
                                        ? "linear-gradient(180deg, rgba(168, 85, 247, 0.9) 0%, rgba(126, 34, 206, 0.95) 50%, rgba(88, 28, 135, 0.9) 100%)"
                                        : "linear-gradient(180deg, rgba(31, 41, 55, 0.7), rgba(17, 24, 39, 0.8))",
                                      border: hasRAM
                                        ? "1px solid rgba(168, 85, 247, 0.7)"
                                        : "1px solid rgba(75, 85, 99, 0.4)",
                                      boxShadow: hasRAM
                                        ? "0 6px 20px rgba(168, 85, 247, 0.4), inset 0 2px 4px rgba(192, 132, 252, 0.3)"
                                        : "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
                                    }}
                                  >
                                    {!hasRAM && (
                                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-slate-400/60 font-mono">
                                        DIMM{slotIndex + 1}
                                      </div>
                                    )}
                                    {hasRAM && (
                                      <>
                                        <div className="absolute top-2 inset-x-0.5 h-1 bg-black/40 rounded-sm" />
                                        <div className="absolute top-5 inset-x-0.5 h-1 bg-black/40 rounded-sm" />
                                        <div className="absolute top-8 inset-x-0.5 h-1 bg-black/40 rounded-sm" />
                                        <div className="absolute top-11 inset-x-0.5 h-1 bg-black/40 rounded-sm" />
                                        <div className="absolute bottom-11 inset-x-0.5 h-1 bg-black/40 rounded-sm" />
                                        <div className="absolute bottom-8 inset-x-0.5 h-1 bg-black/40 rounded-sm" />
                                        <div className="absolute bottom-5 inset-x-0.5 h-1 bg-black/40 rounded-sm" />
                                        <div className="absolute bottom-2 inset-x-0.5 h-1 bg-black/40 rounded-sm" />
                                        <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-b from-purple-400/60 to-transparent rounded-t-sm" />
                                      </>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Middle Row: Chipset | PCIe | M.2 | SATA */}
                              {/* Chipset Heatsink - Column 5 */}
                              <div
                                className="absolute rounded-md"
                                style={{
                                  width: "85px",
                                  height: "55px",
                                  left: col(5) - 20, // moved left by 20px
                                  top: middleRowTop,
                                  background:
                                    "linear-gradient(135deg, rgba(60, 60, 70, 0.95), rgba(40, 40, 50, 0.98))",
                                  border: "2px solid rgba(100, 100, 120, 0.7)",
                                  boxShadow:
                                    "0 4px 15px rgba(0, 0, 0, 0.7), inset 0 2px 3px rgba(255, 255, 255, 0.2)",
                                }}
                              >
                                <div
                                  className="absolute inset-1.5 opacity-35"
                                  style={{
                                    background:
                                      "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 255, 255, 0.2) 2px, rgba(255, 255, 255, 0.2) 3px)",
                                  }}
                                />
                                <div className="absolute top-1 left-1 text-[8px] text-slate-400 font-bold opacity-60">
                                  CHIPSET
                                </div>
                              </div>

                              {/* PCIe Slot - Column 0 (moved far left middle row) */}
                              <div
                                className="absolute rounded-sm"
                                style={{
                                  width: "140px",
                                  height: "22px",
                                  left: col(0),
                                  top: middleRowTop + 25,
                                  transform: "translateZ(2px)",
                                  background:
                                    "linear-gradient(90deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))",
                                  border: "1px solid rgba(75, 85, 99, 0.4)",
                                  boxShadow:
                                    "inset 0 2px 4px rgba(0, 0, 0, 0.5)",
                                }}
                              >
                                <div className="absolute -bottom-3 left-0 text-[8px] font-semibold tracking-wide text-slate-300/70">
                                  PCIE x16
                                </div>
                              </div>

                              {/* M.2 Slot - Column 7 */}
                              {buildConfig.storage && (
                                <div
                                  className="absolute rounded-sm"
                                  style={{
                                    width: "70px",
                                    height: "10px",
                                    left: col(7),
                                    top: middleRowTop + 15,
                                    transform: `translateZ(3px) ${
                                      viewMode === "exploded"
                                        ? "translateY(-8px)"
                                        : "translateY(0)"
                                    }`,
                                    transition: "all 0.5s ease",
                                    background:
                                      "linear-gradient(90deg, rgba(34, 197, 94, 0.8), rgba(5, 150, 105, 0.8))",
                                    border: "1px solid rgba(34, 197, 94, 0.7)",
                                    boxShadow:
                                      "0 3px 12px rgba(34, 197, 94, 0.4)",
                                  }}
                                >
                                  <div className="absolute -top-3 left-0 text-[8px] text-green-400 font-bold">
                                    M.2
                                  </div>
                                  <div className="absolute -bottom-2 left-0 text-[7px] text-green-300/70 tracking-wider">
                                    NVME
                                  </div>
                                </div>
                              )}

                              {/* SATA Ports - Column 10 */}
                              <div
                                className="absolute"
                                style={{
                                  left: col(10),
                                  top: middleRowTop + 10,
                                }}
                              >
                                <div className="flex gap-1">
                                  {[0, 1, 2, 3].map((i) => (
                                    <div
                                      key={i}
                                      className="w-3 h-4 bg-blue-900/60 border border-blue-700/70 rounded-sm"
                                      style={{
                                        boxShadow:
                                          "inset 0 1px 2px rgba(0, 0, 0, 0.6)",
                                      }}
                                    />
                                  ))}
                                </div>
                                <div className="mt-1 text-[7px] text-blue-300/60 tracking-wide">
                                  SATA
                                </div>
                              </div>

                              {/* 8-pin CPU Power - shifted 10px left from right edge */}
                              <div
                                className="absolute rounded-sm"
                                style={{
                                  width: "10px",
                                  height: "22px",
                                  left: 600, // moved 10px left
                                  top: middleRowTop + 10,
                                  background:
                                    "linear-gradient(90deg, rgba(20, 20, 25, 0.9), rgba(30, 30, 35, 0.95))",
                                  border: "1px solid rgba(80, 80, 90, 0.6)",
                                  boxShadow:
                                    "inset 0 2px 4px rgba(0, 0, 0, 0.8)",
                                }}
                              >
                                <div
                                  className="absolute inset-0.5 opacity-50"
                                  style={{
                                    background:
                                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(150, 150, 160, 0.4) 2px, rgba(150, 150, 160, 0.4) 2.5px)",
                                  }}
                                />
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-slate-400/70">
                                  CPU
                                </div>
                              </div>

                              {/* 24-pin ATX - shifted 10px left from right edge */}
                              <div
                                className="absolute rounded-sm"
                                style={{
                                  width: "12px",
                                  height: "45px",
                                  left: 598, // moved 10px left
                                  top: middleRowTop + 40,
                                  background:
                                    "linear-gradient(90deg, rgba(20, 20, 25, 0.9), rgba(30, 30, 35, 0.95))",
                                  border: "1px solid rgba(80, 80, 90, 0.6)",
                                  boxShadow:
                                    "inset 0 2px 4px rgba(0, 0, 0, 0.8)",
                                }}
                              >
                                <div
                                  className="absolute inset-0.5 opacity-50"
                                  style={{
                                    background:
                                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(150, 150, 160, 0.4) 2px, rgba(150, 150, 160, 0.4) 3px)",
                                  }}
                                />
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] text-slate-400/70">
                                  ATX
                                </div>
                              </div>

                              {/* Fan Headers - top edge right side (same inward offset as power connectors) */}
                              {[0, 1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="absolute rounded-sm"
                                  style={{
                                    width: "28px",
                                    height: "12px",
                                    left: 560 - i * 34, // stagger leftwards
                                    top: rowTop - 14, // moved up by 20px
                                    background:
                                      "linear-gradient(180deg, rgba(55,65,81,0.85), rgba(31,41,55,0.9))",
                                    border: "1px solid rgba(100,100,110,0.5)",
                                    boxShadow:
                                      "inset 0 1px 2px rgba(0,0,0,0.6)",
                                  }}
                                >
                                  <div
                                    className="absolute inset-1 opacity-60"
                                    style={{
                                      background:
                                        "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(200,200,210,0.4) 3px, rgba(200,200,210,0.4) 4px)",
                                    }}
                                  />
                                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[6px] tracking-wide text-slate-400/60 font-mono">
                                    SYS_FAN{i + 1}
                                  </div>
                                </div>
                              ))}

                              {/* Left Edge Fan Header near VRM */}
                              <div
                                className="absolute rounded-sm"
                                style={{
                                  width: "28px",
                                  height: "12px",
                                  left: col(0),
                                  top: rowTop - 14, // moved up by 20px
                                  background:
                                    "linear-gradient(180deg, rgba(55,65,81,0.85), rgba(31,41,55,0.9))",
                                  border: "1px solid rgba(100,100,110,0.5)",
                                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
                                }}
                              >
                                <div
                                  className="absolute inset-1 opacity-60"
                                  style={{
                                    background:
                                      "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(200,200,210,0.4) 3px, rgba(200,200,210,0.4) 4px)",
                                  }}
                                />
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[6px] tracking-wide text-slate-400/60 font-mono">
                                  CPU_FAN
                                </div>
                              </div>

                              {/* Front Panel Connector Cluster - bottom right of board */}
                              <div
                                className="absolute rounded-sm"
                                style={{
                                  width: "90px",
                                  height: "28px",
                                  left: 620 - 90 - 20, // 20px inward like headers
                                  top: 400 - 28 - 10, // moved down by 10px from previous position
                                  background:
                                    "linear-gradient(135deg, rgba(45,55,65,0.9), rgba(25,30,38,0.95))",
                                  border: "1px solid rgba(90,100,110,0.5)",
                                  boxShadow:
                                    "0 4px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.08)",
                                }}
                              >
                                {/* Individual pin blocks */}
                                {[0, 1, 2, 3, 4].map((i) => (
                                  <div
                                    key={i}
                                    className="absolute rounded-sm"
                                    style={{
                                      width: "14px",
                                      height: "18px",
                                      left: 6 + i * 16,
                                      top: 5,
                                      background:
                                        "linear-gradient(180deg, rgba(17,24,39,0.9), rgba(31,41,55,0.9))",
                                      border: "1px solid rgba(120,130,140,0.4)",
                                      boxShadow:
                                        "inset 0 1px 2px rgba(0,0,0,0.6)",
                                    }}
                                  >
                                    <div
                                      className="absolute inset-1 opacity-40"
                                      style={{
                                        background:
                                          "repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(200,200,210,0.5) 2px, rgba(200,200,210,0.5) 3px)",
                                      }}
                                    />
                                  </div>
                                ))}
                                {/* Label */}
                                <div className="absolute bottom-0 left-1 right-1 text-[7px] text-center text-slate-300/80 tracking-wide">
                                  FRONT PANEL
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Graphics Card - Column 2 spanning rows 3-4 */}
                      {buildConfig.gpu && (
                        <div
                          className="absolute rounded-lg backdrop-blur-sm"
                          style={{
                            width: "350px",
                            height: "140px",
                            left: 60,
                            top: 310, // moved 20px up
                            transform: `translateZ(20px) ${
                              viewMode === "exploded"
                                ? "translateY(-35px) scale(1.05)"
                                : "translateY(0) scale(1)"
                            }`,
                            transition: "all 0.5s ease",
                            background:
                              "linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)",
                            border: "2px solid rgba(80, 80, 90, 0.6)",
                            boxShadow:
                              "0 12px 40px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          {/* GPU Shroud */}
                          <div
                            className="absolute inset-2 rounded-md"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(40, 40, 48, 0.9), rgba(30, 30, 36, 0.95))",
                              border: "1px solid rgba(100, 100, 110, 0.4)",
                            }}
                          >
                            {/* Brand Logo Area */}
                            <div className="absolute top-2 left-3 text-sm text-red-300 font-bold bg-red-900/60 px-2 py-1 rounded border border-red-500/40">
                              {buildConfig.gpu.brand}
                            </div>

                            {/* RGB LED Strip */}
                            <div className="absolute top-0 inset-x-6 h-1 bg-gradient-to-r from-transparent via-red-500/60 to-transparent animate-pulse" />
                            <div
                              className="absolute bottom-0 inset-x-6 h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent animate-pulse"
                              style={{ animationDelay: "0.5s" }}
                            />

                            {/* Power Connectors */}
                            <div className="absolute top-2 right-3 flex gap-1.5">
                              <div className="w-4 h-5 bg-yellow-600/70 border border-yellow-500/60 rounded-sm" />
                              <div className="w-4 h-5 bg-yellow-600/70 border border-yellow-500/60 rounded-sm" />
                            </div>
                          </div>

                          {/* GPU Fan 1 */}
                          <div
                            className="absolute border-2 border-slate-600/70 rounded-full"
                            style={{
                              width: "75px",
                              height: "75px",
                              left: "45px",
                              top: "32px",
                              background:
                                "radial-gradient(circle, rgba(20, 20, 25, 0.9) 30%, rgba(40, 40, 48, 0.85) 100%)",
                              boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.8)",
                            }}
                          >
                            <div
                              className="absolute inset-2 rounded-full animate-spin"
                              style={{ animationDuration: "1.5s" }}
                            >
                              {/* Fan Blades */}
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-30" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-60" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-90" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-120" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-150" />
                            </div>
                            {/* Fan Hub */}
                            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-slate-800 rounded-full -translate-x-1/2 -translate-y-1/2 border border-slate-600" />
                          </div>

                          {/* GPU Fan 2 */}
                          <div
                            className="absolute border-2 border-slate-600/70 rounded-full"
                            style={{
                              width: "75px",
                              height: "75px",
                              left: "137px",
                              top: "32px",
                              background:
                                "radial-gradient(circle, rgba(20, 20, 25, 0.9) 30%, rgba(40, 40, 48, 0.85) 100%)",
                              boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.8)",
                            }}
                          >
                            <div
                              className="absolute inset-2 rounded-full animate-spin"
                              style={{
                                animationDuration: "1.5s",
                                animationDirection: "reverse",
                              }}
                            >
                              {/* Fan Blades */}
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-30" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-60" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-90" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-120" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-150" />
                            </div>
                            {/* Fan Hub */}
                            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-slate-800 rounded-full -translate-x-1/2 -translate-y-1/2 border border-slate-600" />
                          </div>

                          {/* GPU Fan 3 */}
                          <div
                            className="absolute border-2 border-slate-600/70 rounded-full"
                            style={{
                              width: "75px",
                              height: "75px",
                              left: "229px",
                              top: "32px",
                              background:
                                "radial-gradient(circle, rgba(20, 20, 25, 0.9) 30%, rgba(40, 40, 48, 0.85) 100%)",
                              boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.8)",
                            }}
                          >
                            <div
                              className="absolute inset-2 rounded-full animate-spin"
                              style={{ animationDuration: "1.5s" }}
                            >
                              {/* Fan Blades */}
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-30" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-60" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-90" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-120" />
                              <div className="absolute top-1/2 left-1/2 w-7 h-0.5 bg-slate-400/80 -translate-x-1/2 -translate-y-1/2 rounded rotate-150" />
                            </div>
                            {/* Fan Hub */}
                            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-slate-800 rounded-full -translate-x-1/2 -translate-y-1/2 border border-slate-600" />
                          </div>

                          {/* GPU Backplate Edge */}
                          <div className="absolute -right-1 top-4 bottom-4 w-1 bg-gradient-to-b from-slate-600 via-slate-500 to-slate-600 rounded-r" />
                        </div>
                      )}

                      {/* Power Supply - Bottom right mounted - LARGER */}
                      {buildConfig.psu && (
                        <div
                          className="absolute rounded-md"
                          style={{
                            width: "140px",
                            height: "80px",
                            left: "520px",
                            top: "340px", // moved up by additional 10px
                            transform: `translateZ(15px) ${
                              viewMode === "exploded"
                                ? "translateY(25px)"
                                : "translateY(0)"
                            }`,
                            transition: "all 0.5s ease",
                            background:
                              "linear-gradient(135deg, rgba(60, 60, 70, 0.9), rgba(40, 40, 50, 0.95))",
                            border: "2px solid rgba(100, 100, 110, 0.6)",
                            boxShadow:
                              "0 8px 30px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          {/* PSU Label */}
                          <div className="absolute top-1 left-2 text-xs text-gray-300 font-bold bg-gray-900/70 px-2 py-0.5 rounded border border-gray-600/50">
                            {buildConfig.psu.brand}
                          </div>

                          {/* Modular Cable Connectors */}
                          <div className="absolute bottom-1 left-2 flex gap-0.5">
                            <div className="w-1.5 h-2 bg-yellow-600/80 border border-yellow-500/60 rounded-sm" />
                            <div className="w-1.5 h-2 bg-yellow-600/80 border border-yellow-500/60 rounded-sm" />
                            <div className="w-1.5 h-2 bg-red-600/80 border border-red-500/60 rounded-sm" />
                            <div className="w-1.5 h-2 bg-black/80 border border-gray-600/60 rounded-sm" />
                            <div className="w-1.5 h-2 bg-black/80 border border-gray-600/60 rounded-sm" />
                          </div>

                          {/* PSU Fan with Grille - Larger */}
                          <div
                            className="absolute border-2 border-gray-500/60 rounded-md"
                            style={{
                              width: "60px",
                              height: "60px",
                              right: "8px",
                              top: "10px",
                              background:
                                "radial-gradient(circle, rgba(20, 20, 25, 0.95) 30%, rgba(40, 40, 48, 0.9) 100%)",
                              boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.9)",
                            }}
                          >
                            {/* Fan Grille Mesh */}
                            <div
                              className="absolute inset-1 opacity-30"
                              style={{
                                background:
                                  "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(150, 150, 160, 0.4) 4px, rgba(150, 150, 160, 0.4) 5px), repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(150, 150, 160, 0.4) 4px, rgba(150, 150, 160, 0.4) 5px)",
                              }}
                            />

                            <div
                              className="absolute inset-2 rounded-full animate-spin"
                              style={{ animationDuration: "3s" }}
                            >
                              {/* Fan Blades */}
                              <div className="absolute top-1/2 left-1/2 w-5 h-0.5 bg-gray-400/70 -translate-x-1/2 -translate-y-1/2 rounded" />
                              <div className="absolute top-1/2 left-1/2 w-5 h-0.5 bg-gray-400/70 -translate-x-1/2 -translate-y-1/2 rounded rotate-45" />
                              <div className="absolute top-1/2 left-1/2 w-5 h-0.5 bg-gray-400/70 -translate-x-1/2 -translate-y-1/2 rounded rotate-90" />
                              <div className="absolute top-1/2 left-1/2 w-5 h-0.5 bg-gray-400/70 -translate-x-1/2 -translate-y-1/2 rounded -rotate-45" />
                            </div>
                            {/* Fan Hub */}
                            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gray-800 rounded-full -translate-x-1/2 -translate-y-1/2 border border-gray-600" />
                          </div>

                          {/* Power Socket */}
                          <div
                            className="absolute top-2 right-3 w-5 h-4 bg-black/90 border border-gray-700/70 rounded-sm"
                            style={{
                              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.8)",
                            }}
                          >
                            <div className="absolute top-1 left-1 right-1 flex gap-0.5 justify-center">
                              <div className="w-0.5 h-1.5 bg-yellow-700/60" />
                              <div className="w-0.5 h-1.5 bg-yellow-700/60" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Detached Compatibility Panel */}
                {Object.values(buildConfig).filter(Boolean).length > 0 && (
                  <div
                    className="absolute w-72 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4 space-y-3 shadow-lg"
                    style={{
                      top: "calc(2rem - 15px)",
                      right: "calc(2rem - 15px)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-sky-400" />
                        Compatibility
                      </h4>
                      {compatibility.issues.length === 0 ? (
                        <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
                          OK
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 border-red-500/40 text-red-400">
                          Issues
                        </Badge>
                      )}
                    </div>
                    {compatibility.issues.length > 0 && (
                      <ul className="text-xs text-red-400 list-disc ml-4 space-y-1">
                        {compatibility.issues.slice(0, 4).map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                        {compatibility.issues.length > 4 && (
                          <li>+ {compatibility.issues.length - 4} more…</li>
                        )}
                      </ul>
                    )}
                    {compatibility.warnings.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-yellow-400 mb-1">
                          Warnings
                        </p>
                        <ul className="text-xs text-yellow-400 list-disc ml-4 space-y-1">
                          {compatibility.warnings.slice(0, 4).map((warn, i) => (
                            <li key={i}>{warn}</li>
                          ))}
                          {compatibility.warnings.length > 4 && (
                            <li>+ {compatibility.warnings.length - 4} more…</li>
                          )}
                        </ul>
                      </div>
                    )}
                    {compatibility.issues.length === 0 && (
                      <p className="text-xs text-green-400">
                        All selected core components pass basic checks.
                      </p>
                    )}
                  </div>
                )}

                {/* Instructions overlay when no components selected */}
                {Object.values(buildConfig).filter(Boolean).length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-sm rounded-xl">
                    <div className="text-center">
                      <div className="text-4xl mb-4">⚡</div>
                      <h3 className="text-xl text-white mb-2">
                        Start Building Your PC
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Select components below to see them in 3D
                      </p>
                      <Button
                        onClick={() => setSelectedCategory("case")}
                        variant="outline"
                        className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                      >
                        Choose a Case First
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar with Performance & Summary */}
          <div className="space-y-6 w-full xl:w-auto">
            {/* Performance Benchmarks */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                Performance Benchmarks
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Gaming",
                    value: performanceBenchmarks.gaming,
                    icon: Gamepad,
                  },
                  {
                    label: "Productivity",
                    value: performanceBenchmarks.productivity,
                    icon: Briefcase,
                  },
                  {
                    label: "Streaming",
                    value: performanceBenchmarks.streaming,
                    icon: Video,
                  },
                  {
                    label: "Overall",
                    value: performanceBenchmarks.overall,
                    icon: TrendingUp,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-300">{label}</span>
                      </div>
                      <span
                        className={`text-sm font-semibold ${getPerformanceColor(
                          value
                        )}`}
                      >
                        {value.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          value >= 80
                            ? "bg-green-400"
                            : value >= 60
                            ? "bg-yellow-400"
                            : value >= 40
                            ? "bg-orange-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Build Validation */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                Build Validation
              </h3>
              <div className="space-y-3 text-sm">
                <p className="text-gray-400 font-semibold">Recommendations:</p>
                <ul className="space-y-1 text-gray-300">
                  <li>• Select a PC case to house your components</li>
                  <li>• Choose a motherboard as the foundation</li>
                  <li>• Pick a CPU for processing power</li>
                  <li>• Add RAM for system memory</li>
                  <li>• Include storage for your operating system</li>
                  <li>• Select a power supply unit</li>
                </ul>
              </div>
            </Card>

            {/* Build Summary */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <h3 className="text-xl font-bold mb-4">Build Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Price:</span>
                  <span className="font-bold text-white">
                    £{totalPrice.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Power Draw:</span>
                  <span className="font-bold text-yellow-400">
                    {totalPowerDraw}W
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Components:</span>
                  <span className="font-bold text-sky-400">
                    {Object.values(buildConfig).length}/8
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Component Selection */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 mt-8 p-2 sm:p-4">
          <h2 className="text-2xl font-bold mb-6">Component Selection</h2>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected =
                buildConfig[category.id as keyof BuildConfiguration];
              return (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    transition-all duration-300 
                    ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 border-sky-500/50"
                        : "border-white/10 hover:border-sky-500/30"
                    }
                    ${isSelected ? "border-green-500/50" : ""}
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.name}
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 ml-2 text-green-400" />
                  )}
                </Button>
              );
            })}
          </div>

          {/* Component List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingComponents ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p>Loading components from CMS...</p>
              </div>
            ) : cmsComponents[selectedCategory]?.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-12 text-gray-400">
                <Package className="w-12 h-12 mb-3 opacity-50" />
                <p>No {selectedCategory} components available yet.</p>
                <p className="text-sm mt-1">
                  Check back soon or contact support.
                </p>
              </div>
            ) : (
              cmsComponents[selectedCategory]?.map((component) => {
                const comp = component as PCComponent;
                return (
                  <Card
                    key={comp.id}
                    className={`
                      p-4 cursor-pointer transition-all duration-300 
                      ${
                        buildConfig[
                          selectedCategory as keyof BuildConfiguration
                        ]?.id === comp.id
                          ? "bg-sky-500/20 border-sky-500/40"
                          : "bg-white/5 border-white/10 hover:border-sky-500/30"
                      }
                    `}
                    onClick={() =>
                      selectComponent(
                        selectedCategory,
                        comp as unknown as Component
                      )
                    }
                  >
                    <div className="text-center mb-3">
                      {comp.images && comp.images[0] ? (
                        <img
                          src={comp.images[0]}
                          alt={comp.name}
                          className="w-full h-32 object-contain mb-2 rounded"
                        />
                      ) : (
                        <div className="text-3xl mb-2">📦</div>
                      )}
                      <h4 className="font-semibold text-white mb-1">
                        {comp.name}
                      </h4>
                      {comp.brand && (
                        <p className="text-sm text-gray-400 mb-2">
                          {comp.brand}
                        </p>
                      )}
                      <div className="text-xl font-bold text-sky-400">
                        £{comp.price.toFixed(2)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {comp.rating && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Rating:</span>
                          <span className="text-yellow-400">
                            {comp.rating}/5 ⭐
                          </span>
                        </div>
                      )}
                      {comp.stockLevel !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Stock:</span>
                          <span
                            className={
                              comp.stockLevel > 5
                                ? "text-green-400"
                                : "text-yellow-400"
                            }
                          >
                            {comp.stockLevel > 0
                              ? `${comp.stockLevel} available`
                              : "Out of stock"}
                          </span>
                        </div>
                      )}
                      {comp.features && comp.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {comp.features.slice(0, 3).map((feature, index) => (
                            <Badge
                              key={index}
                              className="bg-gray-600/30 text-gray-300 text-xs px-2 py-1"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {buildConfig[selectedCategory as keyof BuildConfiguration]
                      ?.id === comp.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeComponent(selectedCategory);
                        }}
                        className="w-full mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        Remove
                      </Button>
                    )}
                  </Card>
                );
              })
            )}
          </div>

          {/* Confirm Build Button */}
          {Object.values(buildConfig).filter(Boolean).length > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/30 rounded-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Ready to proceed?
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Continue to PC Builder to review, customize further, and add
                    to cart.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    // Navigate to pc-builder with current configuration
                    // The PCBuilder component will detect and import this
                    sessionStorage.setItem(
                      "visual_configurator_build",
                      JSON.stringify(buildConfig)
                    );
                    navigate("/pc-builder");
                  }}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 px-8 py-6 text-lg font-semibold whitespace-nowrap"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Confirm Build
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
