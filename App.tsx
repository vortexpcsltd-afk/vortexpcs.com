import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { PCFinder, BuildConfig } from './components/PCFinder';
import { PCConfigurator } from './components/PCConfigurator';
import { RepairService } from './components/RepairService';
import { ContactPage } from './components/ContactPage';
import { MembersDashboard } from './components/MembersDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginPage } from './components/LoginPage';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { ShoppingCart } from './components/ShoppingCart';
import { CookieBar } from './components/CookieBar';
import { BackgroundEffects } from './components/BackgroundEffects';
import { AIAssistant } from './components/AIAssistant';
import { Toaster } from './components/ui/sonner';
const logoImage = '/logo.svg';

type Page = 'home' | 'finder' | 'configurator' | 'repair' | 'contact' | 'dashboard' | 'admin' | 'login' | 'privacy' | 'terms' | 'cart';
type UserRole = 'customer' | 'admin' | null;

interface CartItem {
  id: string;
  type: 'build' | 'addon';
  name: string;
  components?: any;
  addOns?: any[];
  price: number;
  quantity: number;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [recommendedBuild, setRecommendedBuild] = useState<Partial<BuildConfig> | undefined>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    if (role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentPage('home');
  };

  const handlePCFinderComplete = (build: BuildConfig) => {
    setRecommendedBuild(build);
    setCurrentPage('configurator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    const newItem: CartItem = {
      ...item,
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantity: 1,
    };
    setCartItems([...cartItems, newItem]);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] relative">
      {/* Premium Background Effects */}
      <BackgroundEffects />

      {/* Navigation - hide on login page */}
      {currentPage !== 'login' && (
        <Navigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userRole={userRole}
          cartItemCount={cartItems.length}
        />
      )}

      {/* Page Content */}
      {currentPage === 'home' && (
        <HomePage onNavigate={handleNavigate} />
      )}

      {currentPage === 'finder' && (
        <PCFinder
          onComplete={handlePCFinderComplete}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === 'configurator' && (
        <PCConfigurator
          initialBuild={recommendedBuild}
          onNavigate={handleNavigate}
          onAddToCart={handleAddToCart}
        />
      )}

      {currentPage === 'repair' && (
        <RepairService onNavigate={handleNavigate} />
      )}

      {currentPage === 'cart' && (
        <ShoppingCart
          cartItems={cartItems}
          onRemoveItem={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={handleClearCart}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === 'contact' && (
        <ContactPage onNavigate={handleNavigate} />
      )}

      {currentPage === 'dashboard' && userRole === 'customer' && (
        <MembersDashboard
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'admin' && userRole === 'admin' && (
        <AdminDashboard
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onNavigate={handleNavigate}
        />
      )}

      {currentPage === 'privacy' && (
        <PrivacyPage onNavigate={handleNavigate} />
      )}

      {currentPage === 'terms' && (
        <TermsPage onNavigate={handleNavigate} />
      )}

      {/* Cookie Bar */}
      <CookieBar onNavigate={handleNavigate} />

      {/* AI Assistant - hide on login page */}
      {currentPage !== 'login' && (
        <AIAssistant
          currentPage={currentPage}
          userContext={{
            budget: recommendedBuild?.budget,
            useCase: recommendedBuild?.primaryUse,
          }}
        />
      )}

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />

      {/* Footer */}
      <footer className="border-t border-white/10 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img 
                  src={logoImage} 
                  alt="VortexPCs Logo" 
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm text-gray-400">
                UK's premier custom PC builder. Every PC is built to order with premium components and lifetime support.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm">Products</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => handleNavigate('finder')} className="hover:text-white transition-colors">PC Finder</button></li>
                <li><button onClick={() => handleNavigate('configurator')} className="hover:text-white transition-colors">Build Your PC</button></li>
                <li><button onClick={() => handleNavigate('repair')} className="hover:text-white transition-colors">Collect & Return</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => handleNavigate('dashboard')} className="hover:text-white transition-colors">My Account</button></li>
                <li><button onClick={() => handleNavigate('contact')} className="hover:text-white transition-colors">Contact Us</button></li>
                <li><button className="hover:text-white transition-colors">FAQ</button></li>
                <li><button className="hover:text-white transition-colors">Warranty</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => handleNavigate('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button onClick={() => handleNavigate('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>© 2025 VortexPCs. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Made with precision in the UK</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
