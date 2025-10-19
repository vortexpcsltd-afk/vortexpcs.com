import React, { useState } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Badge } from "./ui/badge";
import {
  Menu,
  ShoppingCart,
  User,
  Cpu,
  Settings,
  Wrench,
  Search,
  Home,
  Info,
  Phone,
  LogIn,
} from "lucide-react";

interface NavigationProps {
  currentView: string;
  onNavigate: (page: string) => void;
  cartItemCount: number;
  onCartOpen: () => void;
  onLoginOpen: () => void;
}

export function Navigation({
  currentView,
  onNavigate,
  cartItemCount,
  onCartOpen,
  onLoginOpen,
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "pc-finder", label: "PC Finder", icon: Search },
    { id: "pc-builder", label: "PC Builder", icon: Cpu },
    { id: "configurator", label: "Configurator", icon: Settings },
    { id: "repair", label: "Repair", icon: Wrench },
    { id: "about", label: "About", icon: Info },
    { id: "contact", label: "Contact", icon: Phone },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-2xl bg-slate-900/80 border-b border-white/10 shadow-2xl">
      {/* Premium gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent"></div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => onNavigate("home")}
          >
            <div className="relative">
              {/* Animated background glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 rounded-xl opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500"></div>

              {/* Logo background */}
              <div className="relative bg-gradient-to-r from-sky-600/20 to-blue-600/20 backdrop-blur-xl border border-sky-500/30 rounded-xl p-3 group-hover:border-sky-400/50 transition-all duration-300">
                <Cpu className="w-6 h-6 text-sky-400 group-hover:text-sky-300 transition-colors" />
              </div>
            </div>

            <div className="ml-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-sky-200 to-blue-300 bg-clip-text text-transparent group-hover:from-sky-200 group-hover:to-cyan-200 transition-all duration-300">
                Vortex PCs
              </h1>
              <p className="text-xs text-sky-400/80 font-medium uppercase tracking-wider">
                Premium Builds
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => onNavigate(item.id)}
                  className={`relative px-4 py-2 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-white border border-sky-500/30 shadow-lg shadow-sky-500/20"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <>
                      {/* Active state glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/30 to-blue-500/30 rounded-xl blur opacity-60"></div>
                      {/* Active accent */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-sky-400 to-blue-400 rounded-full"></div>
                    </>
                  )}

                  <div className="relative z-10 flex items-center space-x-2">
                    <Icon
                      className={`w-4 h-4 transition-all duration-300 ${
                        isActive ? "text-sky-400" : "group-hover:text-sky-400"
                      }`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Cart Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartOpen}
              className="relative p-3 rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 hover:border-sky-400/40 hover:bg-gradient-to-r hover:from-sky-500/20 hover:to-blue-500/20 transition-all duration-300 group"
            >
              {/* Hover glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/0 via-sky-500/30 to-blue-500/0 opacity-0 group-hover:opacity-100 blur transition-all duration-300 rounded-xl"></div>

              <div className="relative z-10">
                <ShoppingCart className="w-5 h-5 text-sky-400 group-hover:text-sky-300" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-lg animate-pulse">
                    {cartItemCount}
                  </Badge>
                )}
              </div>
            </Button>

            {/* Login Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoginOpen}
              className="hidden sm:flex relative px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-400/40 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300 group"
            >
              {/* Hover glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-cyan-500/0 opacity-0 group-hover:opacity-100 blur transition-all duration-300 rounded-xl"></div>

              <div className="relative z-10 flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                <span className="text-gray-300 group-hover:text-white font-medium">
                  Login
                </span>
              </div>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-3 rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 hover:border-sky-400/40 transition-all duration-300 group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/0 via-sky-500/30 to-blue-500/0 opacity-0 group-hover:opacity-100 blur transition-all duration-300 rounded-xl"></div>
                  <Menu className="w-5 h-5 text-sky-400 relative z-10" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-80 bg-slate-900/95 backdrop-blur-2xl border-l border-white/10"
              >
                {/* Mobile sheet background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-blue-500/5"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>

                <div className="relative z-10 py-6">
                  {/* Mobile Logo */}
                  <div className="flex items-center mb-8 pb-6 border-b border-white/10">
                    <div className="bg-gradient-to-r from-sky-600/20 to-blue-600/20 backdrop-blur-xl border border-sky-500/30 rounded-xl p-3">
                      <Cpu className="w-6 h-6 text-sky-400" />
                    </div>
                    <div className="ml-3">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">
                        Vortex PCs
                      </h2>
                      <p className="text-xs text-sky-400/80 font-medium uppercase tracking-wider">
                        Premium Builds
                      </p>
                    </div>
                  </div>

                  {/* Mobile Navigation Items */}
                  <div className="space-y-2">
                    {navItems.map((item) => {
                      const isActive = currentView === item.id;
                      const Icon = item.icon;

                      return (
                        <Button
                          key={item.id}
                          variant="ghost"
                          onClick={() => {
                            onNavigate(item.id);
                            setIsOpen(false);
                          }}
                          className={`w-full justify-start px-4 py-3 rounded-xl transition-all duration-300 group ${
                            isActive
                              ? "bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-white border border-sky-500/30"
                              : "text-gray-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-xl blur opacity-50"></div>
                          )}

                          <div className="relative z-10 flex items-center space-x-3">
                            <Icon
                              className={`w-5 h-5 transition-colors ${
                                isActive
                                  ? "text-sky-400"
                                  : "group-hover:text-sky-400"
                              }`}
                            />
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>

                  {/* Mobile Login Button */}
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <Button
                      onClick={() => {
                        onLoginOpen();
                        setIsOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl py-3 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Login / Register
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
