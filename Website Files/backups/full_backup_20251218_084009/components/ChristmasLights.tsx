import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

function isHolidayWindow(date: Date): boolean {
  const m = date.getMonth(); // 0=Jan
  const d = date.getDate();
  if (m === 10 && d >= 14) return true; // Nov 14 - Nov 30
  if (m === 11) return true; // December
  if (m === 0 && d <= 5) return true; // Jan 1 - Jan 5
  return false;
}

export function ChristmasLights() {
  const shouldShow = useMemo(() => isHolidayWindow(new Date()), []);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem("vortex_hide_christmas_lights");
      if (v === "1") setHidden(true);
    } catch {
      // ignore
    }
  }, []);

  if (!shouldShow || hidden) return null;

  return (
    <div className="absolute left-0 right-0 -bottom-8 md:-bottom-9 select-none">
      <div className="relative mx-auto max-w-7xl px-6 pointer-events-none">
        <img
          src="/seasonal/christmas-lights.svg"
          alt=""
          aria-hidden="true"
          className="w-full h-auto select-none"
          decoding="async"
          loading="eager"
        />
        <button
          type="button"
          aria-label="Hide seasonal lights"
          onClick={() => {
            try {
              localStorage.setItem("vortex_hide_christmas_lights", "1");
            } catch {
              // ignore
            }
            setHidden(true);
          }}
          className="pointer-events-auto absolute right-6 -top-6 md:-top-7 inline-flex items-center gap-1 text-[11px] md:text-xs px-2 py-1 rounded-md bg-black/60 hover:bg-black/70 border border-white/10 text-gray-300 hover:text-white backdrop-blur-md"
        >
          <X className="w-3.5 h-3.5" />
          Hide
        </button>
      </div>
    </div>
  );
}
