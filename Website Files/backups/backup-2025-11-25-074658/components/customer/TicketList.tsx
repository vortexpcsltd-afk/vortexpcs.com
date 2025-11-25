import { useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { MessageSquare, Search, Plus } from "lucide-react";
import AnimateIn from "../util/AnimateIn";

export type TicketListItem = {
  id: string;
  subject: string;
  status: "open" | "in-progress" | "awaiting-customer" | "resolved" | "closed";
  type: string;
  priority?: "low" | "normal" | "high" | "urgent";
  updatedAt?: Date | string | number | null;
  unread?: boolean;
};

export function TicketList({
  items = [],
  onSelect,
  loading = false,
  onCreate,
}: {
  items?: TicketListItem[];
  onSelect?: (id: string) => void;
  loading?: boolean;
  onCreate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered: TicketListItem[] = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.priority || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4 h-[600px] flex flex-col">
      <div className="mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search tickets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-11"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-20 rounded-lg bg-white/5 border border-white/10"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-white font-semibold mb-2">
              {items.length === 0 ? "No tickets yet" : "No matches found"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {items.length === 0
                ? "Create your first support ticket to get started"
                : "Try adjusting your search"}
            </p>
            {items.length === 0 && onCreate && (
              <Button
                onClick={onCreate}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first ticket
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t, idx) => (
              <AnimateIn key={t.id} delay={idx * 40}>
                <button
                  onClick={() => onSelect?.(t.id)}
                  className="w-full text-left p-4 hover:bg-white/5 rounded-lg transition-all duration-200 border border-transparent hover:border-white/10 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 text-xs capitalize">
                          {t.type}
                        </Badge>
                        {t.unread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <h4 className="text-white font-medium mb-1 group-hover:text-sky-400 transition-colors truncate">
                        {t.subject}
                      </h4>
                      <p className="text-xs text-gray-400">
                        Updated{" "}
                        {t.updatedAt
                          ? new Date(t.updatedAt).toLocaleDateString()
                          : "recently"}
                      </p>
                    </div>
                    <Badge
                      className={
                        t.status === "open"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : t.status === "in-progress"
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          : t.status === "awaiting-customer"
                          ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                          : t.status === "resolved"
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                          : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                      }
                    >
                      {t.status}
                    </Badge>
                  </div>
                </button>
              </AnimateIn>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default TicketList;
