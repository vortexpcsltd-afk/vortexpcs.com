/**
 * PC Finder Component - SPECTACULAR UNFORGETTABLE EDITION
 * The most memorable PC finder experience on the entire web
 * Features: Particle effects, 3D card interactions, confetti, gamification
 * Version: 2025-11-06-UNFORGETTABLE
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Slider } from "./ui/slider";
import {
  ArrowRight,
  ArrowLeft,
  Monitor,
  Gamepad,
  Palette,
  Briefcase,
  Code,
  Home,
  Zap,
  Wifi,
  Shield,
  Clock,
  Star,
  Settings,
  Sparkles,
  Rocket,
  Trophy,
  Target,
  TrendingUp,
  Cpu,
  MemoryStick,
  HardDriveIcon,
} from "lucide-react";
import {
  generateRecommendation,
  persistRecommendation,
  type RecommendationResult,
} from "../services/recommendation";

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
  const [recommendation, setRecommendation] =
    useState<RecommendationResult | null>(null);

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
    setRecommendation(null);
  };

  // When results are shown, compute recommendation once and persist
  useEffect(() => {
    if (showResults && !recommendation) {
      const rec = generateRecommendation({
        purpose: answers.purpose,
        budget: answers.budget,
        performance_ambition: answers.performance_ambition,
        priority_component: answers.priority_component,
        aesthetics: answers.aesthetics,
        timeline: answers.timeline,
      });
      setRecommendation(rec);
      // Persist journey for Builder hydration
      try {
        persistRecommendation(
          {
            purpose: answers.purpose,
            budget: answers.budget,
            performance_ambition: answers.performance_ambition,
            priority_component: answers.priority_component,
            aesthetics: answers.aesthetics,
            timeline: answers.timeline,
          },
          rec
        );
      } catch {
        // ignore persistence errors (e.g., SSR)
      }
    }
  }, [
    showResults,
    recommendation,
    answers.purpose,
    answers.budget,
    answers.performance_ambition,
    answers.priority_component,
    answers.aesthetics,
    answers.timeline,
  ]);

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
                        £
                        {(answers.budget || 1500) +
                          (recommendation?.fulfilment.surcharge || 0)}
                      </div>
                      {recommendation?.fulfilment.priorityFlag && (
                        <div className="mt-1 text-xs text-amber-300">
                          Includes express build surcharge
                        </div>
                      )}
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
                          {recommendation?.parts.cpu || "Latest Gen Intel/AMD"}
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
                          {recommendation?.parts.gpu || "RTX 40-Series"}
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
                          {recommendation?.parts.memory || "32GB DDR5"}
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
                          {recommendation?.parts.storage || "2TB NVMe Gen5"}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      Blazing fast storage
                    </p>
                  </div>
                </div>

                {/* Additional parts summary and fulfilment info */}
                {recommendation && (
                  <div className="grid md:grid-cols-3 gap-4 mb-8 text-sm">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                      <div className="font-semibold text-white mb-1">
                        Cooling
                      </div>
                      <div>{recommendation.parts.cooling}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                      <div className="font-semibold text-white mb-1">
                        Power Supply
                      </div>
                      <div>{recommendation.parts.psu}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                      <div className="font-semibold text-white mb-1">
                        Case Style
                      </div>
                      <div>{recommendation.parts.case}</div>
                    </div>
                  </div>
                )}

                {recommendation && recommendation.notes.length > 0 && (
                  <div className="mb-8 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-200">
                    <div className="font-semibold text-white mb-2">
                      Why this build?
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {recommendation.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Kevin's Expert Insight - Enhanced Personalized Version */}
                <div className="space-y-3 p-6 md:p-8 rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/30 backdrop-blur-sm hover:border-sky-400/40 transition-all duration-300 shadow-lg shadow-sky-500/10 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-500/50 animate-glow">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-xl mb-4">
                        Kevin's Expert Insight
                      </h3>
                      <div className="space-y-4">
                        {/* Primary use case insight */}
                        {answers.purpose === "gaming" &&
                          answers.performance_ambition === "maximum" && (
                            <>
                              <p className="text-base text-gray-300 leading-relaxed">
                                <strong className="text-white">
                                  You're not here to compromise.
                                </strong>{" "}
                                This build is engineered for absolute gaming
                                dominance. The{" "}
                                {recommendation?.parts.gpu ||
                                  "flagship RTX GPU"}{" "}
                                paired with{" "}
                                {recommendation?.parts.cpu ||
                                  "high-core-count processor"}{" "}
                                eliminates every bottleneck—you'll see 240+ FPS
                                in competitive shooters and buttery-smooth
                                ray-traced 4K in single-player masterpieces.
                              </p>
                              <p className="text-base text-gray-300 leading-relaxed">
                                The{" "}
                                {recommendation?.parts.memory ||
                                  "high-speed DDR5"}{" "}
                                ensures zero stuttering during asset streaming
                                in massive open worlds like Cyberpunk 2077 or
                                Starfield. With{" "}
                                {recommendation?.parts.storage ||
                                  "Gen5 NVMe storage"}
                                , your load times will be measured in seconds,
                                not minutes—fast travel becomes truly instant.
                              </p>
                            </>
                          )}
                        {answers.purpose === "gaming" &&
                          answers.performance_ambition !== "maximum" && (
                            <>
                              <p className="text-base text-gray-300 leading-relaxed">
                                <strong className="text-white">
                                  Smart gaming without the unnecessary expense.
                                </strong>{" "}
                                This configuration hits the sweet spot—maxed
                                settings at 1440p or high settings at 4K in
                                virtually every modern title. The{" "}
                                {recommendation?.parts.gpu || "RTX GPU"} brings
                                ray tracing and DLSS 3.5 for stunning visuals
                                without sacrificing frame rates.
                              </p>
                              <p className="text-base text-gray-300 leading-relaxed">
                                I've balanced the{" "}
                                {recommendation?.parts.cpu || "CPU"} to prevent
                                any GPU bottlenecking whilst keeping your budget
                                sensible. The{" "}
                                {recommendation?.parts.memory || "DDR5 memory"}{" "}
                                capacity means you can game with Discord,
                                Spotify, and Chrome open without a single frame
                                drop.
                              </p>
                            </>
                          )}

                        {answers.purpose === "creative" && (
                          <>
                            <p className="text-base text-gray-300 leading-relaxed">
                              <strong className="text-white">
                                Built for creators who can't afford to wait.
                              </strong>{" "}
                              The{" "}
                              {recommendation?.parts.cpu ||
                                "multi-core processor"}{" "}
                              handles 4K timeline scrubbing in DaVinci Resolve
                              like it's child's play—real-time colour grading
                              with multiple nodes applied, no proxy files
                              needed.
                            </p>
                            <p className="text-base text-gray-300 leading-relaxed">
                              Your {recommendation?.parts.gpu || "GPU"}{" "}
                              accelerates Adobe After Effects renders by 3-5x
                              compared to CPU-only systems. Combined with{" "}
                              {recommendation?.parts.memory || "generous RAM"},
                              you'll effortlessly work with 8K footage, complex
                              3D renders in Blender, or massive Photoshop files
                              with hundreds of layers. The{" "}
                              {recommendation?.parts.storage ||
                                "fast NVMe storage"}{" "}
                              means exporting a 20-minute 4K video takes
                              minutes, not hours.
                            </p>
                          </>
                        )}

                        {answers.purpose === "content_creation" && (
                          <>
                            <p className="text-base text-gray-300 leading-relaxed">
                              <strong className="text-white">
                                Stream, record, and create without compromise.
                              </strong>{" "}
                              The dedicated NVENC encoder in your{" "}
                              {recommendation?.parts.gpu || "RTX GPU"} handles
                              streaming at 1080p60 or 1440p60 with zero
                              performance impact on your game—I'm talking sub-1%
                              frame drops.
                            </p>
                            <p className="text-base text-gray-300 leading-relaxed">
                              The{" "}
                              {recommendation?.parts.cpu ||
                                "high-core processor"}{" "}
                              manages OBS, game, Discord, and browser tabs
                              simultaneously without breaking a sweat.{" "}
                              {recommendation?.parts.memory || "Plenty of RAM"}{" "}
                              ensures your recordings never stutter, even during
                              intense gameplay moments. Plus, the{" "}
                              {recommendation?.parts.storage ||
                                "fast storage solution"}{" "}
                              means you can record hours of footage without
                              worrying about write speeds causing dropped
                              frames.
                            </p>
                          </>
                        )}

                        {answers.purpose === "development" && (
                          <>
                            <p className="text-base text-gray-300 leading-relaxed">
                              <strong className="text-white">
                                Code compiles, containers, and chaos—handled.
                              </strong>{" "}
                              The{" "}
                              {recommendation?.parts.cpu || "multi-core CPU"}{" "}
                              demolishes build times—full project recompiles
                              that used to take 5 minutes now finish in under 60
                              seconds. Running multiple Docker containers? The{" "}
                              {recommendation?.parts.memory ||
                                "substantial RAM allocation"}{" "}
                              keeps everything responsive.
                            </p>
                            <p className="text-base text-gray-300 leading-relaxed">
                              Your{" "}
                              {recommendation?.parts.storage || "NVMe storage"}{" "}
                              handles massive node_modules folders and database
                              writes without slowing down your IDE. Perfect for
                              running local Kubernetes clusters, multiple VMs,
                              or heavy database operations whilst keeping 50+
                              Chrome tabs open for documentation.
                            </p>
                          </>
                        )}

                        {answers.purpose === "professional" && (
                          <>
                            <p className="text-base text-gray-300 leading-relaxed">
                              <strong className="text-white">
                                Enterprise-grade reliability for serious work.
                              </strong>{" "}
                              This workstation is built for stability under
                              sustained loads—whether you're running complex
                              simulations, financial modelling, or large dataset
                              analysis.
                            </p>
                            <p className="text-base text-gray-300 leading-relaxed">
                              The{" "}
                              {recommendation?.parts.cpu ||
                                "professional-grade CPU"}{" "}
                              and{" "}
                              {recommendation?.parts.memory ||
                                "ECC-ready memory"}{" "}
                              ensure your calculations remain accurate during
                              marathon work sessions.{" "}
                              {recommendation?.parts.storage || "Fast storage"}{" "}
                              means opening enormous Excel files, CAD drawings,
                              or databases happens instantly, not eventually.
                            </p>
                          </>
                        )}

                        {answers.purpose === "home" && (
                          <>
                            <p className="text-base text-gray-300 leading-relaxed">
                              <strong className="text-white">
                                Versatility is the name of the game.
                              </strong>{" "}
                              This balanced build handles everything you throw
                              at it—from casual gaming and photo editing to
                              browsing with 40 tabs open and managing your smart
                              home.
                            </p>
                            <p className="text-base text-gray-300 leading-relaxed">
                              The{" "}
                              {recommendation?.parts.cpu ||
                                "efficient processor"}{" "}
                              sips power during light tasks but accelerates when
                              needed.{" "}
                              {recommendation?.parts.memory || "Sufficient RAM"}{" "}
                              means seamless multitasking, and the{" "}
                              {recommendation?.parts.storage || "fast storage"}{" "}
                              keeps Windows feeling snappy for years to come.
                            </p>
                          </>
                        )}

                        {/* Priority component insight */}
                        {answers.priority_component === "gpu" && (
                          <p className="text-base text-sky-200 leading-relaxed">
                            💡{" "}
                            <em>
                              You prioritised graphics power, and it shows.
                            </em>{" "}
                            I've allocated more of your budget to the GPU—this
                            means higher resolutions, better ray tracing, and
                            longer-term relevance as games become more
                            demanding.
                          </p>
                        )}
                        {answers.priority_component === "cpu" && (
                          <p className="text-base text-sky-200 leading-relaxed">
                            💡 <em>CPU-focused builds age like fine wine.</em>{" "}
                            Your extra cores mean this system stays relevant for
                            5+ years, handling future software that hasn't even
                            been written yet.
                          </p>
                        )}
                        {answers.priority_component === "memory" && (
                          <p className="text-base text-sky-200 leading-relaxed">
                            💡 <em>RAM headroom is peace of mind.</em> You'll
                            never see "low memory" warnings, even with dozens of
                            applications running. Chrome can finally have all
                            the tabs it wants.
                          </p>
                        )}
                        {answers.priority_component === "storage" && (
                          <p className="text-base text-sky-200 leading-relaxed">
                            💡 <em>Fast storage is the unsung hero.</em> Every
                            single thing you do—from boot to game load to file
                            transfer—is noticeably faster. It's the upgrade you
                            feel in every interaction.
                          </p>
                        )}

                        {/* Budget tier specific insights */}
                        {answers.budget >= 3000 && (
                          <p className="text-base text-amber-200 leading-relaxed">
                            ⭐ <strong>Premium Build Standard:</strong> At this
                            investment level, every component receives 24-hour
                            stress testing before assembly. I personally verify
                            thermal performance and run memory stability tests.
                            You're getting reliability that matters when
                            deadlines loom.
                          </p>
                        )}
                        {answers.budget >= 2000 && answers.budget < 3000 && (
                          <p className="text-base text-emerald-200 leading-relaxed">
                            ✨ <strong>Enthusiast Sweet Spot:</strong> This
                            price range is where price-to-performance peaks.
                            You're getting 90% of flagship performance at 60% of
                            the cost—the smart choice for demanding users.
                          </p>
                        )}
                        {answers.budget < 2000 && answers.budget >= 1200 && (
                          <p className="text-base text-blue-200 leading-relaxed">
                            🎯 <strong>Value Optimised:</strong> I've squeezed
                            every ounce of performance from your budget by
                            selecting components with proven reliability and
                            strong real-world benchmarks—no compromises where it
                            counts.
                          </p>
                        )}

                        {/* Aesthetics insight */}
                        {answers.aesthetics === "rgb_max" && (
                          <p className="text-base text-purple-200 leading-relaxed">
                            🌈 <strong>RGB Done Right:</strong> Your{" "}
                            {recommendation?.parts.case || "showcase case"}{" "}
                            features synchronized lighting that's controllable
                            via software—create custom profiles for different
                            moods or games. Because a beautiful PC brings joy
                            every time you look at it.
                          </p>
                        )}
                        {answers.aesthetics === "minimal" && (
                          <p className="text-base text-gray-200 leading-relaxed">
                            🖤 <strong>Stealth Performance:</strong> No flashy
                            lights, just pure capability. This build looks
                            professional in any environment whilst delivering
                            uncompromising power. Perfect for offices or
                            minimalist setups.
                          </p>
                        )}

                        {/* Timeline insight */}
                        {answers.timeline === "rush" &&
                          recommendation?.fulfilment.priorityFlag && (
                            <p className="text-base text-orange-200 leading-relaxed">
                              ⚡ <strong>Express Priority:</strong> Your build
                              jumps the queue—assembly starts within 24 hours.
                              I'll personally oversee quality control to ensure
                              speed doesn't compromise perfection. Expected
                              dispatch in 2-3 working days.
                            </p>
                          )}
                        {answers.timeline === "flexible" && (
                          <p className="text-base text-green-200 leading-relaxed">
                            🍃 <strong>Patient Perfectionism:</strong> Your
                            flexibility lets me source optimal component batches
                            and potentially save you money if prices drop during
                            your wait window. Great choice for non-urgent
                            upgrades.
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
