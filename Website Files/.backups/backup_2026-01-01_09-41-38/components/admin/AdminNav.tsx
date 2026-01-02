import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Search,
  Settings,
  LineChart,
  ListChecks,
  Shield,
  Package,
  Users,
  Mail,
  Database,
  CreditCard,
  Bot,
  Bell,
  FileText,
  Wrench,
} from "lucide-react";
import { cn } from "../ui/utils";

type NavItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  badge?: string | number;
  children?: NavItem[];
};

const NAV_GROUPS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LineChart className="h-4 w-4" />,
    path: "/admin#dashboard",
  },
  {
    id: "ops",
    label: "Operations",
    icon: <ListChecks className="h-4 w-4" />,
    children: [
      {
        id: "inventory",
        label: "Inventory",
        icon: <Package className="h-4 w-4" />,
        path: "/admin#inventory",
      },
      {
        id: "orders",
        label: "Orders",
        icon: <CreditCard className="h-4 w-4" />,
        path: "/admin#orders",
      },
      {
        id: "users",
        label: "Users",
        icon: <Users className="h-4 w-4" />,
        path: "/admin#customers",
      },
      {
        id: "emails",
        label: "Email & SMTP",
        icon: <Mail className="h-4 w-4" />,
        path: "/admin#email",
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    icon: <FileText className="h-4 w-4" />,
    children: [
      {
        id: "analytics",
        label: "Analytics",
        icon: <LineChart className="h-4 w-4" />,
        path: "/admin#analytics",
      },
      {
        id: "recommendations",
        label: "Recommendations",
        icon: <Bot className="h-4 w-4" />,
        path: "/admin#recommendations",
      },
      {
        id: "reports",
        label: "Scheduled Reports",
        icon: <Bell className="h-4 w-4" />,
        path: "/admin#reports",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: <Settings className="h-4 w-4" />,
    children: [
      {
        id: "security",
        label: "Security",
        icon: <Shield className="h-4 w-4" />,
        path: "/admin#security",
      },
      {
        id: "services",
        label: "Services",
        icon: <Database className="h-4 w-4" />,
        path: "/admin#monitoring",
      },
      {
        id: "maintenance",
        label: "Maintenance",
        icon: <Wrench className="h-4 w-4" />,
        path: "/admin#performance",
      },
      {
        id: "settings",
        label: "Settings",
        icon: <Settings className="h-4 w-4" />,
        path: "/admin#content",
      },
    ],
  },
];

export default function AdminNav({ className }: { className?: string }) {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const closeTimers = React.useRef<Record<string, number>>({});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.getElementById(
          "admin-nav-search"
        ) as HTMLInputElement | null;
        el?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function open(id: string) {
    const t = closeTimers.current[id];
    if (t) {
      window.clearTimeout(t);
      delete closeTimers.current[id];
    }
    setExpanded((prev) => ({ ...prev, [id]: true }));
  }
  function scheduleClose(id: string) {
    const t = window.setTimeout(() => {
      setExpanded((prev) => ({ ...prev, [id]: false }));
      delete closeTimers.current[id];
    }, 150);
    closeTimers.current[id] = t;
  }
  return (
    <div className={cn("w-full", className)}>
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto px-2 md:px-4">
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1 md:gap-2">
                {NAV_GROUPS.map((group) => {
                  const isLeaf = !group.children && group.path;
                  const active = (() => {
                    if (!group.path) return false;
                    if (group.path === "/admin") {
                      return location.pathname === "/admin" && !location.hash;
                    }
                    const targetHash = group.path.split("#")[1];
                    return (
                      location.pathname === "/admin" &&
                      location.hash === `#${targetHash}`
                    );
                  })();
                  return (
                    <div
                      key={group.id}
                      className="relative"
                      onMouseEnter={() => !isLeaf && open(group.id)}
                      onMouseLeave={() => !isLeaf && scheduleClose(group.id)}
                    >
                      <Link
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-sm text-white hover:border-sky-500/30",
                          active && "border-sky-500/40 bg-sky-500/10"
                        )}
                        to={isLeaf ? group.path! : "#"}
                        onClick={(e) => {
                          if (!isLeaf) e.preventDefault();
                        }}
                      >
                        {group.icon}
                        <span className="hidden sm:inline">{group.label}</span>
                      </Link>
                      {!isLeaf && expanded[group.id] && (
                        <div
                          className="absolute left-0 top-full min-w-[240px] rounded-md border border-white/10 bg-black/80 backdrop-blur-xl shadow-xl"
                          onMouseEnter={() => open(group.id)}
                          onMouseLeave={() => scheduleClose(group.id)}
                        >
                          {(group.children || []).map((child) => {
                            const childActive = (() => {
                              if (!child.path) return false;
                              const targetHash = child.path.split("#")[1];
                              return (
                                location.pathname === "/admin" &&
                                location.hash === `#${targetHash}`
                              );
                            })();
                            return (
                              <Link
                                key={child.id}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-sky-500/10",
                                  childActive && "text-sky-400 bg-sky-500/10"
                                )}
                                to={child.path || "#"}
                                onClick={(e) => {
                                  if (!child.path) e.preventDefault();
                                }}
                              >
                                {child.icon}
                                <span>{child.label}</span>
                                {child.badge !== undefined && (
                                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 text-sky-400">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                <Search className="h-4 w-4 text-sky-400" />
                <input
                  id="admin-nav-search"
                  placeholder="Quick search (Ctrl+K)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-48 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-sky-500/40"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
