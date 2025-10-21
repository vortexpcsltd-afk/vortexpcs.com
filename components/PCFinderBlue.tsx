/**
 * PC Finder Component - Blue Glassmorphism Theme
 * Version: 20251019-05
 * Last Updated: 2025-10-19
 * Cache Bust: FILE RENAME - Ultimate cache bypass
 */
import { useState, useEffect } from "react";
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
  Eye,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Heart,
} from "lucide-react";
import { fetchPCBuilds, fetchCategories, type PCBuild } from "../services/cms";

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
const ProductImageGallery = ({
  images,
  productName,
}: {
  images: any[];
  productName: string;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Use placeholder images for now (up to 6)
  const productImages =
    images && images.length > 0 ? images : Array(6).fill(PLACEHOLDER_IMAGE);

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
        className="relative group cursor-pointer"
        onClick={() => setIsGalleryOpen(true)}
      >
        <AspectRatio
          ratio={16 / 10}
          className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900"
        >
          <img
            src={productImages[currentImageIndex]}
            alt={productName}
            width="800"
            height="500"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* View Gallery Button */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              className="bg-black/50 backdrop-blur-md text-white border-white/20 hover:bg-black/70"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Gallery
            </Button>
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge
              variant="secondary"
              className="bg-black/50 backdrop-blur-md text-white border-white/20"
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
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70 flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </AspectRatio>

        {/* Thumbnail strip */}
        {productImages.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {productImages.slice(0, 6).map((image: any, index: number) => (
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
                <img
                  src={image}
                  alt={`${productName} view ${index + 1}`}
                  width="64"
                  height="48"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full Gallery Modal */}
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
            <AspectRatio ratio={16 / 10} className="overflow-hidden rounded-xl">
              <img
                src={productImages[currentImageIndex]}
                alt={productName}
                width="1200"
                height="750"
                loading="eager"
                className="w-full h-full object-cover"
              />
            </AspectRatio>

            {/* Modal Navigation */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-black/90 transition-all duration-300 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-black/90 transition-all duration-300 flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Badge
                variant="secondary"
                className="bg-black/70 backdrop-blur-md text-white border-white/20"
              >
                {currentImageIndex + 1} / {productImages.length}
              </Badge>
            </div>
          </div>

          {/* Gallery thumbnails */}
          <div className="grid grid-cols-6 gap-3 mt-4">
            {productImages.map((image: any, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentImageIndex
                    ? "border-sky-500 shadow-lg shadow-sky-500/25"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <img
                  src={image}
                  alt={`${productName} view ${index + 1}`}
                  width="200"
                  height="112"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export function PCFinder({
  setCurrentView,
  setRecommendedBuild,
}: {
  setCurrentView: (view: string) => void;
  setRecommendedBuild: (build: any) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [showResults, setShowResults] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<number[]>([]);
  const [strapiBuilds, setStrapiBuilds] = useState<PCBuild[]>([]);
  const [_categories, setCategories] = useState<any[]>([]);
  const [_loadingBuilds, setLoadingBuilds] = useState(false);

  // Load Strapi builds and categories on component mount
  useEffect(() => {
    const loadStrapiData = async () => {
      setLoadingBuilds(true);
      try {
        const [builds, cats] = await Promise.all([
          fetchPCBuilds(),
          fetchCategories(),
        ]);
        setStrapiBuilds(builds);
        setCategories(cats);
        console.log("✅ Loaded Strapi builds:", builds);
        console.log("✅ Loaded Strapi categories:", cats);
      } catch (error) {
        console.error("Failed to load Strapi data:", error);
      } finally {
        setLoadingBuilds(false);
      }
    };

    loadStrapiData();
  }, []);

  // Question flow with branching logic
  const getQuestions = () => {
    const questions = [
      {
        id: "purpose",
        title: "What will you mainly use your PC for?",
        subtitle:
          "Let's start with the basics - what's driving your need for a new PC?",
        type: "choice",
        options: [
          {
            value: "gaming",
            label: "Gaming",
            icon: Gamepad,
            description: "Latest games, high frame rates, competitive edge",
          },
          {
            value: "creative",
            label: "Creative Work",
            icon: Palette,
            description: "Video editing, 3D rendering, design work",
          },
          {
            value: "content_creation",
            label: "Content Creation",
            icon: Wifi,
            description: "Streaming, YouTube, video production, podcasting",
          },
          {
            value: "professional",
            label: "Professional Work",
            icon: Briefcase,
            description: "Office tasks, productivity, business applications",
          },
          {
            value: "development",
            label: "Development",
            icon: Code,
            description: "Programming, software development, virtualization",
          },
          {
            value: "home",
            label: "Home & Media",
            icon: Home,
            description: "Browsing, streaming, light productivity",
          },
        ],
      },
      {
        id: "budget",
        title: "What's your budget range?",
        subtitle:
          "This helps us recommend the best components for your investment",
        type: "slider",
        min: 500,
        max: 5000,
        step: 100,
        defaultValue: 1500,
        formatValue: (value: number) => `£${value.toLocaleString()}`,
      },
      {
        id: "gaming_detail",
        title: "What type of gaming experience do you want?",
        subtitle: "Tell us about your gaming ambitions",
        type: "choice",
        condition: (answers: any) => answers.purpose === "gaming",
        options: [
          {
            value: "1080p_budget",
            label: "1080p Gaming",
            icon: Monitor,
            description: "60-120 FPS at 1080p resolution",
          },
          {
            value: "1440p_high",
            label: "1440p High-Refresh",
            icon: Monitor,
            description: "120+ FPS at 1440p resolution",
          },
          {
            value: "4k_ultra",
            label: "4K Ultra Gaming",
            icon: Monitor,
            description: "60+ FPS at 4K resolution with max settings",
          },
          {
            value: "competitive",
            label: "Competitive Gaming",
            icon: Zap,
            description: "240+ FPS for competitive advantages",
          },
        ],
      },
      {
        id: "creative_detail",
        title: "What type of creative work do you do?",
        subtitle: "Different creative tasks have different hardware needs",
        type: "choice",
        condition: (answers: any) => answers.purpose === "creative",
        options: [
          {
            value: "video_editing",
            label: "Video Editing",
            icon: Monitor,
            description: "4K editing, colour grading, motion graphics",
          },
          {
            value: "3d_rendering",
            label: "3D Rendering",
            icon: Package,
            description: "Blender, Maya, architectural visualization",
          },
          {
            value: "streaming",
            label: "Content Creation",
            icon: Wifi,
            description: "Streaming, YouTube, social media content",
          },
          {
            value: "photo_editing",
            label: "Photo Editing",
            icon: Palette,
            description: "Photoshop, Lightroom, graphic design",
          },
        ],
      },
      {
        id: "content_creation_detail",
        title: "What type of content do you create?",
        subtitle: "Let us tailor your PC for your content creation needs",
        type: "choice",
        condition: (answers: any) => answers.purpose === "content_creation",
        options: [
          {
            value: "streaming",
            label: "Live Streaming",
            icon: Wifi,
            description:
              "Twitch, YouTube Live, simultaneous gaming & streaming",
          },
          {
            value: "youtube",
            label: "YouTube Videos",
            icon: Monitor,
            description: "Video recording, editing, thumbnails, rendering",
          },
          {
            value: "podcasting",
            label: "Podcasting",
            icon: Briefcase,
            description: "Audio recording, editing, multi-track production",
          },
          {
            value: "social_media",
            label: "Social Media Content",
            icon: Sparkles,
            description: "TikTok, Instagram, short-form video creation",
          },
        ],
      },
      {
        id: "storage_needs",
        title: "How much storage do you need?",
        subtitle: "Consider your games, projects, and media files",
        type: "choice",
        options: [
          {
            value: "500gb",
            label: "500GB Fast SSD",
            icon: HardDrive,
            description: "Essential programs and a few games",
          },
          {
            value: "1tb",
            label: "1TB Fast SSD",
            icon: HardDrive,
            description: "Good balance for most users",
          },
          {
            value: "2tb",
            label: "2TB Fast SSD",
            icon: HardDrive,
            description: "Large game library or creative projects",
          },
          {
            value: "1tb_plus_hdd",
            label: "1TB SSD + 2TB HDD",
            icon: HardDrive,
            description: "Fast boot drive plus mass storage",
          },
        ],
      },
      {
        id: "timeline",
        title: "When do you need your PC?",
        subtitle:
          "Our standard build time is 5 days, but we can prioritise if needed",
        type: "choice",
        options: [
          {
            value: "standard",
            label: "Standard (5 days)",
            icon: Clock,
            description: "Our normal premium build service",
          },
          {
            value: "rush",
            label: "Rush (2-3 days)",
            icon: Zap,
            description: "+£150 priority build fee",
          },
          {
            value: "flexible",
            label: "I can wait",
            icon: Shield,
            description: "Flexible timing for best component deals",
          },
        ],
      },
    ];

    return questions.filter((q) => !q.condition || q.condition(answers));
  };

  const questions = getQuestions();
  const currentQuestion = questions[currentStep];

  const handleAnswer = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    setQuestionHistory([...questionHistory, currentStep]);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateRecommendations(newAnswers);
    }
  };

  const goBack = () => {
    if (questionHistory.length > 0) {
      const prevStep = questionHistory[questionHistory.length - 1];
      setQuestionHistory(questionHistory.slice(0, -1));
      setCurrentStep(prevStep);
    }
  };

  const generateRecommendations = (finalAnswers: any) => {
    // Enhanced recommendation logic
    const recommendations = generateBuildRecommendations(finalAnswers);
    setRecommendedBuild(recommendations[0]); // Set the primary recommendation
    setShowResults(true);
  };

  // Generate personalized expert comments based on configuration
  const generateExpertComments = (answers: any, _buildType: any) => {
    const comments = [];

    // Purpose-specific insights
    if (answers.purpose === "gaming") {
      if (answers.gaming_detail === "4k_ultra") {
        comments.push(
          "We've selected the RTX 4090 for its exceptional 4K performance – you'll experience native 4K gaming at high frame rates without compromise. The 24GB VRAM ensures future-proofing for upcoming AAA titles."
        );
        comments.push(
          "The combination of DDR5-6400 RAM and Gen5 NVMe storage eliminates bottlenecks, delivering instantaneous load times and seamless texture streaming in demanding open-world games."
        );
      } else if (answers.gaming_detail === "1440p_high") {
        comments.push(
          "The RTX 4070 Ti Super hits the sweet spot for 1440p gaming – delivering consistently high frame rates whilst maintaining excellent value. Its 16GB VRAM provides headroom for texture-heavy titles and future releases."
        );
        comments.push(
          "We've paired this with a 9800X3D for its industry-leading gaming cache technology, ensuring maximum FPS in CPU-intensive titles like strategy games and flight simulators."
        );
      } else if (answers.gaming_detail === "competitive") {
        comments.push(
          "For competitive gaming, we've prioritised high frame rates and low latency. This configuration will easily maintain 240+ FPS in esports titles, giving you the competitive edge you need."
        );
      } else {
        comments.push(
          "This 1080p configuration delivers exceptional performance for modern gaming. The RTX 4060 Ti's 16GB VRAM is uncommon at this tier – we've included it to ensure smooth performance with high texture settings and ray tracing enabled."
        );
      }
    } else if (answers.purpose === "creative") {
      if (answers.creative_detail === "video_editing") {
        comments.push(
          "The 64GB DDR5-6400 RAM is essential for 4K timeline scrubbing and multi-layer colour grading in Premiere Pro and DaVinci Resolve. This capacity allows you to work with RED and ARRI RAW footage without proxies."
        );
        comments.push(
          "We've specified Gen5 NVMe storage for your cache and project files – the increased sequential read speeds dramatically reduce export times and enable real-time playback of complex timelines."
        );
      } else if (answers.creative_detail === "3d_rendering") {
        comments.push(
          "The RTX 4070 Ti Super offers excellent CUDA core count for GPU-accelerated rendering in Blender Cycles and Octane. Combined with the 16-core CPU, you'll see significant improvements in both interactive viewport performance and final render times."
        );
        comments.push(
          "We've configured ample storage for your asset libraries and render output – the Gen5 NVMe ensures your scene files load instantly, even with heavy texture sets."
        );
      } else if (answers.creative_detail === "streaming") {
        comments.push(
          "This configuration excels at simultaneous gaming and streaming. The NVIDIA encoder handles stream encoding with minimal performance impact, whilst the multi-core CPU manages OBS, chat overlays, and background tasks effortlessly."
        );
      }
    } else if (answers.purpose === "development") {
      comments.push(
        "The 64GB RAM and 16-core CPU are specifically chosen for running multiple Docker containers and virtual machines simultaneously. You'll be able to run entire development environments without performance degradation."
      );
      comments.push(
        "Fast NVMe storage significantly improves compilation times for large codebases. We've also included ample capacity for local databases and test environments."
      );
    }

    // Content creation insights
    if (answers.purpose === "content_creation") {
      if (answers.content_creation_detail === "streaming") {
        comments.push(
          "This streaming powerhouse features the NVIDIA RTX encoder for crystal-clear stream quality with minimal CPU overhead. You'll maintain 1080p60 or 1440p60 streams whilst playing demanding games without frame drops."
        );
        comments.push(
          "The multi-core processor effortlessly handles OBS Studio, chat overlays, browser sources, and background applications – ensuring your stream remains smooth even during intensive moments."
        );
      } else if (answers.content_creation_detail === "youtube") {
        comments.push(
          "Perfect for YouTube creators, this build accelerates Adobe Premiere and DaVinci Resolve with GPU acceleration for instant timeline scrubbing and faster exports. The 32GB RAM handles 4K editing with ease."
        );
        comments.push(
          "The NVIDIA encoder also speeds up rendering times significantly – what used to take hours can now be completed in minutes, allowing you to publish content faster."
        );
      } else if (answers.content_creation_detail === "podcasting") {
        comments.push(
          "This configuration excels for audio production with low-latency performance in DAWs like Adobe Audition, Reaper, or Audacity. Multi-track recording and editing are silky smooth with zero audio dropouts."
        );
        comments.push(
          "The fast storage ensures your audio libraries and projects load instantly, whilst the powerful CPU handles real-time effects processing and batch exports effortlessly."
        );
      } else if (answers.content_creation_detail === "social_media") {
        comments.push(
          "Optimised for quick-turnaround content creation, this PC handles multiple applications simultaneously – edit videos in Premiere, create thumbnails in Photoshop, and manage uploads without slowdowns."
        );
        comments.push(
          "The GPU acceleration dramatically speeds up vertical video exports for TikTok and Instagram Reels, whilst the fast storage ensures your raw footage and assets are always ready."
        );
      }
    }

    // Storage-specific insights
    if (answers.storage_needs === "2tb") {
      comments.push(
        "The 2TB Gen4 NVMe provides exceptional capacity for modern games (which often exceed 100GB each) or large creative projects, whilst maintaining consistent performance even when the drive is nearly full."
      );
    } else if (answers.storage_needs === "1tb_plus_hdd") {
      comments.push(
        "We've configured a dual-drive setup: fast NVMe for your OS and active projects, plus a high-capacity HDD for archives and media libraries – offering the perfect balance of speed and capacity."
      );
    }

    // Timeline insights
    if (answers.timeline === "rush") {
      comments.push(
        "Your priority build will be assembled by our lead technicians and undergo expedited testing. We'll personally ensure every component meets our exacting standards before dispatch."
      );
    }

    // Budget-tier specific insights
    if (answers.budget >= 3000) {
      comments.push(
        "At this tier, we source only flagship components with proven reliability. Every part is stress-tested for 24 hours before assembly to ensure absolute stability under sustained workloads."
      );
    }

    return comments;
  };

  // PC Builder component data for accurate pricing
  const pcBuilderComponents = {
    cpu: [
      { name: "AMD Ryzen 9 9950X3D", price: 649.99, category: "flagship" },
      { name: "Intel Core Ultra 9 285K", price: 589.99, category: "flagship" },
      { name: "AMD Ryzen 9 9900X", price: 449.99, category: "high-end" },
      { name: "AMD Ryzen 7 9800X3D", price: 449.99, category: "gaming" },
      { name: "Intel Core i7-14700K", price: 399.99, category: "high-end" },
      { name: "AMD Ryzen 7 9700X", price: 349.99, category: "performance" },
      {
        name: "Intel Core Ultra 7 265K",
        price: 329.99,
        category: "performance",
      },
      { name: "AMD Ryzen 5 9600X", price: 229.99, category: "mainstream" },
      { name: "Intel Core i5-14400F", price: 189.99, category: "mainstream" },
      { name: "Intel Core i5-13400F", price: 169.99, category: "budget" },
      { name: "AMD Ryzen 5 7600", price: 159.99, category: "budget" },
      { name: "Intel Core i5-12400", price: 149.99, category: "budget" },
    ],
    gpu: [
      { name: "RTX 4090 24GB", price: 1599.99, category: "flagship" },
      { name: "RTX 4080 Super 16GB", price: 999.99, category: "high-end" },
      { name: "RTX 4070 Ti Super 16GB", price: 799.99, category: "high-end" },
      { name: "RTX 4070 Super 12GB", price: 599.99, category: "performance" },
      { name: "RTX 4060 Ti 16GB", price: 449.99, category: "mainstream" },
      { name: "RTX 4060 8GB", price: 299.99, category: "budget" },
    ],
    ram: [
      { name: "128GB DDR5-6000", price: 599.99, category: "flagship" },
      { name: "64GB DDR5-6400", price: 349.99, category: "high-end" },
      { name: "64GB DDR5-6000", price: 329.99, category: "high-end" },
      { name: "32GB DDR5-6000 RGB", price: 189.99, category: "performance" },
      { name: "32GB DDR5-5600", price: 159.99, category: "mainstream" },
      { name: "16GB DDR5-5600", price: 99.99, category: "budget" },
      { name: "16GB DDR5-5200", price: 89.99, category: "budget" },
    ],
    storage: [
      { name: "4TB NVMe Gen5 + 8TB HDD", price: 599.99, category: "flagship" },
      { name: "2TB NVMe Gen5 + 4TB HDD", price: 349.99, category: "high-end" },
      {
        name: "2TB NVMe Gen4 + 4TB HDD",
        price: 279.99,
        category: "performance",
      },
      {
        name: "2TB NVMe Gen4 + 2TB HDD",
        price: 239.99,
        category: "performance",
      },
      {
        name: "1TB NVMe Gen4 + 2TB HDD",
        price: 179.99,
        category: "mainstream",
      },
      { name: "1TB NVMe Gen4", price: 129.99, category: "mainstream" },
      { name: "2TB NVMe Gen4", price: 199.99, category: "premium" },
    ],
    cooling: [
      { name: "360mm RGB AIO", price: 179.99, category: "premium" },
      { name: "280mm RGB AIO", price: 149.99, category: "performance" },
      { name: "280mm AIO", price: 129.99, category: "performance" },
      { name: "240mm AIO", price: 109.99, category: "mainstream" },
      { name: "Stock Cooler", price: 0, category: "budget" },
    ],
    case: [
      { name: "Premium ATX RGB", price: 249.99, category: "premium" },
      { name: "ATX RGB", price: 179.99, category: "performance" },
      { name: "ATX Standard", price: 129.99, category: "mainstream" },
      { name: "Micro-ATX", price: 99.99, category: "budget" },
    ],
    psu: [
      { name: "1000W 80+ Gold Modular", price: 189.99, category: "flagship" },
      { name: "850W 80+ Gold Modular", price: 149.99, category: "high-end" },
      { name: "750W 80+ Gold Modular", price: 129.99, category: "performance" },
      { name: "650W 80+ Gold", price: 99.99, category: "mainstream" },
      { name: "550W 80+ Bronze", price: 79.99, category: "budget" },
    ],
    motherboard: [
      { name: "X670E Flagship", price: 399.99, category: "flagship" },
      { name: "Z790 High-End", price: 299.99, category: "high-end" },
      { name: "B650 Performance", price: 179.99, category: "performance" },
      { name: "B550/B660 Mainstream", price: 129.99, category: "mainstream" },
      { name: "A520/H610 Budget", price: 89.99, category: "budget" },
    ],
  };

  // Function to calculate accurate pricing from PC Builder components
  const calculateAccuratePrice = (specs: any): number => {
    let totalPrice = 0;

    // Map PC Finder specs to PC Builder components
    const componentMappings = {
      cpu: specs.cpu,
      gpu: specs.gpu,
      ram: specs.ram,
      storage: specs.storage,
      cooling: specs.cooling,
    };

    // Calculate price for each component
    for (const [componentType, componentName] of Object.entries(
      componentMappings
    )) {
      const componentsOfType =
        pcBuilderComponents[componentType as keyof typeof pcBuilderComponents];
      const matchingComponent = componentsOfType.find(
        (comp) =>
          componentName
            .toLowerCase()
            .includes(comp.name.toLowerCase().split(" ")[0]) ||
          comp.name
            .toLowerCase()
            .includes(componentName.toLowerCase().split(" ")[0])
      );

      if (matchingComponent) {
        totalPrice += matchingComponent.price;
      } else {
        // Fallback pricing based on component type and estimated tier
        const fallbackPrices = {
          cpu: componentName.includes("9950X")
            ? 649.99
            : componentName.includes("9800X")
            ? 449.99
            : componentName.includes("9600X")
            ? 229.99
            : 189.99,
          gpu: componentName.includes("4090")
            ? 1599.99
            : componentName.includes("4080")
            ? 999.99
            : componentName.includes("4070 Ti")
            ? 799.99
            : componentName.includes("4070")
            ? 599.99
            : componentName.includes("4060 Ti")
            ? 449.99
            : 299.99,
          ram: componentName.includes("128GB")
            ? 599.99
            : componentName.includes("64GB")
            ? 329.99
            : componentName.includes("32GB")
            ? 189.99
            : 99.99,
          storage: componentName.includes("4TB")
            ? 599.99
            : componentName.includes("2TB") && componentName.includes("Gen5")
            ? 349.99
            : componentName.includes("2TB")
            ? 279.99
            : 129.99,
          cooling: componentName.includes("360mm")
            ? 179.99
            : componentName.includes("280mm")
            ? 149.99
            : componentName.includes("240mm")
            ? 109.99
            : 0,
        };
        totalPrice +=
          fallbackPrices[componentType as keyof typeof fallbackPrices] || 0;
      }
    }

    // Add motherboard, case, and PSU estimates
    totalPrice += 179.99; // Average motherboard
    totalPrice += 179.99; // Average case
    totalPrice += 129.99; // Average PSU

    return Math.round(totalPrice);
  };

  // Enhanced multi-factor scoring system for intelligent recommendations
  interface UserProfile {
    budget: number;
    purpose: string;
    performance_level?: string;
    gaming_detail?: string;
    creative_detail?: string;
    content_creation_detail?: string;
    future_proofing?: boolean;
    rgb_preference?: boolean;
    size_constraints?: string;
  }

  interface BuildTemplate {
    name: string;
    basePrice: number;
    category: string;
    description: string;
    specs: any;
    features: string[];
    targetUseCase: string[];
    performanceScore: number;
    valueScore: number;
    futureProofScore: number;
    powerEfficiency: number;
  }

  const buildTemplates: BuildTemplate[] = [
    {
      name: "Gaming Beast 4K",
      basePrice: 4200,
      category: "Ultimate Gaming",
      description: "Crushes 4K gaming with RTX 4090 and latest processors",
      specs: {
        cpu: "Intel Core Ultra 9 285K or AMD Ryzen 9 9950X3D",
        gpu: "RTX 4090 24GB",
        ram: "32GB DDR5-6400 RGB",
        storage: "2TB NVMe Gen5 + 2TB HDD",
        cooling: "360mm RGB AIO",
      },
      features: [
        "4K 60+ FPS",
        "Ray Tracing Ultra",
        "DLSS 3.0",
        "3-Year Warranty",
      ],
      targetUseCase: ["gaming", "4k_ultra", "competitive"],
      performanceScore: 100,
      valueScore: 70,
      futureProofScore: 95,
      powerEfficiency: 60,
    },
    {
      name: "Gaming Master 1440p",
      basePrice: 2400,
      category: "High-Performance Gaming",
      description: "Perfect for 1440p high-refresh gaming with RTX 4070 Ti",
      specs: {
        cpu: "AMD Ryzen 7 9800X3D or Intel Core i7-14700K",
        gpu: "RTX 4070 Ti Super 16GB",
        ram: "32GB DDR5-6000 RGB",
        storage: "1TB NVMe Gen4 + 1TB HDD",
        cooling: "280mm AIO",
      },
      features: [
        "1440p 120+ FPS",
        "Ray Tracing High",
        "DLSS 3.0",
        "3-Year Warranty",
      ],
      targetUseCase: ["gaming", "1440p_high"],
      performanceScore: 85,
      valueScore: 90,
      futureProofScore: 80,
      powerEfficiency: 75,
    },
    {
      name: "Gaming Core 1080p",
      basePrice: 1400,
      category: "Performance Gaming",
      description: "Excellent 1080p gaming performance with modern features",
      specs: {
        cpu: "AMD Ryzen 5 9600X or Intel Core i5-13400F",
        gpu: "RTX 4060 Ti 16GB",
        ram: "16GB DDR5-5600",
        storage: "1TB NVMe Gen4",
        cooling: "240mm AIO",
      },
      features: [
        "1080p 144+ FPS",
        "Ray Tracing Medium",
        "DLSS 3.0",
        "3-Year Warranty",
      ],
      targetUseCase: ["gaming", "1080p_budget", "competitive"],
      performanceScore: 70,
      valueScore: 95,
      futureProofScore: 65,
      powerEfficiency: 85,
    },
    {
      name: "Creator Workstation Pro",
      basePrice: 3200,
      category: "Creative Workstation",
      description:
        "Optimised for video editing, 3D rendering, and creative workflows",
      specs: {
        cpu: "AMD Ryzen 9 9950X or Intel Core Ultra 9 285K",
        gpu: "RTX 4070 Ti Super 16GB",
        ram: "64GB DDR5-6400",
        storage: "2TB NVMe Gen5 + 4TB HDD",
        cooling: "360mm AIO",
      },
      features: [
        "4K Video Editing",
        "GPU Acceleration",
        "64GB RAM",
        "3-Year Warranty",
      ],
      targetUseCase: ["creative", "video_editing", "3d_rendering"],
      performanceScore: 95,
      valueScore: 80,
      futureProofScore: 90,
      powerEfficiency: 70,
    },
    {
      name: "Content Creator Studio",
      basePrice: 2600,
      category: "Content Creation Workstation",
      description:
        "Optimised for streaming, video production, and content creation",
      specs: {
        cpu: "AMD Ryzen 7 9800X3D or Intel Core i7-14700K",
        gpu: "RTX 4070 Super 12GB",
        ram: "32GB DDR5-6000 RGB",
        storage: "2TB NVMe Gen4 + 2TB HDD",
        cooling: "280mm RGB AIO",
      },
      features: [
        "NVENC Encoder",
        "Multi-Core Performance",
        "Fast Storage",
        "3-Year Warranty",
      ],
      targetUseCase: ["content_creation", "streaming", "youtube"],
      performanceScore: 80,
      valueScore: 85,
      futureProofScore: 75,
      powerEfficiency: 80,
    },
    {
      name: "Developer Powerhouse",
      basePrice: 2700,
      category: "Development Workstation",
      description:
        "Multi-core performance for compilation, VMs, and development",
      specs: {
        cpu: "AMD Ryzen 9 9950X or Intel Core Ultra 9 285K",
        gpu: "RTX 4060 Ti 16GB",
        ram: "64GB DDR5-6000",
        storage: "2TB NVMe Gen4 + 2TB HDD",
        cooling: "280mm AIO",
      },
      features: [
        "16+ Cores",
        "Fast Compilation",
        "VM Ready",
        "3-Year Warranty",
      ],
      targetUseCase: ["development", "professional"],
      performanceScore: 90,
      valueScore: 85,
      futureProofScore: 85,
      powerEfficiency: 90,
    },
    {
      name: "Home & Office Pro",
      basePrice: 1100,
      category: "Productivity & Media",
      description:
        "Perfect for daily tasks, media consumption, and light productivity",
      specs: {
        cpu: "AMD Ryzen 5 7600 or Intel Core i5-12400F",
        gpu: "RTX 4060 8GB",
        ram: "16GB DDR5-5600",
        storage: "1TB NVMe Gen4",
        cooling: "240mm AIO",
      },
      features: [
        "Silent Operation",
        "Energy Efficient",
        "4K Media",
        "3-Year Warranty",
      ],
      targetUseCase: ["home", "professional", "photo_editing"],
      performanceScore: 60,
      valueScore: 100,
      futureProofScore: 50,
      powerEfficiency: 95,
    },

    // Budget Builds - £600-£800 Range
    {
      name: "Budget Gaming Essential",
      basePrice: 699,
      category: "Budget Gaming",
      description: "Solid 1080p gaming performance at an unbeatable price",
      specs: {
        cpu: "AMD Ryzen 5 7600 or Intel Core i5-12400",
        gpu: "RTX 4060 8GB",
        ram: "16GB DDR5-5200",
        storage: "1TB NVMe Gen4",
        cooling: "Stock Cooler",
      },
      features: [
        "1080p 60+ FPS",
        "Ray Tracing Capable",
        "Great Value",
        "3-Year Warranty",
      ],
      targetUseCase: ["gaming", "1080p_budget", "home"],
      performanceScore: 55,
      valueScore: 100,
      futureProofScore: 45,
      powerEfficiency: 95,
    },
    {
      name: "Budget Creator Basic",
      basePrice: 749,
      category: "Budget Creative",
      description:
        "Entry-level creative workstation for photo editing and light video work",
      specs: {
        cpu: "AMD Ryzen 5 7600 or Intel Core i5-12400",
        gpu: "RTX 4060 8GB",
        ram: "16GB DDR5-5200",
        storage: "1TB NVMe Gen4",
        cooling: "Stock Cooler",
      },
      features: [
        "Photo Editing",
        "1080p Video",
        "GPU Acceleration",
        "Efficient",
      ],
      targetUseCase: ["creative", "photo_editing", "home"],
      performanceScore: 50,
      valueScore: 95,
      futureProofScore: 40,
      powerEfficiency: 90,
    },
    {
      name: "Budget Office Pro",
      basePrice: 599,
      category: "Budget Productivity",
      description:
        "Perfect for office work, web browsing, and basic productivity tasks",
      specs: {
        cpu: "AMD Ryzen 5 7600 or Intel Core i5-12400",
        gpu: "RTX 4060 8GB",
        ram: "16GB DDR5-5200",
        storage: "1TB NVMe Gen4",
        cooling: "Stock Cooler",
      },
      features: [
        "Silent Operation",
        "Energy Efficient",
        "Reliable",
        "Great Value",
      ],
      targetUseCase: ["home", "professional"],
      performanceScore: 45,
      valueScore: 100,
      futureProofScore: 35,
      powerEfficiency: 100,
    },
  ];

  const calculateBuildScore = (
    build: BuildTemplate,
    profile: UserProfile,
    accuratePrice: number
  ): number => {
    let score = 0;
    const weights = {
      budget: 0.3,
      useCase: 0.25,
      performance: 0.2,
      value: 0.15,
      futureProof: 0.1,
    };

    // Budget compatibility score (0-100) - now using accurate pricing
    const budgetRatio = profile.budget / accuratePrice;
    let budgetScore = 0;
    if (budgetRatio >= 1.1) budgetScore = 100; // Can afford with headroom
    else if (budgetRatio >= 0.95) budgetScore = 90; // Can afford
    else if (budgetRatio >= 0.8) budgetScore = 70; // Stretch budget
    else if (budgetRatio >= 0.6) budgetScore = 40; // Significant stretch
    else budgetScore = 10; // Too expensive

    // Use case matching score (0-100)
    let useCaseScore = 0;
    const userDetails = [
      profile.purpose,
      profile.gaming_detail,
      profile.creative_detail,
      profile.content_creation_detail,
    ].filter(Boolean);

    for (const userDetail of userDetails) {
      if (userDetail && build.targetUseCase.includes(userDetail)) {
        useCaseScore += 50;
      }
    }
    useCaseScore = Math.min(useCaseScore, 100);

    // Performance preference weighting
    let performanceWeight = weights.performance;
    if (
      profile.gaming_detail === "4k_ultra" ||
      profile.creative_detail === "3d_rendering"
    ) {
      performanceWeight += 0.1;
    }

    // Value preference weighting
    let valueWeight = weights.value;
    if (profile.budget < 1500) {
      valueWeight += 0.1;
    }

    // Calculate weighted score
    score =
      budgetScore * weights.budget +
      useCaseScore * weights.useCase +
      build.performanceScore * performanceWeight +
      build.valueScore * valueWeight +
      build.futureProofScore * weights.futureProof;

    return Math.round(score);
  };

  const generateBuildRecommendations = (answers: any): any[] => {
    const profile: UserProfile = {
      budget: answers.budget || 1500,
      purpose: answers.purpose || "gaming",
      gaming_detail: answers.gaming_detail,
      creative_detail: answers.creative_detail,
      content_creation_detail: answers.content_creation_detail,
    };

    // Calculate scores for all build templates
    const scoredBuilds = buildTemplates.map((build) => {
      const accuratePrice = calculateAccuratePrice(build.specs);
      return {
        ...build,
        score: calculateBuildScore(build, profile, accuratePrice),
        accuratePrice: accuratePrice,
        adjustedPrice: Math.min(build.basePrice, profile.budget), // Keep for compatibility
      };
    });

    // Sort by score and select top recommendations
    const topBuilds = scoredBuilds
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const builds: any[] = [];

    // First, add relevant Strapi builds if available
    if (strapiBuilds.length > 0) {
      const relevantStrapiBuilds = strapiBuilds.filter((build) => {
        // Filter by budget (if price is available)
        if (build.price && build.price > answers.budget * 1.2) return false;

        // Filter by category/purpose match
        const category = build.category?.toLowerCase() || "";
        const purpose = answers.purpose?.toLowerCase() || "";

        if (purpose.includes("gaming") && category.includes("gaming"))
          return true;
        if (purpose.includes("creative") && category.includes("workstation"))
          return true;
        if (purpose.includes("content") && category.includes("creator"))
          return true;
        if (purpose.includes("professional") && category.includes("office"))
          return true;

        return build.featured; // Include featured builds as general recommendations
      });

      // Add up to 1 relevant Strapi build (reduced to make room for intelligent recommendations)
      relevantStrapiBuilds.slice(0, 1).forEach((strapiBuild) => {
        builds.push({
          name: strapiBuild.name,
          price: strapiBuild.price || Math.min(answers.budget, 2500),
          category: strapiBuild.category || "Custom Build",
          description:
            strapiBuild.description ||
            "Professional custom build from our catalog",
          specs: strapiBuild.components || {
            cpu: "High-performance processor",
            gpu: "Latest graphics card",
            ram: "Fast DDR5 memory",
            storage: "High-speed NVMe storage",
            cooling: "Advanced cooling solution",
          },
          features: [
            "Professional Assembly",
            "Quality Tested",
            "3-Year Warranty",
            "Expert Support",
          ],
          images: Array(6).fill(PLACEHOLDER_IMAGE),
          expertComments: [
            `This is one of our most popular pre-configured builds, carefully selected to deliver excellent performance for ${answers.purpose} workloads.`,
          ],
          isFromStrapi: true, // Mark as Strapi build for tracking
        });
      });
    }

    // Add intelligent recommendations based on scoring
    topBuilds.forEach((build, index) => {
      builds.push({
        name: build.name,
        price: build.accuratePrice, // Use accurate pricing instead of adjusted price
        category: build.category,
        description: build.description,
        specs: build.specs,
        features: build.features,
        images: Array(6).fill(PLACEHOLDER_IMAGE),
        expertComments: generateExpertComments(
          answers,
          answers.gaming_detail || answers.creative_detail || answers.purpose
        ),
        intelligentScore: build.score, // Add score for debugging/analytics
        recommendation:
          index === 0
            ? "Best Match"
            : index === 1
            ? "Great Value"
            : "Alternative Option",
      });
    });

    return builds;
  };

  const restart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setQuestionHistory([]);
  };

  if (showResults) {
    const recommendations = generateBuildRecommendations(answers);

    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950 py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center px-3 md:px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 mb-4">
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              <span className="text-sm text-green-300">
                Perfect Match Found
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent px-4">
              Your Ideal PC Build
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Based on your requirements, we've found the perfect configuration
              for your needs and budget
            </p>
          </div>

          {/* Recommendations Grid */}
          <div className="grid gap-6 md:gap-8 max-w-6xl mx-auto px-4">
            {recommendations.map((build, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 backdrop-blur-xl overflow-hidden group hover:border-sky-500/30 transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 p-4 md:p-6 lg:p-8">
                  {/* Product Images */}
                  <div className="space-y-6">
                    <ProductImageGallery
                      images={build.images}
                      productName={build.name}
                    />

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => setCurrentView("pc-builder")}
                        className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white border-0"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Customise Build
                      </Button>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none border-white/20 text-white hover:bg-white/10"
                        >
                          <Bookmark className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 sm:flex-none border-white/20 text-white hover:bg-white/10"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-4 md:space-y-6">
                    {/* Header */}
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <Badge
                          variant="secondary"
                          className="bg-sky-500/20 text-sky-300 border-sky-500/30 w-fit"
                        >
                          {build.category}
                        </Badge>
                        <div className="flex items-center text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                          <span className="ml-2 text-sm text-gray-400">
                            (4.9/5)
                          </span>
                        </div>
                      </div>
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2">
                        {build.name}
                      </h2>
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                        <span className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                          £{build.price.toLocaleString()}
                        </span>
                        <span className="text-base md:text-lg text-gray-400">
                          inc. VAT
                        </span>
                      </div>
                    </div>

                    <p className="text-sm md:text-base lg:text-lg text-gray-300 leading-relaxed">
                      {build.description}
                    </p>

                    {/* Expert Comments */}
                    {build.expertComments &&
                      build.expertComments.length > 0 && (
                        <div className="space-y-3 p-4 md:p-6 rounded-lg bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-base md:text-lg mb-3">
                                Kevin's Insight
                              </h3>
                              <div className="space-y-3">
                                {build.expertComments.map(
                                  (comment: string, idx: number) => (
                                    <p
                                      key={idx}
                                      className="text-sm md:text-base text-gray-300 leading-relaxed"
                                    >
                                      {comment}
                                    </p>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Specifications */}
                    <div className="space-y-3 md:space-y-4">
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        Key Specifications
                      </h3>
                      <div className="grid gap-2 md:gap-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 md:p-3 rounded-lg bg-white/5 border border-white/10 gap-1">
                          <span className="text-gray-400 text-sm md:text-base">
                            Processor
                          </span>
                          <span className="text-white font-medium text-sm md:text-base break-words">
                            {build.specs.cpu}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 md:p-3 rounded-lg bg-white/5 border border-white/10 gap-1">
                          <span className="text-gray-400 text-sm md:text-base">
                            Graphics Card
                          </span>
                          <span className="text-white font-medium text-sm md:text-base break-words">
                            {build.specs.gpu}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 md:p-3 rounded-lg bg-white/5 border border-white/10 gap-1">
                          <span className="text-gray-400 text-sm md:text-base">
                            Memory
                          </span>
                          <span className="text-white font-medium text-sm md:text-base break-words">
                            {build.specs.ram}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 md:p-3 rounded-lg bg-white/5 border border-white/10 gap-1">
                          <span className="text-gray-400 text-sm md:text-base">
                            Storage
                          </span>
                          <span className="text-white font-medium text-sm md:text-base break-words">
                            {build.specs.storage}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 md:p-3 rounded-lg bg-white/5 border border-white/10 gap-1">
                          <span className="text-gray-400 text-sm md:text-base">
                            Cooling
                          </span>
                          <span className="text-white font-medium text-sm md:text-base break-words">
                            {build.specs.cooling}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        Key Features
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {build.features.map(
                          (feature: string, featureIndex: number) => (
                            <Badge
                              key={featureIndex}
                              variant="secondary"
                              className="bg-green-500/20 text-green-300 border-green-500/30"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {feature}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-sky-400" />
                        <div>
                          <p className="text-white font-medium">
                            5-Day Premium Build Service
                          </p>
                          <p className="text-sm text-gray-400">
                            Built, tested, and delivered within 5 working days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button
              variant="outline"
              onClick={restart}
              className="border-white/20 text-white hover:bg-white/10 px-8 py-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button
              onClick={() => setCurrentView("pc-builder")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-8 py-3"
            >
              <Settings className="w-4 h-4 mr-2" />
              Build from Scratch
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center px-3 md:px-4 py-2 rounded-full bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-sky-400 mr-2" />
            <span className="text-sm text-sky-300">AI-Powered PC Finder</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent px-4">
            Find Your Perfect PC
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
            Our intelligent questionnaire will help you discover the ideal PC
            configuration for your specific needs and budget
          </p>
        </div>

        {/* Progress */}
        <div className="max-w-2xl mx-auto mb-8 md:mb-12 px-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs md:text-sm text-gray-400">
              Question {currentStep + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round(((currentStep + 1) / questions.length) * 100)}%
              Complete
            </span>
          </div>
          <Progress
            value={((currentStep + 1) / questions.length) * 100}
            className="h-2 bg-white/10"
          />
        </div>

        {/* Question Card */}
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/10 backdrop-blur-xl p-4 md:p-8 lg:p-12">
            <div className="text-center mb-4 md:mb-6 lg:mb-8">
              <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 md:mb-4">
                {currentQuestion?.title}
              </h2>
              <p className="text-sm md:text-base lg:text-lg text-gray-300">
                {currentQuestion?.subtitle}
              </p>
            </div>

            {/* Question Content */}
            <div className="space-y-3 md:space-y-4 lg:space-y-6">
              {currentQuestion?.type === "choice" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {currentQuestion.options?.map((option: any) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        handleAnswer(currentQuestion.id, option.value)
                      }
                      className="group p-4 md:p-6 rounded-xl border-2 border-white/10 hover:border-sky-500/50 transition-all duration-300 text-left bg-white/5 hover:bg-white/10"
                    >
                      <div className="flex items-start space-x-3 md:space-x-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                          <option.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold text-white mb-1 md:mb-2">
                            {option.label}
                          </h3>
                          <p className="text-sm md:text-base text-gray-400">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion?.type === "slider" && (
                <div className="space-y-6 md:space-y-8">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent mb-2">
                      {currentQuestion.formatValue?.(
                        answers[currentQuestion.id] ||
                          currentQuestion.defaultValue
                      )}
                    </div>
                    <p className="text-sm md:text-base text-gray-400">
                      Slide to adjust your budget
                    </p>
                  </div>

                  <div className="px-2 md:px-4 lg:px-8">
                    <Slider
                      value={[
                        answers[currentQuestion.id] ||
                          currentQuestion.defaultValue,
                      ]}
                      onValueChange={(value) =>
                        setAnswers({
                          ...answers,
                          [currentQuestion.id]: value[0],
                        })
                      }
                      min={currentQuestion.min}
                      max={currentQuestion.max}
                      step={currentQuestion.step}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-xs md:text-sm text-gray-400">
                      <span>
                        {currentQuestion.formatValue?.(
                          currentQuestion.min || 0
                        )}
                      </span>
                      <span>
                        {currentQuestion.formatValue?.(
                          currentQuestion.max || 0
                        )}
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
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-8 py-3 w-full sm:w-auto"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            {currentStep > 0 && (
              <div className="mt-6 md:mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Question
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
