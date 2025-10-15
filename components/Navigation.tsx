import { useState } from 'react';
import { Menu, X, User, ShieldCheck, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
const logoImage = '/logo.svg';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userRole?: 'customer' | 'admin' | null;
  cartItemCount?: number;
}

export function Navigation({ currentPage, onNavigate, userRole, cartItemCount = 0 }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: 'home' },
    { name: 'PC Finder', path: 'finder' },
    { name: 'Build Your PC', path: 'configurator' },
    { name: 'Collect & Return', path: 'repair' },
    { name: 'Contact', path: 'contact' },
  ];

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center group relative"
          >
            <img 
              src={logoImage} 
              alt="VortexPCs Logo" 
              className="h-14 w-auto transition-all group-hover:scale-105 relative z-10"
            />
            <div className="absolute inset-0 blur-xl opacity-30 group-hover:opacity-50 transition-opacity bg-gradient-to-r from-cyan-400 to-blue-500"></div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  currentPage === item.path
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Shopping Cart */}
            <Button
              onClick={() => onNavigate('cart')}
              variant="ghost"
              className="relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {userRole === 'admin' ? (
              <Button
                onClick={() => onNavigate('admin')}
                variant="outline"
                className="border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/10"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Admin
              </Button>
            ) : userRole === 'customer' ? (
              <Button
                onClick={() => onNavigate('dashboard')}
                variant="outline"
                className="border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10"
              >
                <User className="w-4 h-4 mr-2" />
                My Account
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => onNavigate('login')}
                  variant="ghost"
                  className="hover:bg-white/5"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => onNavigate('login')}
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-400/20"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  currentPage === item.path
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.name}
              </button>
            ))}
            <div className="pt-4 border-t border-white/10 space-y-2">
              {userRole === 'admin' ? (
                <Button
                  onClick={() => {
                    onNavigate('admin');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full border-cyan-500/30"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Button>
              ) : userRole === 'customer' ? (
                <Button
                  onClick={() => {
                    onNavigate('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full border-blue-500/30"
                >
                  <User className="w-4 h-4 mr-2" />
                  My Account
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      onNavigate('login');
                      setMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => {
                      onNavigate('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
