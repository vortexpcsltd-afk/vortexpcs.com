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
import type { User as FirebaseUser } from "firebase/auth";
import {
  loginUser,
  registerUser,
  resetPassword,
  getUserProfile,
} from "../services/auth";
import { logger } from "../services/logger";
import {
  trackUserEvent,
  trackSecurityEvent,
} from "../services/advancedAnalytics";
import { getSessionId } from "../services/sessionTracker";
import { recordLoginAttempt } from "../services/security";

// Simple password validation inline (TODO: move to utils/passwordValidation.ts)
function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push("At least 8 characters");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Include uppercase letters");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("Include lowercase letters");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Include numbers");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push("Include special characters");

  return {
    isValid: score >= 3,
    score,
    feedback,
  };
}

function getPasswordStrengthLabel(score: number): string {
  if (score <= 1) return "Weak";
  if (score === 2) return "Fair";
  if (score === 3) return "Good";
  if (score === 4) return "Strong";
  return "Very Strong";
}

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: FirebaseUser) => void;
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
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [passwordStrength, setPasswordStrength] =
    useState<ReturnType<typeof validatePasswordStrength>>();
  const [rememberMe, setRememberMe] = useState(true); // Default to true - most users expect to stay logged in

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (newPassword && currentTab === "register") {
      const strength = validatePasswordStrength(newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(undefined);
    }
  };

  const mapCodeToSuggestion = (code: string | null): string | null => {
    if (!code) return null;
    switch (code) {
      case "auth/invalid-email":
        return "Email format looks invalid. Check for typos.";
      case "auth/user-not-found":
        return "No account exists for that email. Try Sign Up.";
      case "auth/wrong-password":
        return "Password incorrect. Use Forgot password if needed.";
      case "auth/invalid-credential":
        return "Email or password incorrect. Re-enter both carefully.";
      case "auth/user-disabled":
        return "Account disabled. Contact support.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait 30–60 seconds before retrying.";
      case "auth/network-request-failed":
        return "Network error. Check connectivity / VPN / firewall.";
      case "auth/operation-not-allowed":
        return "Email/password auth not enabled in Firebase project.";
      default:
        return null;
    }
  };

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
    setErrorCode(null);
    const normalizedEmail = email.trim().toLowerCase();
    const pwd = password;
    if (!normalizedEmail) {
      setLoading(false);
      setError("Please enter your email address.");
      return;
    }
    if (!pwd) {
      setLoading(false);
      setError("Please enter your password.");
      return;
    }

    try {
      const user = await loginUser(normalizedEmail, pwd, rememberMe);
      // Record success to reset attempts if not blocked
      recordLoginAttempt("success", normalizedEmail).catch(() => {});
      logger.debug("Login successful", { uid: user.uid, email: user.email });

      // Fetch user profile from Firestore to get the role
      let userProfile = null;
      try {
        userProfile = await getUserProfile(user.uid);
        logger.debug("User profile fetched", { profile: userProfile });
      } catch (profileErr) {
        logger.warn("Could not fetch user profile, using defaults", {
          error: String(profileErr),
        });
        // Continue with default profile
      }

      // Combine Firebase user with Firestore profile data
      const userWithRole = {
        ...user,
        role: userProfile?.role || "user",
        displayName: user.displayName || userProfile?.displayName || email,
      };

      logger.debug("Login complete", { role: userWithRole.role });

      setSuccess("Login successful!");
      setTimeout(() => {
        onLogin(userWithRole);
        onClose();
        // Reset form
        setEmail("");
        setPassword("");
        setName("");
      }, 1000);
    } catch (err: unknown) {
      logger.error("Login failed", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to login. Please check your credentials.";
      setError(errorMessage);
      if (err && typeof err === "object" && "code" in err) {
        setErrorCode((err as { code?: string }).code || null);
      }

      // Track failed login attempt
      console.log("[LoginDialog] Tracking failed login attempt...", {
        email: normalizedEmail,
        code: errorCode,
      });
      try {
        // Record failure for IP-based lockout
        recordLoginAttempt("failure", normalizedEmail).catch(() => {});
        const sessionId =
          sessionStorage.getItem("vortex_session_id") ||
          getSessionId() ||
          "unknown";
        console.log("[LoginDialog] Session ID:", sessionId);

        // Also track as a security event so dashboards count it
        await trackSecurityEvent({
          type: "login_failed",
          email: normalizedEmail,
          userAgent: navigator.userAgent,
          timestamp: new Date(),
          details: {
            page: window.location.pathname,
            message: errorMessage,
            code: errorCode,
          },
        });

        await trackUserEvent({
          sessionId,
          eventType: "login_failed",
          eventData: {
            email: normalizedEmail,
            error: errorMessage,
            code: errorCode,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date(),
          page: window.location.pathname,
        });

        console.log("[LoginDialog] ✅ Failed login tracked successfully");
      } catch (trackError: unknown) {
        console.error(
          "[LoginDialog] ❌ Failed to track login failure:",
          trackError
        );
        logger.warn("Failed to track login failure", {
          error: String(trackError),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setErrorCode(null);

    try {
      const user = await registerUser(
        email.trim().toLowerCase(),
        password,
        name.trim()
      );

      // Fetch user profile from Firestore to get the role
      const userProfile = await getUserProfile(user.uid);

      // Combine Firebase user with Firestore profile data
      const userWithRole = {
        ...user,
        role: userProfile?.role || "user",
        displayName: user.displayName || userProfile?.displayName || name,
      };

      setSuccess("Account created successfully!");
      setTimeout(() => {
        onLogin(userWithRole);
        onClose();
        // Reset form
        setEmail("");
        setPassword("");
        setName("");
      }, 1000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.";
      setError(errorMessage);
      if (err && typeof err === "object" && "code" in err) {
        setErrorCode((err as { code?: string }).code || null);
      }
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
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send reset email.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-sky-500/30 backdrop-blur-2xl w-[95vw] sm:w-full max-w-md">
        {/* Glow effect */}
        <div className="absolute -inset-[2px] bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-cyan-500/20 blur-xl -z-10"></div>

        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent leading-tight">
            Welcome to Vortex PCs
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-sm sm:text-base leading-tight px-2">
            Login to your account or create a new one to get started
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="mt-3 sm:mt-4"
        >
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 h-10 sm:h-11 p-1 rounded-lg">
            <TabsTrigger
              value="login"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-sm sm:text-base rounded-md"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-sm sm:text-base rounded-md"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="login"
            className="space-y-3 sm:space-y-4 mt-4 sm:mt-6"
          >
            {error && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">{error}</p>
                    {errorCode && (
                      <p className="text-xs text-red-300">Code: {errorCode}</p>
                    )}
                    {mapCodeToSuggestion(errorCode) && (
                      <p className="text-xs text-red-200">
                        Suggestion: {mapCodeToSuggestion(errorCode)}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowTechDetails((prev) => !prev)}
                      className="text-xs underline text-white/70 hover:text-white"
                    >
                      {showTechDetails
                        ? "Hide Technical Details"
                        : "Show Technical Details"}
                    </button>
                    {showTechDetails && (
                      <div className="text-[10px] leading-relaxed bg-black/40 p-2 rounded border border-white/10 space-y-1">
                        <div>Raw email: {email}</div>
                        <div>Normalized: {email.trim().toLowerCase()}</div>
                        <div>Password length: {password.length}</div>
                        <div>User agent: {navigator.userAgent}</div>
                        <div>Path: {window.location.pathname}</div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-500/10 border-green-500/30 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="login-email"
                  className="text-white flex items-center text-sm"
                >
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-sky-400" />
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
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="login-password"
                  className="text-white flex items-center text-sm"
                >
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-sky-400" />
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
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center text-gray-400 cursor-pointer hover:text-sky-400 transition-colors">
                  <input
                    type="checkbox"
                    className="mr-1.5 sm:mr-2 rounded border-white/10 bg-white/5"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
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
                className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white py-4 sm:py-6 text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300"
                disabled={loading}
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {loading ? "Logging in..." : "Login to Your Account"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent
            value="register"
            className="space-y-3 sm:space-y-4 mt-4 sm:mt-6"
          >
            {error && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-sm">{error}</p>
                    {errorCode && (
                      <p className="text-xs text-red-300">Code: {errorCode}</p>
                    )}
                    {mapCodeToSuggestion(errorCode) && (
                      <p className="text-xs text-red-200">
                        Suggestion: {mapCodeToSuggestion(errorCode)}
                      </p>
                    )}
                    {showTechDetails && (
                      <div className="text-[10px] leading-relaxed bg-black/40 p-2 rounded border border-white/10 space-y-1">
                        <div>Raw email: {email}</div>
                        <div>Normalized: {email.trim().toLowerCase()}</div>
                        <div>Password length: {password.length}</div>
                        <div>User agent: {navigator.userAgent}</div>
                        <div>Path: {window.location.pathname}</div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-500/10 border-green-500/30 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="register-name"
                  className="text-white flex items-center text-sm"
                >
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-sky-400" />
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
                  autoComplete="name"
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
                  autoComplete="email"
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
                  onChange={handlePasswordChange}
                  placeholder="Create a strong password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50"
                  required
                  disabled={loading}
                  minLength={6}
                  autoComplete="new-password"
                />

                {/* Password strength indicator */}
                {passwordStrength && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.score === 0
                              ? "bg-red-500 w-[20%]"
                              : passwordStrength.score === 1
                              ? "bg-orange-500 w-[40%]"
                              : passwordStrength.score === 2
                              ? "bg-yellow-500 w-[60%]"
                              : passwordStrength.score === 3
                              ? "bg-blue-500 w-[80%]"
                              : "bg-green-500 w-full"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium whitespace-nowrap ${
                          passwordStrength.score <= 1
                            ? "text-red-400"
                            : passwordStrength.score === 2
                            ? "text-yellow-400"
                            : passwordStrength.score === 3
                            ? "text-blue-400"
                            : "text-green-400"
                        }`}
                      >
                        {getPasswordStrengthLabel(passwordStrength.score)}
                      </span>
                    </div>

                    {/* Requirements checklist */}
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs space-y-1">
                        {passwordStrength.feedback.map((message, i) => (
                          <li key={i} className="text-gray-400">
                            <span className="mr-1">○</span>
                            {message}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Success message when all requirements met */}
                    {passwordStrength.isValid && (
                      <div className="text-xs text-green-400 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        All requirements met!
                      </div>
                    )}
                  </div>
                )}
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
                    href={`${window.location.origin}?view=terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href={`${window.location.origin}?view=privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white py-4 sm:py-6 text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300"
                disabled={
                  loading ||
                  (passwordStrength ? !passwordStrength.isValid : false)
                }
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
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
