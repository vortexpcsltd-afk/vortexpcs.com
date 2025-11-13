import {
  Shield,
  Lock,
  CreditCard,
  Award,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface SecurityBadgesProps {
  variant?: "inline" | "grid" | "compact";
  className?: string;
}

export function SecurityBadges({
  variant = "grid",
  className = "",
}: SecurityBadgesProps) {
  const badges = [
    {
      icon: Shield,
      title: "SSL Encrypted",
      description: "256-bit encryption",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      icon: Lock,
      title: "Secure Payments",
      description: "PCI DSS compliant",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      icon: CreditCard,
      title: "Stripe Protected",
      description: "Bank-level security",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      icon: CheckCircle2,
      title: "Verified Secure",
      description: "100% safe checkout",
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/20",
    },
  ];

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center justify-center gap-4 flex-wrap ${className}`}
      >
        {badges.slice(0, 3).map((badge, index) => {
          const Icon = badge.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-gray-400"
            >
              <div
                className={`${badge.bgColor} ${badge.borderColor} border rounded-full p-1.5`}
              >
                <Icon className={`w-3.5 h-3.5 ${badge.color}`} />
              </div>
              <span>{badge.title}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-6 flex-wrap ${className}`}>
        {badges.map((badge, index) => {
          const Icon = badge.icon;
          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`${badge.bgColor} ${badge.borderColor} border rounded-lg p-2`}
              >
                <Icon className={`w-4 h-4 ${badge.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{badge.title}</p>
                <p className="text-xs text-gray-400">{badge.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <div
            key={index}
            className={`${badge.bgColor} ${badge.borderColor} border backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 hover:scale-105 transition-transform duration-200`}
          >
            <div className={`flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${badge.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{badge.title}</p>
              <p className="text-xs text-gray-400">{badge.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PaymentProviderLogos({
  className = "",
}: {
  className?: string;
}) {
  const logos = [
    { name: "Visa", color: "text-blue-400" },
    { name: "Mastercard", color: "text-orange-400" },
    { name: "Amex", color: "text-green-400" },
    { name: "PayPal", color: "text-sky-400" },
  ];

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <span className="text-xs text-gray-500">We accept:</span>
      {logos.map((logo, index) => (
        <div
          key={index}
          className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs font-semibold"
        >
          <span className={logo.color}>{logo.name}</span>
        </div>
      ))}
    </div>
  );
}

export function TrustIndicators({ className = "" }: { className?: string }) {
  const indicators = [
    {
      icon: Award,
      text: "5-Year Warranty",
      color: "text-yellow-400",
    },
    {
      icon: Zap,
      text: "Fast Delivery",
      color: "text-cyan-400",
    },
    {
      icon: CheckCircle2,
      text: "Easy Returns",
      color: "text-green-400",
    },
  ];

  return (
    <div className={`flex items-center justify-center gap-6 ${className}`}>
      {indicators.map((indicator, index) => {
        const Icon = indicator.icon;
        return (
          <div key={index} className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${indicator.color}`} />
            <span className="text-sm text-gray-400">{indicator.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export default SecurityBadges;
