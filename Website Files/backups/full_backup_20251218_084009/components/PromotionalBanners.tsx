import { useState, useEffect } from "react";
import {
  subscribeBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  type Banner,
  type BannerInput,
} from "../services/banners";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Calendar,
  Globe,
  Target,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./ui/tooltip";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";

// Firestore-backed banner type imported from service as Banner

export function PromotionalBanners() {
  // Firestore subscription replaces localStorage persistence
  const [banners, setBanners] = useState<Banner[]>([]);
  const [_, setLoading] = useState(true); // loading state unused for now
  useEffect(() => {
    const unsub = subscribeBanners((list) => {
      setBanners(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerType, setBannerType] = useState<
    "info" | "success" | "warning" | "promo"
  >("promo");
  const [bannerPosition, setBannerPosition] = useState<"top" | "bottom">("top");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerLinkText, setBannerLinkText] = useState("");
  const [bannerStartDate, setBannerStartDate] = useState("");
  const [bannerEndDate, setBannerEndDate] = useState("");
  const [bannerTargeting, setBannerTargeting] = useState<
    "all" | "new" | "returning" | "geographic"
  >("all");
  const [bannerColor, setBannerColor] = useState("default");
  const [isCreating, setIsCreating] = useState(false);

  const getTypeColor = (type: Banner["type"]) => {
    switch (type) {
      case "info":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "promo":
        return "bg-sky-500/20 text-sky-400 border-sky-500/30"; // Changed to blue
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getTypeIcon = (type: Banner["type"]) => {
    switch (type) {
      case "info":
        return <AlertCircle className="w-4 h-4" />;
      case "success":
        return <Target className="w-4 h-4" />;
      case "warning":
        return <AlertCircle className="w-4 h-4" />;
      case "promo":
        return <Megaphone className="w-4 h-4" />;
    }
  };

  const handleCreateBanner = async () => {
    if (!bannerTitle || !bannerMessage || !bannerStartDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      if (editingBanner) {
        // Update existing banner
        const updateData: Partial<BannerInput> = {
          title: bannerTitle,
          message: bannerMessage,
          type: bannerType,
          position: bannerPosition,
          startDate: new Date(bannerStartDate),
          targeting: bannerTargeting,
          ...(bannerColor !== "default" && { color: bannerColor }),
          ...(bannerLink && { link: bannerLink }),
          ...(bannerLinkText && { linkText: bannerLinkText }),
          ...(bannerEndDate && { endDate: new Date(bannerEndDate) }),
        };

        await updateBanner(editingBanner.id, updateData);
        toast.success("Banner updated successfully!");
      } else {
        // Create new banner
        const createData: BannerInput = {
          title: bannerTitle,
          message: bannerMessage,
          type: bannerType,
          position: bannerPosition,
          startDate: new Date(bannerStartDate),
          targeting: bannerTargeting,
          active: true,
          ...(bannerColor !== "default" && { color: bannerColor }),
          ...(bannerLink && { link: bannerLink }),
          ...(bannerLinkText && { linkText: bannerLinkText }),
          ...(bannerEndDate && { endDate: new Date(bannerEndDate) }),
        };

        await createBanner(createData);
        toast.success("Banner created successfully!");
      }

      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error(
        editingBanner
          ? "Failed to update banner. Please try again."
          : "Failed to create banner. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setBannerTitle("");
    setBannerMessage("");
    setBannerType("promo");
    setBannerColor("default");
    setBannerPosition("top");
    setBannerLink("");
    setBannerLinkText("");
    setBannerStartDate("");
    setBannerEndDate("");
    setBannerTargeting("all");
    setEditingBanner(null);
  };

  const toggleBannerStatus = async (id: string) => {
    const target = banners.find((b) => b.id === id);
    if (!target) return;
    await updateBanner(id, { active: !target.active });
  };

  const deleteBannerHandler = async (id: string) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      await deleteBanner(id);
    }
  };

  const duplicateBanner = async (banner: Banner) => {
    await createBanner({
      title: `${banner.title} (Copy)`,
      message: banner.message,
      type: banner.type,
      color: banner.color,
      position: banner.position,
      link: banner.link,
      linkText: banner.linkText,
      startDate: banner.startDate,
      endDate: banner.endDate,
      targeting: banner.targeting,
      targetCountries: banner.targetCountries,
      active: false,
    });
  };

  const calculateCTR = (banner: Banner) => {
    if (banner.views === 0) return "0.0";
    return ((banner.clicks / banner.views) * 100).toFixed(1);
  };

  const editBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerTitle(banner.title);
    setBannerMessage(banner.message);
    setBannerType(banner.type);
    setBannerColor(banner.color || "default");
    setBannerPosition(banner.position);
    setBannerLink(banner.link || "");
    setBannerLinkText(banner.linkText || "");
    setBannerStartDate(banner.startDate.toISOString().split("T")[0]);
    setBannerEndDate(
      banner.endDate ? banner.endDate.toISOString().split("T")[0] : ""
    );
    setBannerTargeting(banner.targeting);
    setShowCreateDialog(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-orange-400" />
              Promotional Banners
            </h3>
            <p className="text-gray-400 mt-1">
              Create site-wide announcements and promotional messages
            </p>
          </div>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => {
                    sessionStorage.removeItem("dismissed-banner");
                    toast.success(
                      "Dismissed banners cleared! Refresh the page to see active banners."
                    );
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Dismissed
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear dismissed banners from session storage</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Banner
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new promotional banner</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Banners</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {banners.filter((b) => b.active).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {banners
                    .reduce((sum, b) => sum + b.views, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Clicks</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {banners
                    .reduce((sum, b) => sum + b.clicks, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. CTR</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {banners.length > 0
                    ? (
                        banners.reduce(
                          (sum, b) => sum + parseFloat(calculateCTR(b)),
                          0
                        ) / banners.length
                      ).toFixed(1)
                    : "0.0"}
                  %
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Preview Active Banner */}
        {banners.filter((b) => b.active).length > 0 && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-4">
            <Label className="text-white mb-3 block">Live Banner Preview</Label>
            {banners
              .filter((b) => b.active)
              .slice(0, 1)
              .map((banner) => (
                <div
                  key={banner.id}
                  className={`p-4 rounded-lg border ${
                    banner.type === "promo"
                      ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30"
                      : banner.type === "success"
                      ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30"
                      : banner.type === "warning"
                      ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
                      : "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(banner.type)}
                      <div>
                        <p className="font-bold text-white">{banner.title}</p>
                        <p className="text-sm text-gray-300">
                          {banner.message}
                        </p>
                      </div>
                    </div>
                    {banner.link && banner.linkText && (
                      <Button
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white"
                      >
                        {banner.linkText}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </Card>
        )}

        {/* Banners List */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
          <div className="p-6 space-y-4">
            {banners.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  No Banners Yet
                </h3>
                <p className="text-gray-400 mb-4">
                  Create promotional banners to engage your visitors
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500"
                      title="Create your first promotional banner"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Banner
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create your first promotional banner</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              banners.map((banner) => (
                <div
                  key={banner.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    banner.active
                      ? "bg-white/10 border-orange-500/50 hover:border-orange-500"
                      : "bg-black/30 border-white/10 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-r ${
                            banner.type === "promo"
                              ? "from-purple-500 to-pink-500"
                              : banner.type === "success"
                              ? "from-green-500 to-emerald-500"
                              : banner.type === "warning"
                              ? "from-yellow-500 to-orange-500"
                              : "from-sky-500 to-blue-500"
                          } flex items-center justify-center flex-shrink-0`}
                        >
                          {getTypeIcon(banner.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white">
                            {banner.title}
                          </h4>
                          <p className="text-sm text-gray-300">
                            {banner.message}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          className={`${getTypeColor(banner.type)} border`}
                        >
                          {banner.type}
                        </Badge>
                        <Badge className="bg-white/10 text-gray-200 border-white/20">
                          {banner.position}
                        </Badge>
                        <Badge className="bg-white/10 text-gray-200 border-white/20">
                          {banner.targeting === "all"
                            ? "All Visitors"
                            : banner.targeting === "geographic"
                            ? "Geographic"
                            : banner.targeting === "new"
                            ? "New Visitors"
                            : "Returning"}
                        </Badge>
                        {!banner.active && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleBannerStatus(banner.id)}
                            className={`border-white/30 hover:bg-white/10 ${
                              banner.active
                                ? "text-yellow-400"
                                : "text-green-400"
                            }`}
                            title={
                              banner.active
                                ? "Deactivate banner"
                                : "Activate banner"
                            }
                          >
                            {banner.active ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {banner.active
                              ? "Deactivate banner"
                              : "Activate banner"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => duplicateBanner(banner)}
                            className="border-white/30 text-white hover:bg-white/10"
                            title="Duplicate banner"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicate banner</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editBanner(banner)}
                            className="border-white/30 text-white hover:bg-white/10"
                            title="Edit banner details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit banner details</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteBannerHandler(banner.id)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            title="Delete banner permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete banner permanently</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Banner Dates */}
                  <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Start: {banner.startDate.toLocaleDateString()}
                    </span>
                    {banner.endDate && (
                      <span className="flex items-center gap-1">
                        End: {banner.endDate.toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Banner Stats */}
                  <div className="grid grid-cols-3 gap-4 p-3 bg-black/30 rounded-lg border border-white/10">
                    <div>
                      <p className="text-xs text-gray-400">Views</p>
                      <p className="text-lg font-bold text-white">
                        {banner.views.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Clicks</p>
                      <p className="text-lg font-bold text-white">
                        {banner.clicks.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">CTR</p>
                      <p className="text-lg font-bold text-white">
                        {calculateCTR(banner)}%
                      </p>
                    </div>
                  </div>

                  {banner.link && (
                    <div className="mt-3 text-sm text-gray-300 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Link: <span className="text-sky-400">{banner.link}</span>
                      {banner.linkText && (
                        <span className="text-white">
                          → "{banner.linkText}"
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Create Banner Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "Edit Banner" : "Create Promotional Banner"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bannerTitle" className="text-white">
                  Banner Title
                </Label>
                <Input
                  id="bannerTitle"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g., Black Friday Sale"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="bannerMessage" className="text-white">
                  Banner Message
                </Label>
                <Textarea
                  id="bannerMessage"
                  value={bannerMessage}
                  onChange={(e) => setBannerMessage(e.target.value)}
                  placeholder="e.g., Save up to 25% on all Gaming PCs! Limited time only."
                  className="bg-white/5 border-white/10 text-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bannerType" className="text-white">
                    Banner Type
                  </Label>
                  <Select
                    value={bannerType}
                    onValueChange={(
                      v: "info" | "success" | "warning" | "promo"
                    ) => setBannerType(v)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="promo">Promotional</SelectItem>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="success">Success/Update</SelectItem>
                      <SelectItem value="warning">Warning/Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bannerPosition" className="text-white">
                    Position
                  </Label>
                  <Select
                    value={bannerPosition}
                    onValueChange={(v: "top" | "bottom") =>
                      setBannerPosition(v)
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="top">Top of Page</SelectItem>
                      <SelectItem value="bottom">Bottom of Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <Label htmlFor="bannerColor" className="text-white">
                  Custom Color (Optional)
                </Label>
                <Select
                  value={bannerColor}
                  onValueChange={(v: string) => setBannerColor(v)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Use default color based on type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="default">
                      Default (Based on Type)
                    </SelectItem>
                    <SelectItem value="bg-gradient-to-r from-sky-600 to-blue-600">
                      Blue Gradient
                    </SelectItem>
                    <SelectItem value="bg-gradient-to-r from-purple-600 to-pink-600">
                      Purple-Pink Gradient
                    </SelectItem>
                    <SelectItem value="bg-gradient-to-r from-green-600 to-emerald-600">
                      Green Gradient
                    </SelectItem>
                    <SelectItem value="bg-gradient-to-r from-yellow-600 to-orange-600">
                      Yellow-Orange Gradient
                    </SelectItem>
                    <SelectItem value="bg-gradient-to-r from-red-600 to-rose-600">
                      Red Gradient
                    </SelectItem>
                    <SelectItem value="bg-gradient-to-r from-cyan-600 to-teal-600">
                      Cyan-Teal Gradient
                    </SelectItem>
                    <SelectItem value="bg-gradient-to-r from-indigo-600 to-purple-600">
                      Indigo-Purple Gradient
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty to use the default color based on banner type
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bannerLink" className="text-white">
                    Link URL (Optional)
                  </Label>
                  <Input
                    id="bannerLink"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    placeholder="/finder"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="bannerLinkText" className="text-white">
                    Link Text (Optional)
                  </Label>
                  <Input
                    id="bannerLinkText"
                    value={bannerLinkText}
                    onChange={(e) => setBannerLinkText(e.target.value)}
                    placeholder="Shop Now"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bannerStartDate" className="text-white">
                    Start Date
                  </Label>
                  <Input
                    id="bannerStartDate"
                    type="date"
                    value={bannerStartDate}
                    onChange={(e) => setBannerStartDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="bannerEndDate" className="text-white">
                    End Date (Optional)
                  </Label>
                  <Input
                    id="bannerEndDate"
                    type="date"
                    value={bannerEndDate}
                    onChange={(e) => setBannerEndDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bannerTargeting" className="text-white">
                  Target Audience
                </Label>
                <Select
                  value={bannerTargeting}
                  onValueChange={(
                    v: "all" | "new" | "returning" | "geographic"
                  ) => setBannerTargeting(v)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="all">All Visitors</SelectItem>
                    <SelectItem value="new">New Visitors Only</SelectItem>
                    <SelectItem value="returning">
                      Returning Visitors
                    </SelectItem>
                    <SelectItem value="geographic">
                      Geographic Targeting
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                  onClick={handleCreateBanner}
                  disabled={
                    !bannerTitle ||
                    !bannerMessage ||
                    !bannerStartDate ||
                    isCreating
                  }
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50"
                >
                  {isCreating
                    ? "Saving..."
                    : editingBanner
                    ? "Update Banner"
                    : "Create Banner"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
