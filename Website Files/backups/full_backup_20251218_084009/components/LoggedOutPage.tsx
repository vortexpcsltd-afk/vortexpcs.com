import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, LogIn, Shield } from "lucide-react";

export function LoggedOutPage() {
  const navigate = useNavigate();

  // Focus main heading for accessibility after mount
  useEffect(() => {
    const h = document.getElementById("logged-out-heading");
    h?.focus();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <Card className="w-full max-w-lg bg-white/5 backdrop-blur-xl border-white/10 p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-sky-500/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl animate-pulse delay-700" />
        </div>
        <div className="relative space-y-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 mx-auto">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1
            id="logged-out-heading"
            tabIndex={-1}
            className="text-3xl font-bold text-white text-center"
          >
            You have been logged out
          </h1>
          <p className="text-gray-300 text-center max-w-md mx-auto">
            Your session has ended securely. You can return to browsing the site
            or log back in to access your dashboard and saved builds.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Button
              variant="premium"
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/member")}
              className="w-full border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
            >
              <LogIn className="w-4 h-4 mr-2" /> Log In
            </Button>
          </div>
          <div className="text-center text-xs text-gray-500 pt-2">
            Need help? Visit the Support section after logging in.
          </div>
        </div>
      </Card>
    </div>
  );
}

export default LoggedOutPage;
