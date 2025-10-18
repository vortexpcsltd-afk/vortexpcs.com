import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Mail, Lock, User, Shield, LogIn, UserPlus } from 'lucide-react';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (isAdmin?: boolean) => void;
  activeTab?: string;
}

export function LoginDialog({ isOpen, onClose, onLogin, activeTab = 'login' }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [currentTab, setCurrentTab] = useState(activeTab);

  React.useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const handleLogin = (e: React.FormEvent, isAdmin = false) => {
    e.preventDefault();
    onLogin(isAdmin);
    onClose();
    // Reset form
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-sky-500/30 backdrop-blur-2xl max-w-md">
        {/* Glow effect */}
        <div className="absolute -inset-[2px] bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-cyan-500/20 blur-xl -z-10"></div>
        
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
            Welcome to Vortex PCs
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Login to your account or create a new one to get started
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="login"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="register"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-6">
            <form onSubmit={(e) => handleLogin(e, false)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-white flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-sky-400" />
                  Email Address
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-white flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-sky-400" />
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-400 cursor-pointer hover:text-sky-400 transition-colors">
                  <input type="checkbox" className="mr-2 rounded border-white/10 bg-white/5" />
                  Remember me
                </label>
                <a href="#" className="text-sky-400 hover:text-sky-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white py-6 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login to Your Account
              </Button>
            </form>

            <Separator className="bg-white/10" />

            <div className="text-center">
              <p className="text-sm text-gray-400 mb-3">Quick Access (Demo)</p>
              <Button
                onClick={(e) => handleLogin(e, true)}
                variant="outline"
                className="w-full border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Login (Demo)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-6">
            <form onSubmit={(e) => handleLogin(e, false)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name" className="text-white flex items-center">
                  <User className="w-4 h-4 mr-2 text-sky-400" />
                  Full Name
                </Label>
                <Input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-white flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-sky-400" />
                  Email Address
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-white flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-sky-400" />
                  Password
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50"
                  required
                />
              </div>

              <div className="flex items-start text-sm">
                <input type="checkbox" className="mr-2 mt-1 rounded border-white/10 bg-white/5" required />
                <label className="text-gray-400">
                  I agree to the{' '}
                  <a href="#" className="text-sky-400 hover:text-sky-300 transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-sky-400 hover:text-sky-300 transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white py-6 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => setCurrentTab('login')}
                className="text-sky-400 hover:text-sky-300 transition-colors font-medium"
              >
                Login here
              </button>
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
