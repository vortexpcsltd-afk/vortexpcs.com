import { useState, useEffect } from "react";
import { Cookie, X, Settings, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface CookieBarBlueProps {
  onNavigate: (page: string) => void;
}

export function CookieBarBlue({ onNavigate }: CookieBarBlueProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Clear any old cookie consent keys to ensure fresh state
    const oldKeys = [
      "vortex_cookie_consent",
      "cookie_consent",
      "cookieConsent",
    ];
    oldKeys.forEach((key) => localStorage.removeItem(key));

    const cookieConsent = localStorage.getItem("vortexpcs-cookie-consent-blue");
    if (!cookieConsent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem(
      "vortexpcs-cookie-consent-blue",
      JSON.stringify(allAccepted)
    );
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem(
      "vortexpcs-cookie-consent-blue",
      JSON.stringify(necessaryOnly)
    );
    setShowBanner(false);
  };

  const savePreferences = () => {
    localStorage.setItem(
      "vortexpcs-cookie-consent-blue",
      JSON.stringify(preferences)
    );
    setShowSettings(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 animate-in slide-in-from-bottom-5 duration-500">
        <Card className="max-w-5xl mx-auto glass-strong border-white/20 shadow-2xl shadow-blue-500/10 rgb-glow">
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 items-center justify-center flex-shrink-0 ring-1 ring-white/10">
                <Cookie className="w-6 h-6 text-blue-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                  <Cookie className="w-5 h-5 text-blue-400 sm:hidden" />
                  Your Privacy Matters
                </h3>
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                  We use cookies to enhance your browsing experience, analyse
                  site traffic, and personalise content. By clicking "Accept
                  All", you consent to our use of cookies as described in our{" "}
                  <button
                    onClick={() => {
                      onNavigate("privacy");
                      setShowBanner(false);
                    }}
                    className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 underline-offset-2 transition-colors"
                  >
                    Privacy Policy
                  </button>
                  .
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={acceptAll}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 text-white font-medium"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept All
                  </Button>
                  <Button
                    onClick={acceptNecessary}
                    variant="outline"
                    className="border-white/20 hover:bg-white/5 text-white hover:text-white"
                  >
                    Necessary Only
                  </Button>
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="outline"
                    className="border-white/20 hover:bg-white/5 hover:border-white/30 group transition-all text-white hover:text-white"
                  >
                    <Settings className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Customise
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={acceptNecessary}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="glass-strong border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Choose which cookies to accept. You can change these settings at
              any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="necessary" className="text-sm font-medium">
                  Necessary Cookies
                </Label>
                <Switch
                  id="necessary"
                  checked={preferences.necessary}
                  disabled
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400">
                Essential for the website to function properly. Cannot be
                disabled.
              </p>
            </div>

            {/* Functional Cookies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="functional" className="text-sm font-medium">
                  Functional Cookies
                </Label>
                <Switch
                  id="functional"
                  checked={preferences.functional}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, functional: checked }))
                  }
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400">
                Remember your preferences and enhance your experience.
              </p>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="analytics" className="text-sm font-medium">
                  Analytics Cookies
                </Label>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, analytics: checked }))
                  }
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400">
                Help us understand how visitors interact with our website.
              </p>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing" className="text-sm font-medium">
                  Marketing Cookies
                </Label>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, marketing: checked }))
                  }
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400">
                Personalize ads and marketing communications.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => setShowSettings(false)}
              variant="outline"
              className="border-white/20 hover:bg-white/5 text-white hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={savePreferences}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20"
            >
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
