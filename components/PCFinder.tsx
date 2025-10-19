import { useState } from "react";
import { ChevronLeft, Sparkles, Award, Shield, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";

// Cache buster - force reload: v2024.10.19.001

interface PCFinderProps {
  setCurrentView: (page: string) => void;
  setRecommendedBuild: (build: any) => void;
}

export interface BuildConfig {
  useCase: string;
  performanceTier: string;
  budget: string;
  formFactor: string;
  aesthetic: string;
  noiseTolerance: string;
  futureProofing: string;
  deliveryUrgency: string;
}

interface BuildRecommendation {
  name: string;
  cpu: string;
  gpu: string;
  motherboard: string;
  ram: string;
  storage: string;
  psu: string;
  case: string;
  cooling: string;
  performanceBadge: string;
  price: string;
  description: string;
}

export function PCFinder({
  setCurrentView,
  setRecommendedBuild,
}: PCFinderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<Partial<BuildConfig>>({});

  const questions = [
    {
      id: "useCase",
      title: "What will you primarily use your PC for?",
      options: [
        {
          value: "Gaming",
          icon: "🎮",
          description: "AAA titles, competitive gaming, streaming",
        },
        {
          value: "Creative",
          icon: "🎨",
          description: "Video editing, 3D rendering, design work",
        },
        {
          value: "Office",
          icon: "💼",
          description: "Productivity, web browsing, office tasks",
        },
        {
          value: "Streaming",
          icon: "📹",
          description: "Content creation, live streaming, recording",
        },
        {
          value: "Mixed",
          icon: "⚡",
          description: "Gaming, work, and content creation",
        },
        {
          value: "General Use",
          icon: "🏠",
          description: "Everyday computing, browsing, light tasks",
        },
      ],
    },
    {
      id: "performanceTier",
      title: "What performance level do you need?",
      options: [
        {
          value: "Entry",
          icon: "🌱",
          description: "1080p gaming, basic tasks",
        },
        { value: "Mid", icon: "⚙️", description: "1440p gaming, multitasking" },
        {
          value: "High",
          icon: "🚀",
          description: "4K gaming, heavy workloads",
        },
        {
          value: "Ultra",
          icon: "💎",
          description: "No compromises, maximum performance",
        },
      ],
    },
    {
      id: "budget",
      title: "What's your budget?",
      options: [
        { value: "£500-£1000", icon: "💷", description: "Great value builds" },
        {
          value: "£1000-£1500",
          icon: "💰",
          description: "Sweet spot for performance",
        },
        { value: "£1500-£2500", icon: "💵", description: "High-end systems" },
        { value: "£2500+", icon: "👑", description: "Premium, no limits" },
      ],
    },
    {
      id: "formFactor",
      title: "What form factor suits you?",
      options: [
        {
          value: "Tower",
          icon: "🏢",
          description: "Full-size, maximum expandability",
        },
        {
          value: "Mini",
          icon: "📦",
          description: "Compact, space-saving design",
        },
        {
          value: "Silent",
          icon: "🔇",
          description: "Quiet operation priority",
        },
        {
          value: "RGB Showcase",
          icon: "🌈",
          description: "Glass panel, lighting",
        },
      ],
    },
    {
      id: "aesthetic",
      title: "What's your preferred aesthetic?",
      options: [
        {
          value: "Stealth",
          icon: "⚫",
          description: "Minimal, all black, no RGB",
        },
        { value: "RGB", icon: "🎨", description: "Full RGB lighting, vibrant" },
        { value: "White", icon: "⚪", description: "Clean white build" },
        {
          value: "Compact",
          icon: "📐",
          description: "Small form factor focus",
        },
        {
          value: "Industrial",
          icon: "🔩",
          description: "Exposed components, raw look",
        },
      ],
    },
    {
      id: "noiseTolerance",
      title: "How important is quiet operation?",
      options: [
        { value: "Silent", icon: "🤫", description: "Must be whisper quiet" },
        { value: "Moderate", icon: "🔉", description: "Low noise preferred" },
        {
          value: "Doesn't matter",
          icon: "🔊",
          description: "Performance over noise",
        },
      ],
    },
    {
      id: "futureProofing",
      title: "Future-proofing preferences?",
      options: [
        {
          value: "Upgrade-ready",
          icon: "🔧",
          description: "Easy to upgrade later",
        },
        {
          value: "Plug-and-play",
          icon: "🎯",
          description: "Complete now, minimal changes",
        },
        {
          value: "Minimal maintenance",
          icon: "✨",
          description: "Set and forget",
        },
      ],
    },
    {
      id: "deliveryUrgency",
      title: "When do you need it?",
      options: [
        { value: "ASAP", icon: "⚡", description: "As soon as possible" },
        {
          value: "Within 2 weeks",
          icon: "📅",
          description: "Standard timeframe",
        },
        {
          value: "Custom timeline",
          icon: "🕐",
          description: "Flexible delivery",
        },
      ],
    },
  ];

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const generateRecommendation = (): BuildRecommendation => {
    const tier = answers.performanceTier || "Mid";
    const useCase = answers.useCase || "Gaming";
    const budget = answers.budget || "£1000-£1500";

    const recommendations: Record<string, BuildRecommendation> = {
      "Entry-Gaming": {
        name: "Vortex Starter Gaming",
        cpu: "AMD Ryzen 5 5600",
        gpu: "NVIDIA RTX 4060",
        motherboard: "MSI B550 Gaming Plus (AM4 • DDR4 • ATX)",
        ram: "16GB DDR4 3200MHz",
        storage: "500GB NVMe SSD",
        psu: "550W 80+ Bronze",
        case: "NZXT H510 Flow",
        cooling: "Stock CPU Cooler",
        performanceBadge: "1080p Gaming Champion",
        price: "£749",
        description:
          "Perfect entry into PC gaming with solid 1080p performance.",
      },
      "Mid-Gaming": {
        name: "Vortex Performance Gaming",
        cpu: "AMD Ryzen 7 5700X",
        gpu: "NVIDIA RTX 4070",
        motherboard: "MSI B550 Gaming Plus (AM4 • DDR4 • ATX)",
        ram: "32GB DDR4 3600MHz",
        storage: "1TB NVMe Gen4 SSD",
        psu: "750W 80+ Gold",
        case: "Fractal Meshify 2",
        cooling: "Arctic Liquid Freezer II 240",
        performanceBadge: "1440p Ultra Gaming",
        price: "£1,349",
        description: "Exceptional 1440p performance with future-proof specs.",
      },
      "High-Gaming": {
        name: "Vortex Elite Gaming",
        cpu: "Intel Core i7-14700K",
        gpu: "NVIDIA RTX 4080",
        motherboard: "MSI Z790 Gaming Plus WiFi (LGA1700 • DDR5 • ATX)",
        ram: "32GB DDR5 6000MHz",
        storage: "2TB NVMe Gen4 SSD",
        psu: "850W 80+ Platinum",
        case: "Lian Li O11 Dynamic EVO",
        cooling: "Arctic Liquid Freezer III 360",
        performanceBadge: "4K Gaming Beast",
        price: "£2,199",
        description:
          "Dominate 4K gaming with ultra settings and high framerates.",
      },
      "Ultra-Gaming": {
        name: "Vortex Apex Gaming",
        cpu: "Intel Core i9-14900K",
        gpu: "NVIDIA RTX 4090",
        motherboard: "ASUS ROG Strix Z790-E (LGA1700 • DDR5 • ATX)",
        ram: "64GB DDR5 6400MHz",
        storage: "4TB NVMe Gen4 SSD",
        psu: "1000W 80+ Titanium",
        case: "Lian Li O11 Dynamic EVO XL",
        cooling: "Arctic Liquid Freezer III 420",
        performanceBadge: "Ultimate 4K Gaming",
        price: "£3,499",
        description: "The absolute pinnacle of gaming performance.",
      },
      "Mid-Creative": {
        name: "Vortex Creator Pro",
        cpu: "AMD Ryzen 9 7900X",
        gpu: "NVIDIA RTX 4070 Ti",
        motherboard: "ASUS TUF B650-PLUS (AM5 • DDR5 • ATX)",
        ram: "64GB DDR5 5600MHz",
        storage: "2TB NVMe Gen4 SSD + 2TB HDD",
        psu: "850W 80+ Gold",
        case: "Fractal Define 7",
        cooling: "Noctua NH-D15",
        performanceBadge: "Professional Workstation",
        price: "£2,099",
        description:
          "Optimised for video editing, 3D work, and creative tasks.",
      },
      "High-Creative": {
        name: "Vortex Studio Elite",
        cpu: "AMD Ryzen 9 7950X",
        gpu: "NVIDIA RTX 4080",
        motherboard: "ASUS ROG Strix X670E-E (AM5 • DDR5 • ATX)",
        ram: "128GB DDR5 5600MHz",
        storage: "4TB NVMe Gen4 SSD + 4TB HDD",
        psu: "1000W 80+ Platinum",
        case: "Fractal Define 7 XL",
        cooling: "Arctic Liquid Freezer III 360",
        performanceBadge: "Creative Powerhouse",
        price: "£3,299",
        description:
          "Maximum multi-core performance for professional workflows.",
      },
    };

    const key = `${tier}-${useCase}`;
    return recommendations[key] || recommendations["Mid-Gaming"];
  };

  const recommendation = generateRecommendation();
  const progress = ((currentStep + 1) / questions.length) * 100;

  const generateFounderQuote = (): string => {
    const useCase = answers.useCase || "Gaming";
    const tier = answers.performanceTier || "Mid";
    const aesthetic = answers.aesthetic || "RGB";
    const { cpu, gpu, ram } = recommendation;

    const quotes: Record<string, string[]> = {
      "Gaming-Entry": [
        `The ${gpu} is a brilliant 1080p gaming card that punches well above its weight. Combined with the ${cpu}, you're getting incredible value without compromise.`,
        `I've built dozens of systems with this ${cpu} and ${gpu} combo - it delivers smooth gameplay in every modern title at 1080p. Perfect starter build.`,
      ],
      "Gaming-Mid": [
        `This ${gpu} paired with ${ram} is the sweet spot for 1440p gaming. You'll get ultra settings with gorgeous frame rates in demanding titles like Cyberpunk 2077 and Starfield.`,
        `The ${cpu} combined with the ${gpu} gives you exceptional 1440p performance with plenty of headroom for streaming. This is what I'd build for myself.`,
      ],
      "Gaming-High": [
        `With the ${gpu} and ${cpu}, you're looking at buttery-smooth 4K gaming with ray tracing enabled. This is a serious enthusiast-grade system that won't disappoint.`,
        `I personally use a similar setup with the ${gpu} - it absolutely demolishes 4K gaming. Add in ${ram} and you're future-proofed for years to come.`,
      ],
      "Gaming-Ultra": [
        `The ${gpu} is simply the most powerful gaming GPU available. Paired with the ${cpu} and ${ram}, this is the ultimate no-compromise gaming machine.`,
        `This is flagship territory - the ${gpu} delivers uncompromising 4K performance with all the eye candy maxed out. Worth every penny for serious gamers.`,
      ],
      "Creative-Mid": [
        `For video editing and 3D work, the ${ram} combined with the ${cpu}'s multi-core prowess will slice through 4K timelines like butter. The ${gpu} accelerates renders beautifully.`,
        `This workstation spec with ${ram} is perfect for Adobe Creative Cloud and DaVinci Resolve. The ${cpu} handles background renders while you keep working.`,
      ],
      "Creative-High": [
        `With ${ram} and the ${cpu}, you've got a professional content creation beast. The ${gpu} will accelerate your renders and handle GPU-intensive effects with ease.`,
        `I spec'd similar systems for our video production clients - the ${ram} means no more waiting, and the ${cpu} keeps everything responsive even under heavy workloads.`,
      ],
      "Office-Entry": [
        `This build is perfectly tuned for productivity work - fast, reliable, and energy efficient. The ${cpu} handles multitasking effortlessly without the overkill.`,
        `Sometimes less is more. This ${cpu} setup gives you snappy performance for office work, browsing, and video calls without unnecessary expense.`,
      ],
      "Streaming-Mid": [
        `The ${cpu} has excellent encoding capabilities for streaming. Combined with ${ram}, you can game and stream simultaneously without dropping frames.`,
        `For content creators, this ${cpu} and ${gpu} combo handles OBS, multiple browser tabs, and Discord all at once. Your stream will look crisp and professional.`,
      ],
      "Mixed-High": [
        `This versatile powerhouse does it all - gaming, streaming, productivity, and content creation. The ${cpu} and ${ram} give you true multitasking capability.`,
        `With the ${gpu} and ${ram}, you can edit videos in the morning, game at 4K in the afternoon, and stream in the evening. Ultimate flexibility.`,
      ],
    };

    const aestheticAddons: Record<string, string> = {
      RGB: " Plus with full RGB lighting, it will look absolutely stunning on your desk.",
      White:
        " The clean white aesthetic will make this a gorgeous centrepiece for any setup.",
      Stealth:
        " The stealthy all-black design is pure class - minimal and professional.",
      Industrial:
        " The industrial aesthetic with exposed components gives it serious character.",
      Compact:
        " The compact form factor means serious performance without dominating your desk space.",
    };

    const key = `${useCase}-${tier}`;
    const quoteOptions = quotes[key] || quotes["Gaming-Mid"];
    const selectedQuote =
      quoteOptions[Math.floor(Math.random() * quoteOptions.length)];
    const aestheticAddon = aesthetic ? aestheticAddons[aesthetic] || "" : "";

    return `"${selectedQuote}${aestheticAddon}"`;
  };

  if (showIntro) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <Card className="glass p-12 text-center border-white/10 relative overflow-hidden rgb-glow">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-blue-500/5 to-blue-400/5"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="mb-4">Find Your Perfect PC — Built by Vortex.</h2>
              <p className="text-xl text-gray-300 mb-8">
                Answer a few quick questions. We'll recommend a build that fits
                your needs, style, and budget.
              </p>
              <Button
                onClick={() => setShowIntro(false)}
                size="lg"
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 shadow-xl shadow-cyan-400/30"
              >
                Start PC Finder
              </Button>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span>Vortex Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Lifetime Support</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm">Build Recommendation Ready</span>
            </div>
            <h2 className="mb-4">Your Perfect Build</h2>
            <p className="text-xl text-gray-400">
              Based on your preferences, we recommend:
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Build Card */}
            <div className="lg:col-span-2">
              <Card className="glass p-8 border-white/10 rgb-glow">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="mb-2">{recommendation.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full">
                        <Award className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">
                          {recommendation.performanceBadge}
                        </span>
                      </div>
                    </div>
                    {/* Platform Info Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                      >
                        {recommendation.motherboard.includes("AM4")
                          ? "AM4 Platform"
                          : recommendation.motherboard.includes("AM5")
                          ? "AM5 Platform"
                          : "LGA1700 Platform"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                      >
                        {recommendation.ram.includes("DDR5")
                          ? "DDR5 Memory"
                          : "DDR4 Memory"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-gray-500/10 text-gray-400 border-gray-500/20"
                      >
                        ATX Form Factor
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {recommendation.price}
                    </div>
                    <div className="text-sm text-gray-400">excl. VAT</div>
                  </div>
                </div>

                <p className="text-gray-300 mb-8">
                  {recommendation.description}
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    { label: "Processor", value: recommendation.cpu },
                    { label: "Graphics Card", value: recommendation.gpu },
                    { label: "Motherboard", value: recommendation.motherboard },
                    { label: "Memory", value: recommendation.ram },
                    { label: "Storage", value: recommendation.storage },
                    { label: "Power Supply", value: recommendation.psu },
                    { label: "Case", value: recommendation.case },
                    { label: "Cooling", value: recommendation.cooling },
                  ].map((spec, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 border-b border-white/5"
                    >
                      <span className="text-gray-400">{spec.label}</span>
                      <span className="text-white">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => {
                      setRecommendedBuild(answers);
                      setCurrentView("configurator");
                    }}
                    className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600"
                  >
                    Customise This Build
                  </Button>
                  <Button
                    onClick={() => {
                      // Mock save functionality
                      alert("Build saved to your account!");
                    }}
                    variant="outline"
                    className="flex-1 border-white/20"
                  >
                    Save Build
                  </Button>
                </div>
              </Card>
            </div>

            {/* Trust Badges & CTA */}
            <div className="space-y-6">
              <Card className="glass p-6 border-white/10 rgb-glow">
                <h4 className="mb-4">Why Vortex?</h4>
                <div className="space-y-4">
                  {[
                    { icon: Award, text: "Vortex Verified Components" },
                    { icon: Shield, text: "Collect & Return Eligible" },
                    { icon: Sparkles, text: "Lifetime Support Option" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="glass p-6 border-white/10 rgb-glow">
                <h4 className="mb-3">Need Expert Advice?</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Speak with our technical team to refine your build.
                </p>
                <Button variant="outline" className="w-full border-white/20">
                  Talk to a Tech
                </Button>
              </Card>

              <Card className="glass p-6 border-white/10 bg-gradient-to-br from-cyan-400/5 to-blue-500/5 rgb-glow">
                <div className="text-sm text-gray-400 mb-2">Founder's Pick</div>
                <h4 className="mb-2">Kevin's Recommendation</h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {generateFounderQuote()}
                </p>
              </Card>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={() => {
                setShowResults(false);
                setShowIntro(true);
                setCurrentStep(0);
                setAnswers({});
              }}
              variant="ghost"
            >
              Start Over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentStep];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">
              Question {currentStep + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="glass p-8 md:p-12 border-white/10 mb-8 rgb-glow">
          <h2 className="mb-8 text-center">{question.title}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {question.options.map((option: any) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.id, option.value)}
                className="glass p-6 rounded-xl border border-white/10 hover:border-blue-400/50 hover:bg-white/5 transition-all text-left group"
              >
                <div className="text-4xl mb-3">{option.icon}</div>
                <div className="text-lg mb-2 text-gray-200 group-hover:text-blue-400 transition-colors">
                  {option.value}
                </div>
                <div className="text-sm text-gray-400">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
            variant="ghost"
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button onClick={() => setShowIntro(true)} variant="ghost">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
