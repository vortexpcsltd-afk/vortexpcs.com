import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Wrench,
  Truck,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle,
  Star,
  Calendar,
  Package,
  Key,
  ArrowRight,
} from "lucide-react";

export function RepairService() {
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    issueType: "",
    description: "",
    urgency: "",
    collectionMethod: "",
    customerInfo: {},
    preferredDate: "",
    pcPassword: "",
  });

  // Postcode lookup state
  const [postcode, setPostcode] = useState("");
  const [foundAddresses, setFoundAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    street: "",
    city: "",
    county: "",
    postcode: "",
  });

  const repairServices = [
    {
      title: "Hardware Diagnostics",
      description: "Complete system diagnosis to identify hardware issues",
      price: "Free",
      duration: "1-2 hours",
      icon: Wrench,
    },
    {
      title: "Component Replacement",
      description: "Replace faulty components with genuine parts",
      price: "From £50",
      duration: "2-5 days",
      icon: Package,
    },
    {
      title: "System Optimisation",
      description: "Performance tuning and software optimisation",
      price: "£99",
      duration: "1-2 days",
      icon: Star,
    },
    {
      title: "Data Recovery",
      description: "Professional data recovery from damaged drives",
      price: "From £199",
      duration: "3-7 days",
      icon: Shield,
    },
  ];

  const coverageAreas = [
    "London",
    "Birmingham",
    "Manchester",
    "Liverpool",
    "Leeds",
    "Sheffield",
    "Bristol",
    "Glasgow",
    "Edinburgh",
    "Newcastle",
    "Nottingham",
    "Cardiff",
  ];

  const testimonials = [
    {
      name: "Alex Thompson",
      location: "London",
      rating: 5,
      comment:
        "Incredible service! They collected my PC, diagnosed the issue within hours, and had it back to me in perfect condition within 3 days.",
      repair: "Graphics card replacement",
    },
    {
      name: "Emma Wilson",
      location: "Manchester",
      rating: 5,
      comment:
        "Professional team, excellent communication throughout the process. They even optimised my system beyond the original repair.",
      repair: "System optimisation",
    },
    {
      name: "James Parker",
      location: "Birmingham",
      rating: 5,
      comment:
        "Thought my data was lost forever, but they recovered everything! Absolutely brilliant service.",
      repair: "Data recovery",
    },
  ];

  const repairProcess = [
    {
      step: 1,
      title: "Book Collection",
      description: "Schedule a convenient time for us to collect your PC",
      icon: Calendar,
    },
    {
      step: 2,
      title: "Free Diagnosis",
      description: "Our experts diagnose the issue within 24 hours",
      icon: Wrench,
    },
    {
      step: 3,
      title: "Approval & Repair",
      description: "Get approval for repairs and we fix your PC",
      icon: CheckCircle,
    },
    {
      step: 4,
      title: "Safe Return",
      description: "Your PC is returned fully tested and working",
      icon: Truck,
    },
  ];

  const BookingForm = () => {
    const steps = [
      "Issue Details",
      "Collection Method",
      "Customer Information",
      "Confirmation",
    ];
    const progress = ((bookingStep + 1) / steps.length) * 100;

    // Mock postcode lookup function
    const handlePostcodeLookup = () => {
      const normalizedPostcode = postcode.replace(/\s/g, "").toUpperCase();

      // Mock addresses based on postcode
      const mockAddresses: { [key: string]: string[] } = {
        SW1A1AA: [
          "10 Downing Street, Westminster, London, SW1A 1AA",
          "11 Downing Street, Westminster, London, SW1A 1AA",
          "12 Downing Street, Westminster, London, SW1A 1AA",
        ],
        M11AE: [
          "1 Piccadilly Gardens, Manchester, Greater Manchester, M1 1AE",
          "2 Piccadilly Gardens, Manchester, Greater Manchester, M1 1AE",
          "3 Piccadilly Gardens, Manchester, Greater Manchester, M1 1AE",
        ],
        B11AA: [
          "Flat 1, Birmingham House, Birmingham, West Midlands, B1 1AA",
          "Flat 2, Birmingham House, Birmingham, West Midlands, B1 1AA",
          "Flat 3, Birmingham House, Birmingham, West Midlands, B1 1AA",
        ],
      };

      // Find matching addresses or return generic ones
      if (mockAddresses[normalizedPostcode]) {
        setFoundAddresses(mockAddresses[normalizedPostcode]);
      } else {
        // Generic addresses for demo purposes
        setFoundAddresses([
          `1 Main Street, City Centre, ${postcode}`,
          `2 Main Street, City Centre, ${postcode}`,
          `Flat A, 3 Main Street, City Centre, ${postcode}`,
        ]);
      }
    };

    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-8 hover:border-sky-500/30 transition-all duration-300 shadow-xl shadow-black/20">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>
              Step {bookingStep + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          <h3 className="text-xl font-bold text-white">{steps[bookingStep]}</h3>
        </div>

        {bookingStep === 0 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white mb-3 block">
                What type of issue are you experiencing?
              </Label>
              <RadioGroup
                value={bookingData.issueType}
                onValueChange={(value) =>
                  setBookingData((prev) => ({ ...prev, issueType: value }))
                }
                className="space-y-3"
              >
                {[
                  "PC won't turn on",
                  "Performance issues/slow speeds",
                  "Graphics/display problems",
                  "Overheating issues",
                  "Strange noises",
                  "Blue screen errors",
                  "Internet/connectivity issues",
                  "Other hardware issue",
                ].map((issue) => (
                  <div
                    key={issue}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                  >
                    <RadioGroupItem value={issue} id={issue} />
                    <Label
                      htmlFor={issue}
                      className="text-white cursor-pointer flex-1"
                    >
                      {issue}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="description" className="text-white">
                Describe the issue in detail
              </Label>
              <Textarea
                id="description"
                value={bookingData.description}
                onChange={(e) =>
                  setBookingData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Please provide as much detail as possible about the problem..."
                className="bg-white/5 border-white/10 text-white mt-2"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-white mb-3 block">
                Select collection & repair service
              </Label>
              <RadioGroup
                value={bookingData.urgency}
                onValueChange={(value) =>
                  setBookingData((prev) => ({ ...prev, urgency: value }))
                }
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label
                    htmlFor="standard"
                    className="text-white cursor-pointer flex-1"
                  >
                    <div>Standard (3-5 days) - £29.99</div>
                    <div className="text-sm text-gray-400">
                      Includes collection and return delivery
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                  <RadioGroupItem value="express" id="express" />
                  <Label
                    htmlFor="express"
                    className="text-white cursor-pointer flex-1"
                  >
                    <div>Express (1-2 days) - £39.99</div>
                    <div className="text-sm text-gray-400">
                      Priority service with expedited collection
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                  <RadioGroupItem value="sameday" id="sameday" />
                  <Label
                    htmlFor="sameday"
                    className="text-white cursor-pointer flex-1"
                  >
                    <div>Same Day Service - £49.99</div>
                    <div className="text-sm text-gray-400">
                      Book before 10am for same day collection and return
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {bookingStep === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white mb-3 block">
                Collection service details
              </Label>
              <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                <div className="flex items-start space-x-3">
                  <Truck className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-white mb-1">
                      UK-Wide Collection & Return Service
                    </div>
                    <div className="text-sm text-gray-400">
                      We'll collect your PC from your address at a convenient
                      time and return it when the repair is complete. Collection
                      prices start from £29.99. Available across the entire UK.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="postcode" className="text-white">
                Enter your postcode
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="e.g. SW1A 1AA"
                  className="bg-white/5 border-white/10 text-white flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePostcodeLookup();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handlePostcodeLookup}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Find Address
                </Button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                We'll verify if we cover your area
              </p>
            </div>

            <div>
              <Label htmlFor="preferredDate" className="text-white">
                Preferred collection date
              </Label>
              <Input
                id="preferredDate"
                type="date"
                value={bookingData.preferredDate}
                onChange={(e) =>
                  setBookingData((prev) => ({
                    ...prev,
                    preferredDate: e.target.value,
                  }))
                }
                className="bg-white/5 border-white/10 text-white mt-2"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <Alert className="border-yellow-500/30 bg-yellow-500/10">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200 text-sm">
                <strong>Important:</strong> You'll need to provide your PC
                password in the next step. Without it, any repair work will be
                delayed until we receive full password access.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {bookingStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-white">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  className="bg-white/5 border-white/10 text-white mt-2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-white">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  className="bg-white/5 border-white/10 text-white mt-2"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                className="bg-white/5 border-white/10 text-white mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-white">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                className="bg-white/5 border-white/10 text-white mt-2"
                required
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="collectionPostcode" className="text-white">
                  Collection Address
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="collectionPostcode"
                    value={postcode}
                    onChange={(e) => {
                      setPostcode(e.target.value);
                      setFoundAddresses([]);
                      setSelectedAddress("");
                    }}
                    placeholder="Enter postcode"
                    className="bg-white/5 border-white/10 text-white flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handlePostcodeLookup();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handlePostcodeLookup}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Find Address
                  </Button>
                </div>
              </div>

              {foundAddresses.length > 0 && (
                <div>
                  <Label className="text-white">Select your address</Label>
                  <Select
                    value={selectedAddress}
                    onValueChange={setSelectedAddress}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                      <SelectValue placeholder="Choose your address" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      {foundAddresses.map((address, index) => (
                        <SelectItem
                          key={index}
                          value={address}
                          className="text-white focus:bg-white/10"
                        >
                          {address}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="manual"
                        className="text-blue-400 focus:bg-white/10 font-medium"
                      >
                        Enter address manually
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(selectedAddress === "manual" || showManualEntry) && (
                <div className="space-y-3 p-4 rounded-lg border border-white/10 bg-white/5">
                  <p className="text-sm text-gray-400 mb-2">
                    Enter your address manually
                  </p>
                  <div>
                    <Label htmlFor="street" className="text-white text-sm">
                      Street Address
                    </Label>
                    <Input
                      id="street"
                      value={manualAddress.street}
                      onChange={(e) =>
                        setManualAddress((prev) => ({
                          ...prev,
                          street: e.target.value,
                        }))
                      }
                      placeholder="House number and street name"
                      className="bg-white/5 border-white/10 text-white mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-white text-sm">
                      Town/City
                    </Label>
                    <Input
                      id="city"
                      value={manualAddress.city}
                      onChange={(e) =>
                        setManualAddress((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder="Town or city"
                      className="bg-white/5 border-white/10 text-white mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="county" className="text-white text-sm">
                      County
                    </Label>
                    <Input
                      id="county"
                      value={manualAddress.county}
                      onChange={(e) =>
                        setManualAddress((prev) => ({
                          ...prev,
                          county: e.target.value,
                        }))
                      }
                      placeholder="County"
                      className="bg-white/5 border-white/10 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="manualPostcode"
                      className="text-white text-sm"
                    >
                      Postcode
                    </Label>
                    <Input
                      id="manualPostcode"
                      value={manualAddress.postcode || postcode}
                      onChange={(e) =>
                        setManualAddress((prev) => ({
                          ...prev,
                          postcode: e.target.value,
                        }))
                      }
                      placeholder="Postcode"
                      className="bg-white/5 border-white/10 text-white mt-1"
                      required
                    />
                  </div>
                </div>
              )}

              {!selectedAddress &&
                foundAddresses.length === 0 &&
                !showManualEntry && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManualEntry(true)}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Enter address manually
                  </Button>
                )}

              {selectedAddress && selectedAddress !== "manual" && (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <AlertDescription className="text-green-200 text-sm">
                    <strong>Address confirmed:</strong> {selectedAddress}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator className="border-white/10" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-blue-400" />
                <Label htmlFor="pcPassword" className="text-white">
                  PC Password (Required)
                </Label>
              </div>
              <Input
                id="pcPassword"
                type="text"
                value={bookingData.pcPassword}
                onChange={(e) =>
                  setBookingData((prev) => ({
                    ...prev,
                    pcPassword: e.target.value,
                  }))
                }
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter your Windows/Mac login password"
                required
              />
              <Alert className="border-blue-500/30 bg-blue-500/10 mt-3">
                <AlertTriangle className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-200 text-sm">
                  <strong>Why we need this:</strong> Your password is required
                  to carry out diagnostics, testing, and repairs on your system.
                  Without full password access, repair work will be delayed
                  until we can contact you. Your password is kept secure and
                  confidential.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" required />
              <Label htmlFor="terms" className="text-white text-sm">
                I agree to the{" "}
                <span className="text-blue-400 underline">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-blue-400 underline">Privacy Policy</span>
              </Label>
            </div>
          </div>
        )}

        {bookingStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Booking Confirmed!
              </h3>
              <p className="text-gray-400">
                Your repair service has been successfully booked.
              </p>
            </div>

            <Card className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-500/20 p-6">
              <h4 className="font-bold text-white mb-4">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Issue Type:</span>
                  <span className="text-white">{bookingData.issueType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Turnaround Time:</span>
                  <span className="text-white capitalize">
                    {bookingData.urgency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Service Type:</span>
                  <span className="text-white capitalize">
                    {bookingData.urgency} Collection & Return
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Booking Reference:</span>
                  <span className="text-white font-mono">
                    VX-REP-
                    {Math.random().toString(36).substr(2, 9).toUpperCase()}
                  </span>
                </div>
              </div>
            </Card>

            <div className="text-center text-sm text-gray-400">
              <p>
                You will receive a confirmation email shortly with tracking
                details.
              </p>
              <p>
                Our team will contact you within 2 hours to confirm collection
                time.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setBookingStep(Math.max(0, bookingStep - 1))}
            disabled={bookingStep === 0}
            className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
          >
            Previous
          </Button>

          <Button
            onClick={() => {
              if (bookingStep < 3) {
                setBookingStep(bookingStep + 1);
              }
            }}
            disabled={bookingStep === 3}
            className="bg-blue-600 hover:bg-blue-500 border border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 disabled:opacity-50 disabled:hover:bg-blue-600 disabled:hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
          >
            {bookingStep === 2
              ? "Confirm Booking"
              : bookingStep === 3
              ? "Complete"
              : "Next"}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-sky-900/20 animate-gradient"></div>
      <div
        className="fixed inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <section className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-8">
                <Wrench className="w-4 h-4 text-blue-400 mr-2" />
                <span className="text-sm text-blue-300">
                  UK-Wide PC Repair Service
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                Expert PC Repair
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Professional PC repair services with UK-wide collection and
                return from £29.99. Expert diagnostics, genuine parts, and
                comprehensive warranty on all repairs.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button
                  onClick={() => setBookingStep(0)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Repair Service
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call: 0800 123 4567
                </Button>
              </div>

              {/* Key Features */}
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  {
                    icon: Truck,
                    title: "UK-Wide Collection",
                    desc: "From £29.99 inc. return",
                  },
                  {
                    icon: Clock,
                    title: "Fast Turnaround",
                    desc: "Same day service available",
                  },
                  {
                    icon: Shield,
                    title: "90-Day Warranty",
                    desc: "All repairs guaranteed",
                  },
                  {
                    icon: Wrench,
                    title: "Expert Technicians",
                    desc: "Certified professionals",
                  },
                ].map((feature, index) => (
                  <Card
                    key={index}
                    className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-sky-500/10 p-4 text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-3">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* Repair Services */}
            <section className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                  Our Repair Services
                </h2>
                <p className="text-gray-400 text-lg">
                  Comprehensive PC repair solutions for all your needs
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {repairServices.map((service, index) => (
                  <Card
                    key={index}
                    className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:bg-white/10 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-sky-500/10 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors">
                      {service.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        {service.price}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {service.duration}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Repair Process */}
            <section className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                  How It Works
                </h2>
                <p className="text-gray-400 text-lg">
                  Simple, transparent process for all repairs
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                {repairProcess.map((step, index) => (
                  <React.Fragment key={index}>
                    <div className="text-center flex-shrink-0">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm border-2 border-blue-500/50 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                          <step.icon className="w-8 h-8 text-blue-400" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-400">{step.description}</p>
                    </div>
                    {index < repairProcess.length - 1 && (
                      <div className="hidden md:flex flex-shrink-0">
                        <ArrowRight className="w-6 h-6 text-blue-400" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>

            {/* Booking Form */}
            <section className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                  Book Your Repair
                </h2>
                <p className="text-gray-400 text-lg">
                  Get started with your PC repair in just a few steps
                </p>
              </div>

              <BookingForm />
            </section>

            {/* Testimonials */}
            <section className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
                  What Our Customers Say
                </h2>
                <p className="text-gray-400 text-lg">
                  Trusted by thousands across the UK
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <Card
                    key={index}
                    className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:border-sky-500/30 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-sky-500/10"
                  >
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-4 italic">
                      "{testimonial.comment}"
                    </p>
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-full flex items-center justify-center mr-3">
                        <span className="text-black font-semibold">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {testimonial.location}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Coverage Area */}
            <section className="mb-20">
              <Card className="relative bg-gradient-to-br from-blue-950/50 to-sky-950/30 backdrop-blur-xl border-2 border-sky-500/30 hover:border-sky-400/50 transition-all duration-500 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.2)] hover:shadow-[0_0_70px_rgba(56,189,248,0.3)] group p-8 text-center">
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-3xl font-bold text-white mb-4">
                    UK-Wide Coverage
                  </h3>
                  <p className="text-gray-300 text-lg mb-6">
                    We provide collection and return services across major UK
                    cities from £29.99
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {coverageAreas.map((area) => (
                      <Badge
                        key={area}
                        variant="secondary"
                        className="bg-white/10 text-white border-white/20 hover:bg-sky-500/20 hover:border-sky-400/50 transition-all duration-300"
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 mt-4">
                    Don't see your area? Contact us - we may still be able to
                    help!
                  </p>
                </div>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
