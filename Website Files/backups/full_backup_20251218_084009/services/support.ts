// CSRF client removed during rollback; use plain headers

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

  const res = await fetch("/api/admin/support/reply", {
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
      err?.message || err?.error || `Ticket reply failed (${res.status})`
    );
  }

  return res.json();
}
