import React from "react";

type Props = {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
};

export function LegalLayout({ title, lastUpdated, children }: Props) {
  const formattedDate = React.useMemo(() => {
    if (!lastUpdated) return undefined;
    try {
      return new Date(lastUpdated).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return undefined;
    }
  }, [lastUpdated]);

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-block rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 text-xs px-3 py-1 mb-4">
            Legal
          </div>
          <h1 className="text-white mb-4">{title}</h1>
          {formattedDate && (
            <p className="text-gray-400">Last updated: {formattedDate}</p>
          )}
        </div>

        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default LegalLayout;
