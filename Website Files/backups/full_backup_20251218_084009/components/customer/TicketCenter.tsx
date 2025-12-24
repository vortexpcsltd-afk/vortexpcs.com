import { useState, useEffect, useCallback, useMemo } from "react";
import TicketList, { TicketListItem } from "./TicketList";
import TicketDetail, { TicketDetailData } from "./TicketDetail";
import TicketComposer, { type TicketComposerValues } from "./TicketComposer";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, ArrowLeft, Filter, Paperclip } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { logger } from "../../services/logger";
import {
  getUserSupportTickets,
  createSupportTicket,
  addSupportTicketMessage,
  type SupportTicket,
} from "../../services/database";
import { uploadTicketAttachment } from "../../services/storage";
import { filterAcceptableFiles } from "../../services/fileValidation";

// Helper mappers
function mapTickets(raw: SupportTicket[]): TicketListItem[] {
  return raw.map((t) => ({
    id: String(t.id),
    subject: t.subject || "Support Ticket",
    status: (t.status || "open") as TicketListItem["status"],
    type: t.type || "general",
    priority: t.priority,
    updatedAt: t.updatedAt || t.createdAt || Date.now(),
    unread: false,
  }));
}

function mapTicketDetail(ticket: SupportTicket): TicketDetailData {
  return {
    id: String(ticket.id),
    subject: ticket.subject || "Support Ticket",
    status: (ticket.status || "open") as TicketDetailData["status"],
    priority: ticket.priority,
    type: ticket.type || "general",
    createdAt: ticket.createdAt || Date.now(),
    updatedAt: ticket.updatedAt || ticket.createdAt || Date.now(),
    messages: Array.isArray(ticket.messages)
      ? ticket.messages.map((m, idx: number) => {
          // Convert Firestore Timestamp to Date
          const timestamp =
            m.timestamp instanceof Date
              ? m.timestamp
              : m.timestamp?.toDate?.() || new Date();

          return {
            id: String(idx),
            sender: m.senderId ? "user" : "agent",
            body: m.body || "",
            createdAt: timestamp,
            attachments: m.attachments?.map((a) => ({
              name: a.name,
              url: a.url,
              size: a.size,
              type: a.type,
              scanStatus: a.scanStatus,
            })),
          };
        })
      : [],
  };
}

export function TicketCenter() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [activeTicket, setActiveTicket] = useState<TicketDetailData | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mode, setMode] = useState<"list" | "detail" | "compose">("list");
  const [loadingList, setLoadingList] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "in-progress" | "closed"
  >("all");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!user?.uid) {
      setTickets([]);
      return;
    }
    setLoadingList(true);
    try {
      const data = await getUserSupportTickets(user.uid);
      setTickets(mapTickets(data));
    } catch (e) {
      logger.error("Load tickets failed", e);
    } finally {
      setLoadingList(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openDetail = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      setLoadingDetail(true);
      setMode("detail");
      try {
        const data = await getUserSupportTickets(user.uid);
        const raw = data.find((t) => String(t.id) === id) || null;
        setActiveTicket(raw ? mapTicketDetail(raw) : null);
      } catch (e) {
        logger.error("Open ticket detail failed", e);
      } finally {
        setLoadingDetail(false);
      }
    },
    [user?.uid]
  );

  async function refreshDetail(id: string) {
    if (!user?.uid) return;
    setLoadingDetail(true);
    try {
      const data = await getUserSupportTickets(user.uid);
      const raw = data.find((t) => String(t.id) === id) || null;
      setActiveTicket(raw ? mapTicketDetail(raw) : null);
    } catch (e) {
      logger.error("Refresh ticket detail failed", e);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSendMessage(id: string, body: string, files?: File[]) {
    if (!user?.uid || !body.trim()) return;
    try {
      // Upload attachments if provided
      let attachments = [] as {
        name: string;
        url: string;
        size?: number;
        type?: string;
        path: string;
        scanStatus?: "pending" | "clean" | "infected" | "error";
      }[];
      if (files && files.length) {
        const accepted = await filterAcceptableFiles(files, 0);
        const uploaded = await Promise.all(
          accepted.map((f) => uploadTicketAttachment(id, f))
        );
        attachments = uploaded.map((u) => ({
          name: u.name,
          url: u.url,
          size: u.size,
          type: u.type,
          path: u.path,
          scanStatus: u.scanStatus || "pending",
        }));
      }
      await addSupportTicketMessage(id, {
        senderId: user.uid,
        senderName: user.email || "Member",
        body: body.trim(),
        internal: false,
        attachments,
      });
      await refreshDetail(id);
      await loadTickets();
    } catch (e) {
      logger.error("Add ticket message failed", e);
    }
  }

  async function handleCreateTicket(
    values: TicketComposerValues,
    files?: File[]
  ) {
    if (!user) {
      throw new Error("You must be logged in to create a support ticket");
    }
    setSubmittingTicket(true);
    try {
      logger.debug("Creating support ticket", values);
      const newId = await createSupportTicket({
        userId: user.uid,
        name: user.displayName || user.email || "Member",
        email: user.email || "",
        subject: values.subject,
        message: values.message,
        type: values.type,
        priority: values.priority,
      });
      logger.debug("Ticket created successfully", { ticketId: newId });

      // If files were attached at creation, upload and add as a follow-up message
      if (files && files.length) {
        try {
          const accepted = await filterAcceptableFiles(files, 0);
          if (accepted.length) {
            const uploaded = await Promise.all(
              accepted.map((f) => uploadTicketAttachment(newId, f))
            );
            await addSupportTicketMessage(newId, {
              senderId: user.uid,
              senderName: user.email || "Member",
              body: "Attachments uploaded",
              internal: false,
              attachments: uploaded.map((u) => ({
                name: u.name,
                url: u.url,
                size: u.size,
                type: u.type,
                path: u.path,
                scanStatus: u.scanStatus || "pending",
              })),
            });
          }
        } catch (e) {
          logger.error("Initial attachment upload failed", e);
        }
      }

      await loadTickets();
      logger.debug("Tickets reloaded");
      await openDetail(newId);
      setMode("detail");
    } catch (e) {
      logger.error("Create support ticket failed", e);
      throw e; // Re-throw so TicketComposer can show error
    } finally {
      setSubmittingTicket(false);
    }
  }

  const openCount = useMemo(
    () => tickets.filter((t) => t.status === "open").length,
    [tickets]
  );
  const inProgressCount = useMemo(
    () => tickets.filter((t) => t.status === "in-progress").length,
    [tickets]
  );
  const closedCount = useMemo(
    () => tickets.filter((t) => t.status === "closed").length,
    [tickets]
  );
  const filteredTickets = useMemo(
    () =>
      statusFilter === "all"
        ? tickets
        : tickets.filter((t) => t.status === statusFilter),
    [tickets, statusFilter]
  );

  if (!user) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 text-center text-gray-400">
        Please sign in to view your support tickets.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats Card */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-bold text-2xl mb-2">
              Support Tickets
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-gray-400">Total: {tickets.length}</span>
              <span className="text-gray-600">•</span>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Open
                </Badge>
                <span className="text-gray-300">{openCount}</span>
              </div>
              <span className="text-gray-600">•</span>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  In Progress
                </Badge>
                <span className="text-gray-300">{inProgressCount}</span>
              </div>
              <span className="text-gray-600">•</span>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                  Closed
                </Badge>
                <span className="text-gray-300">{closedCount}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setMode("compose")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" /> New Ticket
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel - Ticket List or Composer */}
        <div
          className={`${
            mode === "compose" ? "lg:col-span-12" : "lg:col-span-4"
          } ${mode === "detail" ? "hidden lg:block" : "block"}`}
        >
          {mode === "compose" ? (
            <TicketComposer
              onCancel={() => setMode("list")}
              onSubmit={handleCreateTicket}
              submitting={submittingTicket}
            />
          ) : (
            <TicketList
              loading={loadingList}
              items={filteredTickets}
              onSelect={(id) => openDetail(id)}
              onCreate={() => setMode("compose")}
            />
          )}
        </div>

        {/* Right Panel - Ticket Detail */}
        {mode !== "compose" && (
          <div
            className={`lg:col-span-8 ${
              mode !== "detail" ? "hidden lg:block" : "block"
            }`}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl h-full">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10 lg:hidden"
                    onClick={() => setMode("list")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <h3 className="text-white font-semibold">Ticket Detail</h3>
                </div>
                {activeTicket && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge
                      className={
                        activeTicket.status === "open"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : activeTicket.status === "in-progress"
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                      }
                    >
                      {activeTicket.status}
                    </Badge>
                    {activeTicket.priority && (
                      <Badge
                        className={
                          activeTicket.priority === "urgent"
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : activeTicket.priority === "normal"
                            ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        }
                      >
                        {activeTicket.priority}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="h-[calc(100%-56px)]">
                <TicketDetail
                  ticket={activeTicket}
                  loading={loadingDetail}
                  onRefresh={(id) => refreshDetail(id)}
                  onSendMessage={handleSendMessage}
                />
              </div>
              {activeTicket && (
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments (coming soon)
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Filter className="w-3 h-3 mr-1" /> View History
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketCenter;
