import { useState, useEffect } from 'react';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface CookieBarProps {
  onNavigate: (page: string) => void;
}

export function CookieBar({ onNavigate }: CookieBarProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const cookieConsent = localStorage.getItem('vortexpcs-cookie-consent');
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
    localStorage.setItem('vortexpcs-cookie-consent', JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem('vortexpcs-cookie-consent', JSON.stringify(necessaryOnly));
    setShowBanner(false);
  };

  const savePreferences = () => {
    localStorage.setItem('vortexpcs-cookie-consent', JSON.stringify(preferences));
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
                <h3 className="mb-2 flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-blue-400 sm:hidden" />
                  Your Privacy Matters
                </h3>
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                  We use cookies to enhance your browsing experience, analyse site traffic, and personalise content. 
                  By clicking "Accept All", you consent to our use of cookies as described in our{' '}
                  <button
                    onClick={() => {
                      onNavigate('privacy');
                      setShowBanner(false);
                    }}
                    className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 underline-offset-2 transition-colors"
                  >
                    Privacy Policy
                  </button>.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={acceptAll}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept All
                  </Button>
                  <Button
                    onClick={acceptNecessary}
                    variant="outline"
                    className="border-white/20 hover:bg-white/5"
                  >
                    Necessary Only
                  </Button>
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="outline"
                    className="border-white/20 hover:bg-white/5 hover:border-white/30 group transition-all"
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
        <DialogContent className="glass-strong border-white/20 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage your cookie preferences. You can enable or disable different types of cookies below. 
              Note that disabling some cookies may affect your experience on our website.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="glass p-4 rounded-lg border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-base">Necessary Cookies</Label>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Always Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Essential cookies required for the website to function properly. These cannot be disabled 
                    as they enable core functionality such as security, network management, and accessibility.
                  </p>
                </div>
                <Switch checked={true} disabled className="mt-1" />
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="glass p-4 rounded-lg border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="functional" className="text-base mb-2 block">
                    Functional Cookies
                  </Label>
                  <p className="text-sm text-gray-400">
                    Enable enhanced functionality and personalisation, such as remembering your preferences, 
                    language settings, and region. Disabling these may limit some features.
                  </p>
                </div>
                <Switch
                  id="functional"
                  checked={preferences.functional}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, functional: checked })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="glass p-4 rounded-lg border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="analytics" className="text-base mb-2 block">
                    Analytics Cookies
                  </Label>
                  <p className="text-sm text-gray-400">
                    Help us understand how visitors interact with our website by collecting and reporting 
                    information anonymously. This allows us to improve your experience and our services.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="glass p-4 rounded-lg border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="marketing" className="text-base mb-2 block">
                    Marketing Cookies
                  </Label>
                  <p className="text-sm text-gray-400">
                    Used to track visitors across websites to display relevant and engaging advertisements. 
                    These help us measure the effectiveness of our marketing campaigns.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={savePreferences}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
            <Button
              onClick={() => setShowSettings(false)}
              variant="outline"
              className="border-white/20 hover:bg-white/5"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
