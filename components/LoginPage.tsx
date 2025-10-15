import { useState } from 'react';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface LoginPageProps {
  onLogin: (role: 'customer' | 'admin') => void;
  onNavigate: (page: string) => void;
}

export function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = (e: React.FormEvent, role: 'customer' | 'admin' = 'customer') => {
    e.preventDefault();
    // Mock login - in production, integrate with Firebase Auth
    alert(`Logging in... (Mock Firebase Authentication)\n\nUse these credentials:\nCustomer: customer@vortex.com / password\nAdmin: admin@vortex.com / password`);
    
    // For demo purposes, check email to determine role
    if (loginEmail.includes('admin')) {
      onLogin('admin');
    } else {
      onLogin('customer');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock signup - in production, integrate with Firebase Auth
    alert('Account created! (Mock Firebase Authentication)\n\nYou can now sign in with your credentials.');
    setSignupName('');
    setSignupEmail('');
    setSignupPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-3 mb-6"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">V</span>
            </div>
            <span className="text-2xl">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Vortex</span>
              <span className="text-white">PCs</span>
            </span>
          </button>
          <h2 className="mb-2">Welcome Back</h2>
          <p className="text-gray-400">Sign in to your account or create a new one</p>
        </div>

        <Card className="glass p-8 border-white/10">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-8 glass">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={(e) => handleLogin(e)} className="space-y-6">
                <div>
                  <label className="block text-sm mb-2 text-gray-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-11 bg-white/5 border-white/10 placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-11 bg-white/5 border-white/10 placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-sm text-gray-400">Remember me</span>
                  </label>
                  <button type="button" className="text-sm text-blue-400 hover:text-blue-300">
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600"
                >
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[hsl(var(--card))] text-gray-400">Demo Access</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={(e) => {
                      setLoginEmail('customer@vortex.com');
                      setLoginPassword('password');
                    }}
                    variant="outline"
                    className="w-full border-blue-500/30 hover:bg-blue-500/10"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Customer Demo
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      setLoginEmail('admin@vortex.com');
                      setLoginPassword('password');
                    }}
                    variant="outline"
                    className="w-full border-cyan-500/30 hover:bg-cyan-500/10"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Admin Demo
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-6">
                <div>
                  <label className="block text-sm mb-2 text-gray-300">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="John Smith"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="pl-11 bg-white/5 border-white/10 placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-11 bg-white/5 border-white/10 placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pl-11 bg-white/5 border-white/10 placeholder:text-gray-400"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" className="w-4 h-4 mt-1" required />
                  <label className="text-sm text-gray-400">
                    I agree to the{' '}
                    <button type="button" className="text-blue-400 hover:text-blue-300">
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button type="button" className="text-blue-400 hover:text-blue-300">
                      Privacy Policy
                    </button>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600"
                >
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            <strong>Firebase Integration:</strong> This page is ready for Firebase Authentication.
            Configure your Firebase project to enable real user authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
