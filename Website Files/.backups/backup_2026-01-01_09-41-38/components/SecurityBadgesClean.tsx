import React from "react";
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaPaypal } from "react-icons/fa";
import { SiDhl, SiDpd, SiUps, SiFedex } from "react-icons/si";
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
        {badges.slice(0, 3).map((badge, i) => {
          const Icon = badge.icon;
          return (
            <div
              key={i}
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
        {badges.map((badge, i) => {
          const Icon = badge.icon;
          return (
            <div key={i} className="flex items-center gap-2">
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

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {badges.map((badge, i) => {
        const Icon = badge.icon;
        return (
          <div
            key={i}
            className={`${badge.bgColor} ${badge.borderColor} border backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex-shrink-0">
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
  const logos: Array<{
    name: string;
    className: string;
    Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }> = [
    {
      name: "Visa",
      className: "border-blue-500/30 text-blue-400",
      Icon: FaCcVisa,
    },
    {
      name: "Mastercard",
      className: "border-orange-500/30 text-orange-400",
      Icon: FaCcMastercard,
    },
    {
      name: "Amex",
      className: "border-teal-500/30 text-teal-400",
      Icon: FaCcAmex,
    },
    {
      name: "PayPal",
      className: "border-sky-500/30 text-sky-400",
      Icon: FaPaypal,
    },
  ];
  return (
    <ul
      className={`flex flex-wrap items-center justify-start gap-2 ${className}`}
      aria-label="Accepted payment providers"
    >
      {logos.map(({ name, className: brand, Icon }) => (
        <li key={name} className="m-0">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide bg-white/5 backdrop-blur-sm border ${brand} hover:border-sky-500/40 hover:bg-white/10 transition-colors`}
          >
            <Icon className="text-base" aria-hidden={true} />
            <span>{name}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TrustIndicators({ className = "" }: { className?: string }) {
  const indicators = [
    { icon: Award, text: "3-Year Warranty", color: "text-yellow-400" },
    { icon: Zap, text: "Fast Delivery", color: "text-cyan-400" },
    { icon: CheckCircle2, text: "Easy Returns", color: "text-green-400" },
  ];
  return (
    <div className={`flex items-center justify-center gap-6 ${className}`}>
      {indicators.map((indicator, i) => {
        const Icon = indicator.icon;
        return (
          <div key={i} className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${indicator.color}`} />
            <span className="text-sm text-gray-400">{indicator.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DeliveryProviderLogos({
  className = "",
}: {
  className?: string;
}) {
  const providers: Array<{
    name: string;
    className: string;
    Icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }> = [
    {
      name: "DHL",
      className: "border-yellow-500/40 text-yellow-400",
      Icon: SiDhl,
    },
    { name: "DPD", className: "border-red-500/40 text-red-400", Icon: SiDpd },
    { name: "Royal Mail", className: "border-red-500/40 text-red-400" },
    {
      name: "UPS",
      className: "border-amber-600/40 text-amber-500",
      Icon: SiUps,
    },
    {
      name: "FedEx",
      className: "border-purple-500/40 text-purple-400",
      Icon: SiFedex,
    },
  ];
  return (
    <ul
      className={`flex flex-wrap items-center justify-start gap-2 ${className}`}
      aria-label="Supported delivery providers"
    >
      {providers.map(({ name, className: brand, Icon }) => (
        <li key={name}>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-wide bg-white/5 backdrop-blur-sm border ${brand} hover:border-sky-500/40 hover:bg-white/10 transition-colors`}
          >
            {Icon ? <Icon className="text-base" aria-hidden={true} /> : null}
            <span>{name}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default SecurityBadges;
