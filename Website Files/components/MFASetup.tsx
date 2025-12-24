/**
 * Multi-Factor Authentication Setup Component
 * Allows admin users to enable MFA on their accounts
 */

import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Shield, Check, AlertTriangle, Copy, Key } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { auth } from "../config/firebase";
import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  TotpMultiFactorGenerator,
  TotpSecret,
} from "firebase/auth";

interface MFASetupProps {
  onComplete?: () => void;
}

export function MFASetup({ onComplete }: MFASetupProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [setupMethod, setSetupMethod] = useState<"totp" | "sms">("totp");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [secretKey, setSecretKey] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [_mfaEnabled, setMfaEnabled] = useState(false);

  const currentUser = auth?.currentUser;

  // Check if MFA is already enabled
  const checkMFAStatus = () => {
    if (!currentUser) return false;
    const enrolledFactors = multiFactor(currentUser).enrolledFactors;
    return enrolledFactors.length > 0;
  };

  // Generate TOTP secret and QR code
  const generateTOTPSecret = async () => {
    if (!currentUser) {
      toast.error("Not authenticated");
      return;
    }

    setLoading(true);
    try {
      const multiFactorSession = await multiFactor(currentUser).getSession();
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(
        multiFactorSession
      );

      setTotpSecret(totpSecret);

      // Generate QR code URL
      const secretKey = totpSecret.secretKey;
      setSecretKey(secretKey);

      const otpauthUrl = totpSecret.generateQrCodeUrl(
        currentUser.email || "user@vortexpcs.com",
        "Vortex PCs Admin"
      );

      const qrCode = await QRCode.toDataURL(otpauthUrl);
      setQrCodeUrl(qrCode);

      toast.success("Scan QR code with your authenticator app");
    } catch (error) {
      console.error("Failed to generate TOTP secret:", error);
      toast.error("Failed to generate authentication code");
    } finally {
      setLoading(false);
    }
  };

  // Send SMS verification code
  const sendSMSCode = async () => {
    if (!currentUser) {
      toast.error("Not authenticated");
      return;
    }

    setLoading(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(
        auth!,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );

      const multiFactorSession = await multiFactor(currentUser).getSession();
      const phoneAuthProvider = new PhoneAuthProvider(auth!);

      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        {
          phoneNumber,
          session: multiFactorSession,
        },
        recaptchaVerifier
      );

      setVerificationId(verificationId);
      toast.success("Verification code sent to your phone");
    } catch (error) {
      console.error("Failed to send SMS:", error);
      toast.error("Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Verify and enroll TOTP
  const verifyTOTP = async () => {
    if (!currentUser || !totpSecret) {
      toast.error("Setup incomplete");
      return;
    }

    setLoading(true);
    try {
      const multiFactorAssertion =
        TotpMultiFactorGenerator.assertionForEnrollment(
          totpSecret,
          verificationCode
        );

      await multiFactor(currentUser).enroll(
        multiFactorAssertion,
        "Authenticator App"
      );

      setMfaEnabled(true);
      toast.success("MFA enabled successfully!");
      setShowSetup(false);
      onComplete?.();
    } catch (error) {
      console.error("Failed to verify TOTP:", error);
      toast.error("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify and enroll SMS
  const verifySMS = async () => {
    if (!currentUser || !verificationId) {
      toast.error("Setup incomplete");
      return;
    }

    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      await multiFactor(currentUser).enroll(multiFactorAssertion, "Phone SMS");

      setMfaEnabled(true);
      toast.success("MFA enabled successfully!");
      setShowSetup(false);
      onComplete?.();
    } catch (error) {
      console.error("Failed to verify SMS:", error);
      toast.error("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copySecretKey = () => {
    navigator.clipboard.writeText(secretKey);
    toast.success("Secret key copied to clipboard");
  };

  const isMFAEnabled = checkMFAStatus();

  return (
    <>
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/20 rounded-lg">
              <Shield className="h-6 w-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Multi-Factor Authentication
              </h3>
              <p className="text-sm text-gray-400">
                Add an extra layer of security to your admin account
              </p>
            </div>
          </div>
          {isMFAEnabled ? (
            <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
              <Check className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          ) : (
            <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Not Enabled
            </Badge>
          )}
        </div>

        {!isMFAEnabled && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-200">
              <strong>Security Warning:</strong> MFA is not enabled on your
              account. Enable it now to protect against unauthorized access.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={() => setShowSetup(true)}
            disabled={isMFAEnabled || !currentUser}
            className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
          >
            {isMFAEnabled ? "MFA Already Enabled" : "Enable MFA"}
          </Button>
        </div>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-sky-400" />
              Enable Multi-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose your preferred authentication method
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Method Selection */}
            {!qrCodeUrl && !verificationId && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSetupMethod("totp")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      setupMethod === "totp"
                        ? "border-sky-500 bg-sky-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <Key className="h-6 w-6 mx-auto mb-2 text-sky-400" />
                    <div className="text-sm font-semibold">
                      Authenticator App
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Recommended
                    </div>
                  </button>

                  <button
                    onClick={() => setSetupMethod("sms")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      setupMethod === "sms"
                        ? "border-sky-500 bg-sky-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <Shield className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                    <div className="text-sm font-semibold">SMS</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Text message
                    </div>
                  </button>
                </div>

                {setupMethod === "totp" && (
                  <Button
                    onClick={generateTOTPSecret}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-sky-600 to-blue-600"
                  >
                    {loading ? "Generating..." : "Continue with Authenticator"}
                  </Button>
                )}

                {setupMethod === "sms" && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white mb-2 block">
                        Phone Number
                      </Label>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1234567890"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <Button
                      onClick={sendSMSCode}
                      disabled={loading || !phoneNumber}
                      className="w-full bg-gradient-to-r from-sky-600 to-blue-600"
                    >
                      {loading ? "Sending..." : "Send Verification Code"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TOTP QR Code */}
            {qrCodeUrl && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-4">
                    Scan this QR code with your authenticator app (Google
                    Authenticator, Authy, 1Password, etc.)
                  </p>
                  <div className="flex justify-center mb-4">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-48 h-48 bg-white p-2 rounded"
                    />
                  </div>
                  <div className="bg-white/10 rounded p-3">
                    <Label className="text-xs text-gray-400 mb-1 block">
                      Or enter this key manually:
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm text-sky-400 break-all">
                        {secretKey}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copySecretKey}
                        className="border-white/20"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">
                    Enter 6-digit code from your app
                  </Label>
                  <Input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest"
                  />
                </div>

                <Button
                  onClick={verifyTOTP}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-600"
                >
                  {loading ? "Verifying..." : "Verify and Enable MFA"}
                </Button>
              </div>
            )}

            {/* SMS Verification */}
            {verificationId && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-300">
                    Enter the verification code sent to {phoneNumber}
                  </p>
                </div>

                <div>
                  <Label className="text-white mb-2 block">
                    Verification Code
                  </Label>
                  <Input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest"
                  />
                </div>

                <Button
                  onClick={verifySMS}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-600"
                >
                  {loading ? "Verifying..." : "Verify and Enable MFA"}
                </Button>
              </div>
            )}
          </div>

          <div id="recaptcha-container"></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
