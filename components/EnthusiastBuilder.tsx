import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Cpu,
  HardDrive,
  Fan,
  MonitorSmartphone,
  Disc,
  Zap,
  Plus,
  X,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react";

interface Component {
  id: string;
  category: string;
  model: string;
  specifications: string;
}

interface EnthusiastBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPONENT_CATEGORIES = [
  { value: "cpu", label: "CPU / Processor", icon: Cpu },
  { value: "gpu", label: "Graphics Card", icon: MonitorSmartphone },
  { value: "motherboard", label: "Motherboard", icon: Disc },
  { value: "ram", label: "Memory (RAM)", icon: Zap },
  { value: "storage", label: "Storage", icon: HardDrive },
  { value: "cooling", label: "Cooling", icon: Fan },
  { value: "psu", label: "Power Supply", icon: Zap },
  { value: "case", label: "Case", icon: Disc },
  { value: "other", label: "Other Component", icon: Plus },
];

export function EnthusiastBuilder({ isOpen, onClose }: EnthusiastBuilderProps) {
  const [step, setStep] = useState(1);
  const [components, setComponents] = useState<Component[]>([]);
  const [currentComponent, setCurrentComponent] = useState({
    category: "",
    model: "",
    specifications: "",
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    budget: "",
    useCase: "",
    additionalNotes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddComponent = () => {
    if (!currentComponent.category || !currentComponent.model) {
      setError("Please select a category and enter a model/part number");
      return;
    }

    const newComponent: Component = {
      id: Date.now().toString(),
      ...currentComponent,
    };

    setComponents([...components, newComponent]);
    setCurrentComponent({ category: "", model: "", specifications: "" });
    setError(null);
  };

  const handleRemoveComponent = (id: string) => {
    setComponents(components.filter((c) => c.id !== id));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (components.length === 0) {
      setError("Please add at least one component to your build");
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setError("Please fill in all required contact details");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/enthusiast/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          components,
          customerInfo,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quote request");
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Quote submission error:", err);
      setError(
        "Failed to submit your quote request. Please try again or call us at 01603 975440."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setComponents([]);
    setCurrentComponent({ category: "", model: "", specifications: "" });
    setCustomerInfo({
      name: "",
      email: "",
      phone: "",
      budget: "",
      useCase: "",
      additionalNotes: "",
    });
    setSubmitted(false);
    setError(null);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    const cat = COMPONENT_CATEGORIES.find((c) => c.value === category);
    const Icon = cat?.icon || Plus;
    return <Icon className="w-4 h-4" />;
  };

  const getCategoryLabel = (category: string) => {
    return (
      COMPONENT_CATEGORIES.find((c) => c.value === category)?.label || category
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-black border-sky-500/30 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-sky-400 animate-pulse" />
              <div className="absolute inset-0 bg-sky-400/20 blur-xl rounded-full"></div>
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Enthusiast Builder
              </DialogTitle>
              <Badge className="mt-1 bg-transparent border-purple-400/60 text-purple-300">
                Bespoke Component Sourcing Service
              </Badge>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Request a quote for a custom build with hard-to-find or specialised
            components. Our team will source exactly what you need.
          </p>
        </DialogHeader>

        {submitted ? (
          <div className="py-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <CheckCircle className="w-20 h-20 text-green-400" />
                <div className="absolute inset-0 bg-green-400/20 blur-2xl rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Quote Request Submitted!
            </h3>
            <p className="text-gray-300 mb-2">
              Thank you for your enthusiast build request.
            </p>
            <p className="text-gray-400 mb-6">
              Our specialist team will review your component list and get back
              to you within 24 hours with availability and pricing.
            </p>
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div
                className={`flex items-center gap-2 ${
                  step === 1 ? "text-sky-400" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step === 1
                      ? "border-sky-400 bg-sky-400/20"
                      : "border-gray-600 bg-gray-800"
                  }`}
                >
                  1
                </div>
                <span className="text-sm font-medium">Components</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-700"></div>
              <div
                className={`flex items-center gap-2 ${
                  step === 2 ? "text-sky-400" : "text-gray-500"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step === 2
                      ? "border-sky-400 bg-sky-400/20"
                      : "border-gray-600 bg-gray-800"
                  }`}
                >
                  2
                </div>
                <span className="text-sm font-medium">Details</span>
              </div>
            </div>

            {error && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <div className="space-y-6">
                {/* Component List */}
                {components.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Your Build Components ({components.length})
                    </h3>
                    <div className="space-y-2">
                      {components.map((component) => (
                        <div
                          key={component.id}
                          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4 flex items-start gap-3 hover:border-sky-500/30 transition-all"
                        >
                          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                            {getCategoryIcon(component.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="secondary"
                                className="bg-sky-500/20 border-sky-500/40 text-sky-300 text-xs"
                              >
                                {getCategoryLabel(component.category)}
                              </Badge>
                            </div>
                            <p className="font-semibold text-white">
                              {component.model}
                            </p>
                            {component.specifications && (
                              <p className="text-sm text-gray-400 mt-1">
                                {component.specifications}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveComponent(component.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Component Form */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-sky-400" />
                    Add Component
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Category *</Label>
                      <select
                        value={currentComponent.category}
                        onChange={(e) =>
                          setCurrentComponent({
                            ...currentComponent,
                            category: e.target.value,
                          })
                        }
                        className="w-full mt-2 bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                      >
                        <option value="" className="bg-slate-900">
                          Select category
                        </option>
                        {COMPONENT_CATEGORIES.map((cat) => (
                          <option
                            key={cat.value}
                            value={cat.value}
                            className="bg-slate-900"
                          >
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-white">
                        Model / Part Number *
                      </Label>
                      <Input
                        value={currentComponent.model}
                        onChange={(e) =>
                          setCurrentComponent({
                            ...currentComponent,
                            model: e.target.value,
                          })
                        }
                        placeholder="e.g., AMD Ryzen 9 7950X3D"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">
                      Specifications (Optional)
                    </Label>
                    <Textarea
                      value={currentComponent.specifications}
                      onChange={(e) =>
                        setCurrentComponent({
                          ...currentComponent,
                          specifications: e.target.value,
                        })
                      }
                      placeholder="Additional details: frequency, capacity, specific features..."
                      className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      rows={2}
                    />
                  </div>

                  <Button
                    onClick={handleAddComponent}
                    className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Component to Build
                  </Button>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (components.length === 0) {
                        setError("Please add at least one component");
                        return;
                      }
                      setStep(2);
                      setError(null);
                    }}
                    className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
                  >
                    Continue to Details
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Full Name *</Label>
                      <Input
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            name: e.target.value,
                          })
                        }
                        required
                        placeholder="Your name"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Email *</Label>
                      <Input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            email: e.target.value,
                          })
                        }
                        required
                        placeholder="your@email.com"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Phone Number *</Label>
                      <Input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            phone: e.target.value,
                          })
                        }
                        required
                        placeholder="01603 975440"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Budget (Optional)</Label>
                      <Input
                        value={customerInfo.budget}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            budget: e.target.value,
                          })
                        }
                        placeholder="£3000-£4000"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Use Case (Optional)</Label>
                    <Textarea
                      value={customerInfo.useCase}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          useCase: e.target.value,
                        })
                      }
                      placeholder="Gaming at 4K, 3D rendering, video editing, etc..."
                      className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-white">
                      Additional Notes (Optional)
                    </Label>
                    <Textarea
                      value={customerInfo.additionalNotes}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          additionalNotes: e.target.value,
                        })
                      }
                      placeholder="Any specific requirements, preferences, or questions..."
                      className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Back to Components
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Request Quote
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
