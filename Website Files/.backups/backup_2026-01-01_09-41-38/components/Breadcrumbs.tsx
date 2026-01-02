import { ChevronRight, Home } from "lucide-react";
import { cn } from "./ui/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  onNavigate?: (view: string) => void;
}

export function Breadcrumbs({
  items,
  className,
  onNavigate,
}: BreadcrumbsProps) {
  const handleClick = (item: BreadcrumbItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href && onNavigate) {
      onNavigate(item.href);
    }
  };

  // Don't render if no items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center text-xs py-3 px-2 sm:px-3 md:px-4 relative z-10 min-h-[45px]",
        className
      )}
    >
      <ol className="flex items-center flex-wrap gap-1 sm:gap-1.5 w-full">
        {/* Home Link */}
        <li className="flex items-center">
          <button
            onClick={() => onNavigate?.("home")}
            className="flex items-center gap-1 sm:gap-1.5 text-white hover:text-sky-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg px-1.5 sm:px-2 py-1 sm:py-1.5 font-semibold border-2 border-sky-500/40 hover:border-sky-400 bg-transparent hover:bg-sky-500/10 text-[10px] sm:text-xs"
            aria-label="Home"
          >
            <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline sm:inline">Home</span>
          </button>
        </li>

        {/* Breadcrumb Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 mx-0.5 sm:mx-1 flex-shrink-0" />
              {isLast || item.current ? (
                <span
                  className="text-white font-bold px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs border-2 border-sky-400 bg-sky-500/20 rounded-lg whitespace-nowrap max-w-[120px] sm:max-w-none truncate"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={() => handleClick(item)}
                  className="text-white hover:text-sky-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg px-1.5 sm:px-2 py-1 sm:py-1.5 font-semibold border-2 border-sky-500/40 hover:border-sky-400 bg-transparent hover:bg-sky-500/10 text-[10px] sm:text-xs whitespace-nowrap max-w-[120px] sm:max-w-none truncate"
                  title={item.label}
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
