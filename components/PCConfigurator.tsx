import { useState, useEffect } from "react";
import {
  Cpu,
  Monitor,
  HardDrive,
  Zap,
  Box,
  Fan,
  MemoryStick,
  Award,
  Shield,
  Sparkles,
  Info,
  ChevronDown,
  Check,
  AlertTriangle,
  X,
  Headphones,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { BuildConfig } from "./PCFinderOLD";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface PCConfiguratorProps {
  initialBuild?: Partial<BuildConfig>;
  onNavigate: (page: string) => void;
  onAddToCart?: (item: {
    type: "build";
    name: string;
    components: any;
    addOns: any[];
    price: number;
  }) => void;
}

interface Component {
  name: string;
  price: number;
  specs: string;
  badge?: string;
  socket?: string;
  ramType?: string;
  formFactor?: string;
  chipset?: string;
  maxTDP?: number;
  length?: number;
}

interface BuildComponents {
  cpu: Component;
  gpu: Component;
  motherboard: Component;
  ram: Component;
  storage: Component;
  psu: Component;
  case: Component;
  cooling: Component;
}

export function PCConfigurator({
  initialBuild,
  onNavigate,
  onAddToCart,
}: PCConfiguratorProps) {
  const [selectedComponents, setSelectedComponents] = useState<BuildComponents>(
    {
      cpu: {
        name: "AMD Ryzen 7 5700X",
        price: 199,
        specs: "8 Cores, 16 Threads, 4.6GHz Boost",
        badge: "AM4",
        socket: "AM4",
        maxTDP: 65,
      },
      gpu: {
        name: "NVIDIA RTX 4070",
        price: 599,
        specs: "12GB GDDR6X, Ray Tracing",
        badge: "12GB GDDR6X",
        length: 304,
      },
      motherboard: {
        name: "MSI B550 Gaming Plus",
        price: 139,
        specs: "ATX, WiFi 6, PCIe 4.0",
        socket: "AM4",
        ramType: "DDR4",
        formFactor: "ATX",
        chipset: "B550",
        badge: "AM4 • DDR4",
      },
      ram: {
        name: "32GB DDR4 3600MHz",
        price: 89,
        specs: "Corsair Vengeance RGB",
        badge: "DDR4 3600MHz",
        ramType: "DDR4",
      },
      storage: {
        name: "1TB NVMe Gen4 SSD",
        price: 119,
        specs: "Samsung 980 Pro",
        badge: "PCIe 4.0",
      },
      psu: {
        name: "750W 80+ Gold",
        price: 99,
        specs: "Corsair RM750x, Modular",
        badge: "80+ Gold",
      },
      case: {
        name: "Fractal Meshify 2",
        price: 139,
        specs: "Tempered Glass, High Airflow",
        badge: "ATX",
        formFactor: "ATX",
      },
      cooling: {
        name: "Arctic Liquid Freezer II 240",
        price: 89,
        specs: "AIO, 240mm Radiator",
        badge: "240mm AIO",
      },
    }
  );

  const [showSchemaLogic, setShowSchemaLogic] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCompatibilityWarning, setShowCompatibilityWarning] =
    useState(false);
  const [pendingComponent, setPendingComponent] = useState<{
    component: Component;
    categoryId: string;
  } | null>(null);

  const componentOptions = {
    cpu: [
      {
        name: "AMD Ryzen 5 5600",
        price: 149,
        specs: "6 Cores, 12 Threads, 4.4GHz Boost",
        badge: "AM4",
        socket: "AM4",
        maxTDP: 65,
      },
      {
        name: "AMD Ryzen 7 5700X",
        price: 199,
        specs: "8 Cores, 16 Threads, 4.6GHz Boost",
        badge: "AM4",
        socket: "AM4",
        maxTDP: 65,
      },
      {
        name: "Intel Core i5-14600K",
        price: 289,
        specs: "14 Cores, 20 Threads, 5.3GHz Boost",
        badge: "LGA1700",
        socket: "LGA1700",
        maxTDP: 181,
      },
      {
        name: "AMD Ryzen 7 7800X3D",
        price: 399,
        specs: "8 Cores, 16 Threads, 5.0GHz, 3D V-Cache",
        badge: "AM5",
        socket: "AM5",
        maxTDP: 120,
      },
      {
        name: "Intel Core i7-14700K",
        price: 429,
        specs: "20 Cores, 28 Threads, 5.6GHz Boost",
        badge: "LGA1700",
        socket: "LGA1700",
        maxTDP: 253,
      },
      {
        name: "AMD Ryzen 9 7950X",
        price: 599,
        specs: "16 Cores, 32 Threads, 5.7GHz Boost",
        badge: "AM5",
        socket: "AM5",
        maxTDP: 170,
      },
      {
        name: "Intel Core i9-14900K",
        price: 589,
        specs: "24 Cores, 32 Threads, 6.0GHz Boost",
        badge: "LGA1700",
        socket: "LGA1700",
        maxTDP: 253,
      },
    ],
    gpu: [
      {
        name: "NVIDIA RTX 4060",
        price: 299,
        specs: "8GB GDDR6, 1080p Gaming",
        badge: "8GB GDDR6",
        length: 244,
      },
      {
        name: "AMD RX 7700 XT",
        price: 449,
        specs: "12GB GDDR6, 1440p Gaming",
        badge: "12GB RDNA 3",
        length: 267,
      },
      {
        name: "NVIDIA RTX 4070",
        price: 599,
        specs: "12GB GDDR6X, Ray Tracing",
        badge: "12GB GDDR6X",
        length: 304,
      },
      {
        name: "NVIDIA RTX 4070 Ti",
        price: 799,
        specs: "12GB GDDR6X, 4K Ready",
        badge: "12GB GDDR6X",
        length: 304,
      },
      {
        name: "NVIDIA RTX 4080",
        price: 1199,
        specs: "16GB GDDR6X, 4K Ultra",
        badge: "16GB GDDR6X",
        length: 338,
      },
      {
        name: "NVIDIA RTX 4090",
        price: 1799,
        specs: "24GB GDDR6X, Ultimate Performance",
        badge: "24GB GDDR6X",
        length: 336,
      },
    ],
    motherboard: [
      {
        name: "MSI B550 Gaming Plus",
        price: 139,
        specs: "ATX, WiFi 6, PCIe 4.0",
        socket: "AM4",
        ramType: "DDR4",
        formFactor: "ATX",
        chipset: "B550",
        badge: "AM4 • DDR4",
      },
      {
        name: "ASUS TUF B650-PLUS",
        price: 189,
        specs: "ATX, WiFi 6E, PCIe 5.0",
        socket: "AM5",
        ramType: "DDR5",
        formFactor: "ATX",
        chipset: "B650",
        badge: "AM5 • DDR5",
      },
      {
        name: "MSI Z790 Gaming Plus WiFi",
        price: 229,
        specs: "ATX, WiFi 6E, DDR5",
        socket: "LGA1700",
        ramType: "DDR5",
        formFactor: "ATX",
        chipset: "Z790",
        badge: "LGA1700 • DDR5",
      },
      {
        name: "ASUS ROG Strix X670E-E",
        price: 399,
        specs: "ATX, WiFi 6E, PCIe 5.0",
        socket: "AM5",
        ramType: "DDR5",
        formFactor: "ATX",
        chipset: "X670E",
        badge: "AM5 • DDR5",
      },
      {
        name: "GIGABYTE Z790 AORUS Elite",
        price: 279,
        specs: "ATX, WiFi 6E, PCIe 5.0",
        socket: "LGA1700",
        ramType: "DDR5",
        formFactor: "ATX",
        chipset: "Z790",
        badge: "LGA1700 • DDR5",
      },
      {
        name: "ASRock B650M-HDV",
        price: 119,
        specs: "Micro-ATX, Basic Features",
        socket: "AM5",
        ramType: "DDR5",
        formFactor: "Micro-ATX",
        chipset: "B650",
        badge: "AM5 • DDR5",
      },
      {
        name: "ASUS ROG Strix B550-I",
        price: 229,
        specs: "Mini-ITX, WiFi 6, Premium",
        socket: "AM4",
        ramType: "DDR4",
        formFactor: "Mini-ITX",
        chipset: "B550",
        badge: "AM4 • DDR4",
      },
      {
        name: "MSI MPG Z790I Edge WiFi",
        price: 299,
        specs: "Mini-ITX, WiFi 6E, Premium",
        socket: "LGA1700",
        ramType: "DDR5",
        formFactor: "Mini-ITX",
        chipset: "Z790",
        badge: "LGA1700 • DDR5",
      },
    ],
    ram: [
      {
        name: "16GB DDR4 3200MHz",
        price: 49,
        specs: "Corsair Vengeance",
        badge: "DDR4 3200MHz",
        ramType: "DDR4",
      },
      {
        name: "32GB DDR4 3600MHz",
        price: 89,
        specs: "Corsair Vengeance RGB",
        badge: "DDR4 3600MHz",
        ramType: "DDR4",
      },
      {
        name: "32GB DDR5 5600MHz",
        price: 139,
        specs: "G.Skill Trident Z5",
        badge: "DDR5 5600MHz",
        ramType: "DDR5",
      },
      {
        name: "64GB DDR5 6000MHz",
        price: 249,
        specs: "G.Skill Trident Z5 RGB",
        badge: "DDR5 6000MHz",
        ramType: "DDR5",
      },
      {
        name: "128GB DDR5 5600MHz",
        price: 449,
        specs: "Corsair Dominator Platinum",
        badge: "DDR5 5600MHz",
        ramType: "DDR5",
      },
    ],
    storage: [
      {
        name: "500GB NVMe SSD",
        price: 59,
        specs: "WD Blue SN570",
        badge: "PCIe 3.0",
      },
      {
        name: "1TB NVMe Gen4 SSD",
        price: 119,
        specs: "Samsung 980 Pro",
        badge: "PCIe 4.0",
      },
      {
        name: "2TB NVMe Gen4 SSD",
        price: 219,
        specs: "Samsung 990 Pro",
        badge: "PCIe 4.0",
      },
      {
        name: "2TB NVMe + 2TB HDD",
        price: 249,
        specs: "Best for creators",
        badge: "PCIe 4.0 + HDD",
      },
      {
        name: "4TB NVMe Gen4 SSD",
        price: 429,
        specs: "WD Black SN850X",
        badge: "PCIe 4.0",
      },
    ],
    psu: [
      {
        name: "550W 80+ Bronze",
        price: 59,
        specs: "EVGA BR, Non-Modular",
        badge: "80+ Bronze",
      },
      {
        name: "650W 80+ Gold",
        price: 89,
        specs: "Corsair RM650x, Modular",
        badge: "80+ Gold",
      },
      {
        name: "750W 80+ Gold",
        price: 99,
        specs: "Corsair RM750x, Modular",
        badge: "80+ Gold",
      },
      {
        name: "850W 80+ Platinum",
        price: 149,
        specs: "Seasonic Focus PX, Modular",
        badge: "80+ Platinum",
      },
      {
        name: "1000W 80+ Titanium",
        price: 249,
        specs: "Corsair HX1000, Modular",
        badge: "80+ Titanium",
      },
    ],
    case: [
      {
        name: "NZXT H510 Flow",
        price: 89,
        specs: "Mid Tower, Good Airflow",
        badge: "ATX",
        formFactor: "ATX",
      },
      {
        name: "Fractal Meshify 2",
        price: 139,
        specs: "Tempered Glass, High Airflow",
        badge: "ATX",
        formFactor: "ATX",
      },
      {
        name: "Lian Li O11 Dynamic EVO",
        price: 179,
        specs: "Premium, RGB Showcase",
        badge: "ATX",
        formFactor: "ATX",
      },
      {
        name: "Fractal Define 7",
        price: 169,
        specs: "Silent, Sound Dampened",
        badge: "ATX",
        formFactor: "ATX",
      },
      {
        name: "Cooler Master NR200",
        price: 99,
        specs: "Mini ITX, Compact",
        badge: "Mini-ITX",
        formFactor: "Mini-ITX",
      },
      {
        name: "Corsair 4000D Airflow",
        price: 104,
        specs: "Mid Tower, Excellent Airflow",
        badge: "ATX",
        formFactor: "ATX",
      },
      {
        name: "Lian Li O11 Dynamic Mini",
        price: 129,
        specs: "Compact, Premium Build",
        badge: "Micro-ATX",
        formFactor: "Micro-ATX",
      },
    ],
    cooling: [
      {
        name: "Stock CPU Cooler",
        price: 0,
        specs: "Included with CPU",
        badge: "Stock",
      },
      {
        name: "Noctua NH-D15",
        price: 99,
        specs: "Air Cooler, Ultra Quiet",
        badge: "Air Cooling",
      },
      {
        name: "Arctic Liquid Freezer II 240",
        price: 89,
        specs: "AIO, 240mm Radiator",
        badge: "240mm AIO",
      },
      {
        name: "Arctic Liquid Freezer III 360",
        price: 129,
        specs: "AIO, 360mm Radiator",
        badge: "360mm AIO",
      },
      {
        name: "Custom Water Loop",
        price: 499,
        specs: "Maximum Performance",
        badge: "Custom Loop",
      },
    ],
  };

  const addOns = [
    {
      name: "Silent Cooling Upgrade",
      price: 49,
      description: "Premium quiet fans and thermal paste",
    },
    {
      name: '27" 1440p 165Hz Monitor',
      price: 299,
      description: "Perfect match for your build",
    },
    {
      name: "NoFearTech Lifetime Support",
      price: 99,
      description: "Unlimited remote support for life",
    },
    {
      name: "RGB Lighting Kit",
      price: 39,
      description: "Addressable RGB strips and controller",
    },
  ];

  const [selectedAddOns, setSelectedAddOns] = useState<Set<number>>(new Set());

  const calculateTotal = () => {
    const componentsTotal = Object.values(selectedComponents).reduce(
      (sum, comp) => sum + comp.price,
      0
    );
    const addOnsTotal = Array.from(selectedAddOns).reduce(
      (sum, index) => sum + addOns[index].price,
      0
    );
    const buildFee = 99; // Assembly and testing fee
    return componentsTotal + addOnsTotal + buildFee;
  };

  const getPerformanceBadge = () => {
    const gpuName = selectedComponents.gpu.name;
    if (gpuName.includes("4090")) return "Ultimate 4K Gaming";
    if (gpuName.includes("4080")) return "4K Gaming Beast";
    if (gpuName.includes("4070")) return "1440p Ultra Gaming";
    if (gpuName.includes("4060")) return "1080p Gaming Champion";
    return "Performance Gaming";
  };

  const getKevinInsight = () => {
    const cpu = selectedComponents.cpu.name;
    const gpu = selectedComponents.gpu.name;
    const motherboard = selectedComponents.motherboard.name;
    const ram = selectedComponents.ram.name;
    const psu = selectedComponents.psu.name;
    const cooling = selectedComponents.cooling.name;
    const storage = selectedComponents.storage.name;
    const caseModel = selectedComponents.case.name;
    const total = calculateTotal();

    // Check for compatibility issues first
    const compatIssues = getCompatibilityIssues();
    if (compatIssues.length > 0) {
      const urgentFixes = [
        `Stop right there! You've got compatibility issues that need fixing immediately. Your ${selectedComponents.cpu.socket} CPU won't work with your ${selectedComponents.motherboard.socket} motherboard. This build literally cannot function - please adjust your selections.`,
        `Critical issue detected! I cannot let you proceed with incompatible components. Check the compatibility warnings above - these parts physically won't work together. Fix the socket/RAM/form factor mismatches before continuing.`,
        `Hold on - this build has fundamental compatibility problems. The components you've selected are physically incompatible. Review the warnings above and make the necessary changes. I won't let you waste money on parts that won't work together!`,
      ];
      return urgentFixes[Math.floor(Math.random() * urgentFixes.length)];
    }

    // Extract key specs
    const psuWattage = parseInt(psu.match(/(\d+)W/)?.[1] || "0");
    const ramCapacity = parseInt(ram.match(/(\d+)GB/)?.[1] || "16");
    const ramSpeed = parseInt(ram.match(/(\d+)MHz/)?.[1] || "3200");
    const isDDR5 = ram.includes("DDR5");
    const isDDR4 = ram.includes("DDR4");

    // === CRITICAL BOTTLENECK WARNINGS ===
    if (
      (gpu.includes("4090") || gpu.includes("4080")) &&
      (cpu.includes("5600") || cpu.includes("i5-14600K"))
    ) {
      const suggestions = [
        `Hold on - that ${gpu} is being seriously bottlenecked by the ${cpu}. You're leaving 20-30% performance on the table. I'd strongly recommend at least a 7800X3D or i7-14700K to let that GPU breathe properly.`,
        `I've got to be honest with you - pairing a ${gpu} with a ${cpu} is like putting a Formula 1 engine in a hatchback. Step up to at least an i7 or Ryzen 7 to actually use what you're paying for.`,
        `Been building PCs for 15 years and I cannot recommend this CPU/GPU pairing. Your ${gpu} needs a beefier processor - you'll get maybe 60% of its potential with that ${cpu}. Let's fix this before you order.`,
      ];
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    }

    // Low PSU with high-end GPU
    const totalComponentPower = gpu.includes("4090")
      ? 450
      : gpu.includes("4080")
      ? 320
      : gpu.includes("4070 Ti")
      ? 285
      : gpu.includes("4070")
      ? 200
      : 150;
    const cpuPower =
      cpu.includes("14900K") || cpu.includes("7950X")
        ? 250
        : cpu.includes("14700K") || cpu.includes("7900X")
        ? 190
        : cpu.includes("7800X3D")
        ? 120
        : 105;
    const recommendedPSU =
      Math.ceil(((totalComponentPower + cpuPower + 100) * 1.3) / 50) * 50;

    if (psuWattage < recommendedPSU - 50) {
      const warnings = [
        `Your PSU is cutting it too close for comfort. With that ${gpu} and ${cpu}, you're looking at peak draws around ${
          totalComponentPower + cpuPower
        }W. I'd strongly recommend at least ${recommendedPSU}W for stability and longevity. Don't cheap out on the PSU!`,
        `I've seen this exact combo crash under load before. ${psuWattage}W isn't enough headroom for your ${gpu} - you want at least ${recommendedPSU}W. Trust me, PSU failures aren't fun, and they can take other components with them.`,
        `Power supply is undersized here. Your ${gpu} alone can spike to ${totalComponentPower}W+ under full load, and that ${cpu} isn't shy either. Bump up to ${recommendedPSU}W minimum - you'll thank me later when your system stays stable.`,
      ];
      return warnings[Math.floor(Math.random() * warnings.length)];
    }

    // Stock cooler on high-end CPU
    if (
      (cpu.includes("14900K") ||
        cpu.includes("14700K") ||
        cpu.includes("7950X") ||
        cpu.includes("7900X")) &&
      cooling.includes("Stock")
    ) {
      return `You absolutely cannot run that ${cpu} on a stock cooler! These chips pull 200W+ and will thermal throttle instantly. You need at least a 240mm AIO or a beefy tower cooler like the Noctua NH-D15. This is non-negotiable for sustained performance.`;
    }

    // Inadequate cooling for K-series
    if (
      (cpu.includes("14900K") || cpu.includes("14700K")) &&
      (cooling.includes("Stock") || cooling === "Noctua NH-D15")
    ) {
      const coolingAdvice = [
        `That ${cpu} is an absolute beast that needs serious cooling. The ${cooling} will struggle under sustained all-core loads. I'd recommend a 360mm AIO minimum - you'll see better boost clocks and lower noise. These Intel K-series chips run hot!`,
        `Been testing the ${cpu} extensively - it demands proper cooling. Go with at least a 280mm AIO or you'll be thermal throttling in Cinebench within seconds. These chips can pull 250W+ when pushed, and you want them to!`,
      ];
      return coolingAdvice[Math.floor(Math.random() * coolingAdvice.length)];
    }

    // DDR4 with high-end modern platform
    if (
      isDDR4 &&
      (cpu.includes("7800X3D") ||
        cpu.includes("7950X") ||
        cpu.includes("7900X") ||
        cpu.includes("14700K") ||
        cpu.includes("14900K"))
    ) {
      return `Quick heads up - you've selected DDR4 RAM but modern platforms like your ${cpu} really shine with DDR5. You're leaving 10-15% performance on the table, especially in gaming. DDR5-6000 is the sweet spot for AM5 and gives you much better 1% lows.`;
    }

    // === EXCEPTIONAL PAIRINGS ===
    if (gpu.includes("4090") && cpu.includes("14900K")) {
      const praise = [
        `Now THIS is what I'm talking about! The ${gpu} with the ${cpu} is the absolute pinnacle of PC gaming. I'm running this exact combo in my personal rig - you'll be maxing out everything at 4K with DLSS 3.5 and frame generation. Pure excellence.`,
        `You've built the ultimate gaming machine. ${gpu} + ${cpu} is literally the best you can buy right now. I've benched this pairing extensively - you're looking at 120+ fps in Cyberpunk 2077 at 4K max RT. Stunning.`,
        `Exceptional choices! I just finished a build with this exact ${gpu} and ${cpu} combo for a client - they're getting 4K 144Hz in competitive titles with headroom to spare. This is enthusiast-grade hardware done right.`,
      ];
      return praise[Math.floor(Math.random() * praise.length)];
    }

    if (gpu.includes("4090") && cpu.includes("7950X") && ramCapacity >= 64) {
      const insights = [
        `This is a content creator's dream machine! The ${cpu} with its 16 cores will demolish rendering tasks, and that ${gpu} accelerates GPU compute beautifully. With ${ramCapacity}GB RAM, you can have Premiere, After Effects, and Blender all running simultaneously. I spec'd similar systems for professional studios.`,
        `Absolutely stellar workstation build. The ${cpu}'s multi-threaded performance combined with ${ramCapacity}GB and the ${gpu} will handle anything - 8K video editing, complex 3D scenes, you name it. This is professional-grade equipment.`,
      ];
      return insights[Math.floor(Math.random() * insights.length)];
    }

    if (cpu.includes("7800X3D")) {
      const x3dPraise = [
        `The 7800X3D is genuinely the best gaming CPU money can buy right now. That 96MB of 3D V-Cache gives you 15-20% higher FPS in CPU-bound games compared to other chips. Paired with your ${gpu} on that ${motherboard}, you're getting the absolute best gaming performance possible. Smart choice!`,
        `Love seeing the 7800X3D in builds! I've been recommending this chip to every serious gamer - the 3D V-Cache is game-changing for titles like Tarkov, CS2, and Warzone. That ${motherboard} is a perfect pairing. You'll notice the difference immediately, especially in 1080p and 1440p. This is THE gaming CPU.`,
        `You've picked the gaming king! The 7800X3D with that ${gpu} is what I'd build for myself. That massive L3 cache means buttery-smooth frame times and exceptional 1% lows. The ${motherboard} gives you all the features you need without overspending. Brilliant combination!`,
      ];
      return x3dPraise[Math.floor(Math.random() * x3dPraise.length)];
    }

    if (
      gpu.includes("4080") &&
      (cpu.includes("14700K") ||
        cpu.includes("7800X3D") ||
        cpu.includes("7900X"))
    ) {
      const highEndPairs = [
        `Brilliant pairing! The ${gpu} with your ${cpu} is the sweet spot for high-end gaming. You'll be crushing 4K gaming with RT enabled in everything from Cyberpunk to Alan Wake 2. This combo hits that perfect balance of power and value at the enthusiast level.`,
        `This is exactly what I'd recommend for someone wanting uncompromised 4K gaming without going full flagship. Your ${gpu} and ${cpu} will deliver 90+ fps in demanding titles at max settings. Outstanding choices all around.`,
        `I've built dozens of systems with this ${gpu} and ${cpu} combination - it's the enthusiast sweet spot. You're getting 95% of flagship performance for notably less money. Smart building!`,
      ];
      return highEndPairs[Math.floor(Math.random() * highEndPairs.length)];
    }

    // === MOTHERBOARD-SPECIFIC INSIGHTS ===
    if (
      motherboard.includes("X670E") &&
      (cpu.includes("7950X") || cpu.includes("7900X"))
    ) {
      const premiumMobo = [
        `Excellent motherboard choice! The X670E chipset gives you full PCIe 5.0 support on both M.2 and GPU slots. With your ${cpu}, you've got a proper flagship platform. The ${motherboard} has excellent VRMs for sustained all-core workloads - perfect for that 16-core beast.`,
        `Love the X670E board with that ${cpu}! You're getting premium features, robust power delivery, and full PCIe 5.0. This platform will last you years and handle any future upgrades. The VRM quality on this board can easily handle your CPU's power demands.`,
      ];
      return premiumMobo[Math.floor(Math.random() * premiumMobo.length)];
    }

    if (
      motherboard.includes("B650") &&
      (cpu.includes("7800X3D") || cpu.includes("5700X"))
    ) {
      const valueMobo = [
        `Smart motherboard choice! The B650 chipset gives you everything you need - PCIe 4.0, DDR5 support, and solid VRMs - without the premium cost of X670. With your ${cpu}, you're not leaving any performance on the table. This is sensible, value-focused building.`,
        `Perfect pairing! That B650 board has more than enough features for your ${cpu}. You're saving money on the motherboard without sacrificing any actual performance. The VRMs can handle your CPU easily, and you've got all the connectivity you need. This is how you build smart.`,
      ];
      return valueMobo[Math.floor(Math.random() * valueMobo.length)];
    }

    if (motherboard.includes("Z790") && cpu.includes("14900K")) {
      return `Excellent platform choice! The Z790 chipset unlocks full overclocking on your ${cpu}, and the VRMs on this board can handle the 253W power draw easily. With DDR5 support and PCIe 5.0, you've got a proper enthusiast platform that'll extract every bit of performance from that flagship CPU.`;
    }

    // === RAM-SPECIFIC INSIGHTS ===
    if (isDDR5 && ramSpeed >= 6000 && cpu.includes("Ryzen")) {
      const ramInsights = [
        `Perfect RAM configuration! DDR5-${ramSpeed} is the absolute sweet spot for Ryzen 7000 series. AMD's Infinity Fabric runs optimally at 1:1 with this speed - you'll get the best possible latency and bandwidth. Your ${motherboard} will handle this speed with no issues. I always spec this exact speed for AM5 builds.`,
        `Excellent memory choice. That DDR5-${ramSpeed} syncs perfectly with your Ryzen's Infinity Fabric at a 1:1 ratio, giving you exceptional performance. Going higher can actually reduce performance, so you've nailed it. The ${motherboard} supports this perfectly.`,
      ];
      return ramInsights[Math.floor(Math.random() * ramInsights.length)];
    }

    if (ramCapacity >= 64 && gpu.includes("4070")) {
      const creatorRam = [
        `I see you're going with ${ramCapacity}GB RAM - excellent for content creation. With that ${gpu}, you've got proper GPU-accelerated rendering capability. This is a serious workstation setup that'll handle 4K timeline editing, 3D work, and simulation tasks beautifully.`,
        `${ramCapacity}GB is brilliant for creative workflows. You can keep multiple projects open, run background renders, and still have your ${gpu} handling real-time previews. This is the spec I recommend to video editors and 3D artists.`,
      ];
      return creatorRam[Math.floor(Math.random() * creatorRam.length)];
    }

    if (ramCapacity === 16 && (gpu.includes("4080") || gpu.includes("4090"))) {
      return `Quick note - you're running a flagship ${gpu} but only ${ramCapacity}GB RAM. For modern titles at 4K and content creation, I'd strongly recommend 32GB minimum. You don't want RAM to be your bottleneck with this level of GPU horsepower. Games like Starfield and Cities Skylines 2 can easily use 20GB+.`;
    }

    // === STORAGE INSIGHTS ===
    if (
      storage.includes("500GB") &&
      (gpu.includes("4080") || gpu.includes("4090") || gpu.includes("4070 Ti"))
    ) {
      return `You're building a high-end rig but only speccing 500GB storage? Modern games are huge - COD alone is 200GB+. With your ${gpu}, you'll want to install multiple AAA titles. I'd strongly recommend at least 1TB, ideally 2TB. Storage is too cheap to skimp on now.`;
    }

    if (storage.includes("4TB") && storage.includes("Gen4")) {
      const storageInsights = [
        `Love the 4TB Gen4 NVMe choice! You'll never worry about storage space, and Gen4 speeds mean lightning-fast game loads. I went with similar capacity in my personal build - being able to keep my entire Steam library installed is genuinely liberating.`,
        `That 4TB Gen4 SSD is brilliant. Direct Storage API in new games will actually leverage those Gen4 speeds, plus you've got room for years of games, projects, and media. Solid future-proofing.`,
      ];
      return storageInsights[
        Math.floor(Math.random() * storageInsights.length)
      ];
    }

    if (storage.includes("HDD")) {
      return `Smart move adding HDD storage for bulk capacity. Perfect for video footage, game recordings, and asset libraries. I always recommend the SSD for OS and active projects, HDD for archives. You've got the hybrid approach right.`;
    }

    // === COOLING EXCELLENCE ===
    if (
      cooling.includes("360") &&
      (cpu.includes("14900K") || cpu.includes("7950X"))
    ) {
      const coolingPraise = [
        `Excellent cooling solution! That 360mm AIO is exactly what your ${cpu} needs. These chips can sustain 200W+ all-core loads, and you'll keep them under 75°C even during extended Cinebench runs. You'll get maximum boost clocks and silent operation.`,
        `Perfect cooler choice. The 360mm AIO will keep that ${cpu} running cool and quiet even under sustained workloads. I've tested this exact pairing - you'll maintain full boost clocks all day long. Excellent build planning!`,
      ];
      return coolingPraise[Math.floor(Math.random() * coolingPraise.length)];
    }

    if (cooling.includes("Noctua") && caseModel.includes("Define")) {
      const silentInsights = [
        `This is going to be incredibly quiet! The Noctua NH-D15 in a Define case with sound dampening creates an almost silent workspace. I run a similar setup in my editing suite - you can barely hear it even under full load. Perfect for professional environments.`,
        `Love the silent build approach! That Noctua cooler with the Define case's sound dampening will be whisper-quiet. I've built multiple studio PCs with this exact combo - you'll forget the PC is even on. Brilliant for recording or long work sessions.`,
      ];
      return silentInsights[Math.floor(Math.random() * silentInsights.length)];
    }

    // === CASE & AESTHETIC ===
    if (caseModel.includes("O11 Dynamic") && ram.includes("RGB")) {
      const showcaseBuilds = [
        `This is going to look absolutely stunning! The O11 Dynamic with RGB RAM is a proper showcase build. Make sure you grab some RGB fans to fill out the case - it's designed to show off your hardware. This will be a centrepiece setup for sure.`,
        `Love the O11 Dynamic choice! With RGB RAM and that ${gpu}, you're building a proper show-stopper. I'd recommend adding vertical GPU mounting to really make it pop. This case was designed to showcase premium hardware like yours.`,
      ];
      return showcaseBuilds[Math.floor(Math.random() * showcaseBuilds.length)];
    }

    if (caseModel.includes("NR200") || caseModel.includes("Mini")) {
      const sffInsights = [
        `Impressive small form factor build! The ${caseModel} with your ${gpu} and ${cpu} is going to deliver full-sized performance in a tiny footprint. Make sure your PSU cables are SFF-friendly - cable management is crucial in these compact cases. Love seeing SFF builds done right!`,
        `Excellent compact build! I've done several NR200 builds and they're fantastic. Your ${gpu} and ${cpu} will fit beautifully, and the airflow is genuinely good despite the size. Perfect for space-conscious setups without compromising performance.`,
      ];
      return sffInsights[Math.floor(Math.random() * sffInsights.length)];
    }

    if (caseModel.includes("Meshify") && cooling.includes("Arctic")) {
      return `Brilliant airflow-focused build! The Meshify's mesh front with that Arctic AIO will keep everything incredibly cool. I always recommend this case for enthusiast builds - thermals will be excellent and you'll have room for upgrades. Solid choices throughout.`;
    }

    // === VALUE & MID-RANGE EXCELLENCE ===
    if (cpu.includes("5700X") && gpu.includes("4070") && ramCapacity === 32) {
      const valuePraise = [
        `This is the exact build I recommend most often! The ${cpu} with ${gpu} and 32GB RAM hits the perfect balance of performance and value. You'll get excellent 1440p ultra gaming and solid 1% lows. This is the sweet spot build - you've nailed it!`,
        `Brilliantly balanced configuration! This ${cpu} and ${gpu} pairing is what I'd build for myself if I wanted maximum 1440p performance without overspending. 32GB RAM rounds it out perfectly. You've got excellent upgrade paths too.`,
      ];
      return valuePraise[Math.floor(Math.random() * valuePraise.length)];
    }

    if (gpu.includes("7700 XT") && cpu.includes("5700X")) {
      const amdCombo = [
        `Solid AMD combo! The 7700 XT offers incredible value for 1440p gaming, and that Ryzen 5700X is a brilliant pairing. You're getting near-4070 performance for significantly less money. Smart Budget-conscious building without compromising gaming experience.`,
        `Love seeing all-AMD builds! Your 7700 XT and 5700X will deliver excellent 1440p performance with great efficiency. AMD's done really well this generation on the GPU side for value. You'll be very happy with this combination.`,
      ];
      return amdCombo[Math.floor(Math.random() * amdCombo.length)];
    }

    // === ENTRY-LEVEL OPTIMIZATION ===
    if (gpu.includes("4060") && cpu.includes("5600")) {
      const entryInsights = [
        `Solid entry-level pairing! This ${gpu} and ${cpu} will handle 1080p gaming beautifully in any title. You've got excellent upgrade paths too - drop in a better GPU or CPU down the line when you're ready. Smart way to get into PC gaming without overspending.`,
        `Perfect 1080p gaming build! That ${gpu} with the ${cpu} gives you high-refresh gaming at 1080p with room in the budget for a nice monitor and peripherals. This is exactly what I'd recommend for someone starting their PC gaming journey.`,
      ];
      return entryInsights[Math.floor(Math.random() * entryInsights.length)];
    }

    // === BALANCED BUILDS ===
    if (
      gpu.includes("4070 Ti") &&
      (cpu.includes("14600K") || cpu.includes("7900X"))
    ) {
      const balancedHighEnd = [
        `Excellent balanced high-end build! Your ${gpu} and ${cpu} will absolutely crush 1440p gaming and handle 4K well too. This is the kind of build that'll stay relevant for 4-5 years easily. You've spec'd it smart - powerful but not overkill.`,
        `Really nice component pairing here. The ${gpu} with your ${cpu} sits in that perfect spot between mid-range and flagship - you're getting 90% of top-tier performance for notably less investment. This is smart, thoughtful building.`,
      ];
      return balancedHighEnd[
        Math.floor(Math.random() * balancedHighEnd.length)
      ];
    }

    // === PSU EFFICIENCY PRAISE ===
    if (psu.includes("Titanium") || psu.includes("Platinum")) {
      return `Appreciate seeing the quality ${psu}! High-efficiency PSUs run cooler, quieter, and will save you money on electricity over their lifetime. Plus, ${
        psu.includes("Titanium") ? "Titanium" : "Platinum"
      }-rated units typically have the best components and longest warranties. Worth the investment.`;
    }

    if (psuWattage >= 850 && (gpu.includes("4070") || gpu.includes("4060"))) {
      return `You've got plenty of PSU headroom with that ${psu}! Your ${gpu} won't even stress it. This gives you excellent upgrade paths - you could drop in a 4090 down the line without changing anything else. Forward-thinking build!`;
    }

    // === BUDGET-CONSCIOUS COMMENTS ===
    if (total < 1200 && gpu.includes("4070")) {
      return `Impressive value here! You're getting a ${gpu} build for under £1,200 - that's excellent price-to-performance. You've made smart choices on components to maximize gaming performance without overspending on non-essentials. Well optimized!`;
    }

    if (total > 3000) {
      const premiumInsights = [
        `You're building a premium system here - £${Math.floor(
          total
        ).toLocaleString()} of enthusiast-grade hardware. With your ${gpu} and ${cpu}, this will be an absolute powerhouse that'll handle anything you throw at it for years. This is the kind of build that makes you excited to sit down at your desk!`,
        `This is a serious investment at £${Math.floor(
          total
        ).toLocaleString()}, but you're getting flagship performance across the board. The ${gpu} and ${cpu} represent the best available hardware - this is how you build a no-compromises system. Proper enthusiast stuff!`,
      ];
      return premiumInsights[
        Math.floor(Math.random() * premiumInsights.length)
      ];
    }

    // === GENERAL POSITIVE FEEDBACK WITH VARIETY ===
    const generalPositive = [
      `Excellent component selection! Your ${gpu} and ${cpu} are well-matched, and the supporting components make sense. This is a balanced build that'll serve you brilliantly. I'm not seeing any obvious bottlenecks or issues - you've planned this well.`,
      `Really solid build here! The ${gpu} with your ${cpu} and ${ramCapacity}GB RAM will handle your workloads beautifully. I appreciate when I see well-thought-out builds like this - everything works together cohesively.`,
      `Nice work on this configuration! Your component choices show you've done your research. The ${gpu} and ${cpu} pairing is smart, and you've got good supporting hardware. This will be a reliable, performant system.`,
      `This is a well-balanced build! I'm not seeing any glaring issues or bottlenecks. Your ${gpu} will perform excellently with that ${cpu}, and you've got adequate cooling and power. Looks good to me!`,
      `Solid choices throughout! The ${gpu} paired with your ${cpu} makes sense for the price point, and you've specced appropriate RAM and storage. This is the kind of thoughtful build I like to see - nothing wasted, nothing bottlenecked.`,
    ];

    return generalPositive[Math.floor(Math.random() * generalPositive.length)];
  };

  const toggleAddOn = (index: number) => {
    const newAddOns = new Set(selectedAddOns);
    if (newAddOns.has(index)) {
      newAddOns.delete(index);
    } else {
      newAddOns.add(index);
    }
    setSelectedAddOns(newAddOns);
  };

  // Check if current build has compatibility issues - trigger modal immediately
  useEffect(() => {
    const issues = getCompatibilityIssues();
    console.log("Compatibility check:", issues); // Debug log
    if (issues.length > 0) {
      console.log("Opening compatibility warning modal"); // Debug log
      setShowCompatibilityWarning(true);
    } else {
      setShowCompatibilityWarning(false);
    }
  }, [selectedComponents]);

  // Get detailed compatibility warning message from Kevin
  const getKevinCompatibilityWarning = (): string => {
    const issues = getCompatibilityIssues();
    if (issues.length === 0) return "";

    const cpuSocket = selectedComponents.cpu.socket;
    const moboSocket = selectedComponents.motherboard.socket;
    const ramType = selectedComponents.ram.ramType;
    const moboRamType = selectedComponents.motherboard.ramType;
    const caseFF = selectedComponents.case.formFactor;
    const moboFF = selectedComponents.motherboard.formFactor;

    // Socket mismatch - only if they're different
    if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
      const messages = [
        `Right, I need to stop you here before you make an expensive mistake. Your ${selectedComponents.cpu.name} has an ${cpuSocket} socket, but your ${selectedComponents.motherboard.name} uses ${moboSocket}. These are physically incompatible - the CPU literally won't fit in the motherboard. You need to either change to an ${cpuSocket} motherboard or pick a different ${moboSocket} CPU. This is non-negotiable - the build cannot work as configured.`,
        `Stop! Critical compatibility issue here. You've selected a ${cpuSocket} processor (${selectedComponents.cpu.name}) with a ${moboSocket} motherboard (${selectedComponents.motherboard.name}). This is like trying to fit a square peg in a round hole - it's physically impossible. I cannot let you proceed with this configuration. Please select compatible components before continuing.`,
        `I've got to intervene here - this build won't work. The ${selectedComponents.cpu.name} requires an ${cpuSocket} socket, but your ${selectedComponents.motherboard.name} has ${moboSocket}. These are completely different physical sockets and are not interchangeable. Fix this socket mismatch before going any further - I'm not letting you waste money on incompatible parts!`,
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }

    // RAM type mismatch - only if they're different
    if (ramType && moboRamType && ramType !== moboRamType) {
      const messages = [
        `Hold on - you've got a serious RAM compatibility problem here. Your ${selectedComponents.motherboard.name} only supports ${moboRamType}, but you've selected ${ramType} memory (${selectedComponents.ram.name}). These have completely different physical slots and pin configurations. The RAM will not fit in the motherboard. You need to match the RAM type to your motherboard - this isn't optional.`,
        `Red flag! Your motherboard (${selectedComponents.motherboard.name}) uses ${moboRamType} slots, but you've specced ${ramType} RAM. These are physically incompatible - different notch positions, different pin counts. The RAM sticks literally won't slot into the motherboard. Change either your RAM to ${moboRamType} or your motherboard to one that supports ${ramType}.`,
        `I need to flag a critical issue: RAM incompatibility. You've got ${ramType} (${selectedComponents.ram.name}) paired with a ${moboRamType} motherboard (${selectedComponents.motherboard.name}). These have different physical designs and cannot work together. This is a fundamental compatibility problem that must be fixed before proceeding.`,
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }

    // Form factor mismatch - only if there's an actual incompatibility
    if (
      caseFF &&
      moboFF &&
      ((moboFF === "ATX" && caseFF !== "ATX") ||
        (moboFF === "Micro-ATX" && caseFF === "Mini-ITX") ||
        (caseFF === "Mini-ITX" && moboFF !== "Mini-ITX"))
    ) {
      const messages = [
        `Form factor problem detected! Your ${moboFF} motherboard (${selectedComponents.motherboard.name}) won't physically fit in your ${caseFF} case (${selectedComponents.case.name}). The mounting holes won't line up, and the board is simply too large for the case. You need to either upsize your case or choose a smaller motherboard. This is a physical fitment issue that cannot be worked around.`,
        `Size mismatch alert! You're trying to fit a ${moboFF} board into a ${caseFF} case - this won't work. The ${selectedComponents.motherboard.name} is too large for the ${selectedComponents.case.name}. Think of it like trying to fit a large pizza box into a small bag. Either choose a compatible ${moboFF}-capable case or select a ${caseFF} motherboard.`,
        `We've got a case compatibility issue here. Your ${selectedComponents.case.name} is designed for ${caseFF} motherboards, but you've selected a ${moboFF} board (${selectedComponents.motherboard.name}). The board physically won't mount in this case. Fix this by matching your motherboard form factor to your case, or vice versa.`,
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }

    return "You have compatibility issues that need to be resolved. Please check the warnings and adjust your component selections.";
  };

  // Compatibility checking function
  const checkCompatibility = (
    component: Component,
    categoryId: string
  ): { compatible: boolean; warning?: string } => {
    // CPU-Motherboard socket compatibility
    if (categoryId === "cpu") {
      if (
        component.socket &&
        selectedComponents.motherboard.socket &&
        component.socket !== selectedComponents.motherboard.socket
      ) {
        return {
          compatible: false,
          warning: `Socket mismatch! This CPU requires ${component.socket} but your motherboard is ${selectedComponents.motherboard.socket}`,
        };
      }
    }

    if (categoryId === "motherboard") {
      if (
        component.socket &&
        selectedComponents.cpu.socket &&
        component.socket !== selectedComponents.cpu.socket
      ) {
        return {
          compatible: false,
          warning: `Socket mismatch! Your ${selectedComponents.cpu.name} requires ${selectedComponents.cpu.socket} but this motherboard is ${component.socket}`,
        };
      }
    }

    // RAM-Motherboard type compatibility
    if (categoryId === "ram") {
      if (
        component.ramType &&
        selectedComponents.motherboard.ramType &&
        component.ramType !== selectedComponents.motherboard.ramType
      ) {
        return {
          compatible: false,
          warning: `RAM type mismatch! Your motherboard supports ${selectedComponents.motherboard.ramType} only`,
        };
      }
    }

    if (categoryId === "motherboard") {
      if (
        component.ramType &&
        selectedComponents.ram.ramType &&
        component.ramType !== selectedComponents.ram.ramType
      ) {
        return {
          compatible: false,
          warning: `RAM type mismatch! Your ${selectedComponents.ram.name} is ${selectedComponents.ram.ramType} but this motherboard requires ${component.ramType}`,
        };
      }
    }

    // Motherboard-Case form factor compatibility
    if (categoryId === "motherboard") {
      const caseFF = selectedComponents.case.formFactor;
      const moboFF = component.formFactor;

      if (moboFF === "ATX" && caseFF !== "ATX") {
        return {
          compatible: false,
          warning: `Form factor issue! ATX motherboards require an ATX case. Your ${selectedComponents.case.name} won't fit this board.`,
        };
      }
      if (moboFF === "Micro-ATX" && caseFF === "Mini-ITX") {
        return {
          compatible: false,
          warning: `Form factor issue! Micro-ATX motherboards won't fit in Mini-ITX cases.`,
        };
      }
    }

    if (categoryId === "case") {
      const caseFF = component.formFactor;
      const moboFF = selectedComponents.motherboard.formFactor;

      if (caseFF === "Mini-ITX" && moboFF !== "Mini-ITX") {
        return {
          compatible: false,
          warning: `Form factor issue! This Mini-ITX case can only fit Mini-ITX motherboards. Your ${selectedComponents.motherboard.name} is ${moboFF}.`,
        };
      }
      if (caseFF === "Micro-ATX" && moboFF === "ATX") {
        return {
          compatible: false,
          warning: `Form factor issue! This Micro-ATX case cannot fit ATX motherboards. Your ${selectedComponents.motherboard.name} is too large.`,
        };
      }
    }

    return { compatible: true };
  };

  const getCompatibilityIssues = (): string[] => {
    const issues: string[] = [];

    // Check CPU-Motherboard socket
    if (
      selectedComponents.cpu.socket &&
      selectedComponents.motherboard.socket &&
      selectedComponents.cpu.socket !== selectedComponents.motherboard.socket
    ) {
      issues.push(
        `⚠️ CPU socket mismatch: ${selectedComponents.cpu.name} (${selectedComponents.cpu.socket}) doesn't match motherboard (${selectedComponents.motherboard.socket})`
      );
    }

    // Check RAM-Motherboard type
    if (
      selectedComponents.ram.ramType &&
      selectedComponents.motherboard.ramType &&
      selectedComponents.ram.ramType !== selectedComponents.motherboard.ramType
    ) {
      issues.push(
        `⚠️ RAM incompatibility: Your motherboard requires ${selectedComponents.motherboard.ramType} but you have ${selectedComponents.ram.ramType}`
      );
    }

    // Check Motherboard-Case form factor
    const caseFF = selectedComponents.case.formFactor;
    const moboFF = selectedComponents.motherboard.formFactor;

    if (moboFF === "ATX" && caseFF && caseFF !== "ATX") {
      issues.push(
        `⚠️ Form factor issue: ${moboFF} motherboard won't fit in ${caseFF} case`
      );
    }
    if (moboFF === "Micro-ATX" && caseFF === "Mini-ITX") {
      issues.push(
        `⚠️ Form factor issue: Micro-ATX motherboard too large for Mini-ITX case`
      );
    }
    if (caseFF === "Mini-ITX" && moboFF && moboFF !== "Mini-ITX") {
      issues.push(
        `⚠️ Form factor issue: Mini-ITX case requires Mini-ITX motherboard`
      );
    }

    return issues;
  };

  const categories = [
    { id: "cpu", name: "Processor", icon: Cpu },
    { id: "gpu", name: "Graphics Card", icon: Monitor },
    { id: "motherboard", name: "Motherboard", icon: Cpu },
    { id: "ram", name: "Memory", icon: MemoryStick },
    { id: "storage", name: "Storage", icon: HardDrive },
    { id: "psu", name: "Power Supply", icon: Zap },
    { id: "case", name: "Case", icon: Box },
    { id: "cooling", name: "Cooling", icon: Fan },
  ];

  return (
    <>
      {/* Compatibility Warning Modal - Rendered at top level */}
      <AlertDialog
        open={showCompatibilityWarning}
        onOpenChange={setShowCompatibilityWarning}
      >
        <AlertDialogContent className="glass border-red-500/50 bg-gray-900/95 max-w-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <AlertDialogTitle className="text-2xl text-red-400">
                Critical Compatibility Issue Detected
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="text-gray-300 text-base leading-relaxed mt-4">
                <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-sm text-gray-400 mb-2">
                    Message from Kevin, Founder:
                  </div>
                  <div className="text-gray-200 leading-relaxed">
                    {getKevinCompatibilityWarning()}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-sm text-gray-400 mb-2">
                    Issues detected:
                  </div>
                  {getCompatibilityIssues().map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm text-red-300"
                    >
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{issue.replace("⚠️ ", "")}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs text-gray-400">
                    <span className="text-blue-400 font-medium">Pro Tip:</span>{" "}
                    Use the component selection menus above to choose compatible
                    parts. Incompatible options will be greyed out with warning
                    icons to guide you toward working configurations.
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => setShowCompatibilityWarning(false)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              I Understand - Let Me Fix This
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm">PC Configurator</span>
            </div>
            <h2 className="mb-4">Build Your Dream PC</h2>
            <p className="text-xl text-gray-400">
              Customise every component to match your exact needs
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Component Selection */}
            <div className="lg:col-span-2 space-y-6">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="glass border-white/10 rgb-glow"
                >
                  <Collapsible
                    open={activeCategory === category.id}
                    onOpenChange={() =>
                      setActiveCategory(
                        activeCategory === category.id ? null : category.id
                      )
                    }
                  >
                    <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                          <category.icon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <h4>{category.name}</h4>
                            {selectedComponents[
                              category.id as keyof BuildComponents
                            ].badge && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-400/40 shadow-lg shadow-cyan-500/10"
                              >
                                {
                                  selectedComponents[
                                    category.id as keyof BuildComponents
                                  ].badge
                                }
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            {
                              selectedComponents[
                                category.id as keyof BuildComponents
                              ].name
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-blue-400">
                          £
                          {
                            selectedComponents[
                              category.id as keyof BuildComponents
                            ].price
                          }
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${
                            activeCategory === category.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-6 pb-6 space-y-3">
                        {componentOptions[
                          category.id as keyof typeof componentOptions
                        ].map((option, index) => {
                          const isSelected =
                            selectedComponents[
                              category.id as keyof BuildComponents
                            ].name === option.name;
                          return (
                            <button
                              key={index}
                              onClick={() =>
                                setSelectedComponents({
                                  ...selectedComponents,
                                  [category.id]: option,
                                })
                              }
                              className={`w-full p-4 rounded-lg border transition-all text-left ${
                                isSelected
                                  ? "border-blue-500/50 bg-blue-500/10"
                                  : "border-white/10 hover:border-white/20 hover:bg-white/5"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white">
                                      {option.name}
                                    </span>
                                    {option.badge && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-400/40 shadow-lg shadow-cyan-500/10"
                                      >
                                        {option.badge}
                                      </Badge>
                                    )}
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-blue-400" />
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {option.specs}
                                  </div>
                                </div>
                                <div className="text-blue-400 ml-4">
                                  £{option.price}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}

              {/* Add-ons */}
              <Card className="glass p-6 border-white/10 rgb-glow">
                <h4 className="mb-4">Optional Add-ons</h4>
                <div className="space-y-3">
                  {addOns.map((addon, index) => (
                    <button
                      key={index}
                      onClick={() => toggleAddOn(index)}
                      className={`w-full p-4 rounded-lg border transition-all text-left ${
                        selectedAddOns.has(index)
                          ? "border-purple-500/50 bg-purple-500/10"
                          : "border-white/10 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white">{addon.name}</span>
                            {selectedAddOns.has(index) && (
                              <Check className="w-4 h-4 text-purple-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            {addon.description}
                          </div>
                        </div>
                        <div className="text-purple-400 ml-4">
                          +£{addon.price}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Live Build Summary - Sticky on desktop */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card className="glass p-6 border-white/10 rgb-glow">
                  <h4 className="mb-4">Build Summary</h4>

                  <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full mb-6">
                    <Award className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">
                      {getPerformanceBadge()}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-400">
                          {
                            selectedComponents[
                              category.id as keyof BuildComponents
                            ].name
                          }
                        </span>
                        <span className="text-cyan-400">
                          £
                          {
                            selectedComponents[
                              category.id as keyof BuildComponents
                            ].price
                          }
                        </span>
                      </div>
                    ))}
                    {Array.from(selectedAddOns).map((index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm items-center gap-2"
                      >
                        <span className="text-cyan-300">
                          {addOns[index].name}
                        </span>
                        <span className="text-cyan-300 px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20">
                          £{addOns[index].price}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Build & Test</span>
                      <span className="text-cyan-400">£99</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg text-gray-300">Total</span>
                    <span className="text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                      £{calculateTotal().toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      onClick={() =>
                        alert("Adding to cart... (Mock functionality)")
                      }
                    >
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-white/20"
                      onClick={() => alert("Build saved! (Mock functionality)")}
                    >
                      Save Build
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 group transition-all"
                      onClick={() =>
                        alert(
                          "Connecting to tech support... (Mock functionality)"
                        )
                      }
                    >
                      <Headphones className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Talk to a Tech
                      <Sparkles className="w-4 h-4 ml-2 text-purple-400 group-hover:scale-110 transition-transform" />
                    </Button>
                  </div>

                  <div className="space-y-3 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <Award className="w-3 h-3 text-blue-400" />
                      <span>Vortex Verified Components</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-purple-400" />
                      <span>Collect & Return Eligible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-pink-400" />
                      <span>2-Year Warranty Included</span>
                    </div>
                  </div>
                </Card>

                {/* Schema Transparency */}
                <Card className="glass p-6 border-white/10 rgb-glow">
                  <button
                    onClick={() => setShowSchemaLogic(!showSchemaLogic)}
                    className="w-full flex items-center justify-between mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      <h5>Why This Build?</h5>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showSchemaLogic ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {showSchemaLogic && (
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>• Balanced CPU/GPU pairing for optimal performance</p>
                      <p>• Sufficient PSU headroom for upgrades</p>
                      <p>• High airflow case matches cooling requirements</p>
                      <p>• Future-proof platform with upgrade path</p>
                    </div>
                  )}
                </Card>

                {/* Founder's Pick */}
                <Card className="glass p-6 border-white/10 bg-gradient-to-br from-purple-600/5 to-pink-600/5 rgb-glow">
                  <div className="text-xs text-gray-400 mb-2">
                    Founder's Pick
                  </div>
                  <h5 className="mb-2">Kevin's Insight</h5>
                  <p className="text-sm text-gray-300">"{getKevinInsight()}"</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
