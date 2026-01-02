/**
 * Offline State Management & Payment Queue
 *
 * Handles:
 * - Persistent tracking of online/offline status
 * - Queueing payments when offline
 * - Automatic retry when connectivity restored
 * - Event listeners for online/offline transitions
 */

import { logger } from "./logger";

export interface QueuedPayment {
  id: string;
  timestamp: number;
  type: "stripe" | "paypal" | "bank_transfer";
  payload: Record<string, unknown>;
  attempts: number;
  lastError?: string;
}

export interface OfflineState {
  isOnline: boolean;
  lastOnlineTime: number;
  offlineSince?: number;
  queue: QueuedPayment[];
  listeners: Set<(isOnline: boolean) => void>;
}

class OfflineQueueManager {
  private state: OfflineState = {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    lastOnlineTime: Date.now(),
    queue: [],
    listeners: new Set(),
  };

  private STORAGE_KEY = "vortex_offline_queue";
  private MAX_QUEUE_SIZE = 10;
  private MAX_RETRY_ATTEMPTS = 5;

  constructor() {
    this.loadQueueFromStorage();
    this.setupEventListeners();
  }

  /**
   * Setup online/offline event listeners
   */
  private setupEventListeners() {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      logger.info("Device came online");
      this.state.isOnline = true;
      this.state.lastOnlineTime = Date.now();
      this.notifyListeners(true);

      // Trigger retry of queued payments
      if (this.state.queue.length > 0) {
        logger.info(
          `Connectivity restored. ${this.state.queue.length} payment(s) in queue.`
        );
        this.emitQueueRetryEvent();
      }
    };

    const handleOffline = () => {
      logger.warn("Device went offline");
      this.state.isOnline = false;
      this.state.offlineSince = Date.now();
      this.notifyListeners(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup function for SSR/testing
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }

  /**
   * Get current online status
   */
  isOnline(): boolean {
    if (typeof navigator !== "undefined") {
      this.state.isOnline = navigator.onLine;
    }
    return this.state.isOnline;
  }

  /**
   * Queue a payment for retry when offline
   */
  queuePayment(
    type: "stripe" | "paypal" | "bank_transfer",
    payload: Record<string, unknown>
  ): string {
    if (this.state.queue.length >= this.MAX_QUEUE_SIZE) {
      throw new Error(
        `Payment queue full (max ${this.MAX_QUEUE_SIZE}). Please try again after network restored.`
      );
    }

    const paymentId = `payment_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const queuedPayment: QueuedPayment = {
      id: paymentId,
      timestamp: Date.now(),
      type,
      payload,
      attempts: 0,
    };

    this.state.queue.push(queuedPayment);
    this.saveQueueToStorage();

    logger.info(`Payment queued for retry: ${paymentId}`, {
      type,
      queueSize: this.state.queue.length,
    });

    return paymentId;
  }

  /**
   * Remove payment from queue after successful retry
   */
  removePaymentFromQueue(paymentId: string): void {
    const index = this.state.queue.findIndex((p) => p.id === paymentId);
    if (index !== -1) {
      this.state.queue.splice(index, 1);
      this.saveQueueToStorage();
      logger.info(`Payment removed from queue: ${paymentId}`);
    }
  }

  /**
   * Update payment attempt count and error
   */
  updatePaymentAttempt(paymentId: string, error?: string): void {
    const payment = this.state.queue.find((p) => p.id === paymentId);
    if (payment) {
      payment.attempts++;
      if (error) {
        payment.lastError = error;
      }
      this.saveQueueToStorage();
    }
  }

  /**
   * Get all queued payments
   */
  getQueuedPayments(): QueuedPayment[] {
    return [...this.state.queue];
  }

  /**
   * Clear entire queue (for logout, etc)
   */
  clearQueue(): void {
    this.state.queue = [];
    this.saveQueueToStorage();
    logger.info("Payment queue cleared");
  }

  /**
   * Get time offline
   */
  getOfflineTime(): number {
    if (this.state.offlineSince) {
      return Date.now() - this.state.offlineSince;
    }
    return 0;
  }

  /**
   * Get offline duration readable format
   */
  getOfflineDurationString(): string {
    const ms = this.getOfflineTime();
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  }

  /**
   * Subscribe to online/offline status changes
   */
  subscribe(callback: (isOnline: boolean) => void): () => void {
    this.state.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.state.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(isOnline: boolean): void {
    this.state.listeners.forEach((listener) => {
      try {
        listener(isOnline);
      } catch (error) {
        logger.error("Error in offline status listener", error);
      }
    });
  }

  /**
   * Save queue to localStorage
   */
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          queue: this.state.queue,
          lastOnlineTime: this.state.lastOnlineTime,
          offlineSince: this.state.offlineSince,
        })
      );
    } catch (error) {
      logger.error("Failed to save offline queue to storage", error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.state.queue = data.queue || [];
        this.state.lastOnlineTime = data.lastOnlineTime || Date.now();
        this.state.offlineSince = data.offlineSince;

        if (this.state.queue.length > 0) {
          logger.info(
            `Loaded ${this.state.queue.length} payment(s) from offline queue`
          );
        }
      }
    } catch (error) {
      logger.error("Failed to load offline queue from storage", error);
    }
  }

  /**
   * Emit custom event for retry handling
   */
  private emitQueueRetryEvent(): void {
    if (typeof window === "undefined") return;

    const event = new CustomEvent("vortex:offline-queue-retry", {
      detail: {
        queue: this.state.queue,
        timestamp: Date.now(),
      },
    });

    window.dispatchEvent(event);
  }

  /**
   * Check if should auto-retry payment
   */
  shouldRetry(payment: QueuedPayment): boolean {
    return payment.attempts < this.MAX_RETRY_ATTEMPTS;
  }

  /**
   * Get retry delay in ms (with exponential backoff)
   */
  getRetryDelay(payment: QueuedPayment): number {
    const baseDelay = 5000; // 5 seconds
    const maxDelay = 300000; // 5 minutes
    const delay = baseDelay * Math.pow(2, payment.attempts);
    return Math.min(delay, maxDelay);
  }
}

// Export singleton instance
export const offlineQueueManager = new OfflineQueueManager();
