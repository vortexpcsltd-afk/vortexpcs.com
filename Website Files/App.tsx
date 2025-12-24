import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Button } from "./components/ui/button";
import { logger } from "./services/logger";
import { setupGlobalErrorHandler } from "./services/errorReporter";
import {
  initializeSessionTracking,
  trackPage,
} from "./services/sessionTracker";
import {
  startRealtimeTracking,
  stopRealtimeTracking,
} from "./services/realtimeTracking";
import { usePageTracking } from "./hooks/usePageTracking";
import type { CartItem, ContentfulAsset, ContentfulImage } from "./types";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
// import { PageErrorBoundary } from "./components/ErrorBoundary"; // unused
// import { PCFinderSpectacular as PCFinder } from "./components/PCFinderSpectacular"; // unused
import ServiceWorkerUpdateToast from "./components/ServiceWorkerUpdateToast";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
// import { RouteLoader } from "./components/RouteLoader"; // unused
import { NavigationProvider } from "./contexts/NavigationContext";
import { CartProvider } from "./contexts/CartContext";
// const PCBuilder = lazy(() =>
//   import("./components/PCBuilder").then((m) => ({ default: m.PCBuilder }))
// ); // unused here; routed via AppRoutes
// const VisualPCConfigurator = lazy(() =>
//   import("./components/VisualPCConfigurator").then((m) => ({
//     default: m.VisualPCConfigurator,
//   }))
// ); // unused here; routed via AppRoutes
const AIAssistant = lazy(() =>
  import("./components/AIAssistant").then((m) => ({ default: m.AIAssistant }))
);
// MemberArea exports default only; use default directly (handled in AppRoutes)
// const MemberArea = lazy(() => import("./components/MemberArea"));
// const AdminPanel = lazy(() =>
//   import("./components/AdminPanel").then((m) => ({ default: m.AdminPanel }))
// );
// const RepairService = lazy(() =>
//   import("./components/RepairService").then((m) => ({
//     default: m.RepairService,
//   }))
// );
// import { AboutUs } from "./components/AboutUs";
// const Contact = lazy(() =>
//   import("./components/Contact").then((m) => ({ default: m.Contact }))
// );
// const FAQPage = lazy(() =>
//   import("./components/FAQPage").then((m) => ({ default: m.FAQPage }))
// );
// const VacanciesPage = lazy(() =>
//   import("./components/Vacancies").then((m) => ({ default: m.VacanciesPage }))
// );
import { AppLayout } from "./layouts/AppLayout";
import { LoginDialog } from "./components/LoginDialog";
import { ShoppingCartModal } from "./components/ShoppingCartModal";
// import { CheckoutPage } from "./components/CheckoutPage"; // unused here
// import { AccessDenied } from "./components/AccessDenied"; // unused here
import { ActivePromotionalBanner } from "./components/ActivePromotionalBanner";
// const OrderSuccess = lazy(() =>
//   import("./components/OrderSuccess").then((m) => ({
//     default: m.OrderSuccess,
//   }))
// );
// const BlogList = lazy(() =>
//   import("./components/BlogList").then((m) => ({ default: m.BlogList }))
// );
// const BlogPost = lazy(() =>
//   import("./components/BlogPost").then((m) => ({ default: m.BlogPost }))
// );
// const BlogAuthor = lazy(() =>
//   import("./components/BlogAuthor").then((m) => ({ default: m.BlogAuthor }))
// );
// const LoggedOutPage = lazy(() =>
//   import("./components/LoggedOutPage").then((m) => ({
//     default: m.LoggedOutPage,
//   }))
// );
// import { HomePage } from "./components/HomePage"; // routed elsewhere
import ComingSoonNotice from "./components/ComingSoonNotice";
// import { BusinessSolutions } from "./components/BusinessSolutions";
// // BusinessDashboard rendered via BusinessDashboardGuard in routes
// const SetPassword = lazy(() =>
//   import("./components/SetPassword").then((m) => ({ default: m.default }))
// );
// import { TermsPage } from "./components/TermsPage";
// import { WarrantyPage } from "./components/WarrantyPage";
// import { TechnicalSupportPage } from "./components/TechnicalSupportPage";
// import { ReturnsRefundsPage } from "./components/ReturnsRefundsPage";
// import { OurProcessPage } from "./components/OurProcessPage";
// import { QualityStandardsPage } from "./components/QualityStandardsPage";
// const CmsDiagnostics = lazy(() =>
//   import("./components/CmsDiagnostics").then((m) => ({
//     default: m.CmsDiagnostics,
//   }))
// );
// import { PrivacyPage } from "./components/PrivacyPage";
// import { CookiePolicyPage } from "./components/CookiePolicyPage";
// import { NotFoundPage } from "./components/NotFoundPage";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { getBreadcrumbs } from "./utils/breadcrumbHelpers";
// import { BlockedPage } from "./components/BlockedPage"; // unused here
import { checkIpBlocked } from "./services/security";
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
} from "lucide-react";
// Card moved to routes/BusinessDashboardGuard
import { fetchSettings, fetchPageContent } from "./services/cms";
import { trackEvent } from "./services/database";
import { claimGuestOrders } from "./services/database";
import { db } from "./config/firebase";
import { toast } from "sonner";
import { writeConsentCookie } from "./utils/consent";
import { getConsent } from "./utils/consent";
const vortexLogo = "/vortexpcs-logo.png";
// import { BusinessDashboardGuard } from "./routes/BusinessDashboardGuard"; // unused here
import { AppRoutes } from "./routes/AppRoutes";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    userProfile,
    isAuthenticated,
    isAdmin: isAdminFromContext,
    loading,
  } = useAuth();

  // Track page views
  usePageTracking();
  const [currentView, setCurrentView] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  // Minimal shape for a recommended build passed to PCBuilder
  type RecommendedBuildSpec = {
    name?: string;
    description?: string;
    price?: number;
    specs?: {
      cpu?: string;
      gpu?: string;
      ram?: string;
      storage?: string;
      psu?: string;
      cooling?: string;
      case?: string;
    };
    [key: string]: unknown;
  };

  const isRecommendedBuildSpec = (
    val: unknown
  ): val is RecommendedBuildSpec => {
    if (!val || typeof val !== "object") return false;
    // Light structural check: allow empty object or presence of specs/name
    const v = val as { specs?: unknown; name?: unknown };
    return (
      typeof v.name === "string" ||
      (v.specs !== undefined && typeof v.specs === "object")
    );
  };

  const [recommendedBuild, setRecommendedBuild] =
    useState<RecommendedBuildSpec | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginTab, setLoginTab] = useState("login");
  const [showCartModal, setShowCartModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitModalVariant, setExitModalVariant] = useState<
    "discount" | "newsletter" | "cart" | "builder"
  >("discount");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  // Coming Soon banner state
  const [showComingSoon, setShowComingSoon] = useState(false);
  // Promotional banner visibility state
  const [showPromoBanner, setShowPromoBanner] = useState(false);
  const seasonalActive = useMemo(() => {
    const now = new Date();
    const m = now.getMonth(); // 0=Jan
    const d = now.getDate();
    return (m === 10 && d >= 14) || m === 11 || (m === 0 && d <= 5);
  }, []);

  // Simulate login state and cookie consent
  useEffect(() => {
    // Initialize global error monitoring
    setupGlobalErrorHandler();
    logger.success("Error monitoring initialized");

    // Log Firebase configuration status for debugging
    logger.info("🔥 Firebase configured:", { configured: Boolean(db) });
    logger.info("📊 Analytics will use:", {
      method: db ? "direct Firestore" : "API fallback",
    });

    // Start real-time visitor tracking
    startRealtimeTracking(user || undefined);

    // Cleanup on unmount
    return () => {
      stopRealtimeTracking();
    };
  }, [user]);

  // Runtime version check
  useEffect(() => {
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

    // AuthContext handles auth state - no need for manual localStorage check
    // It will sync via the useEffect above when Firebase loads

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

    checkCookieConsent();
    checkStripeRedirect();

    // Determine test mode (Stripe publishable key prefix pk_test_ or explicit flag)
    try {
      const envObj: Record<string, string | undefined> =
        (import.meta as unknown as { env: Record<string, string | undefined> })
          .env || {};
      const pk = envObj.VITE_STRIPE_PUBLISHABLE_KEY;
      const explicit = envObj.VITE_TEST_MODE === "true";
      const isTest = explicit || (pk ? pk.startsWith("pk_test_") : false);
      const dismissed = localStorage.getItem("vortex_coming_soon_dismissed");
      if (isTest && !dismissed) setShowComingSoon(true);
    } catch (e) {
      logger.debug("ComingSoon env detection failed", { error: e });
    }
  }, []);

  // Sync AuthContext with local state
  useEffect(() => {
    // When Firebase auth state changes, update local state
    if (user && isAuthenticated) {
      setIsLoggedIn(true);
      setIsAdmin(isAdminFromContext);

      // Update localStorage to match
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: isAdminFromContext ? "admin" : "user",
      };
      localStorage.setItem("vortex_user", JSON.stringify(userData));
    } else if (!user && !isAuthenticated && !loading) {
      // User logged out via Firebase, sync local state (only if not loading)
      setIsLoggedIn(false);
      setIsAdmin(false);
      localStorage.removeItem("vortex_user");
    }
  }, [user, isAuthenticated, isAdminFromContext, loading]);

  // Derive currentView from URL and scroll to top on navigation
  useEffect(() => {
    const path = location.pathname.replace(/^\/+/, "");
    let view = path === "" ? "home" : path;
    // Normalize nested admin subroutes to 'admin' view so /admin/* renders AdminPanel
    if (view.startsWith("admin/")) {
      view = "admin";
    }
    setCurrentView(view);

    // Smooth scroll to top on navigation
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Fallback for browsers that don't support smooth scrolling
      window.scrollTo(0, 0);
    }
  }, [location.pathname]); // Firestore Analytics: track page views on SPA navigation (gated by cookie consent)

  // Check IP block status when navigating to restricted areas
  useEffect(() => {
    const restricted = ["member", "admin", "business-dashboard"]; // restricted areas
    const target = currentView;
    if (restricted.includes(target)) {
      checkIpBlocked()
        .then((res) => {
          if (res?.blocked) {
            navigate("/blocked");
          }
        })
        .catch(() => {});
    }
  }, [currentView, navigate]);
  useEffect(() => {
    logger.debug("Analytics effect triggered for view", { currentView });
    try {
      // Get verified role from auth context instead of localStorage
      // AuthContext provides server-verified role from Firebase Custom Claims
      const uid = user?.uid || null;
      const isAdmin = userProfile?.role === "admin";
      const isDev = Boolean(
        (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV
      );

      // ADMINS ALWAYS TRACK - no consent check for admins
      const { analytics: consentAnalytics } = getConsent();

      logger.debug("📊 [App] Analytics check", {
        currentView,
        consentAnalytics,
        isAdmin,
        isDev,
        willTrack: consentAnalytics || isAdmin,
        uid,
      });

      // Check consent for non-admins
      if (!consentAnalytics && !isAdmin) {
        logger.debug("📊 Analytics blocked: no consent and not admin");
        return; // Respect consent for non-admins
      }

      // Show debug toasts only once (for Firebase issues)
      if (!db && (isAdmin || isDev)) {
        const key = "vortex_analytics_toast_firebase";
        if (!sessionStorage.getItem(key)) {
          toast.warning(
            "Analytics inactive: Firebase not configured (debug notice)",
            { duration: 5000 }
          );
          sessionStorage.setItem(key, "1");
        }
      }

      logger.debug("📊 Proceeding with analytics tracking", {
        isAdmin,
        hasConsent: consentAnalytics,
        bypassActive: isAdmin && !consentAnalytics,
      });

      // Initialize session tracking (idempotent - won't re-init if already exists)
      const sid = initializeSessionTracking(uid);
      logger.info("📊 [App] Session initialized", { sessionId: sid });

      // Track page view
      const page = `/${currentView}`;
      logger.info("📊 [App] About to track page", { page, uid });
      trackPage(page, document.title, uid);
      logger.success("✅ [App] Page tracking completed", { page });
    } catch (e) {
      logger.error("❌ [App] Analytics tracking error", e);
    }
  }, [currentView, user?.uid, userProfile?.role]);

  // Hydrate document title, standard meta tags, Open Graph and Twitter tags from CMS (Contentful)
  // Only run once on mount to avoid blocking every navigation
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

    // Set default meta tags immediately (before CMS loads)
    document.title = "Vortex PCs - Premium Custom PC Builds";
    setMeta(
      "description",
      "Premium custom PC builds for gaming, workstation, and enthusiast users. Built to your exact specifications with high-quality components."
    );
    setMetaProperty("og:title", "Vortex PCs - Premium Custom PC Builds");
    setMetaProperty("og:type", "website");

    // Load CMS data in background without blocking
    (async () => {
      try {
        const disablePages = import.meta.env.VITE_CMS_DISABLE_PAGES === "true";

        // Load in parallel with timeout protection
        const settingsPromise = fetchSettings().catch(() => null);
        const pagePromise = disablePages
          ? Promise.resolve(null)
          : fetchPageContent("home").catch(() => null);

        const [settings, home] = await Promise.all([
          settingsPromise,
          pagePromise,
        ]);

        if (!mounted) return;

        // Update meta tags with CMS data if available
        if (home?.pageTitle || settings?.siteName) {
          const title = home?.pageTitle || settings?.siteName || "Vortex PCs";
          document.title = title;
          setMetaProperty("og:title", title);
          setMeta("twitter:title", title);
        }

        if (home?.metaDescription || settings?.metaDescription) {
          const description =
            home?.metaDescription || settings?.metaDescription || "";
          setMeta("description", description);
          setMetaProperty("og:description", description);
          setMeta("twitter:description", description);
        }

        const keywords =
          (typeof home?.seo?.keywords === "string" ? home.seo.keywords : "") ||
          "";
        if (keywords) setMeta("keywords", keywords);

        const author = settings?.siteName || "Vortex PCs";
        setMeta("author", author);

        // Determine an image for OG/Twitter: prefer page hero, then settings.logoUrl
        let ogImage = "";
        if (home?.heroBackgroundImage) {
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

        if (ogImage) {
          setMetaProperty("og:image", ogImage);
          setMeta("twitter:image", ogImage);
          setMeta("twitter:card", "summary_large_image");
        }

        const pageUrl = window.location.href;
        setMetaProperty("og:url", pageUrl);
      } catch (error) {
        logger.debug("Meta tags using defaults (CMS load failed)", { error });
        // Keep default meta tags already set above
      }
    })();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  // Exit Intent Detection - Show modal when user attempts to leave
  useExitIntent(
    () => {
      // Don't show if user has already seen it or dismissed it recently
      const hasSeenExitModal = sessionStorage.getItem("vortex_exit_modal_seen");
      const isLoggedInUser = isLoggedIn;

      if (hasSeenExitModal || isLoggedInUser) return;

      // Determine which variant to show based on current view
      let variant: "discount" | "newsletter" | "cart" | "builder" = "discount";

      if (cartItems.length > 0 && currentView !== "home") {
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

  // Hydrate cart from localStorage on mount with validation
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vortex_cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Validate and sanitize cart items
          const validatedItems = parsed
            .filter((item): item is CartItem => {
              // Ensure required fields exist and are valid
              return (
                typeof item === "object" &&
                item !== null &&
                typeof item.id === "string" &&
                item.id.trim() !== "" &&
                typeof item.name === "string" &&
                item.name.trim() !== "" &&
                typeof item.price === "number" &&
                item.price >= 0 &&
                typeof item.quantity === "number" &&
                item.quantity > 0 &&
                typeof item.category === "string" &&
                item.category.trim() !== ""
              );
            })
            .map((item) => ({
              ...item,
              // Ensure quantity is a positive integer
              quantity: Math.max(1, Math.floor(item.quantity)),
              // Ensure price is non-negative
              price: Math.max(0, item.price),
            }));

          setCartItems(validatedItems);

          // If validation removed items, update localStorage
          if (validatedItems.length !== parsed.length) {
            logger.warn(
              `Cart validation removed ${
                parsed.length - validatedItems.length
              } invalid items`
            );
            localStorage.setItem("vortex_cart", JSON.stringify(validatedItems));
          }
        }
      }
    } catch (e) {
      logger.error("Failed to load cart from localStorage", { error: e });
      // Clear corrupted cart data
      localStorage.removeItem("vortex_cart");
    } finally {
      setCartHydrated(true);
    }
  }, []);

  // Persist cart to localStorage whenever it changes with error handling
  useEffect(() => {
    try {
      if (cartItems.length === 0) {
        localStorage.removeItem("vortex_cart");
      } else {
        localStorage.setItem("vortex_cart", JSON.stringify(cartItems));
      }
    } catch (e) {
      logger.error("Failed to save cart to localStorage", { error: e });
      // If quota exceeded, try to save a minimal version
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        try {
          // Keep only essential data
          const minimalCart = cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category,
          }));
          localStorage.setItem("vortex_cart", JSON.stringify(minimalCart));
        } catch {
          logger.error("Failed to save minimal cart - storage quota exceeded");
        }
      }
    }
  }, [cartItems]);

  // Add item to cart with robust validation and duplicate handling
  const addToCart = (item: CartItem) => {
    // Validate input
    if (
      !item ||
      typeof item.id !== "string" ||
      !item.id.trim() ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      typeof item.price !== "number" ||
      item.price < 0 ||
      typeof item.category !== "string" ||
      !item.category.trim()
    ) {
      logger.error("Invalid cart item", { item });
      toast.error("Unable to add item to cart - invalid product data");
      return;
    }

    setCartItems((prevItems) => {
      try {
        // Check if item already exists in cart
        const existingItem = prevItems.find((i) => i.id === item.id);

        if (existingItem) {
          // Update quantity if item exists (with max limit for safety)
          const newQuantity = Math.min(existingItem.quantity + 1, 99);
          if (newQuantity === existingItem.quantity) {
            toast.error("Maximum quantity reached for this item");
            return prevItems;
          }

          toast.success(`Updated quantity for ${item.name}`);
          return prevItems.map((i) =>
            i.id === item.id ? { ...i, quantity: newQuantity } : i
          );
        } else {
          // Add new item with quantity 1
          const newItem: CartItem = {
            id: item.id,
            name: item.name,
            price: Math.max(0, item.price),
            quantity: 1,
            category: item.category,
            image: item.image,
            sku: item.sku,
          };

          toast.success(`Added ${item.name} to cart`);
          return [...prevItems, newItem];
        }
      } catch (error) {
        logger.error("Error adding item to cart", { error, item });
        toast.error("Failed to add item to cart");
        return prevItems;
      }
    });

    // Analytics: add_to_cart (gated by consent)
    try {
      const { analytics: consentAnalytics } = getConsent();
      if (consentAnalytics) {
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
  const onNavigate = useCallback(
    (view: string) => {
      const path = view === "home" ? "/" : `/${view}`;
      navigate(path);
    },
    [navigate]
  );

  return (
    <AuthProvider>
      <NavigationProvider>
        <CartProvider>
          <TooltipProvider delayDuration={0}>
            {/* Schema.org Structured Data for SEO */}
            <OrganizationSchema />
            <WebsiteSchema />
            <ServiceSchema />

            <AppLayout>
              <div className="min-h-screen bg-black text-white overflow-x-hidden">
                {/* Background */}
                <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
                  {/* Base gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-blue-950"></div>

                  {/* Grid pattern */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  ></div>
                </div>

                {/* Coming Soon / Test Mode Banner - Fixed at very top */}
                {showComingSoon && (
                  <ComingSoonNotice
                    launchDate={
                      (
                        import.meta as unknown as {
                          env: Record<string, string | undefined>;
                        }
                      ).env?.VITE_LAUNCH_DATE
                    }
                    onDismiss={() => {
                      setShowComingSoon(false);
                      try {
                        localStorage.setItem(
                          "vortex_coming_soon_dismissed",
                          new Date().toISOString()
                        );
                      } catch (e) {
                        logger.debug("Failed to persist coming soon dismiss", {
                          error: e,
                        });
                      }
                    }}
                  />
                )}

                {/* Active Promotional Banner */}
                <ActivePromotionalBanner
                  onBannerVisibilityChange={setShowPromoBanner}
                />

                <div className="relative z-10">
                  {/* Header - Fixed at top, banner floats above with higher z-index */}
                  <header
                    className="backdrop-blur-xl md:backdrop-blur-2xl bg-black/40 border-b border-white/10 fixed top-0 left-0 right-0 z-[9998] shadow-lg shadow-sky-500/10 will-change-transform transition-all duration-300"
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      marginTop:
                        showComingSoon && showPromoBanner
                          ? "104px"
                          : showComingSoon || showPromoBanner
                          ? "52px"
                          : "0",
                    }}
                  >
                    <div className="container mx-auto px-4 md:px-6 lg:px-8">
                      <div
                        className="flex items-center justify-between h-20 md:h-24"
                        style={{ paddingTop: "70px", paddingBottom: "70px" }}
                      >
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
                              decoding="async"
                              onError={(e) => {
                                logger.error("Logo failed to load", undefined, {
                                  vortexLogo,
                                });
                                e.currentTarget.style.border = "2px solid red";
                              }}
                              onLoad={() =>
                                logger.debug("Logo loaded successfully", {
                                  vortexLogo,
                                })
                              }
                              className="h-full w-auto object-contain min-w-[80px] sm:min-w-[120px] drop-shadow-[0_0_20px_rgba(14,165,233,0.6)] group-hover:drop-shadow-[0_0_32px_rgba(14,165,233,0.8)] transition-all"
                            />
                            {seasonalActive && (
                              <img
                                src="/seasonal/santa-hat.svg"
                                alt=""
                                aria-hidden="true"
                                className="absolute -top-4 -left-2 md:-top-5 md:-left-1 w-8 md:w-10 rotate-[-20deg] drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] select-none pointer-events-none"
                                decoding="async"
                                loading="eager"
                              />
                            )}
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
                              <span className="relative z-10">
                                {item.label}
                              </span>
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
                                onClick={async () => {
                                  try {
                                    // Clear local state
                                    setIsLoggedIn(false);
                                    setIsAdmin(false);
                                    // Clear localStorage
                                    localStorage.removeItem("vortex_user");
                                    // Sign out from Firebase
                                    const { logoutUser } = await import(
                                      "./services/auth"
                                    );
                                    await logoutUser();
                                    // Navigate to home
                                    navigate("/");
                                    setIsMenuOpen(false);
                                  } catch (error) {
                                    logger.error("Logout error:", error);
                                    // Still clear local state even if Firebase logout fails
                                    setIsLoggedIn(false);
                                    setIsAdmin(false);
                                    localStorage.removeItem("vortex_user");
                                    navigate("/");
                                    setIsMenuOpen(false);
                                  }
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
                    {/* Shiny RGB Glass Border */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none relative"
                    >
                      <div className="nav-rgb-border" />
                      <div className="nav-rgb-border-glow" />
                    </div>
                    {/* Seasonal lights removed by request; keeping Santa hat only */}
                  </header>

                  {/* Main Content */}
                  <main
                    className={`min-h-screen ${
                      showComingSoon && showPromoBanner
                        ? "pt-32 md:pt-36"
                        : showComingSoon || showPromoBanner
                        ? "pt-28 md:pt-32"
                        : "pt-20 md:pt-24"
                    } ${currentView === "faq" ? "pb-0" : "pb-20"} relative`}
                  >
                    {/* Vertical Page Title - Left Side */}
                    {currentView !== "home" &&
                      currentView !== "visual-configurator" &&
                      currentView !== "member" &&
                      ![
                        "warranty",
                        "support",
                        "quality",
                        "blog",
                        "returns",
                      ].includes(currentView) && (
                        <div className="hidden lg:block fixed left-[calc((100vw-1280px)/2)] top-1/2 -translate-y-1/2 -translate-x-36 z-10 pointer-events-none">
                          <h2
                            className="font-black text-white uppercase whitespace-nowrap"
                            style={{
                              writingMode: "vertical-rl",
                              transform: "rotate(180deg)",
                              opacity: "0.05",
                              fontSize: [
                                "terms",
                                "business-solutions",
                              ].includes(currentView)
                                ? "85px"
                                : currentView === "business-dashboard"
                                ? "84px"
                                : "100px",
                            }}
                          >
                            {getBreadcrumbs(currentView)[
                              getBreadcrumbs(currentView).length - 1
                            ]?.label || currentView.toUpperCase()}
                          </h2>
                        </div>
                      )}

                    {/* Breadcrumbs - Show on all pages except home */}
                    {currentView !== "home" && (
                      <div className="sticky top-[150px] md:top-[150px] z-40 mb-6">
                        <div className="container mx-auto px-4 md:px-6">
                          <Breadcrumbs
                            items={getBreadcrumbs(currentView)}
                            onNavigate={onNavigate}
                          />
                        </div>
                      </div>
                    )}
                    <Suspense
                      fallback={
                        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
                          <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500 animate-spin mx-auto mb-8 shadow-2xl shadow-sky-500/50"></div>
                            <p className="text-sky-300 text-lg font-medium mb-2">
                              Loading Vortex PCs
                            </p>
                            <p className="text-gray-400 text-sm">
                              Setting up your experience...
                            </p>
                          </div>
                        </div>
                      }
                    >
                      <AppRoutes
                        onNavigate={onNavigate}
                        onSetRecommendedBuild={(build) => {
                          if (isRecommendedBuildSpec(build)) {
                            setRecommendedBuild(build);
                          }
                        }}
                        isRecommendedBuildSpec={isRecommendedBuildSpec}
                        recommendedBuild={recommendedBuild}
                        addToCart={addToCart}
                        setShowCartModal={setShowCartModal}
                        isAdmin={isAdmin}
                        setShowLoginDialog={setShowLoginDialog}
                        cartItems={cartItems}
                        cartHydrated={cartHydrated}
                      />
                    </Suspense>
                  </main>

                  {/* Footer moved to AppLayout */}
                  {/* Service Worker Update Toast */}
                  <ServiceWorkerUpdateToast />

                  {/* PWA Install Prompt */}
                  <PWAInstallPrompt />

                  {/* Cookie Consent Banner */}
                  {showCookieConsent && (
                    <CookieConsentBanner
                      onAccept={() => {
                        const consent = {
                          essential: true,
                          analytics: true,
                          marketing: true,
                          accepted: true,
                        };
                        try {
                          localStorage.setItem(
                            "vortex_cookie_consent",
                            JSON.stringify(consent)
                          );
                        } catch {
                          // ignore localStorage write errors
                        }
                        // Write cookie fallback for browsers restricting localStorage
                        try {
                          writeConsentCookie(consent);
                        } catch {
                          // ignore cookie write errors
                        }
                        setShowCookieConsent(false);
                      }}
                      onDecline={() => {
                        const consent = {
                          essential: true,
                          analytics: false,
                          marketing: false,
                          accepted: false,
                        };
                        try {
                          localStorage.setItem(
                            "vortex_cookie_consent",
                            JSON.stringify(consent)
                          );
                        } catch {
                          // ignore localStorage write errors
                        }
                        // Write cookie fallback for browsers restricting localStorage
                        try {
                          writeConsentCookie(consent);
                        } catch {
                          // ignore cookie write errors
                        }
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
                      const { getUserProfile } = await import(
                        "./services/auth"
                      );
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

                      // CRITICAL: Verify role from server (Firebase Custom Claims)
                      // Never trust client-side role assignment
                      try {
                        const idToken = await firebaseUser.getIdToken();
                        const { verifyUserRole: verifyRole } = await import(
                          "./utils/roleVerification"
                        );
                        const roleVerification = await verifyRole(idToken);
                        if (roleVerification.verified) {
                          userRole = roleVerification.role;
                          logger.info(
                            "✅ Role verified from server on login:",
                            { role: userRole }
                          );
                        }
                      } catch (error) {
                        logger.warn(
                          "Failed to verify role from server, using cached value:",
                          { error }
                        );
                        // Keep the cached value if server verification fails
                      }

                      // Case-insensitive admin check (after server verification)
                      const isAdminUser = userRole.toLowerCase() === "admin";
                      logger.debug("Login - Is Admin?", {
                        isAdminUser,
                        userRole,
                        verifiedFromServer: true,
                      });

                      // Save user data to state and localStorage
                      const userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        role: userRole,
                      };
                      localStorage.setItem(
                        "vortex_user",
                        JSON.stringify(userData)
                      );
                      setIsLoggedIn(true);
                      setIsAdmin(isAdminUser);

                      // Attempt to auto-claim guest orders matching this email
                      try {
                        const emailLower = firebaseUser.email?.toLowerCase();
                        if (emailLower) {
                          const { claimed } = await claimGuestOrders(
                            firebaseUser.uid,
                            emailLower
                          );
                          if (claimed > 0) {
                            toast.success(
                              `Linked ${claimed} past order$${
                                claimed === 1 ? "" : "s"
                              } to your account.`
                            );
                          }
                        }
                      } catch (e) {
                        logger.warn("Guest order claim failed", { error: e });
                      }

                      const targetView = isAdminUser ? "admin" : "member";
                      logger.debug("Login - Redirecting to", { targetView });
                      onNavigate(targetView);
                    }}
                    activeTab={loginTab}
                  />

                  <ShoppingCartModal
                    isOpen={showCartModal}
                    onClose={() => setShowCartModal(false)}
                    cartItems={cartItems}
                    onUpdateQuantity={(id, quantity) => {
                      // Validate quantity input
                      if (typeof quantity !== "number" || quantity < 1) {
                        logger.warn("Invalid quantity update", {
                          id,
                          quantity,
                        });
                        return;
                      }

                      const validatedQuantity = Math.min(
                        Math.max(1, Math.floor(quantity)),
                        99
                      );

                      setCartItems((items) => {
                        const item = items.find((i) => i.id === id);
                        if (!item) {
                          logger.warn("Item not found in cart", { id });
                          return items;
                        }

                        if (validatedQuantity === item.quantity) {
                          return items;
                        }

                        return items.map((item) =>
                          item.id === id
                            ? { ...item, quantity: validatedQuantity }
                            : item
                        );
                      });
                    }}
                    onRemoveItem={(id) => {
                      setCartItems((items) => {
                        const item = items.find((i) => i.id === id);
                        if (item) {
                          toast.success(`Removed ${item.name} from cart`);
                        }
                        return items.filter((item) => item.id !== id);
                      });
                    }}
                    onCheckout={() => {
                      if (cartItems.length === 0) {
                        toast.error("Your cart is empty");
                        return;
                      }
                      setShowCartModal(false);
                      navigate("/checkout");
                    }}
                  />

                  {/* Checkout Page is handled via routing - see renderCurrentView */}

                  {/* Exit Intent Modal */}
                  <ExitIntentModal
                    isOpen={showExitModal}
                    onClose={() => setShowExitModal(false)}
                    variant={exitModalVariant}
                    onSubscribe={(email) => {
                      logger.debug("Exit modal email subscription", { email });
                      // Track subscription
                      try {
                        const { analytics: consentAnalytics } = getConsent();
                        if (consentAnalytics) {
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
            </AppLayout>

            {/* Toast notifications */}
            <Toaster position="top-right" richColors closeButton />
          </TooltipProvider>
        </CartProvider>
      </NavigationProvider>
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
