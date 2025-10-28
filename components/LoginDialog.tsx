import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { loginUser, registerUser, resetPassword } from "../services/auth";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
  activeTab?: string;
}

export function LoginDialog({
  isOpen,
  onClose,
  onLogin,
  activeTab = "login",
}: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await loginUser(email, password);
      setSuccess("Login successful!");
      setTimeout(() => {
        onLogin(user);
        onClose();
        // Reset form
        setEmail("");
        setPassword("");
        setName("");
      }, 1000);
    } catch (err: any) {
      setError(
        err.message || "Failed to login. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await registerUser(email, password, name);
      setSuccess("Account created successfully!");
      setTimeout(() => {
        onLogin(user);
        onClose();
        // Reset form
        setEmail("");
        setPassword("");
        setName("");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await resetPassword(email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
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
            {error && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-500/10 border-green-500/30 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="login-email"
                  className="text-white flex items-center"
                >
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
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="login-password"
                  className="text-white flex items-center"
                >
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
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-400 cursor-pointer hover:text-sky-400 transition-colors">
                  <input
                    type="checkbox"
                    className="mr-2 rounded border-white/10 bg-white/5"
                    disabled={loading}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sky-400 hover:text-sky-300 transition-colors"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white py-6 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
                disabled={loading}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {loading ? "Logging in..." : "Login to Your Account"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-6">
            {error && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-500/10 border-green-500/30 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="register-name"
                  className="text-white flex items-center"
                >
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
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="register-email"
                  className="text-white flex items-center"
                >
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
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="register-password"
                  className="text-white flex items-center"
                >
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
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="flex items-start text-sm">
                <input
                  type="checkbox"
                  className="mr-2 mt-1 rounded border-white/10 bg-white/5"
                  required
                  disabled={loading}
                />
                <label className="text-gray-400">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white py-6 shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
                disabled={loading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <button
                onClick={() => setCurrentTab("login")}
                className="text-sky-400 hover:text-sky-300 transition-colors font-medium"
                disabled={loading}
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
