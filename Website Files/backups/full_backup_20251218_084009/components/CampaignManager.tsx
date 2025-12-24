import { useState } from "react";
import {
  Mail,
  Send,
  Users,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Target,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Label } from "./ui/label";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Campaign {
  id: string;
  name: string;
  type: "email" | "banner" | "discount";
  status: "draft" | "scheduled" | "active" | "paused" | "completed";
  segment: string;
  startDate: Date;
  endDate?: Date;
  metrics: {
    sent?: number;
    opened?: number;
    clicked?: number;
    converted?: number;
    revenue?: number;
  };
  createdAt: Date;
}

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "1",
      name: "Black Friday 2025",
      type: "email",
      status: "scheduled",
      segment: "All Customers",
      startDate: new Date("2025-11-29"),
      endDate: new Date("2025-11-30"),
      metrics: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        revenue: 0,
      },
      createdAt: new Date("2025-11-15"),
    },
    {
      id: "2",
      name: "Gaming PC Launch",
      type: "email",
      status: "active",
      segment: "Gaming Enthusiasts",
      startDate: new Date("2025-11-20"),
      metrics: {
        sent: 1234,
        opened: 890,
        clicked: 456,
        converted: 89,
        revenue: 156780,
      },
      createdAt: new Date("2025-11-18"),
    },
    {
      id: "3",
      name: "Holiday Banner",
      type: "banner",
      status: "active",
      segment: "All Visitors",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-25"),
      metrics: {
        sent: 8943,
        clicked: 234,
      },
      createdAt: new Date("2025-11-25"),
    },
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState<
    "email" | "banner" | "discount"
  >("email");
  const [campaignSegment, setCampaignSegment] = useState("all");
  const [campaignStartDate, setCampaignStartDate] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState("");

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "paused":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    }
  };

  const getTypeIcon = (type: Campaign["type"]) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "banner":
        return <Target className="w-4 h-4" />;
      case "discount":
        return <ShoppingCart className="w-4 h-4" />;
    }
  };

  const calculateMetrics = (campaign: Campaign) => {
    if (campaign.type === "email" && campaign.metrics.sent) {
      const openRate = campaign.metrics.opened
        ? ((campaign.metrics.opened / campaign.metrics.sent) * 100).toFixed(1)
        : "0.0";
      const clickRate = campaign.metrics.clicked
        ? ((campaign.metrics.clicked / campaign.metrics.sent) * 100).toFixed(1)
        : "0.0";
      const conversionRate = campaign.metrics.converted
        ? ((campaign.metrics.converted / campaign.metrics.sent) * 100).toFixed(
            1
          )
        : "0.0";
      return { openRate, clickRate, conversionRate };
    }
    return null;
  };

  const handleCreateCampaign = () => {
    if (!campaignName || !campaignStartDate) return;

    if (editingCampaign) {
      // Update existing campaign
      setCampaigns(
        campaigns.map((c) =>
          c.id === editingCampaign.id
            ? {
                ...c,
                name: campaignName,
                type: campaignType,
                segment: campaignSegment,
                startDate: new Date(campaignStartDate),
                endDate: campaignEndDate
                  ? new Date(campaignEndDate)
                  : undefined,
              }
            : c
        )
      );
    } else {
      // Create new campaign
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: campaignName,
        type: campaignType,
        status: "draft",
        segment: campaignSegment,
        startDate: new Date(campaignStartDate),
        endDate: campaignEndDate ? new Date(campaignEndDate) : undefined,
        metrics: {},
        createdAt: new Date(),
      };
      setCampaigns([newCampaign, ...campaigns]);
    }

    setShowCreateDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setCampaignName("");
    setCampaignType("email");
    setCampaignSegment("all");
    setCampaignStartDate("");
    setCampaignEndDate("");
    setEditingCampaign(null);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(
      campaigns.map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.status === "active" ? "paused" : "active",
            }
          : c
      )
    );
  };

  const deleteCampaign = (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      setCampaigns(campaigns.filter((c) => c.id !== id));
    }
  };

  const editCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignName(campaign.name);
    setCampaignType(campaign.type);
    setCampaignSegment(campaign.segment);
    setCampaignStartDate(campaign.startDate.toISOString().split("T")[0]);
    setCampaignEndDate(
      campaign.endDate ? campaign.endDate.toISOString().split("T")[0] : ""
    );
    setShowCreateDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-400" />
            Campaign Manager
          </h3>
          <p className="text-gray-400 mt-1">
            Create and manage marketing campaigns across channels
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              title="Create a new marketing campaign"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create a new marketing campaign</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Campaigns</p>
              <p className="text-3xl font-bold text-white mt-1">
                {campaigns.filter((c) => c.status === "active").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Sent</p>
              <p className="text-3xl font-bold text-white mt-1">
                {campaigns
                  .reduce((sum, c) => sum + (c.metrics.sent || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Conversions</p>
              <p className="text-3xl font-bold text-white mt-1">
                {campaigns
                  .reduce((sum, c) => sum + (c.metrics.converted || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">
                £
                {campaigns
                  .reduce((sum, c) => sum + (c.metrics.revenue || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <div className="p-6 space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No Campaigns Yet
              </h3>
              <p className="text-gray-400 mb-4">
                Create your first marketing campaign to get started
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                    title="Create your first marketing campaign"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create your first marketing campaign</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            campaigns.map((campaign) => {
              const metrics = calculateMetrics(campaign);
              return (
                <div
                  key={campaign.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-sky-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        {getTypeIcon(campaign.type)}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">
                          {campaign.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-white/5 text-gray-300 border-white/10">
                            {campaign.type}
                          </Badge>
                          <Badge
                            className={`${getStatusColor(
                              campaign.status
                            )} border`}
                          >
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            <Users className="w-3 h-3 inline mr-1" />
                            {campaign.segment}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {campaign.status === "active" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleCampaignStatus(campaign.id)}
                              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Pause campaign</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {campaign.status === "paused" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleCampaignStatus(campaign.id)}
                              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Resume campaign</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editCampaign(campaign)}
                            className="border-white/20 text-white hover:bg-white/10"
                            title="Edit campaign details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit campaign details</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCampaign(campaign.id)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            title="Delete campaign permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete campaign permanently</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Campaign Dates */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Start: {campaign.startDate.toLocaleDateString()}
                    </span>
                    {campaign.endDate && (
                      <span className="flex items-center gap-1">
                        End: {campaign.endDate.toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Metrics */}
                  {campaign.metrics.sent && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-3 bg-black/20 rounded-lg border border-white/5">
                      <div>
                        <p className="text-xs text-gray-400">Sent</p>
                        <p className="text-lg font-bold text-white">
                          {campaign.metrics.sent.toLocaleString()}
                        </p>
                      </div>
                      {campaign.metrics.opened !== undefined && (
                        <div>
                          <p className="text-xs text-gray-400">Opened</p>
                          <p className="text-lg font-bold text-white">
                            {campaign.metrics.opened.toLocaleString()}
                            {metrics && (
                              <span className="text-sm text-sky-400 ml-1">
                                ({metrics.openRate}%)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {campaign.metrics.clicked !== undefined && (
                        <div>
                          <p className="text-xs text-gray-400">Clicked</p>
                          <p className="text-lg font-bold text-white">
                            {campaign.metrics.clicked.toLocaleString()}
                            {metrics && (
                              <span className="text-sm text-purple-400 ml-1">
                                ({metrics.clickRate}%)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {campaign.metrics.converted !== undefined && (
                        <div>
                          <p className="text-xs text-gray-400">Converted</p>
                          <p className="text-lg font-bold text-white">
                            {campaign.metrics.converted.toLocaleString()}
                            {metrics && (
                              <span className="text-sm text-green-400 ml-1">
                                ({metrics.conversionRate}%)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {campaign.metrics.revenue !== undefined &&
                        campaign.metrics.revenue > 0 && (
                          <div>
                            <p className="text-xs text-gray-400">Revenue</p>
                            <p className="text-lg font-bold text-green-400">
                              £{campaign.metrics.revenue.toLocaleString()}
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? "Edit Campaign" : "Create New Campaign"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaignName" className="text-white">
                Campaign Name
              </Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Black Friday Sale 2025"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaignType" className="text-white">
                  Campaign Type
                </Label>
                <Select
                  value={campaignType}
                  onValueChange={(v: "email" | "banner" | "discount") =>
                    setCampaignType(v)
                  }
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="email">Email Campaign</SelectItem>
                    <SelectItem value="banner">Banner/Announcement</SelectItem>
                    <SelectItem value="discount">Discount Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="campaignSegment" className="text-white">
                  Target Segment
                </Label>
                <Select
                  value={campaignSegment}
                  onValueChange={setCampaignSegment}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="gaming">Gaming Enthusiasts</SelectItem>
                    <SelectItem value="business">Business Customers</SelectItem>
                    <SelectItem value="new">New Customers</SelectItem>
                    <SelectItem value="vip">VIP Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-white">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={campaignStartDate}
                  onChange={(e) => setCampaignStartDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="endDate" className="text-white">
                  End Date (Optional)
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={campaignEndDate}
                  onChange={(e) => setCampaignEndDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={!campaignName || !campaignStartDate}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              >
                {editingCampaign ? "Update Campaign" : "Create Campaign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
