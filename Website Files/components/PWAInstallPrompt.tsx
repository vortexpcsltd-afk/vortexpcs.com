import { useState, useEffect } from "react";
import { logger } from "../services/logger";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, Download, Smartphone, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const trackPwaEvent = async (action: string) => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "event",
          payload: {
            eventType: "pwa_install",
            action,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            source: "pwa_prompt",
          },
        }),
      });
    } catch (error) {
      logger.warn("Failed to track PWA event", {
        error: String(error),
        action,
      });
    }
  };

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user already dismissed the prompt
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed =
      (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Don't show if dismissed within last 7 days
    if (dismissed && daysSinceDismissed < 7) {
      return;
    }

    const handler = (e: Event) => {
      // Prevent default browser install prompt
      e.preventDefault();

      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Track that the prompt was shown
      trackPwaEvent("prompt_shown");

      // Show custom install prompt after 15 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 15000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful installation
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem("pwa-install-dismissed");

      // Track app installation event
      trackPwaEvent("installed");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the browser's install prompt
    await deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      logger.info("User accepted PWA install");
      setIsInstalled(true);

      // Track successful PWA installation
      await trackPwaEvent("accepted");
    } else {
      logger.info("User dismissed PWA install");

      // Track PWA installation dismissal
      await trackPwaEvent("dismissed");
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());

    // Track prompt dismissal
    trackPwaEvent("prompt_dismissed");
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-slide-up">
      <Card className="bg-gradient-to-br from-sky-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl border-sky-500/30 shadow-2xl overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-blue-500/10 animate-pulse" />

        <div className="relative p-5">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 hover:border-white/20 transition-all group"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4 text-white/70 group-hover:text-white" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 pr-6">
              <h3 className="text-white font-bold text-lg mb-1">
                Install Vortex PCs
              </h3>
              <p className="text-sky-200 text-sm leading-relaxed mb-4">
                Install our app for a faster experience with offline access and
                quick shortcuts to PC Builder!
              </p>

              {/* Features */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-sky-300">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Works offline</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-sky-300">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Quick access from home screen</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-sky-300">
                  <Download className="w-3.5 h-3.5" />
                  <span>No app store needed</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Install
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  className="text-sky-200 hover:text-white hover:bg-white/10"
                >
                  Not Now
                </Button>
              </div>
            </div>
          </div>

          {/* Trust indicator */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-sky-300">
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Safe & Secure Installation</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
