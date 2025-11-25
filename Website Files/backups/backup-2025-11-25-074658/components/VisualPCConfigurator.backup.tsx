/**
 * Visual PC Configurator Component
 * Features 3D PC visualization, compatibility checking, performance benchmarks, and real-time validation
 * Version: 2025-11-07-PREMIUM
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Monitor,
  Zap,
  Fan,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RotateCcw,
  Eye,
  Settings,
  Gamepad,
  Briefcase,
  Trophy,
  Target,
  Sparkles,
} from "lucide-react";

// Component Database with 3D positioning and specifications
interface ComponentSpec {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  compatibility: string[];
  powerDraw: number;
  performance: number;
  features: string[];
}

interface BuildConfiguration {
  case: ComponentSpec | null;
  motherboard: ComponentSpec | null;
  cpu: ComponentSpec | null;
  gpu: ComponentSpec | null;
  ram: ComponentSpec | null;
  storage: ComponentSpec | null;
  psu: ComponentSpec | null;
  cooler: ComponentSpec | null;
}

interface PerformanceBenchmark {
  gaming: number;
  productivity: number;
  streaming: number;
  overall: number;
}

// Sample component database
const COMPONENT_DATABASE: Record<string, ComponentSpec[]> = {
  case: [
    {
      id: "case-1",
      name: "NZXT H7 Elite",
      brand: "NZXT",
      price: 199.99,
      image: "🏠",
      position: { x: 0, y: 0, z: 0 },
      size: { width: 230, height: 494, depth: 494 },
      compatibility: ["ATX", "micro-ATX", "mini-ITX"],
      powerDraw: 0,
      performance: 0,
      features: ["RGB", "Tempered Glass", "Cable Management"],
    },
    {
      id: "case-2",
      name: "Corsair 5000D",
      brand: "Corsair",
      price: 159.99,
      image: "🏢",
      position: { x: 0, y: 0, z: 0 },
      size: { width: 245, height: 497, depth: 520 },
      compatibility: ["E-ATX", "ATX", "micro-ATX", "mini-ITX"],
      powerDraw: 0,
      performance: 0,
      features: ["Tool-free", "Premium Build", "Excellent Airflow"],
    },
  ],
  motherboard: [
    {
      id: "mb-1",
      name: "ASUS ROG Strix Z790-E",
      brand: "ASUS",
      price: 499.99,
      image: "🔌",
      position: { x: 0, y: -20, z: 5 },
      size: { width: 305, height: 244, depth: 2 },
      compatibility: ["LGA1700", "DDR5", "PCIe5.0"],
      powerDraw: 50,
      performance: 95,
      features: ["WiFi 6E", "RGB", "Premium VRMs"],
    },
    {
      id: "mb-2",
      name: "MSI MAG B550 TOMAHAWK",
      brand: "MSI",
      price: 179.99,
      image: "🎯",
      position: { x: 0, y: -20, z: 5 },
      size: { width: 305, height: 244, depth: 2 },
      compatibility: ["AM4", "DDR4", "PCIe4.0"],
      powerDraw: 35,
      performance: 85,
      features: ["Mystic Light RGB", "Solid VRMs", "Great Value"],
    },
  ],
  cpu: [
    {
      id: "cpu-1",
      name: "Intel Core i9-14900K",
      brand: "Intel",
      price: 589.99,
      image: "🧠",
      position: { x: -20, y: -30, z: 8 },
      size: { width: 37.5, height: 37.5, depth: 5 },
      compatibility: ["LGA1700"],
      powerDraw: 253,
      performance: 100,
      features: ["24 Cores", "5.6GHz Boost", "Overclockable"],
    },
    {
      id: "cpu-2",
      name: "AMD Ryzen 9 7950X",
      brand: "AMD",
      price: 549.99,
      image: "🚀",
      position: { x: -20, y: -30, z: 8 },
      size: { width: 40, height: 40, depth: 5 },
      compatibility: ["AM5"],
      powerDraw: 230,
      performance: 98,
      features: ["16 Cores", "5.7GHz Boost", "Zen 4 Architecture"],
    },
  ],
  gpu: [
    {
      id: "gpu-1",
      name: "RTX 4090 Gaming X Trio",
      brand: "MSI",
      price: 1599.99,
      image: "🎮",
      position: { x: 0, y: 20, z: 15 },
      size: { width: 336, height: 140, depth: 61 },
      compatibility: ["PCIe5.0", "PCIe4.0"],
      powerDraw: 450,
      performance: 100,
      features: ["Ray Tracing", "DLSS 3", "4K Gaming"],
    },
    {
      id: "gpu-2",
      name: "RTX 4070 SUPER Gaming OC",
      brand: "Gigabyte",
      price: 599.99,
      image: "🏆",
      position: { x: 0, y: 20, z: 15 },
      size: { width: 308, height: 136, depth: 56 },
      compatibility: ["PCIe4.0"],
      powerDraw: 220,
      performance: 85,
      features: ["Ray Tracing", "DLSS 3", "1440p Gaming"],
    },
  ],
  ram: [
    {
      id: "ram-1",
      name: "G.Skill Trident Z5 64GB DDR5-6000",
      brand: "G.Skill",
      price: 449.99,
      image: "💾",
      position: { x: 30, y: -25, z: 12 },
      size: { width: 133, height: 44, depth: 7 },
      compatibility: ["DDR5"],
      powerDraw: 15,
      performance: 95,
      features: ["RGB", "High Speed", "Low Latency"],
    },
    {
      id: "ram-2",
      name: "Corsair Vengeance LPX 32GB DDR4-3200",
      brand: "Corsair",
      price: 179.99,
      image: "⚡",
      position: { x: 30, y: -25, z: 12 },
      size: { width: 133, height: 31, depth: 7 },
      compatibility: ["DDR4"],
      powerDraw: 12,
      performance: 80,
      features: ["Low Profile", "Reliable", "Good Value"],
    },
  ],
  storage: [
    {
      id: "storage-1",
      name: "Samsung 990 PRO 2TB NVMe",
      brand: "Samsung",
      price: 249.99,
      image: "💿",
      position: { x: 10, y: -15, z: 6 },
      size: { width: 80, height: 22, depth: 3 },
      compatibility: ["M.2", "PCIe4.0"],
      powerDraw: 8,
      performance: 95,
      features: ["7000MB/s Read", "PCIe 4.0", "Heat Spreader"],
    },
  ],
  psu: [
    {
      id: "psu-1",
      name: "Corsair RM1000x",
      brand: "Corsair",
      price: 199.99,
      image: "⚡",
      position: { x: 0, y: 40, z: 0 },
      size: { width: 150, height: 86, depth: 160 },
      compatibility: ["ATX"],
      powerDraw: -1000,
      performance: 90,
      features: ["80+ Gold", "Fully Modular", "Zero RPM Mode"],
    },
  ],
  cooler: [
    {
      id: "cooler-1",
      name: "NZXT Kraken X73",
      brand: "NZXT",
      price: 199.99,
      image: "❄️",
      position: { x: -20, y: -30, z: 25 },
      size: { width: 394, height: 143, depth: 30 },
      compatibility: ["LGA1700", "AM5", "AM4"],
      powerDraw: 15,
      performance: 95,
      features: ["360mm AIO", "RGB", "CAM Software"],
    },
  ],
};

export function VisualPCConfigurator() {
  const [buildConfig, setBuildConfig] = useState<BuildConfiguration>({
    case: null,
    motherboard: null,
    cpu: null,
    gpu: null,
    ram: null,
    storage: null,
    psu: null,
    cooler: null,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("case");
  const [viewAngle, setViewAngle] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"3d" | "exploded" | "compact">("3d");
  const [performanceBenchmarks, setPerformanceBenchmarks] =
    useState<PerformanceBenchmark>({
      gaming: 0,
      productivity: 0,
      streaming: 0,
      overall: 0,
    });
  const [compatibilityIssues, setCompatibilityIssues] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [totalPower, setTotalPower] = useState<number>(0);
  const [buildValidation, setBuildValidation] = useState<{
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  }>({ isValid: false, warnings: [], recommendations: [] });

  const configuratorRef = useRef<HTMLDivElement>(null);

  // Calculate performance benchmarks
  const calculatePerformanceBenchmarks = useCallback(() => {
    const { cpu, gpu, ram } = buildConfig;

    let gaming = 0;
    let productivity = 0;
    let streaming = 0;

    if (cpu) {
      productivity += cpu.performance * 0.4;
      streaming += cpu.performance * 0.3;
      gaming += cpu.performance * 0.2;
    }

    if (gpu) {
      gaming += gpu.performance * 0.6;
      streaming += gpu.performance * 0.4;
      productivity += gpu.performance * 0.3;
    }

    if (ram) {
      const ramBoost = ram.performance * 0.2;
      gaming += ramBoost;
      productivity += ramBoost;
      streaming += ramBoost;
    }

    const overall = (gaming + productivity + streaming) / 3;

    setPerformanceBenchmarks({
      gaming: Math.min(gaming, 100),
      productivity: Math.min(productivity, 100),
      streaming: Math.min(streaming, 100),
      overall: Math.min(overall, 100),
    });
  }, [buildConfig]);

  const checkCompatibility = useCallback(() => {
    const issues: string[] = [];
    const { motherboard, cpu, ram, psu } = buildConfig;

    // CPU-Motherboard compatibility
    if (cpu && motherboard) {
      const cpuSocket = cpu.compatibility[0];
      if (!motherboard.compatibility.includes(cpuSocket)) {
        issues.push(`CPU socket ${cpuSocket} not compatible with motherboard`);
      }
    }

    // RAM-Motherboard compatibility
    if (ram && motherboard) {
      const ramType = ram.compatibility[0];
      if (
        !motherboard.compatibility.some((compat) => compat.includes(ramType))
      ) {
        issues.push(`${ramType} RAM not compatible with motherboard`);
      }
    }

    // Power supply check
    if (psu && totalPower > 0) {
      const psuCapacity = Math.abs(psu.powerDraw);
      const powerNeeded = totalPower;
      if (powerNeeded > psuCapacity * 0.8) {
        issues.push(
          `PSU may be underpowered (${powerNeeded}W needed, ${psuCapacity}W available)`
        );
      }
    }

    setCompatibilityIssues(issues);
  }, [buildConfig, totalPower]);

  const validateBuild = useCallback(() => {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const {
      case: pcCase,
      motherboard,
      cpu,
      gpu,
      ram,
      storage,
      psu,
      cooler,
    } = buildConfig;

    // Check essential components
    if (!pcCase)
      recommendations.push("Select a PC case to house your components");
    if (!motherboard)
      recommendations.push("Choose a motherboard as the foundation");
    if (!cpu) recommendations.push("Pick a CPU for processing power");
    if (!ram) recommendations.push("Add RAM for system memory");
    if (!storage)
      recommendations.push("Include storage for your operating system");
    if (!psu) recommendations.push("Select a power supply unit");

    // Performance warnings
    if (cpu && gpu && cpu.performance < gpu.performance - 20) {
      warnings.push("CPU may bottleneck GPU performance");
    }

    if (ram && cpu && ram.performance < cpu.performance - 15) {
      warnings.push("RAM speed may limit CPU performance");
    }

    // Cooling warnings
    if (cpu && cpu.powerDraw > 150 && !cooler) {
      warnings.push("High-power CPU requires adequate cooling");
    }

    const isValid =
      !!(pcCase && motherboard && cpu && ram && storage && psu) &&
      compatibilityIssues.length === 0;

    setBuildValidation({ isValid, warnings, recommendations });
  }, [buildConfig, compatibilityIssues]);

  const updatePriceAndPower = useCallback(() => {
    const components = Object.values(buildConfig).filter(
      Boolean
    ) as ComponentSpec[];
    const price = components.reduce(
      (sum, component) => sum + component.price,
      0
    );
    const power = components.reduce((sum, component) => {
      return component.powerDraw > 0 ? sum + component.powerDraw : sum;
    }, 0);

    setTotalPrice(price);
    setTotalPower(power);
  }, [buildConfig]);

  useEffect(() => {
    calculatePerformanceBenchmarks();
    checkCompatibility();
    validateBuild();
    updatePriceAndPower();
  }, [
    calculatePerformanceBenchmarks,
    checkCompatibility,
    validateBuild,
    updatePriceAndPower,
  ]);

  const selectComponent = (category: string, component: ComponentSpec) => {
    setBuildConfig((prev) => ({
      ...prev,
      [category]: component,
    }));
  };

  const removeComponent = (category: string) => {
    setBuildConfig((prev) => ({
      ...prev,
      [category]: null,
    }));
  };

  const categories = [
    {
      id: "case",
      label: "Case",
      icon: Settings,
      color: "from-slate-500 to-gray-500",
    },
    {
      id: "motherboard",
      label: "Motherboard",
      icon: Cpu,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "cpu",
      label: "Processor",
      icon: Cpu,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "gpu",
      label: "Graphics Card",
      icon: Gamepad,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "ram",
      label: "Memory",
      icon: MemoryStick,
      color: "from-orange-500 to-amber-500",
    },
    {
      id: "storage",
      label: "Storage",
      icon: HardDrive,
      color: "from-indigo-500 to-blue-500",
    },
    {
      id: "psu",
      label: "Power Supply",
      icon: Zap,
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "cooler",
      label: "Cooling",
      icon: Fan,
      color: "from-cyan-500 to-blue-500",
    },
  ];

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 50) return "text-orange-400";
    return "text-red-400";
  };

  const getPerformanceGradient = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500";
    if (score >= 70) return "from-yellow-500 to-amber-500";
    if (score >= 50) return "from-orange-500 to-red-500";
    return "from-red-500 to-red-600";
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Visual PC Configurator
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Build your dream PC with our interactive 3D visualization tool
          </p>

          {/* Build Status */}
          <div className="flex flex-wrap justify-center gap-4">
            <Badge
              className={`px-4 py-2 ${
                buildValidation.isValid
                  ? "bg-green-500/20 border-green-500/40 text-green-400"
                  : "bg-red-500/20 border-red-500/40 text-red-400"
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {buildValidation.isValid ? "Build Complete" : "Build Incomplete"}
            </Badge>
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overall Score: {performanceBenchmarks.overall.toFixed(0)}%
            </Badge>
            <Badge className="bg-purple-500/20 border-purple-500/40 text-purple-400 px-4 py-2">
              £{totalPrice.toLocaleString()}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* 3D Visualization */}
          <div className="xl:col-span-2">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  3D PC Visualization
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
                className="relative bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-xl p-4 sm:p-8 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] overflow-hidden"
                style={{ perspective: "1200px" }}
              >
                {/* Instructions overlay when no components selected */}
                {Object.values(buildConfig).filter(Boolean).length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-sm rounded-xl">
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

                {/* 3D PC Build - Always show realistic PC case */}
                <div
                  className="relative w-full h-full transition-transform duration-700"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${viewAngle}deg) rotateX(-5deg)`,
                  }}
                >
                  {/* PC Case - Always visible as the foundation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Main PC Case Structure */}
                    <div
                      className="relative bg-gradient-to-br from-slate-800/40 to-slate-900/60 border-2 border-slate-500/40 rounded-lg backdrop-blur-md"
                      style={{
                        width: "320px",
                        height: "480px",
                        transform: `translateZ(0) ${
                          viewMode === "exploded"
                            ? "scale(1.05)"
                            : viewMode === "compact"
                            ? "scale(0.95)"
                            : "scale(1)"
                        }`,
                        transition: "transform 0.5s ease",
                        boxShadow:
                          "0 25px 50px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      {/* Case Side Panel (Transparent) */}
                      <div
                        className="absolute inset-2 bg-black/20 border border-slate-400/20 rounded backdrop-blur-sm"
                        style={{
                          boxShadow: "inset 0 0 100px rgba(0, 0, 0, 0.8)",
                        }}
                      >
                        {/* Case Interior Background */}
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-800/10 to-black/40 rounded" />
                      </div>

                      {/* Case Badge */}
                      <div className="absolute top-3 left-3 bg-slate-700/80 px-2 py-1 rounded text-xs text-slate-300 font-mono border border-slate-500/30">
                        {buildConfig.case ? buildConfig.case.brand : "Generic Case"}
                      </div>

                      {/* Power Button */}
                      <div className="absolute top-3 right-3 w-3 h-3 bg-blue-500/60 rounded-full border border-blue-400/40 animate-pulse" />

                      {/* Front I/O Ports */}
                      <div className="absolute top-8 right-3 space-y-1">
                        <div className="w-4 h-1 bg-slate-600/60 rounded-sm" />
                        <div className="w-3 h-1 bg-slate-600/60 rounded-sm" />
                        <div className="w-2 h-1 bg-slate-600/60 rounded-sm" />
                      </div>

                      {/* Internal Component Area */}
                      <div className="absolute inset-4 rounded">
                        {/* Motherboard - Always show as the foundation */}
                        <div
                          className="absolute bg-gradient-to-br from-green-800/60 to-emerald-900/60 border border-green-500/50 rounded-md backdrop-blur-sm"
                          style={{
                            width: "240px",
                            height: "180px",
                            left: "20px",
                            top: "120px",
                            transform: `translateZ(8px) ${
                              viewMode === "exploded"
                                ? "translateY(-20px) scale(1.05)"
                                : "translateY(0) scale(1)"
                            }`,
                            transition: "all 0.5s ease",
                            background: buildConfig.motherboard
                              ? "linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(5, 150, 105, 0.6))"
                              : "linear-gradient(135deg, rgba(75, 85, 99, 0.4), rgba(55, 65, 81, 0.4))",
                            borderColor: buildConfig.motherboard
                              ? "rgba(34, 197, 94, 0.5)"
                              : "rgba(75, 85, 99, 0.3)",
                            boxShadow: buildConfig.motherboard
                              ? "0 4px 20px rgba(34, 197, 94, 0.2), inset 0 0 20px rgba(34, 197, 94, 0.1)"
                              : "0 4px 20px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          {/* Motherboard Circuit Patterns */}
                          <div
                            className="absolute inset-2 opacity-40 rounded"
                            style={{
                              background: buildConfig.motherboard
                                ? `conic-gradient(from 0deg at 20% 20%, 
                                  transparent, rgba(34, 197, 94, 0.2), transparent,
                                  rgba(34, 197, 94, 0.15), transparent, rgba(34, 197, 94, 0.1), 
                                  transparent)`
                                : `conic-gradient(from 0deg at 20% 20%, 
                                  transparent, rgba(75, 85, 99, 0.3), transparent,
                                  rgba(75, 85, 99, 0.2), transparent, rgba(75, 85, 99, 0.1), 
                                  transparent)`,
                            }}
                          />
                          
                          {/* Motherboard Label */}
                          {buildConfig.motherboard && (
                            <div className="absolute top-2 left-2 text-xs text-green-300 font-mono bg-green-900/50 px-1 rounded border border-green-500/30">
                              {buildConfig.motherboard.brand}
                            </div>
                          )}

                          {/* CPU Socket - Always visible */}
                          <div
                            className="absolute bg-gradient-to-br from-slate-700/60 to-slate-800/60 border border-slate-500/40 rounded-sm"
                            style={{
                              width: "40px",
                              height: "40px",
                              left: "80px",
                              top: "40px",
                              transform: `translateZ(4px) ${
                                viewMode === "exploded" ? "translateY(-15px)" : "translateY(0)"
                              }`,
                              transition: "all 0.5s ease",
                              background: buildConfig.cpu
                                ? "linear-gradient(135deg, rgba(251, 191, 36, 0.6), rgba(245, 158, 11, 0.6))"
                                : "linear-gradient(135deg, rgba(75, 85, 99, 0.6), rgba(55, 65, 81, 0.6))",
                              borderColor: buildConfig.cpu
                                ? "rgba(251, 191, 36, 0.6)"
                                : "rgba(75, 85, 99, 0.4)",
                              boxShadow: buildConfig.cpu
                                ? "0 4px 15px rgba(251, 191, 36, 0.3)"
                                : "0 2px 8px rgba(0, 0, 0, 0.3)",
                            }}
                          >
                            {buildConfig.cpu && (
                              <div className="absolute inset-1 text-xs text-yellow-300 font-bold flex items-center justify-center">
                                CPU
                              </div>
                            )}
                          </div>

                          {/* CPU Cooler - Show if CPU exists */}
                          {buildConfig.cpu && (
                            <div
                              className="absolute bg-gradient-to-br from-blue-600/60 to-blue-700/60 border border-blue-400/50 rounded-full"
                              style={{
                                width: "50px",
                                height: "50px",
                                left: "75px",
                                top: "35px",
                                transform: `translateZ(12px) ${
                                  viewMode === "exploded" ? "translateY(-25px)" : "translateY(0)"
                                }`,
                                transition: "all 0.5s ease",
                                boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)",
                              }}
                            >
                              <div className="absolute inset-2 border border-blue-300/30 rounded-full animate-spin" 
                                   style={{ animationDuration: "2s" }}>
                                <div className="absolute inset-1 border-t border-blue-300/50 rounded-full" />
                              </div>
                            </div>
                          )}

                          {/* RAM Slots - Always show 4 slots */}
                          {[0, 1, 2, 3].map((slotIndex) => {
                            const hasRAM = buildConfig.memory && slotIndex < 2; // Assume 2 sticks
                            return (
                              <div
                                key={slotIndex}
                                className="absolute border rounded-sm"
                                style={{
                                  width: "12px",
                                  height: "60px",
                                  left: `${140 + slotIndex * 16}px`,
                                  top: "30px",
                                  transform: `translateZ(4px) ${
                                    viewMode === "exploded" && hasRAM 
                                      ? "translateY(-10px)" : "translateY(0)"
                                  }`,
                                  transition: "all 0.5s ease",
                                  background: hasRAM
                                    ? "linear-gradient(180deg, rgba(168, 85, 247, 0.7), rgba(126, 34, 206, 0.7))"
                                    : "linear-gradient(180deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.6))",
                                  borderColor: hasRAM
                                    ? "rgba(168, 85, 247, 0.6)"
                                    : "rgba(75, 85, 99, 0.4)",
                                  boxShadow: hasRAM
                                    ? "0 4px 12px rgba(168, 85, 247, 0.3)"
                                    : "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
                                }}
                              >
                                {hasRAM && (
                                  <div className="absolute inset-1 text-xs text-purple-300 font-bold flex items-center justify-center writing-mode-vertical">
                                    RAM
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* PCIe Slot for GPU */}
                          <div
                            className="absolute border border-slate-500/40 rounded-sm"
                            style={{
                              width: "120px",
                              height: "20px",
                              left: "40px",
                              top: "100px",
                              transform: "translateZ(2px)",
                              background: "linear-gradient(90deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))",
                              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.5)",
                            }}
                          >
                            {/* PCIe Connectors */}
                            <div className="absolute inset-y-1 left-2 right-2 flex justify-between items-center">
                              {[...Array(8)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1 h-full bg-yellow-600/60 rounded-sm"
                                />
                              ))}
                            </div>
                          </div>

                          {/* M.2 SSD Slot */}
                          <div
                            className="absolute border border-slate-500/40 rounded-sm"
                            style={{
                              width: "60px",
                              height: "8px",
                              left: "30px",
                              top: "140px",
                              transform: `translateZ(3px) ${
                                viewMode === "exploded" && buildConfig.storage 
                                  ? "translateY(-8px)" : "translateY(0)"
                              }`,
                              transition: "all 0.5s ease",
                              background: buildConfig.storage
                                ? "linear-gradient(90deg, rgba(34, 197, 94, 0.7), rgba(5, 150, 105, 0.7))"
                                : "linear-gradient(90deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.6))",
                              borderColor: buildConfig.storage
                                ? "rgba(34, 197, 94, 0.6)"
                                : "rgba(75, 85, 99, 0.4)",
                              boxShadow: buildConfig.storage
                                ? "0 2px 8px rgba(34, 197, 94, 0.3)"
                                : "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
                            }}
                          >
                            {buildConfig.storage && (
                              <div className="absolute -top-3 left-0 text-xs text-green-300 font-mono bg-green-900/50 px-1 rounded">
                                M.2
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Graphics Card - Positioned in PCIe slot */}
                        {buildConfig.gpu && (
                          <div
                            className="absolute bg-gradient-to-br from-red-600/60 to-red-700/60 border border-red-400/50 rounded-md backdrop-blur-sm"
                            style={{
                              width: "180px",
                              height: "80px",
                              left: "40px",
                              top: "180px",
                              transform: `translateZ(20px) ${
                                viewMode === "exploded"
                                  ? "translateY(-30px) scale(1.1)"
                                  : "translateY(0) scale(1)"
                              }`,
                              transition: "all 0.5s ease",
                              boxShadow: "0 8px 25px rgba(220, 38, 38, 0.4)",
                            }}
                          >
                            {/* GPU Label */}
                            <div className="absolute top-1 left-2 text-xs text-red-300 font-mono bg-red-900/50 px-1 rounded border border-red-500/30">
                              {buildConfig.gpu.brand}
                            </div>

                            {/* GPU Fans */}
                            <div className="absolute top-3 right-3 w-6 h-6 border border-red-300/50 rounded-full animate-spin"
                                 style={{ animationDuration: "1s" }}>
                              <div className="absolute inset-1 border-t border-red-300/60 rounded-full" />
                            </div>
                            <div className="absolute bottom-3 right-3 w-6 h-6 border border-red-300/50 rounded-full animate-spin"
                                 style={{ animationDuration: "1s", animationDirection: "reverse" }}>
                              <div className="absolute inset-1 border-t border-red-300/60 rounded-full" />
                            </div>

                            {/* GPU Connectors */}
                            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 space-y-1">
                              <div className="w-3 h-1 bg-yellow-500/60 rounded-sm" />
                              <div className="w-3 h-1 bg-yellow-500/60 rounded-sm" />
                            </div>
                          </div>
                        )}

                        {/* Power Supply - Bottom mounted */}
                        {buildConfig.psu && (
                          <div
                            className="absolute bg-gradient-to-br from-gray-600/60 to-gray-700/60 border border-gray-400/50 rounded-md"
                            style={{
                              width: "100px",
                              height: "60px",
                              left: "80px",
                              top: "280px",
                              transform: `translateZ(15px) ${
                                viewMode === "exploded"
                                  ? "translateY(20px) scale(1.05)"
                                  : "translateY(0) scale(1)"
                              }`,
                              transition: "all 0.5s ease",
                              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
                            }}
                          >
                            {/* PSU Label */}
                            <div className="absolute top-1 left-1 text-xs text-gray-300 font-mono bg-gray-800/60 px-1 rounded">
                              {buildConfig.psu.brand}
                            </div>

                            {/* PSU Fan */}
                            <div className="absolute bottom-2 right-2 w-8 h-8 border border-gray-300/40 rounded-full animate-spin"
                                 style={{ animationDuration: "3s" }}>
                              <div className="absolute inset-1 border-t border-gray-300/50 rounded-full" />
                              <div className="absolute inset-2 border-b border-gray-300/30 rounded-full" />
                            </div>

                            {/* Power Cables */}
                            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 space-y-1">
                              <div className="w-2 h-1 bg-black/60 rounded-sm" />
                              <div className="w-2 h-1 bg-red-500/60 rounded-sm" />
                              <div className="w-2 h-1 bg-yellow-500/60 rounded-sm" />
                            </div>
                          </div>
                        )}

                        {/* Storage Drives */}
                        {buildConfig.storage && (
                          <div
                            className="absolute bg-gradient-to-br from-slate-600/60 to-slate-700/60 border border-slate-400/50 rounded-sm"
                            style={{
                              width: "80px",
                              height: "20px",
                              left: "200px",
                              top: "280px",
                              transform: `translateZ(10px) ${
                                viewMode === "exploded"
                                  ? "translateX(20px) translateY(-10px)"
                                  : "translateX(0) translateY(0)"
                              }`,
                              transition: "all 0.5s ease",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                            }}
                          >
                            <div className="absolute top-0.5 left-1 text-xs text-slate-300 font-mono">
                              {buildConfig.storage.brand}
                            </div>
                            <div className="absolute bottom-0.5 right-1 w-2 h-1 bg-green-500/60 rounded-sm animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
                            <div className="absolute left-4 bottom-8 space-y-1">
                              <div className="w-20 h-1.5 bg-slate-700/80 border border-green-400/30 rounded-sm" />
                              <div className="w-20 h-1 bg-slate-700/60 border border-green-400/20 rounded-sm" />
                              <div className="w-20 h-1 bg-slate-700/60 border border-green-400/20 rounded-sm" />
                            </div>

                            {/* Motherboard Label */}
                            <div className="absolute bottom-2 left-2 text-xs text-green-300 font-mono opacity-80">
                              {buildConfig.motherboard.name
                                .split(" ")
                                .slice(0, 2)
                                .join(" ")}
                            </div>
                          </div>
                        )}

                        {/* CPU - Sits in motherboard socket */}
                        {buildConfig.cpu && (
                          <div
                            className="absolute bg-gradient-to-br from-blue-600/80 to-cyan-600/80 border-2 border-blue-400/70 rounded-sm backdrop-blur-sm"
                            style={{
                              width: "36px",
                              height: "36px",
                              left: "52px",
                              top: "147px",
                              transform: `translateZ(12px) ${
                                viewMode === "exploded"
                                  ? "translateY(-40px) scale(1.3)"
                                  : viewMode === "compact"
                                  ? "scale(0.95)"
                                  : "scale(1)"
                              }`,
                              transition: "all 0.5s ease",
                              boxShadow:
                                "0 6px 20px rgba(59, 130, 246, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.2)",
                            }}
                          >
                            {/* CPU Pin Grid */}
                            <div
                              className="absolute inset-1 opacity-70"
                              style={{
                                backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,0.4) 0.3px, transparent 0.3px)`,
                                backgroundSize: "3px 3px",
                              }}
                            />

                            {/* CPU Label */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-xs text-blue-100 font-bold">
                                CPU
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CPU Cooler - Mounted above CPU */}
                        {buildConfig.cooler && (
                          <div
                            className="absolute bg-gradient-to-br from-cyan-700/60 to-blue-700/60 border border-cyan-400/60 rounded-md backdrop-blur-sm"
                            style={{
                              width: "80px",
                              height: "24px",
                              left: "30px",
                              top: "100px",
                              transform: `translateZ(20px) ${
                                viewMode === "exploded"
                                  ? "translateY(-60px) scale(1.1)"
                                  : viewMode === "compact"
                                  ? "scale(0.95)"
                                  : "scale(1)"
                              }`,
                              transition: "all 0.5s ease",
                              boxShadow: "0 8px 20px rgba(6, 182, 212, 0.3)",
                            }}
                          >
                            {/* Cooler Fans */}
                            <div className="absolute top-1 left-2 w-5 h-5 border border-cyan-300/50 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 border border-cyan-200/70 rounded-full animate-spin" />
                            </div>
                            <div className="absolute top-1 right-2 w-5 h-5 border border-cyan-300/50 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 border border-cyan-200/70 rounded-full animate-spin" />
                            </div>

                            {/* Cooler Tubes */}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-cyan-400/30 rounded-full" />

                            <div className="absolute bottom-1 left-1 text-xs text-cyan-200 font-mono">
                              AIO
                            </div>
                          </div>
                        )}

                        {/* Graphics Card - Large component in PCIe slot */}
                        {buildConfig.gpu && (
                          <div
                            className="absolute bg-gradient-to-br from-purple-700/70 to-fuchsia-800/70 border border-purple-400/60 rounded-md backdrop-blur-sm"
                            style={{
                              width: "180px",
                              height: "45px",
                              left: "45px",
                              top: "320px",
                              transform: `translateZ(15px) ${
                                viewMode === "exploded"
                                  ? "translateY(40px) scale(1.1)"
                                  : viewMode === "compact"
                                  ? "scale(0.95)"
                                  : "scale(1)"
                              }`,
                              transition: "all 0.5s ease",
                              boxShadow: "0 10px 30px rgba(147, 51, 234, 0.4)",
                            }}
                          >
                            {/* GPU Fans */}
                            <div className="absolute top-1 left-3 w-7 h-7 border border-purple-300/50 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 border border-purple-200/60 rounded-full animate-spin" />
                            </div>
                            <div className="absolute top-1 left-16 w-7 h-7 border border-purple-300/50 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 border border-purple-200/60 rounded-full animate-spin" />
                            </div>
                            <div className="absolute top-1 left-28 w-7 h-7 border border-purple-300/50 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 border border-purple-200/60 rounded-full animate-spin" />
                            </div>

                            {/* GPU Heatsink */}
                            <div className="absolute right-3 top-2 bottom-2 w-8 bg-gradient-to-b from-purple-600/40 to-purple-800/40 rounded border border-purple-400/30">
                              <div className="absolute inset-1 space-y-0.5">
                                <div className="w-full h-0.5 bg-purple-300/30" />
                                <div className="w-full h-0.5 bg-purple-300/30" />
                                <div className="w-full h-0.5 bg-purple-300/30" />
                                <div className="w-full h-0.5 bg-purple-300/30" />
                              </div>
                            </div>

                            {/* GPU Branding */}
                            <div className="absolute bottom-1 right-2 text-xs text-purple-200 font-mono font-bold">
                              RTX
                            </div>
                          </div>
                        )}

                        {/* RAM Modules - In motherboard slots */}
                        {buildConfig.ram && (
                          <>
                            <div
                              className="absolute bg-gradient-to-br from-orange-600/70 to-amber-600/70 border border-orange-400/60 rounded-sm backdrop-blur-sm"
                              style={{
                                width: "14px",
                                height: "60px",
                                left: "200px",
                                top: "126px",
                                transform: `translateZ(10px) ${
                                  viewMode === "exploded"
                                    ? "translateX(30px) scale(1.1)"
                                    : viewMode === "compact"
                                    ? "scale(0.95)"
                                    : "scale(1)"
                                }`,
                                transition: "all 0.5s ease",
                                boxShadow: "0 4px 15px rgba(249, 115, 22, 0.4)",
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-orange-400/20 to-amber-400/20 rounded-sm" />
                              <div className="absolute top-1 left-1 right-1 h-1 bg-orange-300/40 rounded-sm" />
                            </div>
                            <div
                              className="absolute bg-gradient-to-br from-orange-600/70 to-amber-600/70 border border-orange-400/60 rounded-sm backdrop-blur-sm"
                              style={{
                                width: "14px",
                                height: "60px",
                                left: "220px",
                                top: "126px",
                                transform: `translateZ(10px) ${
                                  viewMode === "exploded"
                                    ? "translateX(35px) scale(1.1)"
                                    : viewMode === "compact"
                                    ? "scale(0.95)"
                                    : "scale(1)"
                                }`,
                                transition: "all 0.5s ease",
                                boxShadow: "0 4px 15px rgba(249, 115, 22, 0.4)",
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-orange-400/20 to-amber-400/20 rounded-sm" />
                              <div className="absolute top-1 left-1 right-1 h-1 bg-orange-300/40 rounded-sm" />
                            </div>
                          </>
                        )}

                        {/* M.2 SSD - On motherboard */}
                        {buildConfig.storage && (
                          <div
                            className="absolute bg-gradient-to-br from-indigo-600/80 to-blue-600/80 border border-indigo-400/70 rounded-sm backdrop-blur-sm"
                            style={{
                              width: "50px",
                              height: "8px",
                              left: "80px",
                              top: "200px",
                              transform: `translateZ(11px) ${
                                viewMode === "exploded"
                                  ? "translateY(25px) scale(1.2)"
                                  : viewMode === "compact"
                                  ? "scale(0.95)"
                                  : "scale(1)"
                              }`,
                              transition: "all 0.5s ease",
                              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/30 to-blue-400/30 rounded-sm" />
                            <div className="absolute right-1 top-0 bottom-0 w-1 bg-indigo-300/60 rounded-r-sm" />
                            <div className="absolute left-1 top-1 bottom-1 space-x-1 flex">
                              <div className="w-1 h-full bg-indigo-200/40" />
                              <div className="w-1 h-full bg-indigo-200/40" />
                            </div>
                          </div>
                        )}

                        {/* Power Supply - Bottom compartment */}
                        {buildConfig.psu && (
                          <div
                            className="absolute bg-gradient-to-br from-yellow-700/70 to-orange-700/70 border border-yellow-400/60 rounded-md backdrop-blur-sm"
                            style={{
                              width: "140px",
                              height: "35px",
                              left: "50px",
                              top: "400px",
                              transform: `translateZ(5px) ${
                                viewMode === "exploded"
                                  ? "translateY(30px) scale(1.05)"
                                  : viewMode === "compact"
                                  ? "scale(0.95)"
                                  : "scale(1)"
                              }`,
                              transition: "all 0.5s ease",
                              boxShadow: "0 8px 20px rgba(234, 179, 8, 0.4)",
                            }}
                          >
                            {/* PSU Fan */}
                            <div className="absolute top-2 left-2 w-8 h-8 border border-yellow-300/50 rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 border border-yellow-200/60 rounded-full animate-spin" />
                            </div>

                            {/* Power Cables */}
                            <div className="absolute top-2 right-3 space-y-1">
                              <div className="w-12 h-1 bg-yellow-400/50 rounded-full" />
                              <div className="w-10 h-1 bg-yellow-400/40 rounded-full" />
                              <div className="w-8 h-1 bg-yellow-400/40 rounded-full" />
                              <div className="w-6 h-1 bg-yellow-400/30 rounded-full" />
                            </div>

                            {/* PSU Label */}
                            <div className="absolute bottom-1 left-2 text-xs text-yellow-200 font-mono">
                              {buildConfig.psu.powerDraw
                                ? `${Math.abs(buildConfig.psu.powerDraw)}W`
                                : "PSU"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Grid overlay */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(56,189,248,0.5) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(56,189,248,0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: "20px 20px",
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Right Panel - Component Selection & Info */}
          <div className="space-y-6">
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
                    icon: Monitor,
                  },
                  {
                    label: "Overall",
                    value: performanceBenchmarks.overall,
                    icon: Target,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-300">{label}</span>
                      </div>
                      <span
                        className={`text-sm font-bold ${getPerformanceColor(
                          value
                        )}`}
                      >
                        {value.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${getPerformanceGradient(
                          value
                        )}`}
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

              {/* Compatibility Issues */}
              {compatibilityIssues.length > 0 && (
                <Alert className="mb-4 border-red-500/30 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    <div className="font-semibold mb-2">
                      Compatibility Issues:
                    </div>
                    {compatibilityIssues.map((issue, index) => (
                      <div key={index} className="text-sm">
                        • {issue}
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {buildValidation.warnings.length > 0 && (
                <Alert className="mb-4 border-yellow-500/30 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-300">
                    <div className="font-semibold mb-2">Warnings:</div>
                    {buildValidation.warnings.map((warning, index) => (
                      <div key={index} className="text-sm">
                        • {warning}
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Recommendations */}
              {buildValidation.recommendations.length > 0 && (
                <div>
                  <div className="text-sm text-blue-400 font-semibold mb-2">
                    Recommendations:
                  </div>
                  {buildValidation.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-gray-300 mb-1">
                      • {rec}
                    </div>
                  ))}
                </div>
              )}

              {buildValidation.isValid && (
                <div className="text-green-400 text-sm flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Your build is ready to order!
                </div>
              )}
            </Card>

            {/* Build Summary */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <h3 className="text-xl font-bold mb-4">Build Summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Price:</span>
                  <span className="text-xl font-bold text-white">
                    £{totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Power Draw:</span>
                  <span className="text-lg font-semibold text-yellow-400">
                    {totalPower}W
                  </span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between">
                  <span className="text-gray-400">Components:</span>
                  <span className="text-white">
                    {Object.values(buildConfig).filter(Boolean).length} / 8
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Component Selection */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 mt-8 p-6">
          <h2 className="text-2xl font-bold mb-6">Component Selection</h2>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white`
                      : "border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                  }
                `}
              >
                <category.icon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            ))}
          </div>

          {/* Component List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPONENT_DATABASE[selectedCategory]?.map((component) => (
              <Card
                key={component.id}
                className={`
                  p-4 cursor-pointer transition-all duration-300 
                  ${
                    buildConfig[selectedCategory as keyof BuildConfiguration]
                      ?.id === component.id
                      ? "bg-sky-500/20 border-sky-500/40"
                      : "bg-white/5 border-white/10 hover:border-sky-500/30"
                  }
                `}
                onClick={() => selectComponent(selectedCategory, component)}
              >
                <div className="text-center mb-3">
                  <div className="text-3xl mb-2">{component.image}</div>
                  <h4 className="font-semibold text-white mb-1">
                    {component.name}
                  </h4>
                  <p className="text-sm text-gray-400 mb-2">
                    {component.brand}
                  </p>
                  <div className="text-xl font-bold text-sky-400">
                    £{component.price}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Performance:</span>
                    <span
                      className={getPerformanceColor(component.performance)}
                    >
                      {component.performance}%
                    </span>
                  </div>
                  {component.powerDraw > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Power:</span>
                      <span className="text-yellow-400">
                        {component.powerDraw}W
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {component.features.slice(0, 3).map((feature, index) => (
                      <Badge
                        key={index}
                        className="bg-gray-600/30 text-gray-300 text-xs px-2 py-1"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {buildConfig[selectedCategory as keyof BuildConfiguration]
                  ?.id === component.id && (
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
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default VisualPCConfigurator;
