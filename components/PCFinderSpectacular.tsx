/**
 * PC Finder Component - SPECTACULAR UNFORGETTABLE EDITION
 * The most memorable PC finder experience on the entire web
 * Features: Particle effects, 3D card interactions, confetti, gamification
 * Version: 2025-11-06-UNFORGETTABLE
 */
import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Slider } from "./ui/slider";
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Monitor,
  Gamepad,
  Palette,
  Briefcase,
  Code,
  Home,
  HardDrive,
  Zap,
  Wifi,
  Shield,
  Clock,
  Star,
  Settings,
  Sparkles,
  Package,
  Rocket,
  Trophy,
  Target,
  TrendingUp,
  Cpu,
  MemoryStick,
  HardDriveIcon,
  Fan,
} from "lucide-react";
import {
  fetchPCBuilds,
  fetchCategories,
  fetchProducts,
  type PCBuild,
} from "../services/cms";

// Confetti particle component
const ConfettiParticle = ({ delay }: { delay: number }) => {
  const colors = ["#0ea5e9", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const duration = 3 + Math.random() * 2;

  return (
    <div
      className="absolute w-2 h-2 rounded-full opacity-0"
      style={{
        left: `${left}%`,
        top: "-20px",
        backgroundColor: color,
        animation: `confettiFall ${duration}s linear ${delay}s infinite`,
      }}
    />
  );
};

export function PCFinderSpectacular({
  setCurrentView,
  _setRecommendedBuild,
}: {
  setCurrentView: (view: string) => void;
  _setRecommendedBuild: (build: any) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [score, setScore] = useState(0);

  // Question flow
  const getQuestions = () => {
    const questions = [
      {
        id: "purpose",
        title: "What's Your Mission?",
        subtitle: "Choose your primary quest with this powerful machine",
        helpText:
          "Understanding how you'll use your PC helps us prioritise the right components. Gamers need powerful GPUs, creators need fast CPUs and lots of RAM, whilst professionals benefit from reliability and multitasking power.",
        emoji: "🎯",
        type: "choice",
        options: [
          {
            value: "gaming",
            label: "Epic Gaming",
            icon: Gamepad,
            description: "Dominate every battlefield, conquer every frame",
            color: "from-purple-500 to-pink-500",
          },
          {
            value: "creative",
            label: "Creative Mastery",
            icon: Palette,
            description: "Transform imagination into stunning reality",
            color: "from-orange-500 to-red-500",
          },
          {
            value: "content_creation",
            label: "Content Empire",
            icon: Wifi,
            description: "Stream, create, and captivate the world",
            color: "from-cyan-500 to-blue-500",
          },
          {
            value: "professional",
            label: "Business Power",
            icon: Briefcase,
            description: "Crush deadlines, multiply productivity",
            color: "from-emerald-500 to-teal-500",
          },
          {
            value: "development",
            label: "Code Warrior",
            icon: Code,
            description: "Build the future, one commit at a time",
            color: "from-violet-500 to-purple-500",
          },
          {
            value: "home",
            label: "Digital Hub",
            icon: Home,
            description: "Perfect balance for everyday excellence",
            color: "from-blue-500 to-indigo-500",
          },
        ],
      },
      {
        id: "budget",
        title: "Your Investment Level",
        subtitle: "Where performance meets your vision",
        helpText:
          "Your budget shapes everything. We'll maximise every pound to give you the best possible performance at your price point, balancing cutting-edge components with smart value choices.",
        emoji: "💰",
        type: "slider",
        min: 500,
        max: 5000,
        step: 100,
        defaultValue: 1500,
        formatValue: (value: number) => `£${value.toLocaleString()}`,
      },
      {
        id: "performance_ambition",
        title: "Performance Dreams",
        subtitle: "How far do you want to push the limits?",
        helpText:
          "This tells us whether you want absolute top-tier performance, great performance with better value, or maximum efficiency. There's no wrong answer—just what's right for you.",
        emoji: "🚀",
        type: "choice",
        options: [
          {
            value: "maximum",
            label: "Absolute Maximum",
            icon: Rocket,
            description: "No compromises, pure unbridled power",
            color: "from-red-500 to-orange-500",
          },
          {
            value: "high",
            label: "High Performance",
            icon: Zap,
            description: "Exceptional speed for demanding tasks",
            color: "from-yellow-500 to-orange-500",
          },
          {
            value: "balanced",
            label: "Smart Balance",
            icon: Target,
            description: "Perfect harmony of power and value",
            color: "from-green-500 to-emerald-500",
          },
          {
            value: "efficient",
            label: "Efficient Excellence",
            icon: TrendingUp,
            description: "Maximum value, minimal waste",
            color: "from-blue-500 to-cyan-500",
          },
        ],
      },
      {
        id: "priority_component",
        title: "Your Priority",
        subtitle: "What matters most in your perfect build?",
        helpText:
          "Every build needs balance, but we can prioritise one area. Tell us what's most important and we'll allocate your budget accordingly whilst keeping everything else perfectly matched.",
        emoji: "⭐",
        type: "choice",
        options: [
          {
            value: "gpu",
            label: "Graphics Powerhouse",
            icon: Monitor,
            description: "RTX performance for visuals that amaze",
            color: "from-green-500 to-emerald-500",
          },
          {
            value: "cpu",
            label: "Processing Beast",
            icon: Cpu,
            description: "Multi-core dominance for heavy workloads",
            color: "from-blue-500 to-cyan-500",
          },
          {
            value: "memory",
            label: "RAM Champion",
            icon: MemoryStick,
            description: "Massive capacity for ultimate multitasking",
            color: "from-purple-500 to-pink-500",
          },
          {
            value: "storage",
            label: "Storage King",
            icon: HardDriveIcon,
            description: "Lightning-fast Gen5 NVMe drives",
            color: "from-orange-500 to-red-500",
          },
        ],
      },
      {
        id: "aesthetics",
        title: "The Visual Experience",
        subtitle: "How should your build look and feel?",
        helpText:
          "Your PC should reflect your personality. Whether you want a stunning RGB showcase, subtle accent lighting, or pure stealth performance, we'll match the aesthetics to your style.",
        emoji: "✨",
        type: "choice",
        options: [
          {
            value: "rgb_max",
            label: "RGB Spectacle",
            icon: Sparkles,
            description: "A dazzling light show of synchronized RGB",
            color: "from-pink-500 via-purple-500 to-cyan-500",
          },
          {
            value: "rgb_moderate",
            label: "Elegant Accent",
            icon: Star,
            description: "Tasteful lighting that enhances beauty",
            color: "from-indigo-500 to-purple-500",
          },
          {
            value: "minimal",
            label: "Stealth Mode",
            icon: Shield,
            description: "Pure performance, understated elegance",
            color: "from-slate-500 to-gray-500",
          },
        ],
      },
      {
        id: "timeline",
        title: "When Do You Need It?",
        subtitle: "Your timeline is our priority",
        helpText:
          "We offer flexible delivery options. Need it fast? We'll prioritise your build. Happy to wait for the perfect component deals? We'll find you the best value. You choose what matters most.",
        emoji: "⏰",
        type: "choice",
        options: [
          {
            value: "rush",
            label: "Express Build",
            icon: Zap,
            description: "2-3 days, priority assembly (+£150)",
            color: "from-red-500 to-orange-500",
          },
          {
            value: "standard",
            label: "Standard Service",
            icon: Clock,
            description: "5 working days, premium quality",
            color: "from-blue-500 to-cyan-500",
          },
          {
            value: "flexible",
            label: "Best Value Wait",
            icon: Trophy,
            description: "Patient for optimal component deals",
            color: "from-green-500 to-emerald-500",
          },
        ],
      },
    ];

    return questions;
  };

  const questions = getQuestions();
  const currentQuestion = questions[currentStep];

  const handleAnswer = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    setQuestionHistory([...questionHistory, currentStep]);

    // Add score for engagement
    setScore(score + 100);

    // Trigger confetti on certain answers
    if (questionId === "budget" && value >= 3000) {
      triggerConfetti();
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      triggerConfetti();
      setTimeout(() => {
        setShowResults(true);
      }, 1000);
    }
  };

  const goBack = () => {
    if (questionHistory.length > 0) {
      const prevStep = questionHistory[questionHistory.length - 1];
      setQuestionHistory(questionHistory.slice(0, -1));
      setCurrentStep(prevStep);
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const restart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setQuestionHistory([]);
    setScore(0);
  };

  if (showResults) {
    return (
      <div className="min-h-screen py-12">
        {/* Victory celebration */}
        <div className="absolute inset-0 pointer-events-none">
          {showConfetti &&
            [...Array(50)].map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.02} />
            ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Epic Results Header */}
          <div className="text-center mb-12 relative">
            <h1
              className="text-5xl md:text-7xl font-black mb-6 relative bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-cyan-500 via-green-500 via-yellow-500 to-pink-500 bg-clip-text text-transparent"
              style={{
                backgroundSize: "200% auto",
                animation: "gradient 3s linear infinite",
              }}
            >
              Your Dream PC Awaits
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
              Based on your answers, we've crafted the ultimate configuration
              designed specifically for you
            </p>
          </div>

          {/* Spectacular Build Display */}
          <div className="max-w-5xl mx-auto">
            <Card className="relative overflow-hidden group bg-gradient-to-br from-slate-900/90 to-blue-950/90 border-2 border-sky-500/30 backdrop-blur-2xl shadow-2xl shadow-sky-500/20 hover:shadow-sky-500/40 transition-all duration-500">
              {/* Animated border gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>

              <div className="relative p-8 md:p-12">
                {/* Header Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <Badge className="px-6 py-2 text-sm font-bold bg-sky-600 border-sky-500 text-white">
                      Recommended Build
                    </Badge>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">
                        Starting from
                      </div>
                      <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        £{answers.budget || 1500}
                      </div>
                    </div>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-3">
                    The Ultimate{" "}
                    {answers.purpose === "gaming"
                      ? "Gaming"
                      : answers.purpose === "creative"
                      ? "Creative"
                      : "Professional"}{" "}
                    Build
                  </h2>
                  <p className="text-lg md:text-xl text-gray-400">
                    Perfectly tailored to your requirements
                  </p>
                </div>

                {/* Spec Highlights */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="group/card p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                        <Cpu className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Processor</div>
                        <div className="text-lg font-bold text-white">
                          Latest Gen Intel/AMD
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      Maximum multi-core performance
                    </p>
                  </div>

                  <div className="group/card p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20 hover:border-green-400/40 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                        <Monitor className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Graphics</div>
                        <div className="text-lg font-bold text-white">
                          RTX 40-Series
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      Ray tracing excellence
                    </p>
                  </div>

                  <div className="group/card p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500">
                        <MemoryStick className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Memory</div>
                        <div className="text-lg font-bold text-white">
                          32GB DDR5
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">Lightning-fast DDR5</p>
                  </div>

                  <div className="group/card p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-400/20 hover:border-orange-400/40 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                        <HardDriveIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Storage</div>
                        <div className="text-lg font-bold text-white">
                          2TB NVMe Gen5
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      Blazing fast storage
                    </p>
                  </div>
                </div>

                {/* Kevin's Expert Insight */}
                <div className="space-y-3 p-6 md:p-8 rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/30 backdrop-blur-sm hover:border-sky-400/40 transition-all duration-300 shadow-lg shadow-sky-500/10 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/50 animate-glow">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-xl mb-4">
                        Kevin's Expert Insight
                      </h3>
                      <div className="space-y-3">
                        {answers.purpose === "gaming" && (
                          <p className="text-base text-gray-300 leading-relaxed">
                            This flagship gaming configuration delivers
                            uncompromising performance with the latest RTX GPU
                            and high-speed DDR5 memory, creating a
                            zero-bottleneck gaming experience with instant load
                            times and seamless texture streaming even in the
                            most demanding open-world games.
                          </p>
                        )}
                        {answers.purpose === "creative" && (
                          <p className="text-base text-gray-300 leading-relaxed">
                            This professional workstation is optimised for
                            creative workflows with generous high-speed memory
                            enabling smooth 4K video editing and real-time
                            colour grading. The powerful GPU provides hardware
                            acceleration for Adobe Creative Suite, DaVinci
                            Resolve, and Blender, dramatically reducing export
                            times.
                          </p>
                        )}
                        {answers.purpose === "content_creation" && (
                          <p className="text-base text-gray-300 leading-relaxed">
                            Perfect for content creators, this streaming
                            powerhouse features the NVIDIA RTX encoder for
                            crystal-clear stream quality with minimal CPU
                            overhead. You'll maintain 1080p60 or 1440p60 streams
                            whilst playing demanding games without frame drops.
                          </p>
                        )}
                        {(answers.purpose === "professional" ||
                          answers.purpose === "development" ||
                          answers.purpose === "home") && (
                          <p className="text-base text-gray-300 leading-relaxed">
                            This balanced configuration delivers excellent
                            performance for your workload whilst maintaining
                            efficiency. The carefully selected components
                            provide reliable performance with enough capability
                            for both demanding tasks and future needs.
                          </p>
                        )}
                        {answers.budget >= 3000 && (
                          <p className="text-base text-gray-300 leading-relaxed">
                            At this premium tier, we source only flagship
                            components with proven reliability. Every part is
                            stress-tested for 24 hours before assembly to ensure
                            absolute stability under sustained workloads.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setCurrentView("pc-builder")}
                    className="flex-1 flex items-center justify-center bg-blue-900 hover:bg-blue-800 text-white font-bold text-lg py-6 rounded-xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105 transition-all duration-300 border-2 border-blue-400/30"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Customise Your Build
                  </button>
                  <Button
                    onClick={restart}
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-lg py-6 rounded-xl hover:scale-105 transition-all duration-300 font-bold"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Start Over
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main Question Interface
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 relative z-10">
        {/* Epic Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-400/30 mb-6 backdrop-blur-xl shadow-xl">
            <Rocket className="w-5 h-5 text-cyan-400 mr-2 animate-bounce" />
            <span className="text-sm font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
              AI-POWERED PERFECT MATCH SYSTEM
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span
              className="block bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-cyan-500 via-green-500 via-yellow-500 to-pink-500 bg-clip-text text-transparent"
              style={{
                backgroundSize: "200% auto",
                animation: "gradient 3s linear infinite",
              }}
            >
              Find Your
            </span>
            <span
              className="block bg-gradient-to-r from-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-purple-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent"
              style={{
                backgroundSize: "200% auto",
                animation: "gradient 3s linear infinite",
                animationDelay: "0.5s",
              }}
            >
              Perfect PC
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            {currentQuestion?.emoji} {currentQuestion?.subtitle}
          </p>
        </div>

        {/* Progress with Score */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 font-medium">
                Question {currentStep + 1} of {questions.length}
              </span>
              <Badge className="bg-purple-500/20 border-purple-400/40 text-purple-300">
                {Math.round(((currentStep + 1) / questions.length) * 100)}%
                Complete
              </Badge>
            </div>
          </div>

          <div className="relative">
            <Progress
              value={((currentStep + 1) / questions.length) * 100}
              className="h-4 bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 shadow-lg"
            />
            <div
              className="absolute top-0 left-0 h-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500 shadow-lg shadow-blue-500/50"
              style={{
                width: `${((currentStep + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="max-w-5xl mx-auto">
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 to-blue-950/90 border-2 border-sky-500/30 backdrop-blur-2xl shadow-2xl shadow-sky-500/20 p-8 md:p-12">
            {/* Question Title */}
            <div className="text-center mb-12">
              <div className="text-7xl mb-6 animate-bounce">
                {currentQuestion?.emoji}
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                {currentQuestion?.title}
              </h2>
              {currentQuestion?.helpText && (
                <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  {currentQuestion.helpText}
                </p>
              )}
            </div>

            {/* Question Options */}
            {currentQuestion?.type === "choice" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQuestion.options?.map((option: any, idx: number) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleAnswer(currentQuestion.id, option.value)
                    }
                    className="group relative p-6 md:p-8 rounded-2xl border-2 border-white/10 hover:border-sky-400/50 transition-all duration-300 text-left bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:scale-105 hover:shadow-2xl overflow-hidden"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {/* Animated gradient background on hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                    ></div>

                    <div className="relative flex items-start gap-4">
                      <div
                        className={`p-4 rounded-xl bg-gradient-to-br ${option.color} shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}
                      >
                        <option.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                          {option.label}
                        </h3>
                        <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                          {option.description}
                        </p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-sky-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Slider Question */}
            {currentQuestion?.type === "slider" && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 blur-3xl rounded-full"></div>
                    <div className="relative text-6xl md:text-7xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent px-12 py-6">
                      {currentQuestion.formatValue?.(
                        answers[currentQuestion.id] ||
                          currentQuestion.defaultValue
                      )}
                    </div>
                  </div>
                  <p className="text-lg text-gray-400">
                    Slide to set your budget range
                  </p>
                </div>

                <div className="px-8">
                  <Slider
                    value={[
                      answers[currentQuestion.id] ||
                        currentQuestion.defaultValue,
                    ]}
                    onValueChange={(value) =>
                      setAnswers({ ...answers, [currentQuestion.id]: value[0] })
                    }
                    min={currentQuestion.min}
                    max={currentQuestion.max}
                    step={currentQuestion.step}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-4 text-sm text-gray-400">
                    <span>
                      {currentQuestion.formatValue?.(currentQuestion.min || 0)}
                    </span>
                    <span>
                      {currentQuestion.formatValue?.(currentQuestion.max || 0)}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() =>
                      handleAnswer(
                        currentQuestion.id,
                        answers[currentQuestion.id] ||
                          currentQuestion.defaultValue
                      )
                    }
                    className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 text-white text-xl px-12 py-6 rounded-xl shadow-2xl shadow-green-500/50 hover:shadow-green-500/70 hover:scale-110 transition-all duration-300"
                  >
                    Continue
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Back Button */}
            {currentStep > 0 && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 hover:scale-105 transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Question
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Confetti on certain actions */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(100)].map((_, i) => (
            <ConfettiParticle key={i} delay={i * 0.01} />
          ))}
        </div>
      )}
    </div>
  );
}
