export async function checkIpBlocked(): Promise<{
  blocked: boolean;
  attempts: number;
  ip: string;
} | null> {
  try {
    const res = await fetch("/api/security/check-ip", { method: "GET" });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<{
      blocked: boolean;
      attempts: number;
      ip: string;
    }>;
    if (
      typeof data.blocked === "boolean" &&
      typeof data.attempts === "number" &&
      typeof data.ip === "string"
    ) {
      return { blocked: data.blocked, attempts: data.attempts, ip: data.ip };
    }
    return null;
  } catch {
    return null;
  }
}

export async function recordLoginAttempt(
  outcome: "success" | "failure",
  email?: string
): Promise<void> {
  try {
    await fetch("/api/security/record-login-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, email }),
    });
  } catch {
    // best-effort only
  }
}

export async function unblockIp(ip: string, idToken: string): Promise<boolean> {
  try {
    const res = await fetch("/api/security/unblock-ip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ ip }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function whitelistIp(
  ip: string,
  idToken: string,
  reason?: string
): Promise<boolean> {
  try {
    const res = await fetch("/api/security/whitelist-ip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ ip, reason }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface IpBlockEntry {
  id: string; // Firestore doc id (sanitized IP)
  ip?: string;
  attempts?: number;
  blocked?: boolean;
  blockedAt?: unknown;
  lastAttemptAt?: unknown;
  lastEmailTried?: string | null;
  reason?: string | null;
}

export interface IpBlockListResponse {
  entries: IpBlockEntry[];
  count: number;
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export async function listIpBlocks(
  idToken: string,
  options: {
    includeUnblocked?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  } = {}
): Promise<IpBlockListResponse> {
  const {
    includeUnblocked = false,
    page = 1,
    limit = 50,
    search = "",
  } = options;
  try {
    const params = new URLSearchParams();
    params.set("includeUnblocked", String(includeUnblocked));
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    const url = `/api/security/list-ip-blocks?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) {
      return {
        entries: [],
        count: 0,
        total: 0,
        page,
        totalPages: 0,
        limit,
        hasNext: false,
        hasPrev: page > 1,
      };
    }
    const json = await res.json();
    return json as IpBlockListResponse;
  } catch {
    return {
      entries: [],
      count: 0,
      total: 0,
      page,
      totalPages: 0,
      limit,
      hasNext: false,
      hasPrev: page > 1,
    };
  }
}
