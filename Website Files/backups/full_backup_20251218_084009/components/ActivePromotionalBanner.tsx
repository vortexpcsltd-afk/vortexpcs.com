import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { subscribeBanners, type Banner } from "../services/banners";

interface ActivePromotionalBannerProps {
  onBannerVisibilityChange?: (visible: boolean) => void;
}

export function ActivePromotionalBanner({
  onBannerVisibilityChange,
}: ActivePromotionalBannerProps) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to banners from Firestore
    const unsubscribe = subscribeBanners((banners) => {
      try {
        // Find the first active banner that should be displayed
        const now = new Date();
        const activeBanner = banners.find((b) => {
          if (!b.active) return false;

          // Check date range
          const startDate = new Date(b.startDate);
          if (startDate > now) return false;

          if (b.endDate) {
            const endDate = new Date(b.endDate);
            if (endDate < now) return false;
          }

          // For now, show all targeting (can add logic for new/returning/geographic later)
          return true;
        });

        if (activeBanner) {
          // Check if user dismissed this specific banner in this session
          const dismissedId = sessionStorage.getItem("dismissed-banner");
          if (dismissedId === activeBanner.id) {
            setDismissed(true);
            onBannerVisibilityChange?.(false);
            return;
          }

          setBanner(activeBanner);
          onBannerVisibilityChange?.(true);

          // Trigger slide-in animation after brief delay
          setTimeout(() => setIsVisible(true), 100);
        } else {
          onBannerVisibilityChange?.(false);
        }
      } catch (e) {
        console.error("Failed to load banners:", e);
        onBannerVisibilityChange?.(false);
      }
    });

    return () => unsubscribe();
  }, [onBannerVisibilityChange]);

  const handleClick = () => {
    // Click tracking can be added via Firestore if needed
    // For now, just navigate to the link
  };

  const handleDismiss = () => {
    // Animate out
    setIsVisible(false);

    // Wait for animation to complete before dismissing
    setTimeout(() => {
      setDismissed(true);
      onBannerVisibilityChange?.(false);
      if (banner) {
        sessionStorage.setItem("dismissed-banner", banner.id);
      }
    }, 300);
  };

  if (!banner || dismissed) return null;

  const getBackgroundClass = () => {
    // Use custom color if provided, otherwise use type-based color
    if (banner.color) {
      return banner.color;
    }

    switch (banner.type) {
      case "promo":
        return "bg-gradient-to-r from-sky-600 to-blue-600"; // Changed to blue gradient
      case "success":
        return "bg-gradient-to-r from-green-600 to-emerald-600";
      case "warning":
        return "bg-gradient-to-r from-yellow-600 to-orange-600";
      case "info":
        return "bg-gradient-to-r from-sky-600 to-blue-600";
      default:
        return "bg-gradient-to-r from-sky-600 to-blue-600";
    }
  };

  return (
    <div
      className={`${getBackgroundClass()} text-white py-3 px-4 transition-all duration-300 ease-in-out ${
        banner.position === "bottom"
          ? "fixed bottom-0 left-0 right-0 z-[9999]"
          : "fixed top-0 left-0 right-0 z-[9999]"
      } ${
        isVisible
          ? "opacity-100 translate-y-0"
          : banner.position === "bottom"
          ? "opacity-0 translate-y-full"
          : "opacity-0 -translate-y-full"
      }`}
      style={{
        position: "fixed",
        top: banner.position === "bottom" ? "auto" : 0,
        bottom: banner.position === "bottom" ? 0 : "auto",
        left: 0,
        right: 0,
      }}
    >
      <div className="container mx-auto flex items-center justify-center gap-4">
        <div className="flex-1 text-center">
          <p className="text-sm md:text-base font-medium">
            {banner.title} - {banner.message}
          </p>
        </div>

        {banner.link && banner.linkText && (
          <Button
            variant="secondary"
            size="sm"
            asChild
            onClick={handleClick}
            className="shrink-0"
          >
            <a href={banner.link} target="_blank" rel="noopener noreferrer">
              {banner.linkText}
            </a>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="shrink-0 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
