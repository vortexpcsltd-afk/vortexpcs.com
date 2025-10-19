import React from "react";
import { Button } from "./ui/button";

interface CookieConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
  onSettings: () => void;
}

export function CookieConsentBanner({
  onAccept,
  onDecline,
  onSettings,
}: CookieConsentBannerProps) {
  return (
    <div className="fixed bottom-6 left-6 w-full max-w-md z-50 animate-in slide-in-from-bottom-8 duration-700">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-blue-500 rounded-2xl blur-lg opacity-40 animate-pulse"></div>

      {/* Main card */}
      <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-2xl border border-sky-500/30 rounded-2xl p-6 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-500/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-2xl"></div>

        <div className="relative space-y-4">
          {/* Header with animated cookie icon */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-500 rounded-full blur opacity-60 animate-pulse"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-sky-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="currentColor"
                      opacity="0.2"
                    />
                    <circle cx="8" cy="9" r="1.5" fill="currentColor" />
                    <circle cx="15" cy="10" r="1.2" fill="currentColor" />
                    <circle cx="10" cy="14" r="1.3" fill="currentColor" />
                    <circle cx="16" cy="15" r="1.4" fill="currentColor" />
                    <circle cx="12" cy="7" r="1" fill="currentColor" />
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                      fill="currentColor"
                      opacity="0.6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                Cookie Settings
                <span className="text-xs px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 rounded-full text-sky-400">
                  GDPR Compliant
                </span>
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                We use cookies to power up your experience! Our cookies help us
                remember your PC configurations, analyse performance, and serve
                you the best content.
                <button
                  onClick={onSettings}
                  className="text-sky-400 hover:text-sky-300 underline decoration-sky-500/50 underline-offset-2 transition-colors ml-1"
                >
                  Learn more
                </button>
              </p>
            </div>
          </div>

          {/* Cookie types quick view */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center hover:border-sky-500/30 transition-colors">
              <div className="text-xs text-gray-400">Essential</div>
              <div className="text-xs text-green-400 font-bold mt-1">
                ✓ Active
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center hover:border-sky-500/30 transition-colors">
              <div className="text-xs text-gray-400">Analytics</div>
              <div className="text-xs text-sky-400 font-bold mt-1">
                Optional
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center hover:border-sky-500/30 transition-colors">
              <div className="text-xs text-gray-400">Marketing</div>
              <div className="text-xs text-sky-400 font-bold mt-1">
                Optional
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDecline}
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
            >
              Essential Only
            </Button>
            <Button
              size="sm"
              onClick={onAccept}
              className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
            >
              Accept All 🚀
            </Button>
          </div>

          {/* Settings link */}
          <button
            onClick={onSettings}
            className="w-full text-xs text-gray-400 hover:text-sky-400 transition-colors text-center py-1"
          >
            ⚙️ Customise Cookie Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
