import { useCallback, useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  MessageSquare,
  Tag,
  TrendingUp,
  Clock,
  AlertCircle,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: Date;
  items: Array<{ productName: string; quantity: number; price: number }>;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  lastUpdate: Date;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
  lastLogin?: Date;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate?: Date;
  firstOrderDate?: Date;
  rfmScore?: {
    recency: number;
    frequency: number;
    monetary: number;
    total: number;
  };
  tags: string[];
  notes?: string;
}

interface CustomerProfileProps {
  customerId: string;
  onClose: () => void;
}

type HasToken = { getIdToken?: () => Promise<string> };

export function CustomerProfile({ customerId, onClose }: CustomerProfileProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notes, setNotes] = useState("");
  const [newTag, setNewTag] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchCustomerData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;

      const tokenSource = user as unknown as HasToken;
      const token = tokenSource.getIdToken
        ? await tokenSource.getIdToken()
        : "";

      // Fetch customer segment data
      const segmentRes = await fetch("/api/admin/crm/segments?segment=all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!segmentRes.ok) throw new Error("Failed to fetch customer data");

      const segmentData = await segmentRes.json();
      const customerData = segmentData.customers.find(
        (c: CustomerData) => c.id === customerId
      );

      if (!customerData) {
        toast.error("Customer not found");
        onClose();
        return;
      }

      setCustomer(customerData);
      setNotes(customerData.notes || "");

      // Fetch orders (using existing database service would be ideal, but we'll simulate)
      // In production, you'd call: const orders = await getOrdersByUserId(customerId);
      // For now, we'll leave orders empty - you should integrate with your existing order fetching
      setOrders([]);

      // Fetch support tickets
      setTickets([]);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast.error("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  }, [customerId, onClose, user]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  async function saveNotes() {
    try {
      setSavingNotes(true);
      if (!user) throw new Error("Not authenticated");

      // Save notes to Firestore
      const { updateDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");

      await updateDoc(doc(db, "users", customerId), {
        notes: notes,
      });

      toast.success("Notes saved");
      if (customer) {
        setCustomer({ ...customer, notes });
      }
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }

  async function addTag() {
    if (!newTag.trim() || !customer) return;

    try {
      const { updateDoc, doc, arrayUnion } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");

      await updateDoc(doc(db, "users", customerId), {
        tags: arrayUnion(newTag.trim()),
      });

      setCustomer({
        ...customer,
        tags: [...customer.tags, newTag.trim()],
      });
      setNewTag("");
      toast.success("Tag added");
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    }
  }

  async function removeTag(tag: string) {
    if (!customer) return;

    try {
      const { updateDoc, doc, arrayRemove } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../config/firebase");

      await updateDoc(doc(db, "users", customerId), {
        tags: arrayRemove(tag),
      });

      setCustomer({
        ...customer,
        tags: customer.tags.filter((t) => t !== tag),
      });
      toast.success("Tag removed");
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    }
  }

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "high-value":
        return "bg-yellow-500/20 border-yellow-500/40 text-yellow-400";
      case "vip":
        return "bg-purple-500/20 border-purple-500/40 text-purple-400";
      case "at-risk":
        return "bg-red-500/20 border-red-500/40 text-red-400";
      case "frequent-buyer":
        return "bg-green-500/20 border-green-500/40 text-green-400";
      case "first-time":
        return "bg-blue-500/20 border-blue-500/40 text-blue-400";
      case "recent":
        return "bg-sky-500/20 border-sky-500/40 text-sky-400";
      default:
        return "bg-gray-500/20 border-gray-500/40 text-gray-400";
    }
  };

  const getRFMScoreColor = (score: number) => {
    if (score >= 4) return "text-green-400";
    if (score >= 3) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            <span className="text-white">Loading customer profile...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-start justify-center">
        <div className="w-full max-w-6xl my-8">
          {/* Header */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-sky-500/20 border border-sky-500/30">
                  <User className="w-8 h-8 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {customer.name}
                  </h2>
                  <p className="text-gray-400">{customer.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {customer.tags.map((tag) => (
                      <Badge key={tag} className={getTagColor(tag)}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="outline"
                size="icon"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Stats */}
            <div className="space-y-4">
              {/* Contact Info */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-sky-400" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-400">Email</div>
                      <div className="text-white">{customer.email}</div>
                    </div>
                  </div>
                  {customer.phone && (
                    <div className="flex items-start gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-gray-400">Phone</div>
                        <div className="text-white">{customer.phone}</div>
                      </div>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-gray-400">Address</div>
                        <div className="text-white">{customer.address}</div>
                      </div>
                    </div>
                  )}
                  {customer.createdAt && (
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-gray-400">Member Since</div>
                        <div className="text-white">
                          {format(customer.createdAt, "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Customer Value */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Customer Value
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Lifetime Value</div>
                    <div className="text-2xl font-bold text-green-400">
                      £{customer.totalSpent.toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-gray-400">Total Orders</div>
                      <div className="text-xl font-semibold text-white">
                        {customer.totalOrders}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Avg Order</div>
                      <div className="text-xl font-semibold text-white">
                        £{customer.avgOrderValue.toFixed(0)}
                      </div>
                    </div>
                  </div>
                  {customer.lastOrderDate && (
                    <div>
                      <div className="text-sm text-gray-400">Last Order</div>
                      <div className="text-white">
                        {format(customer.lastOrderDate, "MMM dd, yyyy")}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* RFM Score */}
              {customer.rfmScore && (
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-purple-400" />
                    RFM Score
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Recency</span>
                      <span
                        className={`text-lg font-bold ${getRFMScoreColor(
                          customer.rfmScore.recency
                        )}`}
                      >
                        {customer.rfmScore.recency}/5
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Frequency</span>
                      <span
                        className={`text-lg font-bold ${getRFMScoreColor(
                          customer.rfmScore.frequency
                        )}`}
                      >
                        {customer.rfmScore.frequency}/5
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Monetary</span>
                      <span
                        className={`text-lg font-bold ${getRFMScoreColor(
                          customer.rfmScore.monetary
                        )}`}
                      >
                        {customer.rfmScore.monetary}/5
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">
                          Total Score
                        </span>
                        <span className="text-2xl font-bold text-sky-400">
                          {customer.rfmScore.total}/15
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Tags */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-400" />
                  Tags
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag) => (
                      <Badge key={tag} className={`${getTagColor(tag)} group`}>
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-red-400"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                      placeholder="Add tag..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Button
                      onClick={addTag}
                      variant="outline"
                      size="sm"
                      className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Middle Column - Timeline */}
            <div className="lg:col-span-2 space-y-4">
              {/* Order History */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-400" />
                  Order History
                </h3>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No orders found</p>
                    <p className="text-sm">Order history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-white">
                            {order.orderNumber}
                          </div>
                          <Badge className="bg-sky-500/20 border-sky-500/30 text-sky-400">
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          {format(order.createdAt, "MMM dd, yyyy")} • £
                          {order.total.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Support Tickets */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Support Tickets
                </h3>
                {tickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No support tickets</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-white">
                            {ticket.subject}
                          </div>
                          <Badge className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                            {ticket.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          {format(ticket.createdAt, "MMM dd, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Notes */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Internal Notes
                </h3>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this customer..."
                  rows={6}
                  className="bg-white/5 border-white/10 text-white mb-3"
                />
                <Button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="bg-gradient-to-r from-sky-600 to-blue-600"
                >
                  {savingNotes ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Notes
                    </>
                  )}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
