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
        "flex items-center space-x-1.5 text-xs py-3 px-3 md:px-4 relative z-10 min-h-[45px]",
        className
      )}
    >
      <ol className="flex items-center space-x-1.5 flex-wrap w-full">
        {/* Home Link */}
        <li className="flex items-center">
          <button
            onClick={() => onNavigate?.("home")}
            className="flex items-center gap-1.5 text-white hover:text-sky-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg px-2 py-1.5 font-semibold border-2 border-sky-500/40 hover:border-sky-400 bg-transparent hover:bg-sky-500/10"
            aria-label="Home"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        </li>

        {/* Breadcrumb Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-sky-400 mx-1.5" />
              {isLast || item.current ? (
                <span
                  className="text-white font-bold px-2 py-1.5 text-xs border-2 border-sky-400 bg-sky-500/20 rounded-lg"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={() => handleClick(item)}
                  className="text-white hover:text-sky-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg px-2 py-1.5 font-semibold border-2 border-sky-500/40 hover:border-sky-400 bg-transparent hover:bg-sky-500/10"
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
