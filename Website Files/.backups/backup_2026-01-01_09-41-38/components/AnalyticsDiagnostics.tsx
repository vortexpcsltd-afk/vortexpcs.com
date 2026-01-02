/**
 * Analytics Diagnostics Component
 * Helps debug analytics tracking issues
 */

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { firebaseIsConfigured } from "../config/firebase";
import { getConsent } from "../utils/consent";
import { logger } from "../services/logger";

export function AnalyticsDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<{
    firebaseConfigured: boolean;
    cookieConsent: boolean;
    sessionId: string | null;
    isAdmin: boolean;
    trackingActive: boolean;
    lastError: string | null;
  } | null>(null);

  const runDiagnostics = () => {
    try {
      const { analytics: consentAnalytics } = getConsent();
      const sessionId = sessionStorage.getItem("vortex_session_id");
      const raw = localStorage.getItem("vortex_user");
      const user = raw ? JSON.parse(raw) : null;
      const isAdmin = user?.role === "admin";

      const trackingActive = consentAnalytics || isAdmin;

      setDiagnostics({
        firebaseConfigured: firebaseIsConfigured,
        cookieConsent: consentAnalytics,
        sessionId,
        isAdmin,
        trackingActive,
        lastError: null,
      });

      logger.info("📊 [Diagnostics] Analytics check complete", {
        firebaseConfigured: firebaseIsConfigured,
        consentAnalytics,
        sessionId,
        isAdmin,
        trackingActive,
      });
    } catch (error) {
      setDiagnostics({
        firebaseConfigured: false,
        cookieConsent: false,
        sessionId: null,
        isAdmin: false,
        trackingActive: false,
        lastError: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  if (!diagnostics) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
        <p className="text-gray-400">Loading diagnostics...</p>
      </Card>
    );
  }

  const StatusBadge = ({
    condition,
    label,
  }: {
    condition: boolean;
    label: string;
  }) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
      <span className="text-white">{label}</span>
      {condition ? (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      ) : (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/40">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      )}
    </div>
  );

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Analytics Diagnostics</h3>
        <Button
          onClick={runDiagnostics}
          variant="outline"
          size="sm"
          className="border-white/20"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        <StatusBadge
          condition={diagnostics.firebaseConfigured}
          label="Firebase Configured"
        />
        <StatusBadge
          condition={diagnostics.cookieConsent}
          label="Cookie Consent"
        />
        <StatusBadge condition={diagnostics.isAdmin} label="Admin User" />
        <StatusBadge
          condition={diagnostics.trackingActive}
          label="Analytics Tracking"
        />

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
          <span className="text-white">Session ID</span>
          {diagnostics.sessionId ? (
            <span className="text-xs text-green-400 font-mono">
              {diagnostics.sessionId.substring(0, 20)}...
            </span>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
              <AlertCircle className="w-3 h-3 mr-1" />
              Not initialized
            </Badge>
          )}
        </div>

        {diagnostics.lastError && (
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/40">
            <p className="text-sm text-red-400">{diagnostics.lastError}</p>
          </div>
        )}

        {!diagnostics.trackingActive && (
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/40">
            <p className="text-sm text-yellow-400">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Analytics tracking is currently inactive.
              {!diagnostics.cookieConsent && !diagnostics.isAdmin && (
                <span>
                  {" "}
                  Please accept cookies or sign in as admin to enable tracking.
                </span>
              )}
            </p>
          </div>
        )}

        {!diagnostics.firebaseConfigured && (
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/40">
            <p className="text-sm text-blue-400">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Firebase is not configured. Analytics will use API fallback if
              deployed.
            </p>
          </div>
        )}

        {diagnostics.trackingActive && diagnostics.sessionId && (
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/40">
            <p className="text-sm text-green-400">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Analytics are active and tracking!
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-black/20 rounded-lg border border-white/5">
        <h4 className="text-sm font-semibold text-white mb-2">
          Troubleshooting Tips
        </h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Check browser console for detailed analytics logs</li>
          <li>• Ensure you're logged in as an admin user</li>
          <li>• Accept analytics cookies or use admin override for testing</li>
          <li>• Verify Firebase environment variables are set correctly</li>
          <li>• Check that Firestore rules allow analytics writes</li>
        </ul>
      </div>
    </Card>
  );
}
