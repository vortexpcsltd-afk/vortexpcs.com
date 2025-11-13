import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Button } from "./components/ui/button";
import { logger } from "./services/logger";
import type { CartItem, ContentfulAsset, ContentfulImage } from "./types";
import { Toaster } from "./components/ui/sonner";
import { PageErrorBoundary } from "./components/ErrorBoundary";
import { PCFinderSpectacular as PCFinder } from "./components/PCFinderSpectacular";
import ServiceWorkerUpdateToast from "./components/ServiceWorkerUpdateToast";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
const PCBuilder = lazy(() =>
  import("./components/PCBuilder").then((m) => ({ default: m.PCBuilder }))
);
const VisualPCConfigurator = lazy(() =>
  import("./components/VisualPCConfigurator").then((m) => ({
    default: m.VisualPCConfigurator,
  }))
);
const AIAssistant = lazy(() =>
  import("./components/AIAssistant").then((m) => ({ default: m.AIAssistant }))
);
const MemberArea = lazy(() =>
  import("./components/MemberArea").then((m) => ({ default: m.MemberArea }))
);
const AdminPanel = lazy(() =>
  import("./components/AdminPanel").then((m) => ({ default: m.AdminPanel }))
);
const RepairService = lazy(() =>
  import("./components/RepairService").then((m) => ({
    default: m.RepairService,
  }))
);
import { AboutUs } from "./components/AboutUs";
const Contact = lazy(() =>
  import("./components/Contact").then((m) => ({ default: m.Contact }))
);
const FAQPage = lazy(() =>
  import("./components/FAQPage").then((m) => ({ default: m.FAQPage }))
);
import { Footer } from "./components/Footer";
import { LoginDialog } from "./components/LoginDialog";
import { ShoppingCartModal } from "./components/ShoppingCartModal";
const OrderSuccess = lazy(() =>
  import("./components/OrderSuccess").then((m) => ({
    default: m.OrderSuccess,
  }))
);
const CheckoutPage = lazy(() =>
  import("./components/CheckoutPage").then((m) => ({
    default: m.CheckoutPage,
  }))
);
const BlogList = lazy(() =>
  import("./components/BlogList").then((m) => ({ default: m.BlogList }))
);
const BlogPost = lazy(() =>
  import("./components/BlogPost").then((m) => ({ default: m.BlogPost }))
);
const BlogAuthor = lazy(() =>
  import("./components/BlogAuthor").then((m) => ({ default: m.BlogAuthor }))
);
const LoggedOutPage = lazy(() =>
  import("./components/LoggedOutPage").then((m) => ({
    default: m.LoggedOutPage,
  }))
);
import { HomePage } from "./components/HomePage";
import { BusinessSolutions } from "./components/BusinessSolutions";
import { BusinessDashboard } from "./components/BusinessDashboard";
import { TermsPage } from "./components/TermsPage";
import { WarrantyPage } from "./components/WarrantyPage";
import { TechnicalSupportPage } from "./components/TechnicalSupportPage";
import { ReturnsRefundsPage } from "./components/ReturnsRefundsPage";
import { OurProcessPage } from "./components/OurProcessPage";
import { QualityStandardsPage } from "./components/QualityStandardsPage";
const CmsDiagnostics = lazy(() =>
  import("./components/CmsDiagnostics").then((m) => ({
    default: m.CmsDiagnostics,
  }))
);
import { PrivacyPage } from "./components/PrivacyPage";
import { CookiePolicyPage } from "./components/CookiePolicyPage";
import { NotFoundPage } from "./components/NotFoundPage";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { getBreadcrumbs } from "./utils/breadcrumbHelpers";
import { ExitIntentModal } from "./components/ExitIntentModal";
import { useExitIntent } from "./hooks/useExitIntent";
import {
  OrganizationSchema,
  WebsiteSchema,
  ServiceSchema,
} from "./components/SchemaMarkup";
import {
  Shield,
  Settings,
  MessageCircle,
  Wrench,
  Menu,
  X,
  User,
  ShoppingCart,
  Search,
  LogIn,
  UserPlus,
  LogOut,
  Home,
  Info,
  Phone,
  Building2,
} from "lucide-react";
import { Card } from "./components/ui/card";
import { fetchSettings, fetchPageContent } from "./services/cms";
import { trackPageView, trackEvent } from "./services/database";
const vortexLogo = "/vortexpcs-logo.png";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [recommendedBuild, setRecommendedBuild] = useState(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginTab, setLoginTab] = useState("login");
  const [showCartModal, setShowCartModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitModalVariant, setExitModalVariant] = useState<
    "discount" | "newsletter" | "cart" | "builder"
  >("discount");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Simulate login state and cookie consent
  useEffect(() => {
    // Runtime version check to avoid stale cached builds
    (async () => {
      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const latestVersion = data?.version || "unknown";
          const prior = localStorage.getItem("vortex_app_version");
          if (prior && prior !== latestVersion) {
            logger.info(
              `New site version detected: ${latestVersion} (was ${prior}). Reloading to get the latest assets...`
            );
            localStorage.setItem("vortex_app_version", latestVersion);
            // Avoid reload loops in rare cases
            const reloadedFor = sessionStorage.getItem("vortex_reloaded_for");
            if (reloadedFor !== latestVersion) {
              sessionStorage.setItem("vortex_reloaded_for", latestVersion);
              const url = new URL(window.location.href);
              url.searchParams.set("v", latestVersion);
              window.location.replace(url.toString());
              return;
            }
          } else if (!prior) {
            localStorage.setItem("vortex_app_version", latestVersion);
          }
          logger.info(`App version: ${latestVersion}`);
        }
      } catch (e) {
        // Best-effort only; ignore errors
        logger.debug("Failed to check app version", { error: e });
      }
    })();

    const checkAuth = () => {
      // Mock authentication check
      const mockUser = localStorage.getItem("vortex_user");
      if (mockUser) {
        setIsLoggedIn(true);
        const userData = JSON.parse(mockUser);
        setIsAdmin(userData.role === "admin");
      }
    };

    const checkCookieConsent = () => {
      const cookieConsent = localStorage.getItem("vortex_cookie_consent");
      if (!cookieConsent) {
        setShowCookieConsent(true);
      }
    };

    // Check for Stripe success redirect
    const checkStripeRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");
      const cancelled = urlParams.get("cancelled");

      if (sessionId) {
        setCurrentView("order-success");
      } else if (cancelled) {
        // Clear the URL parameter
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    checkAuth();
    checkCookieConsent();
    checkStripeRedirect();
  }, []);

  // Derive currentView from URL and scroll to top on navigation
  useEffect(() => {
    const path = location.pathname.replace(/^\/+/, "");
    const view = path === "" ? "home" : path;
    setCurrentView(view);

    // Smooth scroll to top on navigation
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Fallback for browsers that don't support smooth scrolling
      window.scrollTo(0, 0);
    }
  }, [location.pathname]); // Firestore Analytics: track page views on SPA navigation (gated by cookie consent)
  useEffect(() => {
    const consent = localStorage.getItem("vortex_cookie_consent");
    if (consent === "accepted") {
      try {
        const raw = localStorage.getItem("vortex_user");
        const user = raw ? JSON.parse(raw) : null;
        const uid = user?.uid || null;
        // Use a simple route identifier for pages (matches our SPA views)
        const page = `/${currentView}`;
        trackPageView(uid, page);
      } catch (e) {
        // Best-effort only
        logger.warn("Analytics tracking skipped due to parse error", {
          error: e,
        });
      }
    }
  }, [currentView]);

  // Hydrate document title, standard meta tags, Open Graph and Twitter tags from CMS (Contentful)
  useEffect(() => {
    let mounted = true;

    const setMeta = (name: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setMetaProperty = (prop: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", prop);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    (async () => {
      try {
        const disablePages = import.meta.env.VITE_CMS_DISABLE_PAGES === "true";
        const settingsPromise = fetchSettings();
        const pagePromise = disablePages
          ? Promise.resolve(null)
          : fetchPageContent("home");

        const [settings, home] = await Promise.all([
          settingsPromise,
          pagePromise,
        ]);

        if (!mounted) return;

        const title = home?.pageTitle || settings?.siteName || "Vortex PCs";
        document.title = title;

        const description =
          home?.metaDescription || settings?.metaDescription || "";
        setMeta("description", description);

        const keywords =
          (typeof home?.seo?.keywords === "string" ? home.seo.keywords : "") ||
          "";
        setMeta("keywords", keywords);

        const author = settings?.siteName || "Vortex PCs";
        setMeta("author", author);

        // Determine an image for OG/Twitter: prefer page hero, then settings.logoUrl
        let ogImage = "";
        if (home?.heroBackgroundImage) {
          // Support multiple shapes returned by Contentful (raw asset or simplified URL)
          const hb = home.heroBackgroundImage as
            | ContentfulAsset
            | ContentfulImage
            | string
            | undefined;
          if (
            hb &&
            typeof hb === "object" &&
            "fields" in hb &&
            hb.fields?.file?.url
          ) {
            ogImage = `https:${hb.fields.file.url}`;
          } else if (hb && typeof hb === "object" && "url" in hb) {
            ogImage = hb.url;
          } else if (typeof hb === "string") {
            ogImage = hb;
          }
        }
        if (!ogImage && settings?.logoUrl) ogImage = settings.logoUrl;

        const pageUrl = window.location.href;

        // Open Graph
        setMetaProperty("og:title", title);
        setMetaProperty("og:description", description);
        setMetaProperty("og:type", "website");
        setMetaProperty("og:url", pageUrl);
        if (ogImage) setMetaProperty("og:image", ogImage);

        // Twitter
        const twitterCard = ogImage ? "summary_large_image" : "summary";
        setMeta("twitter:card", twitterCard);
        setMeta("twitter:title", title);
        setMeta("twitter:description", description);
        if (ogImage) setMeta("twitter:image", ogImage);
      } catch (error) {
        logger.error("Failed to hydrate meta from CMS", error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Exit Intent Detection - Show modal when user attempts to leave
  useExitIntent(
    () => {
      // Don't show if user has already seen it or dismissed it recently
      const hasSeenExitModal = sessionStorage.getItem("vortex_exit_modal_seen");
      const isLoggedInUser = isLoggedIn;

      if (hasSeenExitModal || isLoggedInUser) return;

      // Determine which variant to show based on current view
      let variant: "discount" | "newsletter" | "cart" | "builder" = "discount";

      if (
        currentView === "checkout" ||
        (cartItems.length > 0 && currentView !== "home")
      ) {
        variant = "cart";
      } else if (currentView === "pc-builder" || currentView === "pc-finder") {
        variant = "builder";
      } else if (currentView === "home") {
        variant = "discount";
      } else {
        variant = "newsletter";
      }

      setExitModalVariant(variant);
      setShowExitModal(true);
      sessionStorage.setItem("vortex_exit_modal_seen", "true");
    },
    {
      enabled: true,
      sensitivity: 20,
      delayMs: 500,
      triggerOnce: true,
    }
  );

  // Add item to cart
  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      // Check if item already exists in cart
      const existingItem = prevItems.find((i) => i.id === item.id);

      if (existingItem) {
        // Update quantity if item exists
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        // Add new item with quantity 1
        const next = [...prevItems, { ...item, quantity: 1 }];
        return next;
      }
    });

    // Analytics: add_to_cart (gated by consent)
    try {
      const consent = localStorage.getItem("vortex_cookie_consent");
      if (consent === "accepted") {
        const raw = localStorage.getItem("vortex_user");
        const user = raw ? JSON.parse(raw) : null;
        const uid = user?.uid || null;
        trackEvent(uid, "add_to_cart", {
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          quantity: 1,
        });
      }
    } catch {
      // analytics best-effort only
    }
  };

  const navigation = [
    { id: "pc-finder", label: "PC Finder", icon: Search },
    { id: "pc-builder", label: "PC Builder", icon: Settings },
    { id: "repair", label: "Repair Service", icon: Wrench },
    { id: "about", label: "About", icon: Info },
    { id: "contact", label: "Contact", icon: Phone },
  ];

  // Use navigation items directly (CMS moved to admin section)
  const navItems = navigation;

  // Navigate helper for child components expecting setCurrentView
  const onNavigate = (view: string) => {
    const path = view === "home" ? "/" : `/${view}`;
    navigate(path);
  };

  const renderCurrentView = () => {
    // Blog detail route: /blog/:slug
    if (currentView.startsWith("blog/")) {
      const slug = currentView.slice(5);
      return (
        <PageErrorBoundary pageName="Blog Post">
          <BlogPost slug={slug} />
        </PageErrorBoundary>
      );
    }
    // Author route: /author/:slug
    if (currentView.startsWith("author/")) {
      const slug = currentView.slice(7);
      return (
        <PageErrorBoundary pageName="Author">
          <BlogAuthor authorSlug={slug} />
        </PageErrorBoundary>
      );
    }
    switch (currentView) {
      case "logged-out":
        return (
          <PageErrorBoundary pageName="Logged Out">
            <LoggedOutPage />
          </PageErrorBoundary>
        );
      case "pc-finder":
        return (
          <PageErrorBoundary pageName="PC Finder">
            <PCFinder
              setCurrentView={onNavigate}
              _setRecommendedBuild={setRecommendedBuild}
            />
          </PageErrorBoundary>
        );
      case "pc-builder":
        return (
          <PageErrorBoundary pageName="PC Builder">
            <PCBuilder
              recommendedBuild={recommendedBuild}
              onAddToCart={(item) => {
                // Convert PCBuilderComponent to CartItem
                addToCart({
                  id: item.id,
                  name: item.name || "Component",
                  price: item.price || 0,
                  quantity: 1,
                  category: item.category || "pc-component",
                  image:
                    typeof item.image === "string" ? item.image : undefined,
                });
              }}
              onOpenCart={() => setShowCartModal(true)}
            />
          </PageErrorBoundary>
        );
      case "visual-configurator":
        return (
          <PageErrorBoundary pageName="Visual Configurator">
            <VisualPCConfigurator />
          </PageErrorBoundary>
        );
      case "repair":
        return (
          <PageErrorBoundary pageName="Repair Service">
            <RepairService onNavigate={onNavigate} />
          </PageErrorBoundary>
        );
      case "business-solutions":
        return (
          <PageErrorBoundary pageName="Business Solutions">
            <BusinessSolutions setCurrentView={onNavigate} />
          </PageErrorBoundary>
        );
      case "business-dashboard": {
        // Require authentication and business account type
        if (!isLoggedIn) {
          return (
            <PageErrorBoundary pageName="Access Denied">
              <div className="min-h-screen flex items-center justify-center text-white py-12 px-4">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 max-w-md text-center">
                  <Shield className="w-16 h-16 text-sky-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-4">
                    Authentication Required
                  </h2>
                  <p className="text-gray-400 mb-6">
                    You must be logged in to access the Business Dashboard.
                  </p>
                  <Button
                    onClick={() => setShowLoginDialog(true)}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  >
                    Sign In
                  </Button>
                </Card>
              </div>
            </PageErrorBoundary>
          );
        }

        // Check if user has business account type
        const userStr = localStorage.getItem("vortex_user");
        const userData = userStr ? JSON.parse(userStr) : null;
        const accountType = userData?.accountType || "personal";

        if (accountType !== "business") {
          return (
            <PageErrorBoundary pageName="Access Denied">
              <div className="min-h-screen flex items-center justify-center text-white py-12 px-4">
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8 max-w-md text-center">
                  <Building2 className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-4">
                    Business Account Required
                  </h2>
                  <p className="text-gray-400 mb-6">
                    The Business Dashboard is only accessible to verified
                    business customers. Business accounts are created by our
                    team during onboarding.
                  </p>
                  <Button
                    onClick={() => setCurrentView("business-solutions")}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  >
                    Learn About Business Solutions
                  </Button>
                </Card>
              </div>
            </PageErrorBoundary>
          );
        }

        return (
          <PageErrorBoundary pageName="Business Dashboard">
            <BusinessDashboard setCurrentView={onNavigate} />
          </PageErrorBoundary>
        );
      }
      case "about":
        return (
          <PageErrorBoundary pageName="About Us">
            <AboutUs onNavigate={onNavigate} />
          </PageErrorBoundary>
        );
      case "faq":
        return (
          <PageErrorBoundary pageName="FAQ">
            <FAQPage onNavigate={onNavigate} />
          </PageErrorBoundary>
        );
      case "contact":
        return (
          <PageErrorBoundary pageName="Contact">
            <Contact onNavigate={onNavigate} />
          </PageErrorBoundary>
        );
      case "blog":
        return (
          <PageErrorBoundary pageName="Blog">
            <BlogList />
          </PageErrorBoundary>
        );
      case "member":
        return (
          <PageErrorBoundary pageName="Member Area">
            <MemberArea
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
              onNavigate={onNavigate}
            />
          </PageErrorBoundary>
        );
      case "admin":
        return (
          <PageErrorBoundary pageName="Admin Panel">
            {isAdmin ? <AdminPanel /> : <div>Access Denied</div>}
          </PageErrorBoundary>
        );
      case "order-success":
        return (
          <PageErrorBoundary pageName="Order Success">
            <OrderSuccess onNavigate={onNavigate} />
          </PageErrorBoundary>
        );
      case "checkout":
        return (
          <PageErrorBoundary pageName="Checkout">
            <CheckoutPage
              cartItems={cartItems}
              onNavigate={onNavigate}
              onBackToCart={() => setShowCartModal(true)}
              onTriggerLogin={() => setShowLoginDialog(true)}
            />
          </PageErrorBoundary>
        );
      case "terms":
        return (
          <PageErrorBoundary pageName="Terms & Conditions">
            <TermsPage />
          </PageErrorBoundary>
        );
      case "warranty":
        return (
          <PageErrorBoundary pageName="Warranty">
            <WarrantyPage onNavigate={onNavigate} />
          </PageErrorBoundary>
        );
      case "process":
        return (
          <PageErrorBoundary pageName="Our Process">
            <OurProcessPage onNavigate={onNavigate} />
          </PageErrorBoundary>
        );
      case "support":
        return (
          <PageErrorBoundary pageName="Technical Support">
            <TechnicalSupportPage onNavigate={onNavigate} />
          </PageErrorBoundary>
        );
      case "quality":
        return (
          <PageErrorBoundary pageName="Quality Standards">
            <QualityStandardsPage onNavigate={onNavigate} />
          </PageErrorBoundary>
        );
      case "returns":
        return (
          <PageErrorBoundary pageName="Returns & Refunds">
            <ReturnsRefundsPage onNavigate={onNavigate} />
          </PageErrorBoundary>
        );
      case "privacy":
        return (
          <PageErrorBoundary pageName="Privacy Policy">
            <PrivacyPage />
          </PageErrorBoundary>
        );
      case "cookies":
        return (
          <PageErrorBoundary pageName="Cookie Policy">
            <CookiePolicyPage />
          </PageErrorBoundary>
        );
      case "cms-diagnostics":
        return (
          <PageErrorBoundary pageName="CMS Diagnostics">
            <CmsDiagnostics />
          </PageErrorBoundary>
        );
      default: {
        // Check if it's a valid route - if not, show 404
        const validRoutes = [
          "home",
          "logged-out",
          "pc-finder",
          "pc-builder",
          "visual-configurator",
          "business-solutions",
          "business-dashboard",
          "blog",
          "author",
          "repair",
          "about",
          "faq",
          "contact",
          "member",
          "admin",
          "order-success",
          "checkout",
          "terms",
          "warranty",
          "process",
          "support",
          "quality",
          "returns",
          "privacy",
          "cookies",
          "cms-diagnostics",
        ];

        // If currentView is not in valid routes and not empty/home, show 404
        if (
          currentView &&
          currentView !== "home" &&
          !validRoutes.includes(currentView)
        ) {
          return (
            <PageErrorBoundary pageName="404">
              <NotFoundPage onNavigate={onNavigate} />
            </PageErrorBoundary>
          );
        }

        // Default to home page
        return (
          <PageErrorBoundary pageName="Home">
            <HomePage setCurrentView={onNavigate} />
          </PageErrorBoundary>
        );
      }
    }
  };

  return (
    <AuthProvider>
      {/* Schema.org Structured Data for SEO */}
      <OrganizationSchema />
      <WebsiteSchema />
      <ServiceSchema />

      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0 pointer-events-none select-none">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-blue-950 will-change-opacity"></div>

          {/* Animated gradient orbs */}
          <div className="absolute top-0 -left-40 w-80 h-80 bg-sky-500/20 rounded-full blur-2xl md:blur-3xl animate-pulse"></div>
          <div
            className="absolute top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-2xl md:blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-2xl md:blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10 will-change-opacity"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          {/* Main Content */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/5 to-transparent opacity-30 animate-pulse will-change-opacity"
            style={{ animationDuration: "3s" }}
          ></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="backdrop-blur-xl md:backdrop-blur-2xl bg-black/40 border-b border-white/10 fixed top-0 left-0 right-0 z-50 shadow-lg shadow-sky-500/10 will-change-transform">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20 md:h-36">
                {/* Logo */}
                <div
                  className="cursor-pointer group"
                  onClick={() => {
                    navigate("/");
                    setIsMenuOpen(false);
                  }}
                >
                  <div className="relative h-10 md:h-12 lg:h-14 xl:h-16 w-auto flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <img
                      src={vortexLogo}
                      alt="Vortex PCs"
                      width="120"
                      height="64"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      onError={(e) => {
                        logger.error("Logo failed to load", undefined, {
                          vortexLogo,
                        });
                        e.currentTarget.style.border = "2px solid red";
                      }}
                      onLoad={() =>
                        logger.debug("Logo loaded successfully", { vortexLogo })
                      }
                      className="h-full w-auto object-contain min-w-[80px] sm:min-w-[120px] drop-shadow-[0_0_20px_rgba(14,165,233,0.6)] group-hover:drop-shadow-[0_0_32px_rgba(14,165,233,0.8)] transition-all"
                    />
                  </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-2.5">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/${item.id}`)}
                      className={`relative flex items-center space-x-2.5 px-6 py-3 rounded-xl transition-all duration-300 group text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                        currentView === item.id
                          ? "bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-400 shadow-lg shadow-sky-500/20"
                          : "hover:bg-white/5 text-gray-300 hover:text-white"
                      }`}
                    >
                      {currentView === item.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-xl blur"></div>
                      )}
                      <item.icon
                        className={`w-5 h-5 relative z-10 ${
                          currentView === item.id ? "animate-pulse" : ""
                        }`}
                      />
                      <span className="relative z-10">{item.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center space-x-3">
                  {/* Desktop Authentication - Hidden on Mobile */}
                  {isLoggedIn ? (
                    <div className="hidden md:flex items-center space-x-2.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/member")}
                        className="text-green-400 hover:text-green-300 px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <User className="w-5 h-5 mr-2.5" />
                        Account
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/admin")}
                            className="text-red-400 hover:text-red-300 px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          >
                            Admin
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/cms-diagnostics")}
                            className="text-sky-400 hover:text-sky-300 px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          >
                            CMS
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="hidden md:flex items-center space-x-2.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLoginDialog(true)}
                        className="relative text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 px-5 py-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/10 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                        <LogIn className="w-4 h-4 mr-2 relative z-10" />
                        <span className="relative z-10">Login</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setLoginTab("register");
                          setShowLoginDialog(true);
                        }}
                        className="relative bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-5 py-2.5 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up
                      </Button>
                    </div>
                  )}

                  {/* Shopping Cart */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCartModal(true)}
                    aria-label="Shopping cart"
                    className="relative text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 min-w-[44px] min-h-[44px] px-3 py-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/10 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                    <ShoppingCart className="w-5 h-5 relative z-10" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm rounded-full flex items-center justify-center shadow-lg shadow-sky-500/50 z-20">
                        {cartItems.length > 9 ? "9+" : cartItems.length}
                      </span>
                    )}
                  </Button>

                  {/* Hamburger Menu Button - Mobile Only */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden min-w-[44px] min-h-[44px] text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Navigation menu"
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-navigation"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/10 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                    {isMenuOpen ? (
                      <X className="w-6 h-6 relative z-10" />
                    ) : (
                      <Menu className="w-6 h-6 relative z-10" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
              <div
                className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
              <div
                id="mobile-navigation"
                className="md:hidden absolute top-full left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-xl"
              >
                <div className="container mx-auto px-4 md:px-6 lg:px-8 py-5">
                  {/* Navigation Links */}
                  <div className="flex flex-col space-y-2.5 mb-5">
                    {/* Home Link */}
                    <button
                      onClick={() => {
                        navigate("/");
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center space-x-2.5 px-5 py-4 rounded-lg transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                        currentView === "home"
                          ? "bg-white/10 text-sky-400"
                          : "hover:bg-white/5 text-gray-300"
                      }`}
                    >
                      <Home className="w-5 h-5" />
                      <span>Home</span>
                    </button>

                    {/* Other Navigation Items */}
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(`/${item.id}`);
                          setIsMenuOpen(false);
                        }}
                        className={`flex items-center space-x-2.5 px-5 py-4 rounded-lg transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                          currentView === item.id
                            ? "bg-white/10 text-sky-400"
                            : "hover:bg-white/5 text-gray-300"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/10 mb-5"></div>

                  {/* Authentication Section */}
                  {isLoggedIn ? (
                    <div className="flex flex-col space-y-2.5">
                      <button
                        onClick={() => {
                          navigate("/member");
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-2.5 px-5 py-4 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <User className="w-5 h-5" />
                        <span>My Account</span>
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              navigate("/admin");
                              setIsMenuOpen(false);
                            }}
                            className="flex items-center space-x-2.5 px-5 py-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          >
                            <Shield className="w-5 h-5" />
                            <span>Admin Panel</span>
                          </button>
                          <button
                            onClick={() => {
                              navigate("/cms-diagnostics");
                              setIsMenuOpen(false);
                            }}
                            className="flex items-center space-x-2.5 px-5 py-4 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-lg transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                          >
                            <Settings className="w-5 h-5" />
                            <span>CMS Diagnostics</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setIsLoggedIn(false);
                          setIsAdmin(false);
                          navigate("/");
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-2.5 px-5 py-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2.5">
                      <button
                        onClick={() => {
                          setShowLoginDialog(true);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-2.5 px-5 py-4 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-lg transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <LogIn className="w-5 h-5" />
                        <span>Login</span>
                      </button>
                      <button
                        onClick={() => {
                          setLoginTab("register");
                          setShowLoginDialog(true);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center justify-center space-x-2.5 px-5 py-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <UserPlus className="w-5 h-5" />
                        <span>Sign Up</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* Main Content */}
          <main
            className={`min-h-screen pt-20 md:pt-24 ${
              currentView === "faq" ? "pb-0" : "pb-20"
            }`}
          >
            {/* Breadcrumbs - Show on all pages except home */}
            {currentView !== "home" && (
              <div className="container mx-auto">
                <Breadcrumbs
                  items={getBreadcrumbs(currentView)}
                  onNavigate={onNavigate}
                />
              </div>
            )}
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-32">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-600 to-blue-600 animate-pulse mx-auto mb-6 shadow-lg shadow-sky-500/30"></div>
                    <p className="text-gray-400 text-lg">Loading module...</p>
                  </div>
                </div>
              }
            >
              {renderCurrentView()}
            </Suspense>
          </main>

          {/* Footer */}
          <Footer onNavigate={onNavigate} />

          {/* Service Worker Update Toast */}
          <ServiceWorkerUpdateToast />

          {/* PWA Install Prompt */}
          <PWAInstallPrompt />

          {/* Cookie Consent Banner */}
          {showCookieConsent && (
            <CookieConsentBanner
              onAccept={() => {
                localStorage.setItem("vortex_cookie_consent", "accepted");
                setShowCookieConsent(false);
              }}
              onDecline={() => {
                localStorage.setItem("vortex_cookie_consent", "declined");
                setShowCookieConsent(false);
              }}
              onSettings={() => navigate("/cookies")}
            />
          )}

          {/* AI Assistant Modal */}
          {showAIAssistant && (
            // Wrap lazy-loaded assistant in Suspense so it actually renders (fixes "live chat stopped" issue if fallback missing)
            <Suspense
              fallback={
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 animate-pulse shadow-lg shadow-sky-500/40" />
                    <p className="text-sky-300 tracking-wide">
                      Loading VortexAI Assistant…
                    </p>
                  </div>
                </div>
              }
            >
              <AIAssistant
                isOpen={showAIAssistant}
                onClose={() => setShowAIAssistant(false)}
              />
            </Suspense>
          )}

          {/* Login Dialog */}
          <LoginDialog
            isOpen={showLoginDialog}
            onClose={() => setShowLoginDialog(false)}
            onLogin={async (firebaseUser) => {
              logger.debug("Login - Firebase User", {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
              });

              // Fetch user profile to get role
              const { getUserProfile } = await import("./services/auth");
              let userRole = "user";
              try {
                const profile = await getUserProfile(firebaseUser.uid);
                userRole = profile?.role || "user";
              } catch (error) {
                logger.warn(
                  "Could not fetch user profile, defaulting to user role",
                  { error }
                );
              }

              // Case-insensitive admin check
              const isAdminUser = userRole.toLowerCase() === "admin";
              logger.debug("Login - Is Admin?", { isAdminUser, userRole });

              // Save user data to state and localStorage
              const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: userRole,
              };
              localStorage.setItem("vortex_user", JSON.stringify(userData));
              setIsLoggedIn(true);
              setIsAdmin(isAdminUser);

              const targetView = isAdminUser ? "admin" : "member";
              logger.debug("Login - Redirecting to", { targetView });
              navigate(`/${targetView}`);
            }}
            activeTab={loginTab}
          />

          <ShoppingCartModal
            isOpen={showCartModal}
            onClose={() => setShowCartModal(false)}
            cartItems={cartItems}
            onUpdateQuantity={(id, quantity) => {
              setCartItems((items) =>
                items.map((item) =>
                  item.id === id ? { ...item, quantity } : item
                )
              );
            }}
            onRemoveItem={(id) => {
              setCartItems((items) => items.filter((item) => item.id !== id));
            }}
            onCheckout={() => {
              // Analytics: begin_checkout (gated by consent)
              try {
                const consent = localStorage.getItem("vortex_cookie_consent");
                if (consent === "accepted") {
                  const raw = localStorage.getItem("vortex_user");
                  const user = raw ? JSON.parse(raw) : null;
                  const uid = user?.uid || null;
                  const total = cartItems.reduce(
                    (s, i) => s + i.price * i.quantity,
                    0
                  );
                  trackEvent(uid, "begin_checkout", {
                    item_count: cartItems.length,
                    total,
                  });
                }
              } catch {
                // analytics best-effort only
              }
              navigate("/checkout");
            }}
          />

          {/* Exit Intent Modal */}
          <ExitIntentModal
            isOpen={showExitModal}
            onClose={() => setShowExitModal(false)}
            variant={exitModalVariant}
            onSubscribe={(email) => {
              logger.debug("Exit modal email subscription", { email });
              // Track subscription
              try {
                const consent = localStorage.getItem("vortex_cookie_consent");
                if (consent === "accepted") {
                  const raw = localStorage.getItem("vortex_user");
                  const user = raw ? JSON.parse(raw) : null;
                  const uid = user?.uid || null;
                  trackEvent(uid, "newsletter_signup", {
                    source: "exit_intent",
                    variant: exitModalVariant,
                  });
                }
              } catch {
                // analytics best-effort only
              }
            }}
          />

          {/* Floating Live Chat Button */}
          <button
            onClick={() => setShowAIAssistant(true)}
            className="fixed bottom-8 right-8 z-[60] group"
            aria-label="Open Live Chat"
          >
            {/* Pulsing glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full blur-xl opacity-60 group-hover:opacity-100 animate-pulse transition-opacity"></div>

            {/* Button */}
            <div className="relative w-16 h-16 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 rounded-full shadow-2xl shadow-sky-500/50 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
              <MessageCircle className="w-7 h-7 text-white" />

              {/* Notification badge */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Live Chat Support
              <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}

// Cookie Consent Banner
function CookieConsentBanner({
  onAccept,
  onDecline,
  onSettings,
}: {
  onAccept: () => void;
  onDecline: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:w-full sm:max-w-md z-50 animate-in slide-in-from-bottom-8 duration-700">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-blue-500 rounded-2xl blur-lg opacity-40 animate-pulse"></div>

      {/* Main card */}
      <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-2xl border border-sky-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-sky-500/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-2xl"></div>

        <div className="relative space-y-3 sm:space-y-4">
          {/* Header with animated cookie icon */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-500 rounded-full blur opacity-60 animate-pulse"></div>
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400"
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

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white mb-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-sm sm:text-base">Cookie Settings</span>
                <span className="text-xs px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 rounded-full text-sky-400 self-start">
                  GDPR Compliant
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
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
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDecline}
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs sm:text-sm"
            >
              Essential Only
            </Button>
            <Button
              size="sm"
              onClick={onAccept}
              className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300 text-xs sm:text-sm"
            >
              Accept All
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
