// CSRF client removed during rollback; use plain headers

export type BankTransferSettings = {
  accountName: string;
  bankName?: string;
  sortCode: string;
  accountNumber: string;
  iban?: string;
  bic?: string;
  referenceNote?: string;
  instructions?: string;
  updatedAt?: string;
};

export async function fetchBankTransferSettings(): Promise<BankTransferSettings> {
  try {
    const res = await fetch("/api/settings/bank-transfer", { method: "GET" });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as Partial<BankTransferSettings>;
    return {
      accountName: data.accountName || "Vortex PCs Ltd",
      bankName: data.bankName,
      sortCode: data.sortCode || "04-00-04",
      accountNumber: data.accountNumber || "12345678",
      iban: data.iban,
      bic: data.bic,
      referenceNote: data.referenceNote || "We’ll use your Order ID",
      instructions: data.instructions,
      updatedAt: data.updatedAt,
    };
  } catch {
    return {
      accountName: "Vortex PCs Ltd",
      sortCode: "04-00-04",
      accountNumber: "12345678",
      referenceNote: "We’ll use your Order ID",
    };
  }
}

export async function updateBankTransferSettings(
  input: Partial<BankTransferSettings>,
  idToken: string
): Promise<boolean> {
  const res = await fetch("/api/admin/settings/bank-transfer", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => ({}));
  return Boolean((data as { success?: boolean }).success);
}
