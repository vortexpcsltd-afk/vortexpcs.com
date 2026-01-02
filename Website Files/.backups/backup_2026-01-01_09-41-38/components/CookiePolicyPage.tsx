import React, { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Cookie,
  Settings,
  BarChart,
  Target,
  Shield,
  CheckCircle,
  X,
} from "lucide-react";
import { Switch } from "./ui/switch";
import { fetchLegalPage, type LegalPage } from "../services/cms";
import { HtmlContent } from "./cms/HtmlContent";

export function CookiePolicyPage() {
  const [cms, setCms] = useState<LegalPage | null>(null);
  const [essentialEnabled] = React.useState(true); // Always enabled
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(false);
  const [marketingEnabled, setMarketingEnabled] = React.useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchLegalPage("cookies");
        if (active && data && data.content && data.content.trim().length > 0) {
          setCms(data);
        }
      } catch {
        // Silent fallback
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const cookieTypes = [
    {
      icon: Shield,
      name: "Essential Cookies",
      description:
        "These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.",
      examples: [
        "Session management",
        "Authentication",
        "Security tokens",
        "Load balancing",
      ],
      required: true,
      enabled: essentialEnabled,
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: BarChart,
      name: "Analytics Cookies",
      description:
        "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.",
      examples: [
        "Google Analytics",
        "Page view tracking",
        "User flow analysis",
        "Performance metrics",
      ],
      required: false,
      enabled: analyticsEnabled,
      setter: setAnalyticsEnabled,
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Target,
      name: "Marketing Cookies",
      description:
        "These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad.",
      examples: [
        "Advertising IDs",
        "Conversion tracking",
        "Retargeting",
        "Social media integration",
      ],
      required: false,
      enabled: marketingEnabled,
      setter: setMarketingEnabled,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const specificCookies = [
    {
      name: "vortex_session",
      type: "Essential",
      purpose: "Maintains your session across pages",
      duration: "Session",
      provider: "Vortex PCs",
    },
    {
      name: "vortex_cookie_consent",
      type: "Essential",
      purpose: "Stores your cookie preferences",
      duration: "1 year",
      provider: "Vortex PCs",
    },
    {
      name: "vortex_user",
      type: "Essential",
      purpose: "Stores authentication information",
      duration: "30 days",
      provider: "Vortex PCs",
    },
    {
      name: "vortex_cart",
      type: "Essential",
      purpose: "Remembers your shopping cart items",
      duration: "7 days",
      provider: "Vortex PCs",
    },
    {
      name: "_ga",
      type: "Analytics",
      purpose: "Distinguishes unique users",
      duration: "2 years",
      provider: "Google Analytics",
    },
    {
      name: "_gid",
      type: "Analytics",
      purpose: "Distinguishes unique users",
      duration: "24 hours",
      provider: "Google Analytics",
    },
    {
      name: "_gat",
      type: "Analytics",
      purpose: "Throttles request rate",
      duration: "1 minute",
      provider: "Google Analytics",
    },
    {
      name: "fbp",
      type: "Marketing",
      purpose: "Facebook tracking pixel",
      duration: "3 months",
      provider: "Facebook",
    },
    {
      name: "_gcl_au",
      type: "Marketing",
      purpose: "Google Ads conversion tracking",
      duration: "3 months",
      provider: "Google Ads",
    },
  ];

  const handleSavePreferences = () => {
    const preferences = {
      essential: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("vortex_cookie_consent", JSON.stringify(preferences));
    alert("Your cookie preferences have been saved successfully!");
  };

  const handleAcceptAll = () => {
    setAnalyticsEnabled(true);
    setMarketingEnabled(true);
    const preferences = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("vortex_cookie_consent", JSON.stringify(preferences));
    alert("All cookies have been accepted!");
  };

  const handleRejectAll = () => {
    setAnalyticsEnabled(false);
    setMarketingEnabled(false);
    const preferences = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("vortex_cookie_consent", JSON.stringify(preferences));
    alert("Only essential cookies are enabled.");
  };

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 mb-4">
            Cookie Management
          </Badge>
          <h1 className="text-white mb-4">Cookie Policy</h1>
          <p className="text-gray-400">
            Last updated:{" "}
            {(cms?.lastUpdated
              ? new Date(cms.lastUpdated)
              : new Date()
            ).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Introduction / CMS Content */}
        {cms?.content ? (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 mb-8">
            <HtmlContent html={cms.content} />
          </Card>
        ) : (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <h2 className="text-white mb-2">What Are Cookies?</h2>
                <p className="text-gray-300">
                  Cookies are small text files that are placed on your device
                  when you visit our website. They help us provide you with a
                  better experience by remembering your preferences, analysing
                  how you use our site, and enabling certain functionality. This
                  policy explains what cookies we use and how you can control
                  them.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Cookie Types with Controls */}
        <div className="mb-12">
          <h2 className="text-white mb-6">Cookie Categories</h2>
          <div className="space-y-6">
            {cookieTypes.map((cookieType, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border-white/10 p-6 hover:border-sky-500/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cookieType.color} opacity-20 flex items-center justify-center flex-shrink-0`}
                  >
                    <cookieType.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white mb-1 flex items-center gap-2">
                          {cookieType.name}
                          {cookieType.required && (
                            <Badge className="bg-green-500/20 border-green-500/40 text-green-400 text-xs">
                              Required
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {cookieType.description}
                        </p>
                      </div>
                      <div className="ml-4">
                        {cookieType.required ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-sm text-gray-400">
                              Always On
                            </span>
                          </div>
                        ) : (
                          <Switch
                            checked={cookieType.enabled}
                            onCheckedChange={cookieType.setter}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cookieType.examples.map((example, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs border-white/20 text-gray-400"
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <Card className="bg-gradient-to-br from-sky-500/20 to-blue-500/20 border-sky-500/30 p-6 mb-12">
          <h3 className="text-white mb-4">Manage Your Preferences</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAcceptAll}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg transition-all duration-300 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50"
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Accept All Cookies
            </button>
            <button
              onClick={handleSavePreferences}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-all duration-300"
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Save My Preferences
            </button>
            <button
              onClick={handleRejectAll}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg transition-all duration-300"
            >
              <X className="w-4 h-4 inline mr-2" />
              Reject All (Essential Only)
            </button>
          </div>
        </Card>

        {/* Detailed Cookie List */}
        <div className="mb-12">
          <h2 className="text-white mb-6">Specific Cookies We Use</h2>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white">Cookie Name</th>
                    <th className="text-left p-4 text-white">Type</th>
                    <th className="text-left p-4 text-white">Purpose</th>
                    <th className="text-left p-4 text-white">Duration</th>
                    <th className="text-left p-4 text-white">Provider</th>
                  </tr>
                </thead>
                <tbody>
                  {specificCookies.map((cookie, index) => (
                    <tr
                      key={index}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 text-gray-300 font-mono text-sm">
                        {cookie.name}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            cookie.type === "Essential"
                              ? "border-green-500/40 text-green-400"
                              : cookie.type === "Analytics"
                              ? "border-blue-500/40 text-blue-400"
                              : "border-purple-500/40 text-purple-400"
                          }`}
                        >
                          {cookie.type}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {cookie.purpose}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {cookie.duration}
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {cookie.provider}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* How to Control Cookies */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 mb-8">
          <h3 className="text-white mb-4">
            How to Control Cookies in Your Browser
          </h3>
          <p className="text-gray-300 mb-6">
            Most web browsers allow you to control cookies through their
            settings. However, if you disable cookies, some features of our
            website may not function properly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { browser: "Google Chrome", link: "chrome://settings/cookies" },
              { browser: "Mozilla Firefox", link: "about:preferences#privacy" },
              { browser: "Safari", link: "Safari > Preferences > Privacy" },
              { browser: "Microsoft Edge", link: "edge://settings/privacy" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg"
              >
                <Settings className="w-5 h-5 text-sky-400 flex-shrink-0" />
                <div>
                  <div className="text-white text-sm">{item.browser}</div>
                  <div className="text-xs text-gray-400 font-mono">
                    {item.link}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Third-Party Cookies */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 mb-8">
          <h3 className="text-white mb-4">Third-Party Cookies</h3>
          <p className="text-gray-300 mb-4">
            We use services from trusted third-party providers who may set their
            own cookies:
          </p>
          <div className="space-y-3">
            {[
              {
                name: "Google Analytics",
                purpose: "Website analytics and performance monitoring",
                link: "https://policies.google.com/privacy",
              },
              {
                name: "Google Ads",
                purpose: "Advertising and conversion tracking",
                link: "https://policies.google.com/technologies/ads",
              },
              {
                name: "Facebook",
                purpose: "Social media integration and advertising",
                link: "https://www.facebook.com/policies/cookies",
              },
            ].map((provider, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-white text-sm mb-1">{provider.name}</div>
                  <div className="text-xs text-gray-400 mb-2">
                    {provider.purpose}
                  </div>
                  <a
                    href={provider.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    View Privacy Policy →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="bg-gradient-to-br from-sky-500/20 to-blue-500/20 border-sky-500/30 p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-white mb-2">
                Questions About Our Cookie Policy?
              </h3>
              <p className="text-gray-300 mb-4">
                If you have any questions about how we use cookies, please
                contact us.
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <p>
                  Email:{" "}
                  <a
                    href="mailto:privacy@vortexpcs.com"
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    privacy@vortexpcs.com
                  </a>
                </p>
                <p>
                  Phone:{" "}
                  <a
                    href="tel:+441603975440"
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    01603 975440
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Company Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Vortex PCs Ltd • Company Registration No. 16474994</p>
        </div>
      </div>
    </div>
  );
}
