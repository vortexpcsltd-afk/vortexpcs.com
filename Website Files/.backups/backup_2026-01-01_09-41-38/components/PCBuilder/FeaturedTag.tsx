export const FeaturedTag = ({ label = "Featured" }: { label?: string }) => (
  <div className="rounded-full bg-black/30 backdrop-blur-xl border-2 border-amber-400/70 text-amber-300 text-xs font-semibold tracking-wide px-3 py-1 shadow-[0_0_20px_rgba(251,191,36,0.25)]">
    {label}
  </div>
);
