import { useState, useEffect, FormEvent } from "react";
import { X, Gift, Zap, Mail, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe?: (email: string) => void;
  _onNavigate?: (view: string) => void;
  variant?: "discount" | "newsletter" | "cart" | "builder";
  customMessage?: string;
}

export function ExitIntentModal({
  isOpen,
  onClose,
  onSubscribe,
  _onNavigate: _,
  variant = "discount",
  customMessage,
}: ExitIntentModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setEmail("");
        setSubmitted(false);
        setIsSubmitting(false);
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      if (onSubscribe) {
        onSubscribe(email);
      }

      setSubmitted(true);
      setIsSubmitting(false);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1000);
  };
  const getContent = () => {
    switch (variant) {
      case "discount":
        return {
          icon: <Gift className="w-16 h-16 text-sky-400" />,
          title: "Wait! Don't Miss Out! 🎁",
          subtitle: "Get 10% off your first custom PC build",
          description:
            "Join thousands of satisfied customers who got exclusive deals on premium gaming PCs.",
          inputPlaceholder: "Enter your email for the discount",
          buttonText: "Claim My 10% Discount",
          successMessage: "Awesome! Check your email for the discount code! 🎉",
        };

      case "newsletter":
        return {
          icon: <Mail className="w-16 h-16 text-blue-400" />,
          title: "Stay in the Loop! 📬",
          subtitle: "Get exclusive PC building tips & deals",
          description:
            "Join our community of PC enthusiasts. Get weekly tips, new component releases, and exclusive member-only discounts.",
          inputPlaceholder: "Enter your email address",
          buttonText: "Subscribe Now",
          successMessage: "Welcome aboard! You'll hear from us soon! 🚀",
        };

      case "cart":
        return {
          icon: <Zap className="w-16 h-16 text-cyan-400" />,
          title: "Your Dream PC Awaits! ⚡",
          subtitle: "Complete your build and save big",
          description:
            "You're just one step away from the ultimate gaming experience. Plus, get free shipping on orders over £1,000!",
          inputPlaceholder: "Enter email to save your cart",
          buttonText: "Complete My Build",
          successMessage: "Cart saved! You can finish anytime! 💾",
        };

      case "builder":
        return {
          icon: <Zap className="w-16 h-16 text-purple-400" />,
          title: "Not Sure What to Build? 🤔",
          subtitle: "Let our AI assistant guide you",
          description:
            "Get personalised recommendations based on your needs, budget, and gaming preferences. It's 100% free!",
          inputPlaceholder: "Enter email to get started",
          buttonText: "Get My Custom Recommendation",
          successMessage: "Perfect! Redirecting to PC Finder... 🎯",
        };

      default:
        return {
          icon: <Gift className="w-16 h-16 text-sky-400" />,
          title: customMessage || "Wait! Before You Go...",
          subtitle: "We have something special for you",
          description: "Don't miss out on exclusive offers.",
          inputPlaceholder: "Enter your email",
          buttonText: "Get Started",
          successMessage: "Success! 🎉",
        };
    }
  };

  const content = getContent();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-lg bg-black/90 backdrop-blur-xl border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10">
          {/* Icon */}
          <div className="flex justify-center mb-6 animate-in zoom-in duration-500 delay-100">
            {content.icon}
          </div>

          {!submitted ? (
            <>
              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3 animate-in slide-in-from-bottom duration-500 delay-150">
                {content.title}
              </h2>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-sky-400 text-center mb-4 animate-in slide-in-from-bottom duration-500 delay-200">
                {content.subtitle}
              </p>

              {/* Description */}
              <p className="text-gray-300 text-center mb-8 animate-in slide-in-from-bottom duration-500 delay-250">
                {content.description}
              </p>

              {/* Email Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4 animate-in slide-in-from-bottom duration-500 delay-300"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={content.inputPlaceholder}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      {content.buttonText}
                      <ArrowRight className="w-5 h-5 ml-2 inline-block group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* No Thanks Link */}
              <button
                onClick={onClose}
                className="mt-6 text-sm text-gray-400 hover:text-white transition-colors w-full text-center animate-in fade-in duration-500 delay-350"
              >
                No thanks, I'll miss out on this offer
              </button>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-6 text-xs text-gray-400 animate-in fade-in duration-500 delay-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span>No Spam Ever</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500 delay-100">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 animate-in slide-in-from-bottom duration-500 delay-150">
                  You're All Set!
                </h3>

                <p className="text-lg text-sky-400 animate-in slide-in-from-bottom duration-500 delay-200">
                  {content.successMessage}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-purple-500" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </Card>
    </div>
  );
}

export default ExitIntentModal;
