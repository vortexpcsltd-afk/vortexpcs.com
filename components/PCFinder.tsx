<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { AspectRatio } from './ui/aspect-ratio';
import { CheckCircle, ArrowRight, ArrowLeft, Monitor, Gamepad, Palette, Briefcase, Code, Home, HardDrive, Zap, Wifi, Shield, Clock, Star, Settings, Sparkles, Package, Eye, Layers, TrendingUp, ChevronLeft, ChevronRight, ShoppingCart, Bookmark, Heart } from 'lucide-react';

// Dark themed placeholder image
const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64," + btoa(`
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
const ProductImageGallery = ({ images, productName }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Use placeholder images for now (up to 6)
  const productImages = images && images.length > 0 ? images : Array(6).fill(PLACEHOLDER_IMAGE);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <>
      {/* Main product image */}
      <div className="relative group cursor-pointer" onClick={() => setIsGalleryOpen(true)}>
        <AspectRatio ratio={16 / 10} className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900">
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
            <Button size="sm" variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-white/20 hover:bg-black/70">
              <Eye className="w-4 h-4 mr-2" />
              View Gallery
            </Button>
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-white/20">
              {currentImageIndex + 1} / {productImages.length}
            </Badge>
          </div>

          {/* Navigation arrows */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70 flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
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
            {productImages.slice(0, 6).map((image, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentImageIndex
                    ? 'border-sky-500 shadow-lg shadow-sky-500/25'
                    : 'border-white/10 hover:border-white/30'
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
              <Badge variant="secondary" className="bg-black/70 backdrop-blur-md text-white border-white/20">
                {currentImageIndex + 1} / {productImages.length}
              </Badge>
            </div>
          </div>

          {/* Gallery thumbnails */}
          <div className="grid grid-cols-6 gap-3 mt-4">
            {productImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentImageIndex
                    ? 'border-sky-500 shadow-lg shadow-sky-500/25'
                    : 'border-white/10 hover:border-white/30'
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

export function PCFinder({ setCurrentView, setRecommendedBuild }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [questionHistory, setQuestionHistory] = useState([]);

  // Question flow with branching logic
  const getQuestions = () => {
    const questions = [
      {
        id: 'purpose',
        title: "What will you mainly use your PC for?",
        subtitle: "Let's start with the basics - what's driving your need for a new PC?",
        type: 'choice',
        options: [
          { value: 'gaming', label: 'Gaming', icon: Gamepad, description: 'Latest games, high frame rates, competitive edge' },
          { value: 'creative', label: 'Creative Work', icon: Palette, description: 'Video editing, 3D rendering, design work' },
          { value: 'professional', label: 'Professional Work', icon: Briefcase, description: 'Office tasks, productivity, business applications' },
          { value: 'development', label: 'Development', icon: Code, description: 'Programming, software development, virtualization' },
          { value: 'home', label: 'Home & Media', icon: Home, description: 'Browsing, streaming, light productivity' }
        ]
      },
      {
        id: 'budget',
        title: "What's your budget range?",
        subtitle: "This helps us recommend the best components for your investment",
        type: 'slider',
        min: 500,
        max: 5000,
        step: 100,
        defaultValue: 1500,
        formatValue: (value) => `£${value.toLocaleString()}`
      },
      {
        id: 'gaming_detail',
        title: "What type of gaming experience do you want?",
        subtitle: "Tell us about your gaming ambitions",
        type: 'choice',
        condition: (answers) => answers.purpose === 'gaming',
        options: [
          { value: '1080p_budget', label: '1080p Gaming', icon: Monitor, description: '60-120 FPS at 1080p resolution' },
          { value: '1440p_high', label: '1440p High-Refresh', icon: Monitor, description: '120+ FPS at 1440p resolution' },
          { value: '4k_ultra', label: '4K Ultra Gaming', icon: Monitor, description: '60+ FPS at 4K resolution with max settings' },
          { value: 'competitive', label: 'Competitive Gaming', icon: Zap, description: '240+ FPS for competitive advantages' }
        ]
      },
      {
        id: 'creative_detail',
        title: "What type of creative work do you do?",
        subtitle: "Different creative tasks have different hardware needs",
        type: 'choice',
        condition: (answers) => answers.purpose === 'creative',
        options: [
          { value: 'video_editing', label: 'Video Editing', icon: Monitor, description: '4K editing, colour grading, motion graphics' },
          { value: '3d_rendering', label: '3D Rendering', icon: Package, description: 'Blender, Maya, architectural visualization' },
          { value: 'streaming', label: 'Content Creation', icon: Wifi, description: 'Streaming, YouTube, social media content' },
          { value: 'photo_editing', label: 'Photo Editing', icon: Palette, description: 'Photoshop, Lightroom, graphic design' }
        ]
      },
      {
        id: 'storage_needs',
        title: "How much storage do you need?",
        subtitle: "Consider your games, projects, and media files",
        type: 'choice',
        options: [
          { value: '500gb', label: '500GB Fast SSD', icon: HardDrive, description: 'Essential programs and a few games' },
          { value: '1tb', label: '1TB Fast SSD', icon: HardDrive, description: 'Good balance for most users' },
          { value: '2tb', label: '2TB Fast SSD', icon: HardDrive, description: 'Large game library or creative projects' },
          { value: '1tb_plus_hdd', label: '1TB SSD + 2TB HDD', icon: HardDrive, description: 'Fast boot drive plus mass storage' }
        ]
      },
      {
        id: 'timeline',
        title: "When do you need your PC?",
        subtitle: "Our standard build time is 5 days, but we can prioritise if needed",
        type: 'choice',
        options: [
          { value: 'standard', label: 'Standard (5 days)', icon: Clock, description: 'Our normal premium build service' },
          { value: 'rush', label: 'Rush (2-3 days)', icon: Zap, description: '+£150 priority build fee' },
          { value: 'flexible', label: 'I can wait', icon: Shield, description: 'Flexible timing for best component deals' }
        ]
      }
    ];

    return questions.filter(q => !q.condition || q.condition(answers));
  };

  const questions = getQuestions();
  const currentQuestion = questions[currentStep];

  const handleAnswer = (questionId, value) => {
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

  const generateRecommendations = (finalAnswers) => {
    // Enhanced recommendation logic
    const recommendations = generateBuildRecommendations(finalAnswers);
    setRecommendedBuild(recommendations[0]); // Set the primary recommendation
    setShowResults(true);
  };

  // Generate personalized expert comments based on configuration
  const generateExpertComments = (answers, buildType) => {
    const comments = [];
    
    // Purpose-specific insights
    if (answers.purpose === 'gaming') {
      if (answers.gaming_detail === '4k_ultra') {
        comments.push("We've selected the RTX 4090 for its exceptional 4K performance – you'll experience native 4K gaming at high frame rates without compromise. The 24GB VRAM ensures future-proofing for upcoming AAA titles.");
        comments.push("The combination of DDR5-6400 RAM and Gen5 NVMe storage eliminates bottlenecks, delivering instantaneous load times and seamless texture streaming in demanding open-world games.");
      } else if (answers.gaming_detail === '1440p_high') {
        comments.push("The RTX 4070 Ti Super hits the sweet spot for 1440p gaming – delivering consistently high frame rates whilst maintaining excellent value. Its 16GB VRAM provides headroom for texture-heavy titles and future releases.");
        comments.push("We've paired this with a 9800X3D for its industry-leading gaming cache technology, ensuring maximum FPS in CPU-intensive titles like strategy games and flight simulators.");
      } else if (answers.gaming_detail === 'competitive') {
        comments.push("For competitive gaming, we've prioritised high frame rates and low latency. This configuration will easily maintain 240+ FPS in esports titles, giving you the competitive edge you need.");
      } else {
        comments.push("This 1080p configuration delivers exceptional performance for modern gaming. The RTX 4060 Ti's 16GB VRAM is uncommon at this tier – we've included it to ensure smooth performance with high texture settings and ray tracing enabled.");
      }
    } else if (answers.purpose === 'creative') {
      if (answers.creative_detail === 'video_editing') {
        comments.push("The 64GB DDR5-6400 RAM is essential for 4K timeline scrubbing and multi-layer colour grading in Premiere Pro and DaVinci Resolve. This capacity allows you to work with RED and ARRI RAW footage without proxies.");
        comments.push("We've specified Gen5 NVMe storage for your cache and project files – the increased sequential read speeds dramatically reduce export times and enable real-time playback of complex timelines.");
      } else if (answers.creative_detail === '3d_rendering') {
        comments.push("The RTX 4070 Ti Super offers excellent CUDA core count for GPU-accelerated rendering in Blender Cycles and Octane. Combined with the 16-core CPU, you'll see significant improvements in both interactive viewport performance and final render times.");
        comments.push("We've configured ample storage for your asset libraries and render output – the Gen5 NVMe ensures your scene files load instantly, even with heavy texture sets.");
      } else if (answers.creative_detail === 'streaming') {
        comments.push("This configuration excels at simultaneous gaming and streaming. The NVIDIA encoder handles stream encoding with minimal performance impact, whilst the multi-core CPU manages OBS, chat overlays, and background tasks effortlessly.");
      }
    } else if (answers.purpose === 'development') {
      comments.push("The 64GB RAM and 16-core CPU are specifically chosen for running multiple Docker containers and virtual machines simultaneously. You'll be able to run entire development environments without performance degradation.");
      comments.push("Fast NVMe storage significantly improves compilation times for large codebases. We've also included ample capacity for local databases and test environments.");
    }
    
    // Storage-specific insights
    if (answers.storage_needs === '2tb') {
      comments.push("The 2TB Gen4 NVMe provides exceptional capacity for modern games (which often exceed 100GB each) or large creative projects, whilst maintaining consistent performance even when the drive is nearly full.");
    } else if (answers.storage_needs === '1tb_plus_hdd') {
      comments.push("We've configured a dual-drive setup: fast NVMe for your OS and active projects, plus a high-capacity HDD for archives and media libraries – offering the perfect balance of speed and capacity.");
    }
    
    // Timeline insights
    if (answers.timeline === 'rush') {
      comments.push("Your priority build will be assembled by our lead technicians and undergo expedited testing. We'll personally ensure every component meets our exacting standards before dispatch.");
    }
    
    // Budget-tier specific insights
    if (answers.budget >= 3000) {
      comments.push("At this tier, we source only flagship components with proven reliability. Every part is stress-tested for 24 hours before assembly to ensure absolute stability under sustained workloads.");
    }
    
    return comments;
  };

  const generateBuildRecommendations = (answers) => {
    // This is a simplified recommendation engine
    const builds = [];
    
    // Determine performance tier
    let performanceTier = 'mid';
    if (answers.budget >= 3000) performanceTier = 'extreme';
    else if (answers.budget >= 2000) performanceTier = 'high';
    else if (answers.budget >= 1000) performanceTier = 'mid';
    else performanceTier = 'budget';

    // Build recommendations based on purpose and budget
    if (answers.purpose === 'gaming') {
      if (answers.gaming_detail === '4k_ultra' || performanceTier === 'extreme') {
        builds.push({
          name: "Gaming Beast 4K",
          price: Math.min(answers.budget, 4500),
          category: "Ultimate Gaming",
          description: "Crushes 4K gaming with RTX 4090 and latest processors",
          specs: {
            cpu: "Intel Core Ultra 9 285K or AMD Ryzen 9 9950X3D",
            gpu: "RTX 4090 24GB",
            ram: "32GB DDR5-6400 RGB",
            storage: "2TB NVMe Gen5 + 2TB HDD",
            cooling: "360mm RGB AIO"
          },
          features: ["4K 60+ FPS", "Ray Tracing Ultra", "DLSS 3.0", "3-Year Warranty"],
          images: Array(6).fill(PLACEHOLDER_IMAGE),
          expertComments: generateExpertComments(answers, '4k_ultra')
        });
      } else if (answers.gaming_detail === '1440p_high' || performanceTier === 'high') {
        builds.push({
          name: "Gaming Master 1440p",
          price: Math.min(answers.budget, 2500),
          category: "High-Performance Gaming",
          description: "Perfect for 1440p high-refresh gaming with RTX 4070 Ti",
          specs: {
            cpu: "AMD Ryzen 7 9800X3D or Intel Core i7-14700K",
            gpu: "RTX 4070 Ti Super 16GB",
            ram: "32GB DDR5-6000 RGB",
            storage: "1TB NVMe Gen4 + 1TB HDD",
            cooling: "280mm AIO"
          },
          features: ["1440p 120+ FPS", "Ray Tracing High", "DLSS 3.0", "3-Year Warranty"],
          images: Array(6).fill(PLACEHOLDER_IMAGE),
          expertComments: generateExpertComments(answers, '1440p_high')
        });
      } else {
        builds.push({
          name: "Gaming Core 1080p",
          price: Math.min(answers.budget, 1500),
          category: "Performance Gaming",
          description: "Excellent 1080p gaming performance with modern features",
          specs: {
            cpu: "AMD Ryzen 5 9600X or Intel Core i5-13400F",
            gpu: "RTX 4060 Ti 16GB",
            ram: "16GB DDR5-5600",
            storage: "1TB NVMe Gen4",
            cooling: "240mm AIO"
          },
          features: ["1080p 144+ FPS", "Ray Tracing Medium", "DLSS 3.0", "3-Year Warranty"],
          images: Array(6).fill(PLACEHOLDER_IMAGE),
          expertComments: generateExpertComments(answers, '1080p')
        });
      }
    } else if (answers.purpose === 'creative') {
      builds.push({
        name: "Creator Workstation Pro",
        price: Math.min(answers.budget, 3500),
        category: "Creative Workstation",
        description: "Optimised for video editing, 3D rendering, and creative workflows",
        specs: {
          cpu: "AMD Ryzen 9 9950X or Intel Core Ultra 9 285K",
          gpu: "RTX 4070 Ti Super 16GB",
          ram: "64GB DDR5-6400",
          storage: "2TB NVMe Gen5 + 4TB HDD",
          cooling: "360mm AIO"
        },
        features: ["4K Video Editing", "GPU Acceleration", "64GB RAM", "3-Year Warranty"],
        images: Array(6).fill(PLACEHOLDER_IMAGE),
        expertComments: generateExpertComments(answers, 'creative')
      });
    } else if (answers.purpose === 'development') {
      builds.push({
        name: "Developer Powerhouse",
        price: Math.min(answers.budget, 2800),
        category: "Development Workstation",
        description: "Multi-core performance for compilation, VMs, and development",
        specs: {
          cpu: "AMD Ryzen 9 9950X or Intel Core Ultra 9 285K",
          gpu: "RTX 4060 Ti 16GB",
          ram: "64GB DDR5-6000",
          storage: "2TB NVMe Gen4 + 2TB HDD",
          cooling: "280mm AIO"
        },
        features: ["16+ Cores", "Fast Compilation", "VM Ready", "3-Year Warranty"],
        images: Array(6).fill(PLACEHOLDER_IMAGE),
        expertComments: generateExpertComments(answers, 'development')
      });
    } else {
      builds.push({
        name: "Home & Office Pro",
        price: Math.min(answers.budget, 1200),
        category: "Productivity & Media",
        description: "Perfect for daily tasks, media consumption, and light productivity",
        specs: {
          cpu: "AMD Ryzen 5 7600 or Intel Core i5-12400F",
          gpu: "RTX 4060 8GB",
          ram: "16GB DDR5-5600",
          storage: "1TB NVMe Gen4",
          cooling: "240mm AIO"
        },
        features: ["Silent Operation", "Energy Efficient", "4K Media", "3-Year Warranty"],
        images: Array(6).fill(PLACEHOLDER_IMAGE),
        expertComments: generateExpertComments(answers, 'home')
      });
    }

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
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 mb-4">
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              <span className="text-sm text-green-300">Perfect Match Found</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
              Your Ideal PC Build
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Based on your requirements, we've found the perfect configuration for your needs and budget
            </p>
          </div>

          {/* Recommendations Grid */}
          <div className="grid gap-8 max-w-6xl mx-auto">
            {recommendations.map((build, index) => (
              <Card key={index} className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 backdrop-blur-xl overflow-hidden group hover:border-sky-500/30 transition-all duration-300">
                <div className="grid lg:grid-cols-2 gap-8 p-8">
                  {/* Product Images */}
                  <div className="space-y-6">
                    <ProductImageGallery images={build.images} productName={build.name} />
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setCurrentView('pc-builder')}
                        className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white border-0"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Customise Build
                      </Button>
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="secondary" className="bg-sky-500/20 text-sky-300 border-sky-500/30">
                          {build.category}
                        </Badge>
                        <div className="flex items-center text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                          <span className="ml-2 text-sm text-gray-400">(4.9/5)</span>
                        </div>
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2">{build.name}</h2>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                          £{build.price.toLocaleString()}
                        </span>
                        <span className="text-lg text-gray-400">inc. VAT</span>
                      </div>
                    </div>

                    <p className="text-gray-300 text-lg leading-relaxed">{build.description}</p>

                    {/* Expert Comments */}
                    {build.expertComments && build.expertComments.length > 0 && (
                      <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-sky-400" />
                          </div>
                          <h3 className="font-bold text-white">Kevin's Insight</h3>
                        </div>
                        {build.expertComments.map((comment, idx) => (
                          <p key={idx} className="text-sm text-gray-300 leading-relaxed pl-10">
                            {comment}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Specifications */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-white">Key Specifications</h3>
                      <div className="grid gap-3">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-gray-400">Processor</span>
                          <span className="text-white font-medium">{build.specs.cpu}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-gray-400">Graphics Card</span>
                          <span className="text-white font-medium">{build.specs.gpu}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-gray-400">Memory</span>
                          <span className="text-white font-medium">{build.specs.ram}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-gray-400">Storage</span>
                          <span className="text-white font-medium">{build.specs.storage}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-gray-400">Cooling</span>
                          <span className="text-white font-medium">{build.specs.cooling}</span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-white">Key Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {build.features.map((feature, featureIndex) => (
                          <Badge key={featureIndex} variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-sky-400" />
                        <div>
                          <p className="text-white font-medium">5-Day Premium Build Service</p>
                          <p className="text-sm text-gray-400">Built, tested, and delivered within 5 working days</p>
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
              onClick={() => setCurrentView('pc-builder')}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-8 py-3"
            >
              <Settings className="w-4 h-4 mr-2" />
              Build from Scratch
            </Button>
=======
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Award, Shield, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

interface PCFinderProps {
  onComplete: (build: BuildConfig) => void;
  onNavigate: (page: string) => void;
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

export function PCFinder({ onComplete, onNavigate }: PCFinderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<Partial<BuildConfig>>({});

  const questions = [
    {
      id: 'useCase',
      title: 'What will you primarily use your PC for?',
      options: [
        { value: 'Gaming', icon: '🎮', description: 'AAA titles, competitive gaming, streaming' },
        { value: 'Creative', icon: '🎨', description: 'Video editing, 3D rendering, design work' },
        { value: 'Office', icon: '💼', description: 'Productivity, web browsing, office tasks' },
        { value: 'Streaming', icon: '📹', description: 'Content creation, live streaming, recording' },
        { value: 'Mixed', icon: '⚡', description: 'Gaming, work, and content creation' },
        { value: 'General Use', icon: '🏠', description: 'Everyday computing, browsing, light tasks' },
      ],
    },
    {
      id: 'performanceTier',
      title: 'What performance level do you need?',
      options: [
        { value: 'Entry', icon: '🌱', description: '1080p gaming, basic tasks' },
        { value: 'Mid', icon: '⚙️', description: '1440p gaming, multitasking' },
        { value: 'High', icon: '🚀', description: '4K gaming, heavy workloads' },
        { value: 'Ultra', icon: '💎', description: 'No compromises, maximum performance' },
      ],
    },
    {
      id: 'budget',
      title: 'What\'s your budget?',
      options: [
        { value: '£500-£1000', icon: '💷', description: 'Great value builds' },
        { value: '£1000-£1500', icon: '💰', description: 'Sweet spot for performance' },
        { value: '£1500-£2500', icon: '💵', description: 'High-end systems' },
        { value: '£2500+', icon: '👑', description: 'Premium, no limits' },
      ],
    },
    {
      id: 'formFactor',
      title: 'What form factor suits you?',
      options: [
        { value: 'Tower', icon: '🏢', description: 'Full-size, maximum expandability' },
        { value: 'Mini', icon: '📦', description: 'Compact, space-saving design' },
        { value: 'Silent', icon: '🔇', description: 'Quiet operation priority' },
        { value: 'RGB Showcase', icon: '🌈', description: 'Glass panel, lighting' },
      ],
    },
    {
      id: 'aesthetic',
      title: 'What\'s your preferred aesthetic?',
      options: [
        { value: 'Stealth', icon: '⚫', description: 'Minimal, all black, no RGB' },
        { value: 'RGB', icon: '🎨', description: 'Full RGB lighting, vibrant' },
        { value: 'White', icon: '⚪', description: 'Clean white build' },
        { value: 'Compact', icon: '📐', description: 'Small form factor focus' },
        { value: 'Industrial', icon: '🔩', description: 'Exposed components, raw look' },
      ],
    },
    {
      id: 'noiseTolerance',
      title: 'How important is quiet operation?',
      options: [
        { value: 'Silent', icon: '🤫', description: 'Must be whisper quiet' },
        { value: 'Moderate', icon: '🔉', description: 'Low noise preferred' },
        { value: "Doesn't matter", icon: '🔊', description: 'Performance over noise' },
      ],
    },
    {
      id: 'futureProofing',
      title: 'Future-proofing preferences?',
      options: [
        { value: 'Upgrade-ready', icon: '🔧', description: 'Easy to upgrade later' },
        { value: 'Plug-and-play', icon: '🎯', description: 'Complete now, minimal changes' },
        { value: 'Minimal maintenance', icon: '✨', description: 'Set and forget' },
      ],
    },
    {
      id: 'deliveryUrgency',
      title: 'When do you need it?',
      options: [
        { value: 'ASAP', icon: '⚡', description: 'As soon as possible' },
        { value: 'Within 2 weeks', icon: '📅', description: 'Standard timeframe' },
        { value: 'Custom timeline', icon: '🕐', description: 'Flexible delivery' },
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
    const tier = answers.performanceTier || 'Mid';
    const useCase = answers.useCase || 'Gaming';
    const budget = answers.budget || '£1000-£1500';

    const recommendations: Record<string, BuildRecommendation> = {
      'Entry-Gaming': {
        name: 'Vortex Starter Gaming',
        cpu: 'AMD Ryzen 5 5600',
        gpu: 'NVIDIA RTX 4060',
        motherboard: 'MSI B550 Gaming Plus (AM4 • DDR4 • ATX)',
        ram: '16GB DDR4 3200MHz',
        storage: '500GB NVMe SSD',
        psu: '550W 80+ Bronze',
        case: 'NZXT H510 Flow',
        cooling: 'Stock CPU Cooler',
        performanceBadge: '1080p Gaming Champion',
        price: '£749',
        description: 'Perfect entry into PC gaming with solid 1080p performance.',
      },
      'Mid-Gaming': {
        name: 'Vortex Performance Gaming',
        cpu: 'AMD Ryzen 7 5700X',
        gpu: 'NVIDIA RTX 4070',
        motherboard: 'MSI B550 Gaming Plus (AM4 • DDR4 • ATX)',
        ram: '32GB DDR4 3600MHz',
        storage: '1TB NVMe Gen4 SSD',
        psu: '750W 80+ Gold',
        case: 'Fractal Meshify 2',
        cooling: 'Arctic Liquid Freezer II 240',
        performanceBadge: '1440p Ultra Gaming',
        price: '£1,349',
        description: 'Exceptional 1440p performance with future-proof specs.',
      },
      'High-Gaming': {
        name: 'Vortex Elite Gaming',
        cpu: 'Intel Core i7-14700K',
        gpu: 'NVIDIA RTX 4080',
        motherboard: 'MSI Z790 Gaming Plus WiFi (LGA1700 • DDR5 • ATX)',
        ram: '32GB DDR5 6000MHz',
        storage: '2TB NVMe Gen4 SSD',
        psu: '850W 80+ Platinum',
        case: 'Lian Li O11 Dynamic EVO',
        cooling: 'Arctic Liquid Freezer III 360',
        performanceBadge: '4K Gaming Beast',
        price: '£2,199',
        description: 'Dominate 4K gaming with ultra settings and high framerates.',
      },
      'Ultra-Gaming': {
        name: 'Vortex Apex Gaming',
        cpu: 'Intel Core i9-14900K',
        gpu: 'NVIDIA RTX 4090',
        motherboard: 'ASUS ROG Strix Z790-E (LGA1700 • DDR5 • ATX)',
        ram: '64GB DDR5 6400MHz',
        storage: '4TB NVMe Gen4 SSD',
        psu: '1000W 80+ Titanium',
        case: 'Lian Li O11 Dynamic EVO XL',
        cooling: 'Arctic Liquid Freezer III 420',
        performanceBadge: 'Ultimate 4K Gaming',
        price: '£3,499',
        description: 'The absolute pinnacle of gaming performance.',
      },
      'Mid-Creative': {
        name: 'Vortex Creator Pro',
        cpu: 'AMD Ryzen 9 7900X',
        gpu: 'NVIDIA RTX 4070 Ti',
        motherboard: 'ASUS TUF B650-PLUS (AM5 • DDR5 • ATX)',
        ram: '64GB DDR5 5600MHz',
        storage: '2TB NVMe Gen4 SSD + 2TB HDD',
        psu: '850W 80+ Gold',
        case: 'Fractal Define 7',
        cooling: 'Noctua NH-D15',
        performanceBadge: 'Professional Workstation',
        price: '£2,099',
        description: 'Optimised for video editing, 3D work, and creative tasks.',
      },
      'High-Creative': {
        name: 'Vortex Studio Elite',
        cpu: 'AMD Ryzen 9 7950X',
        gpu: 'NVIDIA RTX 4080',
        motherboard: 'ASUS ROG Strix X670E-E (AM5 • DDR5 • ATX)',
        ram: '128GB DDR5 5600MHz',
        storage: '4TB NVMe Gen4 SSD + 4TB HDD',
        psu: '1000W 80+ Platinum',
        case: 'Fractal Define 7 XL',
        cooling: 'Arctic Liquid Freezer III 360',
        performanceBadge: 'Creative Powerhouse',
        price: '£3,299',
        description: 'Maximum multi-core performance for professional workflows.',
      },
    };

    const key = `${tier}-${useCase}`;
    return recommendations[key] || recommendations['Mid-Gaming'];
  };

  const recommendation = generateRecommendation();
  const progress = ((currentStep + 1) / questions.length) * 100;

  const generateFounderQuote = (): string => {
    const useCase = answers.useCase || 'Gaming';
    const tier = answers.performanceTier || 'Mid';
    const aesthetic = answers.aesthetic || 'RGB';
    const { cpu, gpu, ram } = recommendation;

    const quotes: Record<string, string[]> = {
      'Gaming-Entry': [
        `The ${gpu} is a brilliant 1080p gaming card that punches well above its weight. Combined with the ${cpu}, you're getting incredible value without compromise.`,
        `I've built dozens of systems with this ${cpu} and ${gpu} combo - it delivers smooth gameplay in every modern title at 1080p. Perfect starter build.`,
      ],
      'Gaming-Mid': [
        `This ${gpu} paired with ${ram} is the sweet spot for 1440p gaming. You'll get ultra settings with gorgeous frame rates in demanding titles like Cyberpunk 2077 and Starfield.`,
        `The ${cpu} combined with the ${gpu} gives you exceptional 1440p performance with plenty of headroom for streaming. This is what I'd build for myself.`,
      ],
      'Gaming-High': [
        `With the ${gpu} and ${cpu}, you're looking at buttery-smooth 4K gaming with ray tracing enabled. This is a serious enthusiast-grade system that won't disappoint.`,
        `I personally use a similar setup with the ${gpu} - it absolutely demolishes 4K gaming. Add in ${ram} and you're future-proofed for years to come.`,
      ],
      'Gaming-Ultra': [
        `The ${gpu} is simply the most powerful gaming GPU available. Paired with the ${cpu} and ${ram}, this is the ultimate no-compromise gaming machine.`,
        `This is flagship territory - the ${gpu} delivers uncompromising 4K performance with all the eye candy maxed out. Worth every penny for serious gamers.`,
      ],
      'Creative-Mid': [
        `For video editing and 3D work, the ${ram} combined with the ${cpu}'s multi-core prowess will slice through 4K timelines like butter. The ${gpu} accelerates renders beautifully.`,
        `This workstation spec with ${ram} is perfect for Adobe Creative Cloud and DaVinci Resolve. The ${cpu} handles background renders while you keep working.`,
      ],
      'Creative-High': [
        `With ${ram} and the ${cpu}, you've got a professional content creation beast. The ${gpu} will accelerate your renders and handle GPU-intensive effects with ease.`,
        `I spec'd similar systems for our video production clients - the ${ram} means no more waiting, and the ${cpu} keeps everything responsive even under heavy workloads.`,
      ],
      'Office-Entry': [
        `This build is perfectly tuned for productivity work - fast, reliable, and energy efficient. The ${cpu} handles multitasking effortlessly without the overkill.`,
        `Sometimes less is more. This ${cpu} setup gives you snappy performance for office work, browsing, and video calls without unnecessary expense.`,
      ],
      'Streaming-Mid': [
        `The ${cpu} has excellent encoding capabilities for streaming. Combined with ${ram}, you can game and stream simultaneously without dropping frames.`,
        `For content creators, this ${cpu} and ${gpu} combo handles OBS, multiple browser tabs, and Discord all at once. Your stream will look crisp and professional.`,
      ],
      'Mixed-High': [
        `This versatile powerhouse does it all - gaming, streaming, productivity, and content creation. The ${cpu} and ${ram} give you true multitasking capability.`,
        `With the ${gpu} and ${ram}, you can edit videos in the morning, game at 4K in the afternoon, and stream in the evening. Ultimate flexibility.`,
      ],
    };

    const aestheticAddons: Record<string, string> = {
      'RGB': ' Plus with full RGB lighting, it will look absolutely stunning on your desk.',
      'White': ' The clean white aesthetic will make this a gorgeous centrepiece for any setup.',
      'Stealth': ' The stealthy all-black design is pure class - minimal and professional.',
      'Industrial': ' The industrial aesthetic with exposed components gives it serious character.',
      'Compact': ' The compact form factor means serious performance without dominating your desk space.',
    };

    const key = `${useCase}-${tier}`;
    const quoteOptions = quotes[key] || quotes['Gaming-Mid'];
    const selectedQuote = quoteOptions[Math.floor(Math.random() * quoteOptions.length)];
    const aestheticAddon = aesthetic ? (aestheticAddons[aesthetic] || '') : '';

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
                Answer a few quick questions. We'll recommend a build that fits your needs, style, and budget.
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
            <p className="text-xl text-gray-400">Based on your preferences, we recommend:</p>
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
                        <span className="text-sm text-gray-300">{recommendation.performanceBadge}</span>
                      </div>
                    </div>
                    {/* Platform Info Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {recommendation.motherboard.includes('AM4') ? 'AM4 Platform' : 
                         recommendation.motherboard.includes('AM5') ? 'AM5 Platform' : 'LGA1700 Platform'}
                      </Badge>
                      <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                        {recommendation.ram.includes('DDR5') ? 'DDR5 Memory' : 'DDR4 Memory'}
                      </Badge>
                      <Badge variant="secondary" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
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

                <p className="text-gray-300 mb-8">{recommendation.description}</p>

                <div className="space-y-4 mb-8">
                  {[
                    { label: 'Processor', value: recommendation.cpu },
                    { label: 'Graphics Card', value: recommendation.gpu },
                    { label: 'Motherboard', value: recommendation.motherboard },
                    { label: 'Memory', value: recommendation.ram },
                    { label: 'Storage', value: recommendation.storage },
                    { label: 'Power Supply', value: recommendation.psu },
                    { label: 'Case', value: recommendation.case },
                    { label: 'Cooling', value: recommendation.cooling },
                  ].map((spec, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-gray-400">{spec.label}</span>
                      <span className="text-white">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => onComplete(answers as BuildConfig)}
                    className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600"
                  >
                    Customise This Build
                  </Button>
                  <Button
                    onClick={() => {
                      // Mock save functionality
                      alert('Build saved to your account!');
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
                    { icon: Award, text: 'Vortex Verified Components' },
                    { icon: Shield, text: 'Collect & Return Eligible' },
                    { icon: Sparkles, text: 'Lifetime Support Option' },
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
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581
          </div>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-sky-400 mr-2" />
            <span className="text-sm text-sky-300">AI-Powered PC Finder</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
            Find Your Perfect PC
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Our intelligent questionnaire will help you discover the ideal PC configuration for your specific needs and budget
          </p>
        </div>

        {/* Progress */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-400">Question {currentStep + 1} of {questions.length}</span>
            <span className="text-sm text-gray-400">{Math.round(((currentStep + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <Progress 
            value={((currentStep + 1) / questions.length) * 100} 
            className="h-2 bg-white/10"
          />
        </div>

        {/* Question Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/10 backdrop-blur-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {currentQuestion?.title}
              </h2>
              <p className="text-lg text-gray-300">
                {currentQuestion?.subtitle}
              </p>
            </div>

            {/* Question Content */}
            <div className="space-y-6">
              {currentQuestion?.type === 'choice' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(currentQuestion.id, option.value)}
                      className="group p-6 rounded-xl border-2 border-white/10 hover:border-sky-500/50 transition-all duration-300 text-left bg-white/5 hover:bg-white/10"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <option.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{option.label}</h3>
                          <p className="text-gray-400">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion?.type === 'slider' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent mb-2">
                      {currentQuestion.formatValue(answers[currentQuestion.id] || currentQuestion.defaultValue)}
                    </div>
                    <p className="text-gray-400">Slide to adjust your budget</p>
                  </div>
                  
                  <div className="px-8">
                    <Slider
                      value={[answers[currentQuestion.id] || currentQuestion.defaultValue]}
                      onValueChange={(value) => setAnswers({...answers, [currentQuestion.id]: value[0]})}
                      min={currentQuestion.min}
                      max={currentQuestion.max}
                      step={currentQuestion.step}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-sm text-gray-400">
                      <span>{currentQuestion.formatValue(currentQuestion.min)}</span>
                      <span>{currentQuestion.formatValue(currentQuestion.max)}</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button 
                      onClick={() => handleAnswer(currentQuestion.id, answers[currentQuestion.id] || currentQuestion.defaultValue)}
                      className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-8 py-3"
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
              <div className="mt-8 text-center">
                <Button 
                  variant="outline" 
                  onClick={goBack}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Question
                </Button>
              </div>
            )}
          </Card>
=======
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
            <span className="text-sm text-gray-400">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="glass p-8 md:p-12 border-white/10 mb-8 rgb-glow">
          <h2 className="mb-8 text-center">{question.title}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {question.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.id, option.value)}
                className="glass p-6 rounded-xl border border-white/10 hover:border-blue-400/50 hover:bg-white/5 transition-all text-left group"
              >
                <div className="text-4xl mb-3">{option.icon}</div>
                <div className="text-lg mb-2 text-gray-200 group-hover:text-blue-400 transition-colors">
                  {option.value}
                </div>
                <div className="text-sm text-gray-400">{option.description}</div>
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
          <Button
            onClick={() => setShowIntro(true)}
            variant="ghost"
          >
            Cancel
          </Button>
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 037d06695c2ff190d50078afab895a9c0d22b581
