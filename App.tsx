import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Progress } from "./components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Checkbox } from "./components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
import { PCFinder } from "./components/PCFinderBlue";
import { PCBuilder } from "./components/PCBuilder";
import { AIAssistant } from "./components/AIAssistant";
import { MemberArea } from "./components/MemberArea";
import { AdminPanel } from "./components/AdminPanel";
import { RepairService } from "./components/RepairService";
import { AboutUs } from "./components/AboutUs";
import { Contact } from "./components/Contact";
import { CookieConsentModern } from "./components/CookieConsentModern";
import { Footer } from "./components/Footer";
import { FooterClean } from "./components/FooterClean";
import { LoginDialog } from "./components/LoginDialog";
import { ShoppingCartModal } from "./components/ShoppingCartModal";
import { HomePage } from "./components/HomePage";
import { TermsPage } from "./components/TermsPage";
import { PrivacyPage } from "./components/PrivacyPage";
import { CookiePolicyPage } from "./components/CookiePolicyPage";
import {
  Monitor,
  Cpu,
  HardDrive,
  Zap,
  Shield,
  Clock,
  Users,
  Settings,
  Wrench,
  Star,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  User,
  ShoppingCart,
  Search,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  Info,
  Phone,
} from "lucide-react";
const vortexLogo = "https://www.vortexpcs.com/vortexpcs-logo.png";
const heroBackground = "https://vortexpcs.com/gaming-keyboard.jpeg";

export default function App() {
  const [currentView, setCurrentView] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recommendedBuild, setRecommendedBuild] = useState(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginTab, setLoginTab] = useState("login");
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      name: "AMD Ryzen 9 7950X3D",
      category: "Processor",
      price: 599.99,
      quantity: 1,
    },
    {
      id: "2",
      name: "NVIDIA GeForce RTX 4080 SUPER",
      category: "Graphics Card",
      price: 1099.99,
      quantity: 1,
    },
    {
      id: "3",
      name: "Corsair Vengeance RGB DDR5 32GB",
      category: "Memory",
      price: 149.99,
      quantity: 2,
    },
  ]);

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

    checkAuth();
  }, []);

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
        return <RepairService onNavigate={setCurrentView} />;
      case "about":
        return <AboutUs onNavigate={setCurrentView} />;
      case "contact":
        return <Contact onNavigate={setCurrentView} />;
      case "member":
        return (
          <MemberArea isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        );
      case "admin":
        return isAdmin ? <AdminPanel /> : <div>Access Denied</div>;
      case "terms":
        return <TermsPage onNavigate={setCurrentView} />;
      case "privacy":
        return <PrivacyPage onNavigate={setCurrentView} />;
      case "cookies":
        return <CookiePolicyPage />;
      default:
        return <HomePage setCurrentView={setCurrentView} />;
    }
  };

  const mockLogin = () => {
    const userData = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "user",
    };
    localStorage.setItem("vortex_user", JSON.stringify(userData));
    setIsLoggedIn(true);
    setCurrentView("member");
  };

  const mockAdminLogin = () => {
    const userData = {
      id: 1,
      name: "Admin User",
      email: "admin@vortexpcs.com",
      role: "admin",
    };
    localStorage.setItem("vortex_user", JSON.stringify(userData));
    setIsLoggedIn(true);
    setIsAdmin(true);
    setCurrentView("admin");
  };

  return (
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
                onClick={() => setCurrentView("home")}
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <img
                    src={vortexLogo}
                    alt="Vortex PCs"
                    width="80"
                    height="80"
                    loading="eager"
                    className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(14,165,233,0.6)] group-hover:drop-shadow-[0_0_32px_rgba(14,165,233,0.8)] transition-all"
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
              <div className="flex items-center space-x-5">
                {isLoggedIn ? (
                  <div className="flex items-center space-x-2.5">
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
                  <div className="flex items-center space-x-2.5">
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

                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden min-w-[44px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Navigation menu"
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-navigation"
                >
                  {isMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div
              id="mobile-navigation"
              className="md:hidden border-t border-white/10 bg-black/30 backdrop-blur-xl"
            >
              <div className="container mx-auto px-4 md:px-6 lg:px-8 py-5">
                <div className="flex flex-col space-y-2.5">
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
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="min-h-screen pb-20 pt-24">{renderCurrentView()}</main>

        {/* Footer */}
        <FooterClean onNavigate={setCurrentView} />

        {/* Cookie Consent Banner */}
        <CookieConsentModern onNavigate={setCurrentView} />

        {/* AI Assistant Modal */}
        <AIAssistant
          currentPage={currentView}
          userContext={{
            budget: recommendedBuild?.budget
              ? Number(recommendedBuild.budget)
              : undefined,
            useCase: recommendedBuild?.useCase,
          }}
        />

        {/* Login Dialog */}
        <LoginDialog
          isOpen={showLoginDialog}
          onClose={() => setShowLoginDialog(false)}
          onLogin={(isAdmin) => {
            if (isAdmin) {
              mockAdminLogin();
            } else {
              mockLogin();
            }
            setCurrentView("member");
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
      </div>
    </div>
  );
}
