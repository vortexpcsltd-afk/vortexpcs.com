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
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Card className="max-w-2xl w-full bg-white/5 backdrop-blur-xl border-white/10 p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-gray-300 mt-2">
          Admin access is required to view this area. Sign in with an
          administrator account, or head back to explore the site.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
          <Button
            onClick={onLogin}
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
          >
            <Shield className="w-4 h-4 mr-2" /> Sign in as Admin
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate?.("home")}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate?.("business-solutions")}
            className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            title="Request business/admin access"
          >
            <Mail className="w-4 h-4 mr-2" /> Request Access
          </Button>
        </div>
      </Card>
    </div>
  );
}
