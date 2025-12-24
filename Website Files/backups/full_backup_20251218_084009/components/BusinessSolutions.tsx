/**
 * Business Solutions Page
 * Pre-configured workstations and service packages for small businesses
 */

import { useState, useEffect, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Building2,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Shield,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HeadphonesIcon,
  Settings,
  TrendingUp,
  Award,
  Wrench,
  MessageSquare,
  Calendar,
  BarChart3,
  Gamepad2,
  Wind,
  Layers,
  Box,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { logger } from "../services/logger";
import { SubscriptionModal } from "./SubscriptionModal";
import {
  fetchBusinessWorkstations,
  type BusinessWorkstation,
} from "../services/cms";
import { type CartItem } from "../types";

interface BusinessSolutionsProps {
  setCurrentView: (view: string) => void;
  onAddToCart?: (item: CartItem) => void;
  onOpenCart?: () => void;
}

interface WorkstationConfig {
  id: string;
  name: string;
  tagline: string;
  price: number;
  image: string;
  formFactor?: string;
  recommended?: boolean;
  specs: {
    processor: string;
    ram: string;
    storage: string;
    graphics: string;
    cooler?: string;
    motherboard?: string;
    case?: string;
    psu?: string;
    warranty: string;
    os?: string;
  };
  features: string[];
  idealFor: string[];
  performance: {
    office: number;
    creative: number;
    data: number;
  };
}

interface ServiceTier {
  id: string;
  name: string;
  price: number;
  billing: "monthly" | "annual";
  popular?: boolean;
  tagline: string;
  features: string[];
  responseTime: string;
  icon: ReactNode;
  savings?: string;
}

export function BusinessSolutions({
  setCurrentView,
  onAddToCart,
  onOpenCart,
}: BusinessSolutionsProps) {
  const [selectedWorkstation, setSelectedWorkstation] =
    useState<WorkstationConfig | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceTier | null>(
    null
  );
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [cmsWorkstations, setCmsWorkstations] = useState<BusinessWorkstation[]>(
    []
  );

  // Load workstations from CMS on mount
  useEffect(() => {
    const loadWorkstations = async () => {
      try {
        const data = await fetchBusinessWorkstations();
        if (data.length > 0) {
          setCmsWorkstations(data);
        }
      } catch (error) {
        logger.error("Failed to load workstations from CMS:", error);
      }
    };
    loadWorkstations();
  }, []);
  const [quoteForm, setQuoteForm] = useState({
    orderType: "bulk-quote" as "bulk-quote" | "cart",
    companyName: "",
    companyRegistration: "",
    vatNumber: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    postcode: "",
    os: "Windows 11 Pro",
    quantity: 1,
  });

  const serviceTiers: ServiceTier[] = [
    {
      id: "essential-care",
      name: "Essential Care",
      price: 299,
      billing: "annual",
      tagline: "Annual maintenance for peace of mind",
      responseTime: "48-72 hours",
      icon: <Shield className="h-8 w-8" />,
      features: [
        "Annual on-site health check",
        "Hardware diagnostics & cleaning",
        "Software updates & security patches",
        "Performance optimisation",
        "Email support (business hours)",
        "Remote assistance available",
        "Health report & recommendations",
        "10% discount on repairs",
      ],
    },
    {
      id: "priority-support",
      name: "Priority Support",
      price: 49,
      billing: "monthly",
      popular: true,
      tagline: "Proactive care with priority response",
      responseTime: "4-8 hours",
      savings: "Save £289/year vs Essential",
      icon: <Zap className="h-8 w-8" />,
      features: [
        "Quarterly on-site maintenance",
        "Priority ticket queue",
        "Phone & email support (extended hours)",
        "Remote monitoring & alerts",
        "Proactive issue detection",
        "Same-day remote fixes",
        "Free hardware loan during repairs",
        "20% discount on upgrades & parts",
        "Dedicated account manager",
      ],
    },
    {
      id: "business-premium",
      name: "Business Premium",
      price: 99,
      billing: "monthly",
      tagline: "Complete coverage with guaranteed uptime",
      responseTime: "2-4 hours",
      savings: "Includes £500 protection coverage",
      icon: <Award className="h-8 w-8" />,
      features: [
        "Monthly on-site visits",
        "24/7 emergency support hotline",
        "Next business day on-site repairs",
        "Advanced hardware replacement",
        "Free annual upgrades (up to £200)",
        "Business continuity planning",
        "Data backup consultation",
        "Cybersecurity health checks",
        "30% discount on all parts & labour",
        "VIP direct support line",
        "Guaranteed 99% uptime SLA",
      ],
    },
  ];

  // Use CMS workstations if available, otherwise use empty array
  const workstations: WorkstationConfig[] =
    cmsWorkstations.length > 0
      ? cmsWorkstations.map((ws) => ({
          id: ws.id,
          name: ws.name,
          tagline: ws.tagline,
          price: ws.price,
          image: ws.imageUrl || "", // No fallback - require Contentful image
          formFactor: ws.formFactor,
          recommended: ws.recommended,
          specs: {
            processor: ws.processor,
            ram: ws.ram,
            storage: ws.storage,
            graphics: ws.graphics,
            cooler: ws.cooler,
            motherboard: ws.motherboard,
            case: ws.case,
            psu: ws.psu,
            warranty: ws.warranty,
            os: ws.operatingSystem,
          },
          features: ws.features,
          idealFor: ws.idealFor,
          performance: {
            office: ws.officePerformance,
            creative: ws.creativePerformance,
            data: ws.dataPerformance,
          },
        }))
      : [];
  const handleAddToCart = (workstation: WorkstationConfig) => {
    setSelectedWorkstation(workstation);
    setQuoteOpen(true);
  };

  const handleSelectService = (tier: ServiceTier) => {
    setSelectedService(tier);
    setSubscriptionModalOpen(true);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Blur overlay when modal is open */}
      {quoteOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
      )}

      {/* Main Content */}
      <div className={quoteOpen ? "blur-sm pointer-events-none" : ""}>
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto text-center">
            <Badge className="bg-sky-500/20 border-sky-500 text-white px-6 py-2 text-sm mb-6 font-semibold">
              <Building2 className="w-4 h-4 inline mr-2" />
              Business Solutions
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Power Your Business
              </span>
              <br />
              <span className="text-white">With Professional Workstations</span>
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Pre-configured workstations designed for productivity, backed by
              comprehensive support packages to keep your business running
              smoothly.
            </p>

            <div className="flex flex-wrap gap-8 justify-center items-center text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>3-5 Year Warranties</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Business-Grade Components</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Volume Discounts Available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Expert UK Support</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Request Quote Modal */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-w-2xl bg-black/95 border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Business Order</DialogTitle>
            <DialogDescription>
              {selectedWorkstation
                ? `For: ${selectedWorkstation.name} (${selectedWorkstation.specs.processor}, ${selectedWorkstation.specs.ram})`
                : "Provide your details to proceed with your order."}
            </DialogDescription>
          </DialogHeader>

          {/* Order Type Selection */}
          <div className="space-y-3 border border-white/10 rounded-lg p-4 mb-4">
            <Label className="text-base font-semibold">
              How would you like to order?
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  value="bulk-quote"
                  checked={quoteForm.orderType === "bulk-quote"}
                  onChange={(e) =>
                    setQuoteForm((p) => ({
                      ...p,
                      orderType: e.target.value as "bulk-quote" | "cart",
                    }))
                  }
                  className="w-4 h-4"
                />
                <span>Request Bulk Buy Quote</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  value="cart"
                  checked={quoteForm.orderType === "cart"}
                  onChange={(e) =>
                    setQuoteForm((p) => ({
                      ...p,
                      orderType: e.target.value as "bulk-quote" | "cart",
                    }))
                  }
                  className="w-4 h-4"
                />
                <span>Add to Cart</span>
              </label>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Vortex Consulting Ltd"
                  value={quoteForm.companyName}
                  onChange={(e) =>
                    setQuoteForm((p) => ({ ...p, companyName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyRegistration">
                  Company Registration No
                </Label>
                <Input
                  id="companyRegistration"
                  placeholder="e.g. 12345678"
                  value={quoteForm.companyRegistration}
                  onChange={(e) =>
                    setQuoteForm((p) => ({
                      ...p,
                      companyRegistration: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Number</Label>
                <Input
                  id="vatNumber"
                  placeholder="e.g. GB123456789"
                  value={quoteForm.vatNumber}
                  onChange={(e) =>
                    setQuoteForm((p) => ({ ...p, vatNumber: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode *</Label>
                <Input
                  id="postcode"
                  placeholder="e.g. NR1 1AA"
                  value={quoteForm.postcode}
                  onChange={(e) =>
                    setQuoteForm((p) => ({ ...p, postcode: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  placeholder="e.g. Jane Smith"
                  value={quoteForm.contactName}
                  onChange={(e) =>
                    setQuoteForm((p) => ({ ...p, contactName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email Address *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="jane@company.com"
                  value={quoteForm.contactEmail}
                  onChange={(e) =>
                    setQuoteForm((p) => ({
                      ...p,
                      contactEmail: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contactPhone">Contact Number *</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="e.g. 01603 123456"
                  value={quoteForm.contactPhone}
                  onChange={(e) =>
                    setQuoteForm((p) => ({
                      ...p,
                      contactPhone: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity Required *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={quoteForm.quantity}
                  onChange={(e) =>
                    setQuoteForm((p) => ({
                      ...p,
                      quantity: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="os">Operating System *</Label>
                <Select
                  value={quoteForm.os}
                  onValueChange={(v) => setQuoteForm((p) => ({ ...p, os: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Windows 11 Home">
                      Windows 11 Home
                    </SelectItem>
                    <SelectItem value="Windows 11 Pro">
                      Windows 11 Pro
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setQuoteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
              disabled={quoteLoading}
              onClick={async () => {
                if (!selectedWorkstation) return;

                // Validate required fields
                const {
                  companyName,
                  contactName,
                  contactEmail,
                  contactPhone,
                  postcode,
                  orderType,
                } = quoteForm;
                if (
                  !companyName ||
                  !contactName ||
                  !contactEmail ||
                  !contactPhone ||
                  !postcode
                ) {
                  toast.error(
                    "Please fill in all required fields (marked with *)"
                  );
                  return;
                }

                try {
                  setQuoteLoading(true);

                  if (orderType === "bulk-quote") {
                    // Send bulk quote request
                    const res = await fetch("/api/business/quote", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        orderType,
                        companyName,
                        companyRegistration: quoteForm.companyRegistration,
                        vatNumber: quoteForm.vatNumber,
                        postcode,
                        contactName,
                        contactEmail,
                        contactPhone,
                        os: quoteForm.os,
                        quantity: quoteForm.quantity,
                        workstation: {
                          id: selectedWorkstation.id,
                          name: selectedWorkstation.name,
                          price: selectedWorkstation.price,
                          specs: selectedWorkstation.specs,
                        },
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    console.log("Quote response:", {
                      status: res.status,
                      ok: res.ok,
                      data,
                    });
                    if (!res.ok || !data?.success) {
                      toast.error(
                        data?.message ||
                          "Failed to submit bulk quote request. Please try again."
                      );
                      return;
                    }
                    toast.success(
                      "Bulk quote request submitted! We'll contact you within 24 hours."
                    );
                  } else {
                    // Add to shopping cart
                    const res = await fetch("/api/business/order", {
                      method: "POST",
                      body: JSON.stringify({
                        orderType,
                        companyName,
                        companyRegistration: quoteForm.companyRegistration,
                        vatNumber: quoteForm.vatNumber,
                        postcode,
                        contactName,
                        contactEmail,
                        contactPhone,
                        os: quoteForm.os,
                        quantity: quoteForm.quantity,
                        workstation: {
                          id: selectedWorkstation.id,
                          name: selectedWorkstation.name,
                          price: selectedWorkstation.price,
                          specs: selectedWorkstation.specs,
                        },
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    console.log("Order response:", {
                      status: res.status,
                      ok: res.ok,
                      data,
                    });
                    if (!res.ok || !data?.success) {
                      toast.error(
                        data?.message ||
                          "Failed to add to cart. Please try again."
                      );
                      return;
                    }

                    if (!onAddToCart) {
                      toast.error(
                        "Cart is unavailable. Please contact support to complete your purchase."
                      );
                    } else {
                      // Push the requested quantity into the existing cart system
                      const count = Math.max(1, quoteForm.quantity);
                      for (let i = 0; i < count; i += 1) {
                        onAddToCart({
                          id: selectedWorkstation.id,
                          name: selectedWorkstation.name,
                          price: selectedWorkstation.price,
                          category: "business-workstation",
                          image: selectedWorkstation.image,
                          quantity: 1,
                        });
                      }
                      onOpenCart?.();
                      toast.success(
                        `Added ${count} ${selectedWorkstation.name} to cart!`
                      );
                    }
                  }

                  setQuoteOpen(false);
                  setQuoteForm({
                    orderType: "bulk-quote",
                    companyName: "",
                    companyRegistration: "",
                    vatNumber: "",
                    contactName: "",
                    contactEmail: "",
                    contactPhone: "",
                    postcode: "",
                    os: "Windows 11 Pro",
                    quantity: 1,
                  });
                  setSelectedWorkstation(null);
                } catch (error) {
                  console.error("Error:", error);
                  toast.error(
                    "An unexpected error occurred. Please try again."
                  );
                } finally {
                  setQuoteLoading(false);
                }
              }}
            >
              {quoteLoading
                ? "Processing..."
                : quoteForm.orderType === "bulk-quote"
                ? "Request Bulk Quote"
                : "Add to Cart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workstations Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Pre-Configured{" "}
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                Workstations
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Expertly configured systems ready to deploy. Each workstation is
              optimised for stability, performance, and business reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workstations.map((workstation) => (
              <Card
                key={workstation.id}
                className={`group bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/50 transition-all duration-300 overflow-hidden relative ${
                  workstation.recommended ? "ring-2 ring-sky-500/50" : ""
                }`}
              >
                {workstation.recommended && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    RECOMMENDED
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="mb-6">
                    <div
                      className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                      style={{ height: "300px" }}
                    >
                      {workstation.image ? (
                        <img
                          src={workstation.image}
                          alt={workstation.name}
                          className="w-full h-auto object-contain"
                          onLoad={() => {
                            logger.debug(`Image loaded: ${workstation.image}`);
                          }}
                          onError={(e) => {
                            logger.error(
                              `Image failed to load: ${workstation.image}`
                            );
                            // Image failed - hide broken image
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="text-center space-y-2">
                          <Monitor className="w-8 h-8 text-gray-400 mx-auto" />
                          <p className="text-xs text-gray-500">
                            Image from Contentful
                          </p>
                        </div>
                      )}
                      {workstation.recommended && (
                        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full border border-white/10">
                          Best Choice
                        </div>
                      )}
                    </div>
                    <div className="text-center mt-4">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {workstation.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        {workstation.tagline}
                      </p>
                      {workstation.formFactor && (
                        <p className="text-xs inline-flex px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 mb-3">
                          {workstation.formFactor}
                        </p>
                      )}
                      <div className="relative mt-2">
                        <div
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-blue-500/10 blur-md"
                          aria-hidden
                        />
                        <div className="relative rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_12px_40px_-24px_rgba(56,189,248,0.6)] flex items-center justify-center gap-3">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-full px-2 py-1">
                            From
                          </span>
                          <div className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                            £{workstation.price.toLocaleString()}
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2 py-1">
                            Per Unit
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Specs Container */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                    <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-3">
                      Specifications
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-2 text-sm">
                        <Cpu className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">
                          Processor: {workstation.specs.processor}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <BarChart3 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">
                          RAM: {workstation.specs.ram}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <HardDrive className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">
                          Storage: {workstation.specs.storage}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Gamepad2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">
                          Graphics: {workstation.specs.graphics}
                        </span>
                      </div>
                      {workstation.specs.cooler && (
                        <div className="flex items-start gap-2 text-sm">
                          <Wind className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">
                            Cooler: {workstation.specs.cooler}
                          </span>
                        </div>
                      )}
                      {workstation.specs.motherboard && (
                        <div className="flex items-start gap-2 text-sm">
                          <Layers className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">
                            Motherboard: {workstation.specs.motherboard}
                          </span>
                        </div>
                      )}
                      {workstation.specs.case && (
                        <div className="flex items-start gap-2 text-sm">
                          <Box className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">
                            Case: {workstation.specs.case}
                          </span>
                        </div>
                      )}
                      {workstation.specs.psu && (
                        <div className="flex items-start gap-2 text-sm">
                          <Zap className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">
                            PSU: {workstation.specs.psu}
                          </span>
                        </div>
                      )}
                      {workstation.specs.os && (
                        <div className="flex items-start gap-2 text-sm">
                          <Settings className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">
                            OS: {workstation.specs.os}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-sm">
                        <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">
                          Warranty: {workstation.specs.warranty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Bars */}
                  <div className="space-y-2 mb-6">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Office Tasks</span>
                        <span>{workstation.performance.office}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                          style={{
                            width: `${workstation.performance.office}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Creative Work</span>
                        <span>{workstation.performance.creative}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                          style={{
                            width: `${workstation.performance.creative}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Data Processing</span>
                        <span>{workstation.performance.data}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-blue-400"
                          style={{ width: `${workstation.performance.data}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Ideal For */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                      Ideal For:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {workstation.idealFor.map((use, idx) => (
                        <Badge
                          key={idx}
                          className="bg-sky-500/10 border-sky-500/30 text-sky-400 text-xs"
                        >
                          {use}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleAddToCart(workstation)}
                      className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white"
                    >
                      Request Bulk Buy Quote
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedWorkstation(workstation);
                        setQuoteForm((prev) => ({
                          ...prev,
                          orderType: "cart",
                        }));
                        setQuoteOpen(true);
                      }}
                      className="w-full border-sky-500 text-sky-400 hover:bg-sky-500/10"
                    >
                      Buy Now
                    </Button>
                  </div>

                  {/* Features (Expandable) */}
                  <details className="mt-4">
                    <summary className="text-sm text-sky-400 cursor-pointer hover:text-sky-300">
                      View all features
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {workstation.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-400"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </Card>
            ))}
          </div>

          {/* Volume Discount CTA */}
          <Card className="mt-12 bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-500/30 p-8 text-center">
            <Users className="w-12 h-12 text-sky-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">
              Need Multiple Workstations?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Get volume discounts on orders of 5+ workstations. We'll work with
              you to configure the perfect fleet for your business needs.
            </p>
            <Button
              onClick={() => setCurrentView("contact")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Sales Team
            </Button>
          </Card>
        </div>
      </section>

      {/* Service Tiers */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Business{" "}
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                Support Packages
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Keep your business running smoothly with proactive maintenance and
              priority support. Choose the service level that matches your
              needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {serviceTiers.map((tier) => (
              <Card
                key={tier.id}
                className={`group bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/50 transition-all duration-300 relative ${
                  tier.popular ? "ring-2 ring-sky-500 scale-105" : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-1 text-xs font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className="text-sky-400 mb-4">{tier.icon}</div>

                  {/* Header */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">{tier.tagline}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        £{tier.price}
                      </span>
                      <span className="text-gray-400">
                        /{tier.billing === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                    {tier.savings && (
                      <p className="text-sm text-green-400 mt-2">
                        {tier.savings}
                      </p>
                    )}
                  </div>

                  {/* Response Time */}
                  <div className="flex items-center gap-2 mb-6 p-3 bg-sky-500/10 rounded-lg border border-sky-500/20">
                    <Clock className="w-5 h-5 text-sky-400" />
                    <div>
                      <div className="text-xs text-gray-400">Response Time</div>
                      <div className="text-sm font-semibold text-white">
                        {tier.responseTime}
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={() => handleSelectService(tier)}
                    className={`w-full ${
                      tier.popular
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                        : "bg-white/10 hover:bg-white/20 border border-white/20"
                    }`}
                  >
                    {tier.billing === "monthly"
                      ? "Subscribe Now"
                      : "Purchase Annual Plan"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 text-center">
              <Calendar className="w-8 h-8 text-sky-400 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Flexible Scheduling</h4>
              <p className="text-sm text-gray-400">
                Choose maintenance windows that work for your business hours
              </p>
            </Card>
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 text-center">
              <HeadphonesIcon className="w-8 h-8 text-sky-400 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">UK-Based Support</h4>
              <p className="text-sm text-gray-400">
                All support handled by our expert technicians based in the UK
              </p>
            </Card>
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6 text-center">
              <Wrench className="w-8 h-8 text-sky-400 mx-auto mb-3" />
              <h4 className="font-semibold mb-2">On-Site Service</h4>
              <p className="text-sm text-gray-400">
                We come to you - minimal disruption to your operations
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Businesses{" "}
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                Choose Vortex
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <TrendingUp className="w-10 h-10 text-sky-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Proven Reliability</h3>
              <p className="text-sm text-gray-400">
                Business-grade components tested for 24/7 operation and
                long-term stability
              </p>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <Settings className="w-10 h-10 text-sky-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Easy Serviceability</h3>
              <p className="text-sm text-gray-400">
                Tool-less designs and modular components for quick repairs and
                upgrades
              </p>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <Shield className="w-10 h-10 text-sky-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Extended Warranties</h3>
              <p className="text-sm text-gray-400">
                Up to 5-year warranties included, with optional extensions
                available
              </p>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
              <Users className="w-10 h-10 text-sky-400 mb-4" />
              <h3 className="text-lg font-bold mb-2">Dedicated Support</h3>
              <p className="text-sm text-gray-400">
                Account managers who understand your business and technical
                needs
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Upgrade Your{" "}
            <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              Business Technology?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's discuss your requirements and create a custom solution that
            fits your business perfectly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setCurrentView("contact")}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-lg px-8 py-6"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Schedule Consultation
            </Button>
            <Button
              onClick={() => setCurrentView("pc-builder")}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-lg px-8 py-6"
            >
              <Settings className="w-5 h-5 mr-2" />
              Build Custom Configuration
            </Button>
          </div>
        </div>
      </section>

      {/* Subscription Modal */}
      <SubscriptionModal
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
        selectedTier={selectedService}
      />
    </div>
  );
}
