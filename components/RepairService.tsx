import {
  useState,
  useRef,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
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
  Phone,
  CheckCircle,
  AlertTriangle,
  Star,
  Calendar,
  Package,
  Key,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  lookupAddresses,
  lastAddressProvider,
  lastAddressError,
} from "../services/address";
import { GETADDRESS_IO_API_KEY } from "../config/address";

// Stable child component to prevent remounts that interrupt typing/focus
interface BookingFormProps {
  bookingStep: number;
  setBookingStep: (n: number) => void;
  bookingData: {
    issueTypes: string[];
    description: string;
    urgency: string;
    collectionMethod: string;
    customerInfo: Record<string, unknown>;
    preferredDate: string;
    pcPassword: string;
  };
  setBookingData: Dispatch<
    SetStateAction<{
      issueTypes: string[];
      description: string;
      urgency: string;
      collectionMethod: string;
      customerInfo: Record<string, unknown>;
      preferredDate: string;
      pcPassword: string;
    }>
  >;
  postcode: string;
  setPostcode: Dispatch<SetStateAction<string>>;
  foundAddresses: string[];
  setFoundAddresses: Dispatch<SetStateAction<string[]>>;
  selectedAddress: string;
  setSelectedAddress: Dispatch<SetStateAction<string>>;
  showManualEntry: boolean;
  setShowManualEntry: Dispatch<SetStateAction<boolean>>;
  isLoadingAddresses: boolean;
  postcodeError: string;
  setPostcodeError: Dispatch<SetStateAction<string>>;
  manualAddress: {
    street: string;
    city: string;
    county: string;
    postcode: string;
  };
  setManualAddress: Dispatch<
    SetStateAction<{
      street: string;
      city: string;
      county: string;
      postcode: string;
    }>
  >;
  handlePostcodeLookup: () => Promise<void> | void;
  onNavigate?: (view: string) => void;
}

function BookingForm(props: BookingFormProps) {
  const {
    bookingStep,
    setBookingStep,
    bookingData,
    setBookingData,
    postcode,
    setPostcode,
    foundAddresses,
    setFoundAddresses,
    selectedAddress,
    setSelectedAddress,
    showManualEntry,
    setShowManualEntry,
    isLoadingAddresses,
    postcodeError,
    setPostcodeError,
    manualAddress,
    setManualAddress,
    handlePostcodeLookup,
    onNavigate,
  } = props;

  const steps = [
    "Issue Details",
    "Collection Method",
    "Customer Information",
    "Confirmation",
  ];
  const progress = ((bookingStep + 1) / steps.length) * 100;

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl p-6 md:p-8 hover:border-sky-500/30 transition-all duration-300">
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-400 mb-3">
          <span>
            Step {bookingStep + 1} of {steps.length}
          </span>
          <span className="font-semibold">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2 mb-4 bg-white/10" />
        <h3 className="text-2xl font-bold text-white">{steps[bookingStep]}</h3>
      </div>

      {bookingStep === 0 && (
        <div className="space-y-6">
          {/** Step 1 validation helpers */}
          {null}
          <div>
            <Label className="text-white mb-3 block">
              What type of issue are you experiencing? (Select all that apply)
            </Label>
            <div className="space-y-3">
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
                  <Checkbox
                    id={issue}
                    checked={bookingData.issueTypes.includes(issue)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setBookingData((prev) => ({
                          ...prev,
                          issueTypes: [...prev.issueTypes, issue],
                        }));
                      } else {
                        setBookingData((prev) => ({
                          ...prev,
                          issueTypes: prev.issueTypes.filter(
                            (i) => i !== issue
                          ),
                        }));
                      }
                    }}
                  />
                  <Label
                    htmlFor={issue}
                    className="text-white cursor-pointer flex-1"
                  >
                    {issue}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Tip: selecting applicable issues helps us diagnose faster.
            </p>
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
            {bookingData.description.trim().length < 10 && (
              <p className="text-xs text-red-400 mt-1">
                Please provide a brief description (minimum 10 characters).
              </p>
            )}
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
            {!bookingData.urgency && (
              <p className="text-xs text-red-400 mt-2">
                Please choose a service speed.
              </p>
            )}
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
                    We'll collect your PC from your address at a convenient time
                    and return it when the repair is complete. Collection prices
                    start from £29.99. Available across the entire UK.
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
                onChange={(e) => {
                  setPostcode(e.target.value);
                  if (postcodeError) {
                    setPostcodeError("");
                  }
                }}
                placeholder="e.g. SW1A 1AA"
                className="bg-white/5 border-white/10 text-white flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePostcodeLookup();
                  }
                }}
                disabled={isLoadingAddresses}
              />
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("===BUTTON CLICKED===");
                  console.log(
                    "Find Address button clicked, postcode:",
                    postcode
                  );
                  console.log("isLoadingAddresses:", isLoadingAddresses);
                  console.log("About to call handlePostcodeLookup");
                  handlePostcodeLookup();
                  console.log("handlePostcodeLookup called");
                }}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoadingAddresses || postcode.trim().length === 0}
              >
                {isLoadingAddresses ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  "Find Address"
                )}
              </Button>
            </div>
            {postcodeError && (
              <p className="text-sm text-red-400 mt-2">{postcodeError}</p>
            )}
            {foundAddresses.length > 0 && !postcodeError && (
              <div className="mt-3 space-y-3">
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <AlertDescription className="text-green-200 text-sm">
                    Coverage confirmed for{" "}
                    <strong>{postcode.toUpperCase()}</strong>. We found{" "}
                    {foundAddresses.length} address
                    {foundAddresses.length > 1 ? "es" : ""}. Select your exact
                    address below.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label className="text-white">Select your address</Label>
                  <Select
                    value={selectedAddress}
                    onValueChange={(value) => {
                      setSelectedAddress(value);
                      if (value === "manual") {
                        setShowManualEntry(true);
                      } else {
                        setShowManualEntry(false);
                      }
                    }}
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
              </div>
            )}
            {!postcodeError && !isLoadingAddresses && (
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-400">
                  We'll verify if we cover your area
                </p>
                {(import.meta.env.DEV ||
                  import.meta.env.VITE_DEBUG_ADDRESS === "1") && (
                  <div className="space-y-0.5">
                    <p className="text-xs text-gray-500">
                      Provider:{" "}
                      {lastAddressProvider ||
                        (GETADDRESS_IO_API_KEY
                          ? "getaddress.io (client?)"
                          : "postcodes.io (fallback)")}
                    </p>
                    {lastAddressError && (
                      <p className="text-[11px] text-gray-500/80">
                        Detail: {lastAddressError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
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
                      e.preventDefault();
                      handlePostcodeLookup();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePostcodeLookup();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoadingAddresses || postcode.trim().length === 0}
                >
                  {isLoadingAddresses ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    "Find Address"
                  )}
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
                <strong>Why we need this:</strong> Your password is required to
                carry out diagnostics, testing, and repairs on your system.
                Without full password access, repair work will be delayed until
                we can contact you. Your password is kept secure and
                confidential.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="terms" required />
            <Label htmlFor="terms" className="text-white text-sm">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => onNavigate?.("terms")}
                className="text-blue-400 underline hover:text-blue-300"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => onNavigate?.("privacy")}
                className="text-blue-400 underline hover:text-blue-300"
              >
                Privacy Policy
              </button>
            </Label>
          </div>
        </div>
      )}

      {bookingStep === 3 && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">
              Booking Confirmed!
            </h3>
            <p className="text-gray-400 text-lg">
              Your repair service has been successfully booked.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-sky-600/10 to-blue-600/10 border-sky-500/30 p-6">
            <h4 className="font-bold text-white mb-4 text-lg">
              Booking Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-start pb-2 border-b border-white/10">
                <span className="text-gray-400">Issue Types:</span>
                <span className="text-white font-medium text-right max-w-xs">
                  {bookingData.issueTypes.join(", ") || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-gray-400">Turnaround Time:</span>
                <span className="text-white font-medium capitalize">
                  {bookingData.urgency}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-gray-400">Service Type:</span>
                <span className="text-white font-medium capitalize">
                  {bookingData.urgency} Collection & Return
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Booking Reference:</span>
                <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300 font-mono">
                  VX-REP-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </Badge>
              </div>
            </div>
          </Card>

          <Alert className="border-sky-500/30 bg-sky-500/10">
            <CheckCircle className="w-4 h-4 text-sky-400" />
            <AlertDescription className="text-sky-200">
              <p className="mb-2">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>
                  You'll receive a confirmation email shortly with tracking
                  details
                </li>
                <li>
                  Our team will contact you within 2 hours to confirm collection
                  time
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
        <Button
          variant="outline"
          onClick={() => setBookingStep(Math.max(0, bookingStep - 1))}
          disabled={bookingStep === 0}
          className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </Button>

        <Button
          onClick={() => {
            if (bookingStep === 0) {
              const desc = bookingData.description.trim();
              const isValid = desc.length >= 10 && Boolean(bookingData.urgency);
              if (!isValid) return;
            }
            if (bookingStep < 3) setBookingStep(bookingStep + 1);
          }}
          disabled={
            bookingStep === 3 ||
            (bookingStep === 0 &&
              !(
                bookingData.description.trim().length >= 10 &&
                Boolean(bookingData.urgency)
              ))
          }
          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:from-sky-600 disabled:to-blue-600"
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
}

export function RepairService({
  onNavigate,
}: {
  onNavigate?: (view: string) => void;
}) {
  const bookingFormRef = useRef<HTMLDivElement>(null);
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    issueTypes: [] as string[], // Changed to array for multiple selections
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
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [postcodeError, setPostcodeError] = useState("");
  const [manualAddress, setManualAddress] = useState({
    street: "",
    city: "",
    county: "",
    postcode: "",
  });

  // (reserved) validation state if needed for future steps

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

  // Real postcode lookup via provider (getaddress.io if configured) with fallback
  const handlePostcodeLookup = useCallback(async () => {
    console.log("=== handlePostcodeLookup called ===");
    console.log("Current postcode value:", postcode);

    const trimmedPostcode = postcode.trim();
    const normalizedNoSpace = trimmedPostcode.replace(/\s+/g, "").toUpperCase();

    console.log("Trimmed postcode:", trimmedPostcode);
    console.log("Normalized no-space:", normalizedNoSpace);

    if (!trimmedPostcode) {
      console.log("Postcode is empty");
      setPostcodeError("Please enter a postcode");
      return;
    }

    // Basic UK postcode format validation (more lenient)
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(trimmedPostcode)) {
      console.log("Postcode failed regex validation");
      setPostcodeError(
        "Please enter a valid UK postcode format (e.g. SW1A 1AA)"
      );
      return;
    }

    console.log("Postcode passed validation, starting lookup...");
    setIsLoadingAddresses(true);
    setPostcodeError("");
    setFoundAddresses([]);
    setSelectedAddress("");

    try {
      console.log("Looking up addresses via provider for:", trimmedPostcode);
      const addresses = await lookupAddresses(trimmedPostcode);
      if (addresses.length > 0) {
        console.log("Provider returned addresses:", addresses.length);
        setFoundAddresses(addresses);
        setPostcode(trimmedPostcode.toUpperCase());
        console.log("Addresses set successfully");
      } else {
        console.error("No addresses returned for postcode:", trimmedPostcode);
        setPostcodeError(
          "No addresses found for this postcode. Please check and try again or enter your address manually."
        );
        setShowManualEntry(true);
      }
    } catch (error) {
      console.error("Postcode lookup error:", error);
      setPostcodeError(
        "Unable to look up postcode. Please enter your address manually."
      );
      setShowManualEntry(true);
    } finally {
      console.log("Lookup complete, setting loading to false");
      setIsLoadingAddresses(false);
    }
  }, [postcode]); // Dependencies: only recreate if postcode changes

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-20">
            <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-300 mb-6 px-4 py-1.5">
              <Wrench className="w-4 h-4 mr-2" />
              UK-Wide PC Repair Service
            </Badge>

            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-sky-200 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Expert PC Repair
              <br />
              <span className="text-4xl md:text-5xl">Done Right</span>
            </h1>

            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Professional PC repair services with UK-wide collection and return
              from £29.99. Expert diagnostics, genuine parts, and comprehensive
              warranty on all repairs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                onClick={() => {
                  setBookingStep(0);
                  bookingFormRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-8 py-6 text-lg font-semibold transition-all duration-300 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Repair Service
              </Button>
              <Button
                variant="outline"
                className="bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 hover:border-white/30 px-8 py-6 text-lg font-semibold transition-all duration-300"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call: 0800 123 4567
              </Button>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
                  className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 p-6 text-center group"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm md:text-base">
                    {feature.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-400">
                    {feature.desc}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* Repair Services */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                Our Repair Services
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Comprehensive PC repair solutions for all your needs
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {repairServices.map((service, index) => (
                <Card
                  key={index}
                  className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:bg-white/10 hover:border-sky-500/30 transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-sm">
                      {service.price}
                    </Badge>
                    <span className="text-xs text-gray-500">
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
              <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Simple, transparent process for all repairs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
              {repairProcess.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-sky-500/30 transition-all duration-300 p-6 text-center h-full">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/25">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                      {step.step}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </Card>
                  {index < repairProcess.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-5 h-5 text-sky-500/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Booking Form */}
          <section className="mb-20" ref={bookingFormRef}>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                Book Your Repair
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Get started with your PC repair in just a few steps
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <BookingForm
                bookingStep={bookingStep}
                setBookingStep={setBookingStep}
                bookingData={bookingData}
                setBookingData={setBookingData}
                postcode={postcode}
                setPostcode={setPostcode}
                foundAddresses={foundAddresses}
                setFoundAddresses={setFoundAddresses}
                selectedAddress={selectedAddress}
                setSelectedAddress={setSelectedAddress}
                showManualEntry={showManualEntry}
                setShowManualEntry={setShowManualEntry}
                isLoadingAddresses={isLoadingAddresses}
                postcodeError={postcodeError}
                setPostcodeError={setPostcodeError}
                manualAddress={manualAddress}
                setManualAddress={setManualAddress}
                handlePostcodeLookup={handlePostcodeLookup}
                onNavigate={onNavigate}
              />
            </div>
          </section>

          {/* Testimonials */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                What Our Customers Say
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Trusted by thousands across the UK
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="bg-white/5 border-white/10 backdrop-blur-xl p-6 hover:border-sky-500/30 transition-all duration-300"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 text-sm leading-relaxed italic">
                    "{testimonial.comment}"
                  </p>
                  <Separator className="mb-4 bg-white/10" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-black font-bold text-sm">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {testimonial.location} • {testimonial.repair}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Coverage Area */}
          <section className="mb-20">
            <Card className="bg-gradient-to-br from-sky-950/30 to-blue-950/30 backdrop-blur-xl border border-sky-500/30 p-8 md:p-12 hover:border-sky-400/50 transition-all duration-500 overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
                  UK-Wide Coverage
                </h3>
                <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                  Professional PC repair and collection service available
                  throughout England, Scotland, Wales, and Northern Ireland
                </p>

                {/* UK Map Silhouette */}
                <div className="flex justify-center items-center gap-8 mb-8">
                  <div className="relative">
                    {/* UK Map Outline */}
                    <div className="relative w-56 h-72 md:w-64 md:h-80 flex items-center justify-center">
                      <img
                        src="/uk-map-outline.png"
                        alt="UK Map"
                        className="w-full h-full object-contain"
                        style={{
                          filter:
                            "brightness(0) saturate(100%) invert(70%) sepia(52%) saturate(2878%) hue-rotate(169deg) brightness(98%) contrast(101%)",
                        }}
                      />
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-sky-400/30 blur-2xl -z-10 scale-90"></div>
                    </div>
                  </div>

                  <div className="text-left space-y-4 max-w-md">
                    <div className="flex items-start gap-3">
                      <Truck className="w-6 h-6 text-sky-400 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-white mb-1">
                          Nationwide Collection
                        </h4>
                        <p className="text-sm text-gray-400">
                          Free collection and return anywhere in the UK
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-6 h-6 text-sky-400 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-white mb-1">
                          Fast Service
                        </h4>
                        <p className="text-sm text-gray-400">
                          Standard, express, and same-day options available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="w-6 h-6 text-sky-400 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-white mb-1">
                          Fully Insured
                        </h4>
                        <p className="text-sm text-gray-400">
                          Your PC is protected during transit and repair
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <p className="text-sky-300 font-semibold mb-2">
                    Collection & Return from £29.99
                  </p>
                  <p className="text-sm text-gray-400">
                    We serve all UK postcodes. Book online or call 0800 123 4567
                    for a quote.
                  </p>
                </div>
              </div>

              {/* Background decoration */}
              <div className="absolute inset-0 opacity-5">
                <svg
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle
                        cx="20"
                        cy="20"
                        r="1"
                        fill="currentColor"
                        className="text-sky-400"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
