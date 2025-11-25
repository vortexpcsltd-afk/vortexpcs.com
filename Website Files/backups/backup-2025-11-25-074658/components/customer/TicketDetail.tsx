import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { Loader2, Send, RefreshCw, Copy } from "lucide-react";
import AnimateIn from "../util/AnimateIn";

export interface TicketMessageDisplay {
  id: string;
  sender: string; // user id or 'agent'
  body: string;
  createdAt: Date | string | number;
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
    scanStatus?: "pending" | "clean" | "infected" | "error";
  }>;
}

export interface TicketDetailData {
  id: string;
  subject: string;
  status: "open" | "in-progress" | "awaiting-customer" | "resolved" | "closed";
  priority?: "low" | "normal" | "high" | "urgent";
  type: string;
  messages: TicketMessageDisplay[];
  createdAt?: Date | string | number;
  updatedAt?: Date | string | number;
  assignedTo?: string | null;
}

interface TicketDetailProps {
  ticket?: TicketDetailData | null;
  loading?: boolean;
  onRefresh?: (id: string) => void;
  onSendMessage?: (
    id: string,
    body: string,
    files?: File[]
  ) => Promise<void> | void;
}

export function TicketDetail({
  ticket,
  loading = false,
  onRefresh,
  onSendMessage,
}: TicketDetailProps) {
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<
    Array<{ url: string; name: string; type: string; size: number }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copied, setCopied] = useState(false);

  // Load and persist drafts per ticket id
  useEffect(() => {
    if (!ticket?.id) return;
    const key = `ticket-draft:${ticket.id}`;
    const saved = localStorage.getItem(key);
    if (saved && !replyBody) setReplyBody(saved);
    // We intentionally don't add replyBody to deps to avoid overwriting active typing with stale saved value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.id]);

  useEffect(() => {
    if (!ticket?.id) return;
    const key = `ticket-draft:${ticket.id}`;
    // save draft (simple immediate save; could debounce if needed)
    localStorage.setItem(key, replyBody);
  }, [replyBody, ticket?.id]);

  // Handle file previews lifecycle
  useEffect(() => {
    // Revoke previous URLs
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    const next = files.map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
      type: f.type,
      size: f.size,
    }));
    setPreviews(next);
    // Cleanup on unmount
    return () => {
      next.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  if (!ticket) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 h-full flex items-center justify-center text-gray-400">
        Select a ticket to view its details.
      </Card>
    );
  }

  async function handleSend() {
    const trimmed = replyBody.trim();
    if (!trimmed || !ticket) return;
    try {
      setSending(true);
      await onSendMessage?.(ticket.id, trimmed, files);
      setReplyBody("");
      setFiles([]);
      setPreviews([]);
      if (ticket?.id) localStorage.removeItem(`ticket-draft:${ticket.id}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-0 flex flex-col h-full">
      <div className="border-b border-white/10 p-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">
            {ticket.subject}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400 capitalize">
              {ticket.type}
            </Badge>
            <Badge
              className={
                ticket.status === "open"
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : ticket.status === "in-progress"
                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  : ticket.status === "awaiting-customer"
                  ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                  : ticket.status === "resolved"
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  : "bg-gray-500/20 text-gray-300 border-gray-500/30"
              }
            >
              {ticket.status}
            </Badge>
            {ticket.priority && (
              <Badge
                className={
                  ticket.priority === "urgent"
                    ? "bg-red-600/30 text-red-300 border-red-600/40"
                    : ticket.priority === "high"
                    ? "bg-red-500/20 text-red-300 border-red-500/30"
                    : ticket.priority === "normal"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                }
              >
                {ticket.priority}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            size="sm"
            onClick={async () => {
              try {
                const lines = ticket.messages.map((m) => {
                  const d = new Date(m.createdAt);
                  const who =
                    m.sender === "agent" || m.sender === "support"
                      ? "Support"
                      : "You";
                  return `[${d.toLocaleString()}] ${who}: ${m.body}`;
                });
                await navigator.clipboard.writeText(lines.join("\n"));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                /* ignore */
              }
            }}
          >
            <Copy className="w-4 h-4 mr-2" />{" "}
            {copied ? "Copied" : "Copy transcript"}
          </Button>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            size="sm"
            disabled={loading}
            onClick={() => onRefresh?.(ticket.id)}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {ticket.messages.map((m, idx) => {
            const date = new Date(m.createdAt);
            const isAgent = m.sender === "agent" || m.sender === "support";
            return (
              <AnimateIn key={m.id} delay={idx * 40}>
                <div
                  className={`rounded-lg p-4 text-sm border backdrop-blur-md max-w-[85%] transition-all duration-300 hover:shadow-lg ${
                    isAgent
                      ? "ml-auto bg-gradient-to-br from-blue-500/10 to-sky-500/10 border-blue-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs uppercase tracking-wide text-gray-400">
                      {isAgent ? "Support" : "You"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {date.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-white whitespace-pre-wrap leading-relaxed">
                    {m.body}
                  </div>
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {m.attachments.map((a, ai) => {
                        const isImage = a.type?.startsWith("image/");
                        return (
                          <a
                            key={ai}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:border-sky-500/40 hover:bg-sky-500/10 text-sky-300 transition-colors"
                          >
                            {isImage && (
                              <img
                                src={a.url}
                                alt={a.name}
                                loading="lazy"
                                className="w-10 h-10 object-cover rounded border border-white/10"
                              />
                            )}
                            <span className="truncate max-w-[200px]">
                              {a.name}
                            </span>
                            {typeof a.size === "number" && (
                              <span className="text-gray-500 ml-auto">
                                {(a.size / 1024).toFixed(1)} KB
                              </span>
                            )}
                            {a.scanStatus && (
                              <span
                                className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize ${
                                  a.scanStatus === "pending"
                                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                    : a.scanStatus === "clean"
                                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                                    : a.scanStatus === "infected"
                                    ? "bg-red-600/30 text-red-300 border-red-600/50"
                                    : "bg-orange-500/20 text-orange-300 border-orange-500/30"
                                }`}
                              >
                                {a.scanStatus}
                              </span>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </AnimateIn>
            );
          })}
          {ticket.messages.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">
              No messages yet.
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-white/10 p-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Type your reply..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                void handleSend();
              }
            }}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            disabled={sending}
          />
          {/* Attachments preview */}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3 py-1">
              {previews.map((p, idx) => (
                <div
                  key={idx}
                  className="group relative border border-white/10 rounded-md overflow-hidden bg-white/5"
                >
                  {p.type.startsWith("image/") ? (
                    <img
                      src={p.url}
                      alt={p.name}
                      className="h-20 w-28 object-cover"
                    />
                  ) : (
                    <div className="h-20 w-28 flex items-center justify-center text-[10px] text-gray-300 p-2">
                      {p.name}
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute top-1 right-1 text-[10px] bg-black/50 text-white rounded px-1 opacity-0 group-hover:opacity-100 transition"
                    onClick={() =>
                      setFiles((arr) => arr.filter((_, i) => i !== idx))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const fl = Array.from(e.target.files || []);
                  if (fl.length) setFiles((prev) => [...prev, ...fl]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
              >
                Attach files
              </Button>
              <span className="text-[11px] text-gray-400">
                Attachments are optional and will be included when available
              </span>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSend}
                disabled={sending || !replyBody.trim()}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {sending ? "Sending" : "Send Reply"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default TicketDetail;
