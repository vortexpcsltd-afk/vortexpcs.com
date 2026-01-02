import React from "react";
import { cn } from "./ui/utils";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeIcon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function PageHero({
  title,
  subtitle,
  description,
  badge,
  badgeIcon,
  className,
  children,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative pt-[150px] pb-12 md:pb-16 px-4 md:px-6 lg:px-8",
        className
      )}
    >
      <div className="container mx-auto max-w-[1400px]">
        {/* Glassmorphism card */}
        <div className="relative">
          {/* Background blur elements */}
          <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl blur-2xl -z-10"></div>

          {/* Glassmorphism container */}
          <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 md:p-12 lg:p-16 text-center">
            {/* Badge */}
            {badge && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 mb-6 backdrop-blur-xl">
                {badgeIcon}
                <span className="font-semibold text-sm">{badge}</span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
              {title}
            </h1>

            {/* Subtitle/Gradient text */}
            {subtitle && (
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 text-transparent bg-clip-text mb-6">
                {subtitle}
              </h2>
            )}

            {/* Description */}
            {description && (
              <p className="text-lg text-gray-300 mb-8 max-w-6xl mx-auto leading-relaxed">
                {description}
              </p>
            )}

            {/* Custom children (CTA buttons, etc.) */}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
