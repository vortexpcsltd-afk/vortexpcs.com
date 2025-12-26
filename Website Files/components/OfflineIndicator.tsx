/**
 * OfflineIndicator Component
 *
 * Displays current network status to user
 * Shows warning when offline with queue status
 */

import { useEffect, useState } from "react";
import { WifiOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { offlineQueueManager } from "../services/offlineQueue";
import { logger } from "../services/logger";

interface OfflineIndicatorProps {
  /**
   * Whether to show only when offline
   * @default true
   */
  showOnlyOffline?: boolean;

  /**
   * Custom className for the container
   */
  className?: string;
}

export function OfflineIndicator({
  showOnlyOffline = true,
  className = "",
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [queuedCount, setQueuedCount] = useState(0);
  const [offlineDuration, setOfflineDuration] = useState("");

  useEffect(() => {
    // Subscribe to offline status changes
    const unsubscribe = offlineQueueManager.subscribe((online) => {
      setIsOnline(online);

      if (online) {
        // Clear duration when coming back online
        setOfflineDuration("");
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update queued payment count
    const queued = offlineQueueManager.getQueuedPayments();
    setQueuedCount(queued.length);
  }, []);

  useEffect(() => {
    if (!isOnline) {
      // Update offline duration every second
      const interval = setInterval(() => {
        const duration = offlineQueueManager.getOfflineDurationString();
        setOfflineDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOnline]);

  // Listen for custom retry event
  useEffect(() => {
    const handleRetry = (event: Event) => {
      const customEvent = event as CustomEvent;
      setQueuedCount(customEvent.detail.queue.length);
      logger.info("Payment queue retry event received", customEvent.detail);
    };

    window.addEventListener("vortex:offline-queue-retry", handleRetry);
    return () => {
      window.removeEventListener("vortex:offline-queue-retry", handleRetry);
    };
  }, []);

  // Don't show if online and only showing offline
  if (showOnlyOffline && isOnline) {
    return null;
  }

  if (isOnline) {
    return (
      <Alert className={`bg-green-500/10 border-green-500/30 ${className}`}>
        <AlertDescription className="text-green-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Connected
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`bg-red-500/20 border-red-500/40 ${className}`}>
      <div className="flex items-start gap-3">
        <WifiOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-red-300 font-medium">
            No Internet Connection
          </AlertDescription>
          <div className="text-sm text-red-300/70 mt-1 space-y-1">
            <p>Offline for {offlineDuration}</p>
            {queuedCount > 0 && (
              <p className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                {queuedCount} payment{queuedCount !== 1 ? "s" : ""} waiting to
                retry
              </p>
            )}
            <p className="text-xs">
              Your changes will be saved automatically when reconnected.
            </p>
          </div>
        </div>
      </div>
    </Alert>
  );
}
