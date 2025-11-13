import { useEffect, useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { logger } from "../services/logger";
import { auth } from "../config/firebase";

export default function SetPassword() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [code, setCode] = useState<string | null>(null);
  const [emailFromCode, setEmailFromCode] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const oob = params.get("oobCode");
    setCode(oob);
    if (!oob) {
      setError("Missing or invalid password setup link.");
      setLoading(false);
      return;
    }

    if (!auth) {
      setError("Authentication not available. Please try again later.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { verifyPasswordResetCode } = await import("firebase/auth");
        const email = await verifyPasswordResetCode(auth, oob);
        setEmailFromCode(email);
        // Obfuscate email for display
        const [user, domain] = email.split("@");
        const masked = `${user.slice(0, 2)}***@${domain}`;
        setEmailHint(masked);
        setError(null);
      } catch (e: any) {
        logger.error("verifyPasswordResetCode failed", e);
        setError(
          e?.code === "auth/expired-action-code"
            ? "This link has expired. Please request a new one."
            : "Invalid or expired link. Please request a new one."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  const onSubmit = async () => {
    if (!code || !auth) return;
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters for a strong password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const { confirmPasswordReset, signInWithEmailAndPassword } = await import(
        "firebase/auth"
      );
      await confirmPasswordReset(auth, code, password);

      // Attempt sign-in and redirect to the right area
      const email = emailFromCode || params.get("email");
      if (email) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          // Fetch profile to route accordingly
          try {
            const { getUserProfile } = await import("../services/auth");
            const profile = await getUserProfile(cred.user.uid);
            const accountType = (profile as any)?.accountType;
            const target =
              accountType === "business" ? "/business-dashboard" : "/member";
            window.location.replace(target);
            return;
          } catch {
            // If profile fetch fails, go to member area by default
            window.location.replace("/member");
            return;
          }
        } catch (e) {
          // If auto sign-in fails, still show success
          logger.warn("Auto sign-in after password set failed", e);
        }
      }

      setDone(true);
    } catch (e: any) {
      logger.error("confirmPasswordReset failed", e);
      const msg =
        e?.code === "auth/weak-password"
          ? "Password too weak. Please choose a stronger password."
          : e?.message || "Failed to set password. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!code || error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-lg mx-auto p-8 bg-white/5 backdrop-blur-xl border-white/10 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Password Setup</h1>
          <p className="text-gray-300 mb-6">
            {error ||
              "Invalid link. Please request a new password setup email."}
          </p>
          <Button onClick={() => (window.location.href = "/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-lg mx-auto p-8 bg-white/5 backdrop-blur-xl border-white/10 text-white">
        <h1 className="text-2xl font-bold mb-2">Set your password</h1>
        {emailHint && (
          <p className="text-gray-300 mb-6">
            For account: <span className="text-sky-300">{emailHint}</span>
          </p>
        )}
        <div className="space-y-4">
          <div>
            <Label className="text-white">New password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <Label className="text-white">Confirm password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {done ? (
            <div className="text-green-300 text-sm">
              Password updated. You can now sign in.
            </div>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={onSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              {submitting ? "Saving..." : "Save password"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
