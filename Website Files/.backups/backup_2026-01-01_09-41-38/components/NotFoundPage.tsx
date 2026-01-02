import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Home,
  Search,
  Cpu,
  AlertTriangle,
  Zap,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";

interface NotFoundPageProps {
  onNavigate?: (view: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  const [glitchText, setGlitchText] = useState("404");
  const [particleCount, setParticleCount] = useState(0);

  // Easter egg counter
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  // Glitch effect on 404
  useEffect(() => {
    const glitchChars = ["4", "0", "4", "?", "!", "#", "@", "*"];
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const randomIndex = Math.floor(Math.random() * 3);
        const chars = glitchText.split("");
        chars[randomIndex] =
          glitchChars[Math.floor(Math.random() * glitchChars.length)];
        setGlitchText(chars.join(""));

        setTimeout(() => setGlitchText("404"), 100);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [glitchText]);

  // Particle animation counter
  useEffect(() => {
    const interval = setInterval(() => {
      setParticleCount((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Easter egg handler
  const handle404Click = () => {
    setClickCount((prev) => prev + 1);
    if (clickCount >= 6) {
      setShowEasterEgg(true);
      setTimeout(() => setShowEasterEgg(false), 5000);
      setClickCount(0);
    }
  };

  const funnyMessages = [
    "This page has been overclocked out of existence! 🔥",
    "Error: Page.exe has stopped responding.",
    "Our AI couldn't find this page... and it's pretty smart.",
    "This page blue-screened harder than Windows 95.",
    "404: Your PC build is ready, but this page isn't.",
    "We searched through all our RAM slots... still can't find it.",
  ];

  const [funnyMessage] = useState(
    funnyMessages[Math.floor(Math.random() * funnyMessages.length)]
  );

  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate("home");
    } else {
      window.location.href = "/";
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-sky-500/30 rounded-full animate-float"
              style={{
                left: `${(i * 7 + particleCount) % 100}%`,
                top: `${(i * 13 + particleCount * 0.5) % 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${3 + i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Scanline effect */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/5 to-transparent opacity-50 animate-pulse"
          style={{ animationDuration: "4s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-4xl w-full">
          {/* Main 404 Display */}
          <div className="text-center mb-12">
            {/* Glitchy 404 */}
            <button
              onClick={handle404Click}
              className="relative inline-block mb-8 cursor-pointer focus:outline-none group"
            >
              <h1
                className="text-[12rem] md:text-[16rem] font-black leading-none bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent select-none"
                style={{
                  textShadow:
                    "0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(249, 115, 22, 0.3)",
                }}
              >
                {glitchText}
              </h1>
              {/* Glitch overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent opacity-0 group-hover:opacity-30 transition-opacity"
                style={{
                  clipPath: "inset(0 50% 0 0)",
                }}
              >
                <h1 className="text-[12rem] md:text-[16rem] font-black leading-none">
                  {glitchText}
                </h1>
              </div>
            </button>

            {/* Error Message */}
            <div className="space-y-4 mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Oops! Page Not Found
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                {funnyMessage}
              </p>
            </div>

            {/* Easter Egg */}
            {showEasterEgg && (
              <div className="mb-8 animate-bounce">
                <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 backdrop-blur-xl p-6 inline-block">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
                    <p className="text-white font-bold">
                      🎉 Achievement Unlocked: Professional Page Clicker!
                    </p>
                    <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Humorous Error Details */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8 md:p-12 mb-8">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-red-300 mb-2">
                  Error Code
                </h3>
                <p className="text-3xl font-mono text-white">404</p>
              </div>

              <div className="text-center p-6 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Cpu className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-orange-300 mb-2">
                  CPU Usage
                </h3>
                <p className="text-3xl font-mono text-white">0%</p>
                <p className="text-xs text-gray-400 mt-1">
                  (Nothing to process)
                </p>
              </div>

              <div className="text-center p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <HelpCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-yellow-300 mb-2">
                  Our Confusion
                </h3>
                <p className="text-3xl font-mono text-white">100%</p>
                <p className="text-xs text-gray-400 mt-1">(We're lost too)</p>
              </div>
            </div>

            {/* Troubleshooting Tips */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-sky-400" />
                Possible Causes:
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 flex-shrink-0">→</span>
                  <span>
                    The page you're looking for has been{" "}
                    <span className="text-red-400 font-semibold">
                      deleted by our AI
                    </span>{" "}
                    (it was deemed "not RGB enough")
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 flex-shrink-0">→</span>
                  <span>
                    The URL was{" "}
                    <span className="text-orange-400 font-semibold">
                      mistyped
                    </span>{" "}
                    (happens to the best of us, even our developers)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 flex-shrink-0">→</span>
                  <span>
                    This page is{" "}
                    <span className="text-purple-400 font-semibold">
                      currently being overclocked
                    </span>{" "}
                    to 5GHz and needs a moment
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sky-400 flex-shrink-0">→</span>
                  <span>
                    Our hamster running the server took a{" "}
                    <span className="text-green-400 font-semibold">
                      coffee break
                    </span>{" "}
                    🐹☕
                  </span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGoHome}
                size="lg"
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/50 hover:shadow-sky-500/70 transition-all duration-300"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
              <Button
                onClick={handleGoBack}
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={() => onNavigate?.("pc-finder")}
                size="lg"
                variant="outline"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Search className="w-5 h-5 mr-2" />
                Find a PC
              </Button>
            </div>
          </Card>

          {/* Fun Footer Message */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 border-purple-500/30 backdrop-blur-xl p-6 inline-block">
              <p className="text-gray-300 text-sm">
                💡 <span className="font-semibold text-white">Pro Tip:</span>{" "}
                While you're here, did you know our custom PCs can render this
                404 page at 240fps? 😎
              </p>
            </Card>
          </div>

          {/* Secret Message */}
          <div className="text-center mt-8 opacity-30 hover:opacity-100 transition-opacity">
            <p className="text-xs text-gray-500 font-mono">
              // TODO: Add page that actually exists here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
