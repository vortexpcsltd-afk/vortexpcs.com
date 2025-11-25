import { useState, useRef, useCallback } from "react";
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
  // ...existing code...
  RotateCcw,
  Eye,
} from "lucide-react";

// Component database with sample data
const COMPONENT_DATABASE = {
  case: [
    {
      id: "case-1",
      name: "NZXT H7 Flow",
      brand: "NZXT",
      price: 139.99,
      image: "🖥️",
      performance: 85,
      powerDraw: 0,
      features: ["Tempered Glass", "RGB Ready", "Excellent Airflow"],
    },
  ],
  motherboard: [
    {
      id: "mobo-1",
      name: "MSI B550M Pro",
      brand: "MSI",
      price: 89.99,
      image: "🔌",
      performance: 80,
      powerDraw: 25,
      features: ["AMD B550", "DDR4", "PCIe 4.0"],
    },
  ],
  cpu: [
    {
      id: "cpu-1",
      name: "AMD Ryzen 5 7600X",
      brand: "AMD",
      price: 299.99,
      image: "⚡",
      performance: 90,
      powerDraw: 105,
      features: ["6 Cores", "12 Threads", "5.3GHz Boost"],
    },
  ],
  memory: [
    {
      id: "ram-1",
      name: "Corsair Vengeance 16GB",
      brand: "Corsair",
      price: 89.99,
      image: "🎰",
      performance: 85,
      powerDraw: 10,
      features: ["DDR4-3200", "16GB (2x8GB)", "RGB"],
    },
  ],
  gpu: [
    {
      id: "gpu-1",
      name: "RTX 4070 SUPER",
      brand: "NVIDIA",
      price: 599.99,
      image: "🎮",
      performance: 95,
      powerDraw: 220,
      features: ["12GB GDDR6X", "DLSS 3", "Ray Tracing"],
    },
  ],
  storage: [
    {
      id: "ssd-1",
      name: "Samsung 980 PRO 1TB",
      brand: "Samsung",
      price: 149.99,
      image: "💾",
      performance: 95,
      powerDraw: 5,
      features: ["NVMe PCIe 4.0", "1TB", "7000MB/s"],
    },
  ],
  psu: [
    {
      id: "psu-1",
      name: "Corsair RM750x",
      brand: "Corsair",
      price: 129.99,
      image: "⚡",
      performance: 90,
      powerDraw: -750,
      features: ["750W", "80+ Gold", "Modular"],
    },
  ],
  cooling: [
    {
      id: "cooler-1",
      name: "Noctua NH-D15",
      brand: "Noctua",
      price: 99.99,
      image: "❄️",
      performance: 95,
      powerDraw: 5,
      features: ["Dual Tower", "Quiet", "140mm Fans"],
    },
  ],
};

interface Component {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  performance: number;
  powerDraw: number;
  features: string[];
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

export default function VisualPCConfigurator() {
  const [buildConfig, setBuildConfig] = useState<BuildConfiguration>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("case");
  const [viewMode, setViewMode] = useState<"3d" | "exploded" | "compact">("3d");
  const [viewAngle, setViewAngle] = useState(15);
  const configuratorRef = useRef<HTMLDivElement>(null);

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
  const totalPowerDraw = Object.values(buildConfig).reduce(
    (sum, component) => sum + (component?.powerDraw || 0),
    0
  );

  const performanceBenchmarks = {
    gaming: Math.min(
      95,
      Math.max(
        0,
        (buildConfig.gpu?.performance || 0) * 0.6 +
          (buildConfig.cpu?.performance || 0) * 0.4
      )
    ),
    productivity: Math.min(
      95,
      Math.max(
        0,
        (buildConfig.cpu?.performance || 0) * 0.7 +
          (buildConfig.memory?.performance || 0) * 0.3
      )
    ),
    streaming: Math.min(
      95,
      Math.max(
        0,
        (buildConfig.cpu?.performance || 0) * 0.5 +
          (buildConfig.gpu?.performance || 0) * 0.5
      )
    ),
    overall: Math.min(
      95,
      Math.max(
        0,
        Object.values(buildConfig).reduce(
          (sum, component) => sum + (component?.performance || 0),
          0
        ) / Object.values(buildConfig).length
      )
    ),
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 80) return "text-green-400";
    if (performance >= 60) return "text-yellow-400";
    if (performance >= 40) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_50%)]" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
            Visual PC Configurator
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Build your dream PC with our interactive 3D visualisation tool
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex justify-center gap-6 mb-8">
          <Badge
            className={`px-4 py-2 ${
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
          <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 px-4 py-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overall Score: {performanceBenchmarks.overall.toFixed(0)}%
          </Badge>
          <Badge className="bg-purple-500/20 border-purple-500/40 text-purple-400 px-4 py-2">
            £{totalPrice.toLocaleString()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* 3D Visualization */}
          <div className="xl:col-span-2">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  3D PC Visualisation
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
                className="relative bg-gradient-to-br from-slate-900/50 to-slate-950/50 rounded-xl p-8 min-h-[600px] overflow-hidden"
                style={{ perspective: "1200px" }}
              >
                {/* 3D PC Build Visualization */}
                <div
                  className="relative w-full h-full transition-transform duration-700"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${viewAngle}deg) rotateX(-5deg)`,
                  }}
                >
                  {/* PC Case - Always visible as foundation */}
                  <div className="absolute inset-0 flex items-center justify-center">
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
                      {/* Case Panel */}
                      <div
                        className="absolute inset-2 bg-black/20 border border-slate-400/20 rounded backdrop-blur-sm"
                        style={{
                          boxShadow: "inset 0 0 100px rgba(0, 0, 0, 0.8)",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-800/10 to-black/40 rounded" />
                      </div>

                      {/* Case Badge */}
                      <div className="absolute top-3 left-3 bg-slate-700/80 px-2 py-1 rounded text-xs text-slate-300 font-mono border border-slate-500/30">
                        {buildConfig.case
                          ? buildConfig.case.brand
                          : "Generic Case"}
                      </div>

                      {/* Power Button */}
                      <div className="absolute top-3 right-3 w-3 h-3 bg-blue-500/60 rounded-full border border-blue-400/40 animate-pulse" />

                      {/* I/O Ports */}
                      <div className="absolute top-8 right-3 space-y-1">
                        <div className="w-4 h-1 bg-slate-600/60 rounded-sm" />
                        <div className="w-3 h-1 bg-slate-600/60 rounded-sm" />
                        <div className="w-2 h-1 bg-slate-600/60 rounded-sm" />
                      </div>

                      {/* Motherboard - Always visible as foundation */}
                      <div
                        className="absolute rounded-md backdrop-blur-sm"
                        style={{
                          width: "240px",
                          height: "180px",
                          left: "40px",
                          top: "150px",
                          transform: `translateZ(8px) ${
                            viewMode === "exploded"
                              ? "translateY(-20px)"
                              : "translateY(0)"
                          }`,
                          transition: "all 0.5s ease",
                          background: buildConfig.motherboard
                            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.6), rgba(5, 150, 105, 0.6))"
                            : "linear-gradient(135deg, rgba(75, 85, 99, 0.4), rgba(55, 65, 81, 0.4))",
                          border: buildConfig.motherboard
                            ? "1px solid rgba(34, 197, 94, 0.5)"
                            : "1px solid rgba(75, 85, 99, 0.3)",
                          boxShadow: buildConfig.motherboard
                            ? "0 4px 20px rgba(34, 197, 94, 0.2), inset 0 0 20px rgba(34, 197, 94, 0.1)"
                            : "0 4px 20px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        {/* Circuit Pattern */}
                        <div
                          className="absolute inset-2 opacity-40 rounded"
                          style={{
                            background: buildConfig.motherboard
                              ? `conic-gradient(from 0deg at 20% 20%, transparent, rgba(34, 197, 94, 0.2), transparent, rgba(34, 197, 94, 0.15), transparent)`
                              : `conic-gradient(from 0deg at 20% 20%, transparent, rgba(75, 85, 99, 0.3), transparent, rgba(75, 85, 99, 0.2), transparent)`,
                          }}
                        />

                        {/* CPU Socket */}
                        <div
                          className="absolute rounded-sm"
                          style={{
                            width: "40px",
                            height: "40px",
                            left: "80px",
                            top: "40px",
                            transform: `translateZ(4px) ${
                              viewMode === "exploded" && buildConfig.cpu
                                ? "translateY(-15px)"
                                : "translateY(0)"
                            }`,
                            transition: "all 0.5s ease",
                            background: buildConfig.cpu
                              ? "linear-gradient(135deg, rgba(251, 191, 36, 0.7), rgba(245, 158, 11, 0.7))"
                              : "linear-gradient(135deg, rgba(75, 85, 99, 0.6), rgba(55, 65, 81, 0.6))",
                            border: buildConfig.cpu
                              ? "1px solid rgba(251, 191, 36, 0.6)"
                              : "1px solid rgba(75, 85, 99, 0.4)",
                            boxShadow: buildConfig.cpu
                              ? "0 4px 15px rgba(251, 191, 36, 0.3)"
                              : "0 2px 8px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          {buildConfig.cpu && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-xs text-yellow-300 font-bold">
                                CPU
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CPU Cooler */}
                        {buildConfig.cpu && buildConfig.cooling && (
                          <div
                            className="absolute rounded-full"
                            style={{
                              width: "50px",
                              height: "50px",
                              left: "75px",
                              top: "35px",
                              transform: `translateZ(12px) ${
                                viewMode === "exploded"
                                  ? "translateY(-25px)"
                                  : "translateY(0)"
                              }`,
                              transition: "all 0.5s ease",
                              background:
                                "linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(37, 99, 235, 0.6))",
                              border: "1px solid rgba(59, 130, 246, 0.5)",
                              boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)",
                            }}
                          >
                            <div
                              className="absolute inset-2 border border-blue-300/30 rounded-full animate-spin"
                              style={{ animationDuration: "2s" }}
                            >
                              <div className="absolute inset-1 border-t border-blue-300/50 rounded-full" />
                            </div>
                          </div>
                        )}

                        {/* RAM Slots */}
                        {[0, 1, 2, 3].map((slotIndex) => {
                          const hasRAM = buildConfig.memory && slotIndex < 2;
                          return (
                            <div
                              key={slotIndex}
                              className="absolute rounded-sm"
                              style={{
                                width: "12px",
                                height: "60px",
                                left: `${140 + slotIndex * 16}px`,
                                top: "30px",
                                transform: `translateZ(4px) ${
                                  viewMode === "exploded" && hasRAM
                                    ? "translateY(-10px)"
                                    : "translateY(0)"
                                }`,
                                transition: "all 0.5s ease",
                                background: hasRAM
                                  ? "linear-gradient(180deg, rgba(168, 85, 247, 0.7), rgba(126, 34, 206, 0.7))"
                                  : "linear-gradient(180deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.6))",
                                border: hasRAM
                                  ? "1px solid rgba(168, 85, 247, 0.6)"
                                  : "1px solid rgba(75, 85, 99, 0.4)",
                                boxShadow: hasRAM
                                  ? "0 4px 12px rgba(168, 85, 247, 0.3)"
                                  : "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
                              }}
                            >
                              {hasRAM && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-xs text-purple-300 font-bold transform rotate-90">
                                    RAM
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* PCIe Slot */}
                        <div
                          className="absolute rounded-sm"
                          style={{
                            width: "120px",
                            height: "20px",
                            left: "40px",
                            top: "100px",
                            transform: "translateZ(2px)",
                            background:
                              "linear-gradient(90deg, rgba(31, 41, 55, 0.8), rgba(17, 24, 39, 0.8))",
                            border: "1px solid rgba(75, 85, 99, 0.4)",
                            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.5)",
                          }}
                        />

                        {/* M.2 Storage Slot */}
                        <div
                          className="absolute rounded-sm"
                          style={{
                            width: "60px",
                            height: "8px",
                            left: "30px",
                            top: "140px",
                            transform: `translateZ(3px) ${
                              viewMode === "exploded" && buildConfig.storage
                                ? "translateY(-8px)"
                                : "translateY(0)"
                            }`,
                            transition: "all 0.5s ease",
                            background: buildConfig.storage
                              ? "linear-gradient(90deg, rgba(34, 197, 94, 0.7), rgba(5, 150, 105, 0.7))"
                              : "linear-gradient(90deg, rgba(31, 41, 55, 0.6), rgba(17, 24, 39, 0.6))",
                            border: buildConfig.storage
                              ? "1px solid rgba(34, 197, 94, 0.6)"
                              : "1px solid rgba(75, 85, 99, 0.4)",
                            boxShadow: buildConfig.storage
                              ? "0 2px 8px rgba(34, 197, 94, 0.3)"
                              : "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
                          }}
                        />
                      </div>

                      {/* Graphics Card */}
                      {buildConfig.gpu && (
                        <div
                          className="absolute rounded-md backdrop-blur-sm"
                          style={{
                            width: "180px",
                            height: "80px",
                            left: "70px",
                            top: "240px",
                            transform: `translateZ(20px) ${
                              viewMode === "exploded"
                                ? "translateY(-30px) scale(1.1)"
                                : "translateY(0) scale(1)"
                            }`,
                            transition: "all 0.5s ease",
                            background:
                              "linear-gradient(135deg, rgba(220, 38, 38, 0.6), rgba(185, 28, 28, 0.6))",
                            border: "1px solid rgba(220, 38, 38, 0.5)",
                            boxShadow: "0 8px 25px rgba(220, 38, 38, 0.4)",
                          }}
                        >
                          <div className="absolute top-1 left-2 text-xs text-red-300 font-mono bg-red-900/50 px-1 rounded">
                            {buildConfig.gpu.brand}
                          </div>
                          {/* GPU Fans */}
                          <div
                            className="absolute top-3 right-3 w-6 h-6 border border-red-300/50 rounded-full animate-spin"
                            style={{ animationDuration: "1s" }}
                          >
                            <div className="absolute inset-1 border-t border-red-300/60 rounded-full" />
                          </div>
                          <div
                            className="absolute bottom-3 right-3 w-6 h-6 border border-red-300/50 rounded-full animate-spin"
                            style={{
                              animationDuration: "1s",
                              animationDirection: "reverse",
                            }}
                          >
                            <div className="absolute inset-1 border-t border-red-300/60 rounded-full" />
                          </div>
                        </div>
                      )}

                      {/* Power Supply */}
                      {buildConfig.psu && (
                        <div
                          className="absolute rounded-md"
                          style={{
                            width: "100px",
                            height: "60px",
                            left: "110px",
                            top: "380px",
                            transform: `translateZ(15px) ${
                              viewMode === "exploded"
                                ? "translateY(20px)"
                                : "translateY(0)"
                            }`,
                            transition: "all 0.5s ease",
                            background:
                              "linear-gradient(135deg, rgba(75, 85, 99, 0.6), rgba(55, 65, 81, 0.6))",
                            border: "1px solid rgba(75, 85, 99, 0.5)",
                            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
                          }}
                        >
                          <div className="absolute top-1 left-1 text-xs text-gray-300 font-mono bg-gray-800/60 px-1 rounded">
                            {buildConfig.psu.brand}
                          </div>
                          {/* PSU Fan */}
                          <div
                            className="absolute bottom-2 right-2 w-8 h-8 border border-gray-300/40 rounded-full animate-spin"
                            style={{ animationDuration: "3s" }}
                          >
                            <div className="absolute inset-1 border-t border-gray-300/50 rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
              </div>
            </Card>
          </div>

          {/* Sidebar with Performance & Summary */}
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
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 mt-8 p-6">
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
            {COMPONENT_DATABASE[
              selectedCategory as keyof typeof COMPONENT_DATABASE
            ]?.map((component) => (
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
