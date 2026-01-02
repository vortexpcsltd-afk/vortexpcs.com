/**
 * Email Client Service
 * Client-side service for triggering bulk emails via admin API
 * Includes CSRF protection on email sending requests
 */

import { getCsrfToken } from "../utils/csrfToken";

export type SendBulkEmailPayload = {
  subject: string;
  html: string;
  preheader?: string;
  recipients?: string[]; // if omitted and mode=all, server will load all customers
  mode: "all" | "emails";
};

export type BulkEmailResponse = {
  success: boolean;
  sent: number;
  recipients?: number;
  batchSize?: number;
  batches?: number;
};

export async function sendBulkEmail(
  payload: SendBulkEmailPayload
): Promise<BulkEmailResponse> {
  let idToken: string | null = null;
  try {
    const { auth } = await import("../config/firebase");
    if (auth?.currentUser) {
      const { getIdToken } = await import("firebase/auth");
      idToken = await getIdToken(auth.currentUser, true);
    }
  } catch {
    /* ignore token retrieval failure; endpoint will reject if not authorized */
  }

  // Add CSRF token to request headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  // Add CSRF token if available
  try {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  } catch {
    /* ignore CSRF token failure; endpoint will handle validation */
  }

  const res = await fetch("/api/admin/email/send", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || err?.error || `Email send failed (${res.status})`
    );
  }

  return res.json();
}
