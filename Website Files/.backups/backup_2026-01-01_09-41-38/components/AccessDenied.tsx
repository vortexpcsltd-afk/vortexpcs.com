import { Shield, Lock, Mail } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

export function AccessDenied({
  onLogin,
  onNavigate,
}: {
  onLogin: () => void;
  onNavigate?: (view: string) => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
      <Card className="max-w-2xl w-full bg-white/5 backdrop-blur-xl border-white/10 p-5 sm:p-8 text-center">
        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 flex items-center justify-center mb-4 sm:mb-6">
          <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Access Denied
        </h2>
        <p className="text-gray-300 mt-2 text-sm sm:text-base leading-relaxed">
          Admin access is required to view this area. Sign in with an
          administrator account, or head back to explore the site.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8 justify-center">
          <Button
            onClick={onLogin}
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-sm sm:text-base py-2.5 sm:py-3"
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Sign
            in as Admin
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate?.("home")}
            className="border-white/20 text-white hover:bg-white/10 text-sm sm:text-base py-2.5 sm:py-3"
          >
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate?.("business-solutions")}
            className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-sm sm:text-base py-2.5 sm:py-3"
            title="Request business/admin access"
          >
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
            Request Access
          </Button>
        </div>
      </Card>
    </div>
  );
}
