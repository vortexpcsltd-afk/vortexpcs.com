export type EnvGuardResult = {
  ok: boolean;
  missing?: string[];
  reason?: string;
};

// Guard for Firebase Admin credentials in serverless runtime
export function guardFirebaseAdminEnv(): EnvGuardResult {
  const hasBase64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const hasTriple =
    !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY;

  if (hasBase64 || hasTriple) return { ok: true };

  const missing: string[] = [];
  if (!hasBase64) {
    if (!process.env.FIREBASE_PROJECT_ID) missing.push("FIREBASE_PROJECT_ID");
    if (!process.env.FIREBASE_CLIENT_EMAIL)
      missing.push("FIREBASE_CLIENT_EMAIL");
    if (!process.env.FIREBASE_PRIVATE_KEY) missing.push("FIREBASE_PRIVATE_KEY");
  }
  return {
    ok: false,
    missing,
    reason:
      "Firebase Admin credentials not configured. Provide FIREBASE_SERVICE_ACCOUNT_BASE64 or the trio FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.",
  };
}

// Optional: common 503 response payload for feature-disabled state
export function featureDisabledPayload(kind: string, guard: EnvGuardResult) {
  return {
    ok: false,
    feature: kind,
    disabled: true,
    error: "feature-disabled",
    message: guard.reason,
    missing: guard.missing || [],
  };
}
