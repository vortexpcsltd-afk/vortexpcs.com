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

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-2 text-sm py-4 px-4 md:px-0",
        className
      )}
    >
      <ol className="flex items-center space-x-2 flex-wrap">
        {/* Home Link */}
        <li className="flex items-center">
          <button
            onClick={() => onNavigate?.("home")}
            className="flex items-center gap-1.5 text-gray-400 hover:text-sky-400 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
        </li>

        {/* Breadcrumb Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />
              {isLast || item.current ? (
                <span
                  className="text-sky-400 font-medium px-2 py-1"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={() => handleClick(item)}
                  className="text-gray-400 hover:text-sky-400 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1"
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
