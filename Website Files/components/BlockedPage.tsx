import { ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";

export function BlockedPage({
  onNavigate,
}: {
  onNavigate: (view: string) => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Temporarily Blocked</h1>
        <p className="text-gray-300 mb-6">
          For your security, access from your IP has been temporarily blocked
          due to multiple failed login attempts. Please contact support or wait
          for an administrator to unblock your IP.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => onNavigate("contact")}
            className="bg-gradient-to-r from-sky-600 to-blue-600"
          >
            Contact Support
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate("home")}
            className="border-white/20"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
