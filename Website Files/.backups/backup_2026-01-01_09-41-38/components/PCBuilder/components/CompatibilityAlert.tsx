import React from "react";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../ui/alert-dialog";
import { Alert, AlertDescription } from "../../ui/alert";
import { Badge } from "../../ui/badge";
import { trackClick } from "../../../services/sessionTracker";
import type { CompatibilityIssue } from "../types";

/**
 * CompatibilityAlert - Modal dialog showing component compatibility warnings
 *
 * Features:
 * - AlertDialog modal with glassmorphism styling
 * - Severity-based color coding (critical/warning/info)
 * - Issue list with icon indicators
 * - Severity badge (Critical/Warning/Info)
 * - Scrollable issue list (max-height with overflow)
 * - Accept/Cancel action buttons
 * - Analytics tracking for compatibility warnings
 * - Automatically opens when issues detected
 *
 * Severity Levels:
 * - Critical: Red - blocking incompatibilities (AlertTriangle icon)
 * - Warning: Yellow - potential issues (AlertCircle icon)
 * - Info: Blue - suggestions/recommendations (Info icon)
 *
 * @component
 * @example
 * ```tsx
 * <CompatibilityAlert
 *   compatibilityIssues={[
 *     {
 *       severity: "warning",
 *       title: "PSU Wattage Low",
 *       description: "Recommended 750W, selected 650W may cause instability"
 *     }
 *   ]}
 *   onAccept={() => handleAcceptWarning()}
 *   onCancel={() => handleCancelSelection()}
 * />
 * ```
 */
interface CompatibilityAlertProps {
  /** Array of compatibility issues to display */
  compatibilityIssues: CompatibilityIssue[];
  /** Callback when user accepts the warnings and proceeds */
  onAccept: () => void;
  /** Callback when user cancels and reverts selection */
  onCancel: () => void;
}

export const CompatibilityAlert: React.FC<CompatibilityAlertProps> = ({
  compatibilityIssues,
  onAccept,
  onCancel,
}) => {
  const severityColors = {
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
    warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  const severityIcons = {
    critical: AlertTriangle,
    warning: AlertCircle,
    info: Info,
  };

  return (
    <AlertDialog open={compatibilityIssues.length > 0}>
      <AlertDialogContent className="max-w-2xl bg-black/95 border-white/10 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Compatibility Check Results
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            We've detected some potential compatibility issues with your
            selected components. Please review the details below.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Track compatibility warnings when dialog shows */}
          {(() => {
            try {
              if (compatibilityIssues.length > 0) {
                const userId = sessionStorage.getItem("vortex_user_id");
                const titles = Array.from(
                  new Set(compatibilityIssues.map((i) => i.title))
                );
                const severities = compatibilityIssues.reduce(
                  (acc: Record<string, number>, i) => {
                    acc[i.severity] = (acc[i.severity] || 0) + 1;
                    return acc;
                  },
                  {}
                );
                trackClick(
                  "compatibility_warning",
                  { titles, severities },
                  userId || undefined
                );
              }
            } catch {
              // best-effort analytics
            }
            return null;
          })()}

          {compatibilityIssues.map(
            (issue: CompatibilityIssue, index: number) => {
              const Icon =
                severityIcons[issue.severity as keyof typeof severityIcons];
              return (
                <Alert
                  key={index}
                  className={`border rounded-lg p-4 ${
                    severityColors[
                      issue.severity as keyof typeof severityColors
                    ]
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="ml-3">
                    <h4 className="font-bold mb-2">{issue.title}</h4>
                    <AlertDescription className="text-sm opacity-90">
                      {issue.description}
                    </AlertDescription>
                    {issue.recommendation && (
                      <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-sky-300">
                          <strong>Recommendation:</strong>{" "}
                          {issue.recommendation}
                        </p>
                      </div>
                    )}
                    {issue.affectedComponents && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {issue.affectedComponents.map(
                          (component: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {component}
                            </Badge>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </Alert>
              );
            }
          )}
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Review & Fix Issues
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onAccept}
            className="bg-yellow-600 hover:bg-yellow-500 text-white"
          >
            Continue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
