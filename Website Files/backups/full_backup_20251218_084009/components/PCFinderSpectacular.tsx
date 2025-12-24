import { pcFinderInsights } from "../utils/pcFinderInsights";
/**
 * PC Finder Component - SPECTACULAR UNFORGETTABLE EDITION
 * The most memorable PC finder experience on the entire web
 * Features: Particle effects, 3D card interactions, confetti, gamification
 * Version: 2025-11-06-UNFORGETTABLE
 */
import type { ComponentType } from "react";
import { useState, useEffect } from "react";
type Answers = {
  purpose?: string;
  budget?: number;
  performance_ambition?: string;
  priority_component?: string;
  aesthetics?: string;
  timeline?: string;
  [key: string]: string | number | undefined;
};
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Slider } from "./ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { AspectRatio } from "./ui/aspect-ratio";
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
  Eye,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Heart,
} from "lucide-react";
import { ProgressiveImage } from "./ProgressiveImage";
import {
  generateRecommendation,
  persistRecommendation,
  type RecommendationResult,
} from "../services/recommendation";
import {
  ProductCardSkeleton,
  PageHeaderSkeleton,
  GridSkeleton,
} from "./SkeletonComponents";
import { fetchPCBuilds, type PCBuild } from "../services/cms";
import { logger } from "../services/logger";

// Dark themed placeholder image
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64," +
  btoa(`
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#grad1)" />
  <rect x="20" y="20" width="360" height="260" fill="none" stroke="#334155" stroke-width="2" stroke-dasharray="10,5" rx="8" />
  <circle cx="200" cy="120" r="30" fill="#475569" opacity="0.5" />
  <rect x="170" y="90" width="60" height="60" fill="none" stroke="#64748b" stroke-width="2" rx="4" />
  <text x="200" y="180" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="16" font-weight="600">Image Coming Soon</text>
  <text x="200" y="200" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="12">High-quality product image</text>
  <text x="200" y="215" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="12">will be available via CMS</text>
</svg>
`);

// Image gallery component for products
type ImageSrc = string;

const ProductImageGallery = ({
  images,
  productName,
}: {
  images: ImageSrc[];
  productName: string;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Determine if provided images are real (exclude common placeholder URLs)
  const isPlaceholderImage = (src: unknown) => {
    if (typeof src !== "string") return true;
    const s = src.toLowerCase();
    return (
      s.includes("placeholder") ||
      s.includes("placehold.co") ||
      s.includes("dummyimage") ||
      s.includes("coming-soon") ||
      s.includes("image-coming-soon") ||
      s.startsWith("data:image/svg+xml") ||
      s.startsWith("about:blank")
    );
  };

  const filteredImages = (images ?? []).filter(
    (src) => !isPlaceholderImage(src)
  );
  const hasRealImages = filteredImages.length > 0;
  const productImages: ImageSrc[] = hasRealImages ? filteredImages : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + productImages.length) % productImages.length
    );
  };

  return (
    <>
      {/* Main product image */}
      <div
        className={`relative group ${hasRealImages ? "cursor-pointer" : ""}`}
        onClick={() => hasRealImages && setIsGalleryOpen(true)}
      >
        <AspectRatio
          ratio={16 / 10}
          className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900"
        >
          {hasRealImages ? (
            <>
              <ProgressiveImage
                src={productImages[currentImageIndex]}
                alt={productName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                aspectRatio="16/10"
                shimmer
                lazy
                srcSet={`${productImages[currentImageIndex]}?w=480 480w, ${productImages[currentImageIndex]}?w=768 768w, ${productImages[currentImageIndex]}?w=1024 1024w, ${productImages[currentImageIndex]}?w=1280 1280w`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 640px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* View Gallery Button */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Gallery
                </Button>
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Badge
                  variant="secondary"
                  className="bg-white/10 backdrop-blur-md text-white border-white/20"
                >
                  {currentImageIndex + 1} / {productImages.length}
                </Badge>
              </div>

              {/* Navigation arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </>
          ) : (
            /* Placeholder with large PC icon */
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full"></div>
                <Monitor className="w-32 h-32 text-sky-400/60 relative z-10" />
              </div>
              <p className="mt-6 text-gray-400 text-sm">
                Product images coming soon
              </p>
            </div>
          )}
        </AspectRatio>

        {/* Thumbnail strip - only show if we have real images */}
        {hasRealImages && productImages.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {productImages.slice(0, 6).map((image: ImageSrc, index: number) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentImageIndex
                    ? "border-sky-500 shadow-lg shadow-sky-500/25"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <ProgressiveImage
                  src={image}
                  alt={`${productName} view ${index + 1}`}
                  className="w-full h-full object-cover"
                  aspectRatio="4/3"
                  shimmer={false}
                  srcSet={`${image}?w=120 120w, ${image}?w=160 160w, ${image}?w=240 240w`}
                  sizes="(max-width: 640px) 80px, 64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full Gallery Modal - only show if we have real images */}
      {hasRealImages && (
        <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
          <DialogContent className="max-w-4xl bg-black/95 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
                {productName} - Gallery
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                View detailed images of this recommended PC build
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <AspectRatio
                ratio={16 / 10}
                className="overflow-hidden rounded-xl"
              >
                <ProgressiveImage
                  src={productImages[currentImageIndex]}
                  alt={productName}
                  className="w-full h-full object-cover"
                  aspectRatio="16/10"
                  shimmer
                  lazy={false}
                  srcSet={`${productImages[currentImageIndex]}?w=640 640w, ${productImages[currentImageIndex]}?w=960 960w, ${productImages[currentImageIndex]}?w=1280 1280w, ${productImages[currentImageIndex]}?w=1600 1600w`}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 960px"
                />
              </AspectRatio>

              {/* Modal Navigation */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md text-white hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Badge
                  variant="secondary"
                  className="bg-white/15 backdrop-blur-md text-white border-white/20"
                >
                  {currentImageIndex + 1} / {productImages.length}
                </Badge>
              </div>
            </div>

            {/* Gallery thumbnails */}
            <div className="grid grid-cols-6 gap-3 mt-4">
              {productImages.map((image: ImageSrc, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    index === currentImageIndex
                      ? "border-sky-500 shadow-lg shadow-sky-500/25"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <ProgressiveImage
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    aspectRatio="16/9"
                    className="w-full h-full object-cover"
                    srcSet={`${image}?w=160 160w, ${image}?w=240 240w, ${image}?w=320 320w`}
                    sizes="(max-width: 640px) 16vw, (max-width: 1024px) 10vw, 8vw"
                    shimmer
                  />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

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
  _setRecommendedBuild: (build: unknown) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [score, setScore] = useState(0);
  const [recommendation, setRecommendation] =
    useState<RecommendationResult | null>(null);
  const [cmsBuilds, setCmsBuilds] = useState<PCBuild[]>([]);
  const [_loadingBuilds, setLoadingBuilds] = useState(false);

  // Load PC builds on component mount
  useEffect(() => {
    const loadContentfulData = async () => {
      setLoadingBuilds(true);
      try {
        const builds = await fetchPCBuilds();
        setCmsBuilds(builds);
        logger.debug("Loaded Contentful builds", { count: builds.length });
      } catch (error) {
        logger.error("Failed to load Contentful data", {
          error: error instanceof Error ? error.message : String(error),
        });
        // Set empty arrays to indicate no CMS data available
        setCmsBuilds([]);
        logger.debug("ℹ️ Using fallback recommendations without CMS data");
      } finally {
        setLoadingBuilds(false);
      }
    };

    loadContentfulData();
  }, []);

  // Question flow
  const getQuestions = () => {
    const questions = [
      {
        id: "purpose",
        title: "Build Without Fear. Power Without Limits.",
        subtitle: " ",
        helpText:
          "Understanding how you'll use your PC helps us prioritise the right components. Gamers need powerful GPUs, creators need fast CPUs and lots of RAM, whilst professionals benefit from reliability and multitasking power.",
        emoji: "⚡",
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

  const handleAnswer = (questionId: string, value: string | number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    setQuestionHistory([...questionHistory, currentStep]);

    // Add score for engagement
    setScore(score + 100);

    // Trigger confetti on certain answers
    if (questionId === "budget" && typeof value === "number" && value >= 3000) {
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
    // Show loading skeleton while generating recommendation
    if (!recommendation) {
      return (
        <div className="min-h-screen py-12 bg-black">
          <div className="container mx-auto px-4">
            <PageHeaderSkeleton />
            <div className="max-w-[1300px] mx-auto space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute inset-0 animate-shimmer pointer-events-none"></div>
                <div className="p-8 md:p-12 space-y-6">
                  <div className="h-8 w-48 bg-white/10 rounded"></div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="h-6 w-32 bg-white/10 rounded"></div>
                      <div className="h-32 bg-white/10 rounded"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-6 w-40 bg-white/10 rounded"></div>
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="h-12 bg-white/10 rounded"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <div className="h-8 w-40 bg-white/10 rounded"></div>
                    <GridSkeleton
                      count={3}
                      columns={3}
                      SkeletonComponent={ProductCardSkeleton}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      );
    }

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
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-6 relative bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-cyan-500 via-green-500 via-yellow-500 to-pink-500 bg-clip-text text-transparent"
              style={{
                backgroundSize: "200% auto",
                animation: "gradient 3s linear infinite",
              }}
            >
              Your Dream PC Awaits
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 px-4">
              Based on your answers, we've crafted the ultimate configuration
              designed specifically for you
            </p>
          </div>

          {/* Spectacular Build Display */}
          <div className="max-w-[1300px] mx-auto">
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
                        {Number(answers.budget ?? 1500) +
                          Number(recommendation?.fulfilment.surcharge ?? 0)}
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

                {/* Product Image Gallery */}
                <div className="mb-8">
                  <ProductImageGallery
                    images={
                      cmsBuilds.length > 0 && cmsBuilds[0]?.images
                        ? cmsBuilds[0].images
                        : Array(6).fill(PLACEHOLDER_IMAGE)
                    }
                    productName={`The Ultimate ${
                      answers.purpose === "gaming"
                        ? "Gaming"
                        : answers.purpose === "creative"
                        ? "Creative"
                        : "Professional"
                    } Build`}
                  />
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
                  <div className="grid md:grid-cols-4 gap-4 mb-8 text-sm">
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
                    {recommendation.parts.caseFans && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                        <div className="font-semibold text-white mb-1">
                          Case Fans
                        </div>
                        <div>{recommendation.parts.caseFans}</div>
                      </div>
                    )}
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

                {/* Kevin's Expert Insight - Enhanced Personalised Version */}
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
                              {pcFinderInsights.gaming
                                .slice(0, 2)
                                .map((msg, idx) => (
                                  <p
                                    key={"gaming-max-" + idx}
                                    className="text-base text-gray-300 leading-relaxed"
                                  >
                                    {msg}
                                  </p>
                                ))}
                            </>
                          )}
                        {answers.purpose === "gaming" &&
                          answers.performance_ambition !== "maximum" && (
                            <>
                              {pcFinderInsights.gaming
                                .slice(2, 4)
                                .map((msg, idx) => (
                                  <p
                                    key={"gaming-nonmax-" + idx}
                                    className="text-base text-gray-300 leading-relaxed"
                                  >
                                    {msg}
                                  </p>
                                ))}
                            </>
                          )}

                        {answers.purpose === "creative" && (
                          <>
                            {pcFinderInsights.creative
                              .slice(0, 2)
                              .map((msg, idx) => (
                                <p
                                  key={"creative-" + idx}
                                  className="text-base text-gray-300 leading-relaxed"
                                >
                                  {msg}
                                </p>
                              ))}
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
                            {pcFinderInsights.development
                              .slice(0, 2)
                              .map((msg, idx) => (
                                <p
                                  key={"dev-" + idx}
                                  className="text-base text-gray-300 leading-relaxed"
                                >
                                  {msg}
                                </p>
                              ))}
                          </>
                        )}

                        {answers.purpose === "professional" && (
                          <>
                            {pcFinderInsights.professional
                              .slice(0, 2)
                              .map((msg, idx) => (
                                <p
                                  key={"pro-" + idx}
                                  className="text-base text-gray-300 leading-relaxed"
                                >
                                  {msg}
                                </p>
                              ))}
                          </>
                        )}

                        {answers.purpose === "home" && (
                          <>
                            {pcFinderInsights.home
                              .slice(0, 2)
                              .map((msg, idx) => (
                                <p
                                  key={"home-" + idx}
                                  className="text-base text-gray-300 leading-relaxed"
                                >
                                  {msg}
                                </p>
                              ))}
                          </>
                        )}

                        {/* Priority component insight */}
                        {answers.priority_component &&
                          pcFinderInsights.priority[
                            answers.priority_component as keyof typeof pcFinderInsights.priority
                          ] &&
                          pcFinderInsights.priority[
                            answers.priority_component as keyof typeof pcFinderInsights.priority
                          ].map((msg: string, idx: number) => (
                            <p
                              key={
                                "priority-" +
                                answers.priority_component +
                                "-" +
                                idx
                              }
                              className="text-base text-sky-200 leading-relaxed"
                            >
                              {msg}
                            </p>
                          ))}

                        {/* Budget tier specific insights */}
                        {Number(answers.budget) >= 3000 &&
                          pcFinderInsights.budget.premium &&
                          pcFinderInsights.budget.premium.map((msg, idx) => (
                            <p
                              key={"budget-premium-" + idx}
                              className="text-base text-amber-200 leading-relaxed"
                            >
                              {msg}
                            </p>
                          ))}
                        {Number(answers.budget) >= 2000 &&
                          Number(answers.budget) < 3000 &&
                          pcFinderInsights.budget.enthusiast &&
                          pcFinderInsights.budget.enthusiast.map((msg, idx) => (
                            <p
                              key={"budget-enthusiast-" + idx}
                              className="text-base text-emerald-200 leading-relaxed"
                            >
                              {msg}
                            </p>
                          ))}
                        {Number(answers.budget) < 2000 &&
                          Number(answers.budget) >= 1200 &&
                          pcFinderInsights.budget.value &&
                          pcFinderInsights.budget.value.map((msg, idx) => (
                            <p
                              key={"budget-value-" + idx}
                              className="text-base text-blue-200 leading-relaxed"
                            >
                              {msg}
                            </p>
                          ))}

                        {/* Aesthetics insight */}
                        {answers.aesthetics &&
                          pcFinderInsights.aesthetics[
                            answers.aesthetics as keyof typeof pcFinderInsights.aesthetics
                          ] &&
                          pcFinderInsights.aesthetics[
                            answers.aesthetics as keyof typeof pcFinderInsights.aesthetics
                          ].map((msg: string, idx: number) => (
                            <p
                              key={
                                "aesthetics-" + answers.aesthetics + "-" + idx
                              }
                              className={
                                answers.aesthetics === "rgb_max"
                                  ? "text-base text-purple-200 leading-relaxed"
                                  : "text-base text-gray-200 leading-relaxed"
                              }
                            >
                              {msg}
                            </p>
                          ))}

                        {/* Timeline insight */}
                        {answers.timeline &&
                          pcFinderInsights.timeline[
                            answers.timeline as keyof typeof pcFinderInsights.timeline
                          ] &&
                          pcFinderInsights.timeline[
                            answers.timeline as keyof typeof pcFinderInsights.timeline
                          ].map((msg: string, idx: number) => (
                            <p
                              key={"timeline-" + answers.timeline + "-" + idx}
                              className={
                                answers.timeline === "rush"
                                  ? "text-base text-orange-200 leading-relaxed"
                                  : "text-base text-green-200 leading-relaxed"
                              }
                            >
                              {msg}
                            </p>
                          ))}
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
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none border-white/20 text-white hover:bg-white/10 hover:scale-110 transition-all duration-300"
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none border-white/20 text-white hover:bg-white/10 hover:text-red-400 hover:border-red-400/40 hover:scale-110 transition-all duration-300"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
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
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-slate-900/80 border border-sky-500/40 mb-8 backdrop-blur-sm shadow-lg shadow-sky-500/20">
            <Zap className="w-4 h-4 text-sky-400 mr-2" />
            <span className="text-xs font-semibold tracking-wider text-sky-300 uppercase">
              Premium PC Engineering
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
            <span className="relative block mb-3">
              <span className="relative bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-pulse">
                Build Without Fear.
              </span>
            </span>
            <span className="relative block">
              <span className="relative bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-400 bg-clip-text text-transparent animate-pulse">
                Power Without Limits.
              </span>
            </span>
          </h1>

          <div className="max-w-[1300px] mx-auto px-4 space-y-6">
            <p className="text-xl sm:text-2xl text-white font-medium leading-relaxed">
              At Vortex PCs, we don't just assemble machines—we engineer weapons
              of choice for gamers, creators, and professionals who refuse to
              settle for anything less than the absolute best.
            </p>

            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
              Our PC Builder puts you in control: every component, every
              upgrade, every ounce of performance is yours to command.
            </p>

            <div className="h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent my-8"></div>

            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
              Forget cookie-cutter rigs and bland 'good enough' builds. With
              Vortex, you design a system that's unapologetically yours—whether
              it's a sleek workstation that crushes deadlines or a
              fire-breathing gaming beast that leaves competitors in the dust.
            </p>

            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
              <span className="text-sky-400 font-semibold">
                Premium parts. Transparent pricing. No hidden nonsense.
              </span>{" "}
              Just pure, class-leading performance, backed by service menus that
              prove we're as serious about support as we are about speed.
            </p>

            <div className="pt-4">
              <p className="text-xl sm:text-2xl text-white font-semibold">
                Ready to build? Let's turn your vision into a machine that does
                exactly what you demand to crush whatever you throw at it.
              </p>
            </div>
          </div>
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
              <div className="text-5xl sm:text-6xl md:text-7xl mb-6 animate-bounce">
                {currentQuestion?.emoji}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 px-4">
                {currentQuestion?.title}
              </h2>
              {currentQuestion?.helpText && (
                <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
                  {currentQuestion.helpText}
                </p>
              )}
            </div>

            {/* Question Options */}
            {currentQuestion?.type === "choice" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQuestion.options?.map(
                  (
                    option: {
                      value: string;
                      label: string;
                      icon: ComponentType<{ className?: string }>;
                      description: string;
                      color: string;
                    },
                    idx: number
                  ) => (
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
                  )
                )}
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
                        Number(
                          (answers[currentQuestion.id] as number | undefined) ??
                            (currentQuestion.defaultValue as
                              | number
                              | undefined) ??
                            0
                        )
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
                      Number(
                        (answers[currentQuestion.id] as number | undefined) ??
                          (currentQuestion.defaultValue as
                            | number
                            | undefined) ??
                          0
                      ),
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
                        Number(
                          (answers[currentQuestion.id] as number | undefined) ??
                            (currentQuestion.defaultValue as
                              | number
                              | undefined) ??
                            0
                        )
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
