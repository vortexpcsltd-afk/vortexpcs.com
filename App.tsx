import { useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { Button } from "./components/ui/button";
import { PCFinder } from "./components/PCFinderBlue.tsx";
import { PCBuilder } from "./components/PCBuilder.tsx";
import { AIAssistant } from "./components/AIAssistant.tsx";
import { MemberArea } from "./components/MemberArea.tsx";
import { AdminPanel } from "./components/AdminPanel.tsx";
import { RepairService } from "./components/RepairService.tsx";
import { AboutUs } from "./components/AboutUs.tsx";
import { Contact } from "./components/Contact.tsx";
import { FAQPage } from "./components/FAQPage.tsx";
import { Footer } from "./components/Footer.tsx";
import { LoginDialog } from "./components/LoginDialog.tsx";
import { ShoppingCartModal } from "./components/ShoppingCartModal.tsx";
import { HomePage } from "./components/HomePage.tsx";
import { TermsPage } from "./components/TermsPage.tsx";
import { PrivacyPage } from "./components/PrivacyPage.tsx";
import { CookiePolicyPage } from "./components/CookiePolicyPage.tsx";
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
const vortexLogo = "/vortexpcs-logo.png";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [recommendedBuild, setRecommendedBuild] = useState(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginTab, setLoginTab] = useState("login");
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartItems, setCartItems] = useState<
    Array<{
      id: string;
      name: string;
      category: string;
      price: number;
      quantity: number;
    }>
  >([]);

  // Simulate login state and cookie consent
  useEffect(() => {
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

    checkAuth();
    checkCookieConsent();
  }, []);

  // Scroll to top whenever the view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  const navigation = [
    { id: "pc-finder", label: "PC Finder", icon: Search },
    { id: "pc-builder", label: "PC Builder", icon: Settings },
    { id: "repair", label: "Repair Service", icon: Wrench },
    { id: "about", label: "About", icon: Info },
    { id: "contact", label: "Contact", icon: Phone },
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case "pc-finder":
        return (
          <PCFinder
            setCurrentView={setCurrentView}
            setRecommendedBuild={setRecommendedBuild}
          />
        );
      case "pc-builder":
        return <PCBuilder recommendedBuild={recommendedBuild} />;
      case "repair":
        return <RepairService />;
      case "about":
        return <AboutUs onNavigate={setCurrentView} />;
      case "faq":
        return <FAQPage onNavigate={setCurrentView} />;
      case "contact":
        return <Contact onNavigate={setCurrentView} />;
      case "member":
        return (
          <MemberArea isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        );
      case "admin":
        return isAdmin ? <AdminPanel /> : <div>Access Denied</div>;
      case "terms":
        return <TermsPage />;
      case "privacy":
        return <PrivacyPage />;
      case "cookies":
        return <CookiePolicyPage />;
      default:
        return <HomePage setCurrentView={setCurrentView} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-blue-950"></div>

          {/* Animated gradient orbs */}
          <div className="absolute top-0 -left-40 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          {/* Scanline effect */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/5 to-transparent opacity-30 animate-pulse"
            style={{ animationDuration: "3s" }}
          ></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <header className="backdrop-blur-2xl bg-black/40 border-b border-white/10 fixed top-0 left-0 right-0 z-50 shadow-lg shadow-sky-500/10">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
              <div className="flex items-center justify-between h-24">
                {/* Logo */}
                <div
                  className="cursor-pointer group"
                  onClick={() => {
                    setCurrentView("home");
                    setIsMenuOpen(false);
                  }}
                >
                  <div className="relative h-12 sm:h-14 md:h-16 w-auto flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <img
                      src={vortexLogo}
                      alt="Vortex PCs"
                      width="120"
                      height="64"
                      loading="eager"
                      onError={(e) => {
                        console.error("Logo failed to load:", vortexLogo);
                        e.currentTarget.style.border = "2px solid red";
                      }}
                      onLoad={() =>
                        console.log("Logo loaded successfully:", vortexLogo)
                      }
                      className="h-full w-auto object-contain min-w-[80px] sm:min-w-[120px] drop-shadow-[0_0_20px_rgba(14,165,233,0.6)] group-hover:drop-shadow-[0_0_32px_rgba(14,165,233,0.8)] transition-all"
                    />
                  </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-2.5">
                  {navigation.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
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
                        onClick={() => setCurrentView("member")}
                        className="text-green-400 hover:text-green-300 px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <User className="w-5 h-5 mr-2.5" />
                        Account
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentView("admin")}
                          className="text-red-400 hover:text-red-300 px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                          Admin
                        </Button>
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
                        setCurrentView("home");
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
                    {navigation.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentView(item.id);
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
                          setCurrentView("member");
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-2.5 px-5 py-4 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      >
                        <User className="w-5 h-5" />
                        <span>My Account</span>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setCurrentView("admin");
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center space-x-2.5 px-5 py-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                          <Shield className="w-5 h-5" />
                          <span>Admin Panel</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsLoggedIn(false);
                          setIsAdmin(false);
                          setCurrentView("home");
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
            className={`min-h-screen pt-24 ${
              currentView === "faq" ? "pb-0" : "pb-20"
            }`}
          >
            {renderCurrentView()}
          </main>

          {/* Footer */}
          <Footer onNavigate={setCurrentView} />

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
              onSettings={() => setCurrentView("cookies")}
            />
          )}

          {/* AI Assistant Modal */}
          {showAIAssistant && (
            <AIAssistant
              isOpen={showAIAssistant}
              onClose={() => setShowAIAssistant(false)}
            />
          )}

          {/* Login Dialog */}
          <LoginDialog
            isOpen={showLoginDialog}
            onClose={() => setShowLoginDialog(false)}
            onLogin={(firebaseUser) => {
              // Save user data to state and localStorage
              const userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: firebaseUser.role || "user",
              };
              localStorage.setItem("vortex_user", JSON.stringify(userData));
              setUser(firebaseUser);
              setIsLoggedIn(true);
              setIsAdmin(firebaseUser.role === "admin");
              setCurrentView(
                firebaseUser.role === "admin" ? "admin" : "member"
              );
            }}
            activeTab={loginTab}
          />

          {/* Shopping Cart Modal */}
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
              setShowCartModal(false);
              alert("Checkout functionality coming soon!");
            }}
          />

          {/* Floating Live Chat Button */}
          <button
            onClick={() => setShowAIAssistant(true)}
            className="fixed bottom-8 right-8 z-50 group"
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
