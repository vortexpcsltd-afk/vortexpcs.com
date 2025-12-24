/**
 * Email Client Service
 * Client-side service for triggering bulk emails via admin API
 */

// CSRF client removed during rollback; use plain headers

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

  const res = await fetch("/api/admin/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
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
