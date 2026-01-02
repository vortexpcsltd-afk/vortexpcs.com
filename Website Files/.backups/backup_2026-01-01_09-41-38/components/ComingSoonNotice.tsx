import { ReactNode } from "react";
import { Card } from "./ui/card";
import { Clock, X } from "lucide-react";
import { Button } from "./ui/button";

interface ComingSoonNoticeProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  launchDate?: string;
  onDismiss?: () => void;
}

// Simple glassmorphism notice component to indicate upcoming features.
// Uses theme conventions: bg-white/5 backdrop-blur-xl border-white/10 with cyan/blue accents.
export default function ComingSoonNotice({
  title = "Feature Coming Soon",
  description = "We're polishing the final details. Check back shortly!",
  icon,
  className = "",
  launchDate,
  onDismiss,
}: ComingSoonNoticeProps) {
  // If used as a banner (has onDismiss), render as fixed top banner
  if (onDismiss) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl border-b border-amber-500/30 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-xs sm:text-sm leading-tight">
                  <span className="hidden sm:inline">
                    🚧 Development Mode - Test Orders Only
                  </span>
                  <span className="sm:hidden">🚧 Dev Mode - Test Only</span>
                </p>
                {launchDate && (
                  <p className="text-amber-200 text-[10px] sm:text-xs leading-tight mt-0.5">
                    <span className="hidden xs:inline">Official launch: </span>
                    {new Date(launchDate).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default card layout for inline use
  return (
    <Card
      className={`bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 p-6 flex flex-col gap-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-tr from-sky-600/30 to-blue-600/30 border border-sky-500/40">
          {icon || <Clock className="w-6 h-6 text-sky-400" />}
        </div>
        <h3 className="text-xl font-semibold text-white tracking-tight">
          {title}
        </h3>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed max-w-prose">
        {description}
      </p>
      <div className="mt-2 text-xs text-gray-500">
        <span className="inline-block px-2 py-1 rounded-md bg-sky-500/20 border border-sky-500/40 text-sky-300 font-medium">
          In Development
        </span>
      </div>
    </Card>
  );
}
