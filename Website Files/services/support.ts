// CSRF token automatically added via addCsrfTokenToHeaders

export type TicketReplyPayload = {
  ticketId: string;
  body: string;
  internal?: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
    path: string;
    scanStatus?: "pending" | "clean" | "infected" | "error";
  }>;
};

export async function replyToTicket(payload: TicketReplyPayload): Promise<{
  success: boolean;
}> {
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
    const { getCsrfToken, addCsrfTokenToHeaders } = await import(
      "../utils/csrfToken"
    );
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      addCsrfTokenToHeaders(headers);
    }
  } catch {
    /* ignore CSRF token failure; endpoint will handle validation */
  }

  const res = await fetch("/api/admin/support/reply", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.message || err?.error || `Ticket reply failed (${res.status})`
    );
  }

  return res.json();
}
