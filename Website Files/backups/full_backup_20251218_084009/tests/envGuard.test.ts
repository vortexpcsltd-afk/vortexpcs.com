import { describe, it, expect } from "vitest";
import { guardFirebaseAdminEnv } from "../utils/envGuard";

describe("guardFirebaseAdminEnv", () => {
  it("returns ok when base64 is present", () => {
    const prev = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = "dummy";
    const result = guardFirebaseAdminEnv();
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = prev;
    expect(result.ok).toBe(true);
  });

  it("returns ok when triple vars are present", () => {
    const prev = {
      pid: process.env.FIREBASE_PROJECT_ID,
      email: process.env.FIREBASE_CLIENT_EMAIL,
      key: process.env.FIREBASE_PRIVATE_KEY,
    };
    process.env.FIREBASE_PROJECT_ID = "proj";
    process.env.FIREBASE_CLIENT_EMAIL = "svc@proj";
    process.env.FIREBASE_PRIVATE_KEY =
      "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n";
    const result = guardFirebaseAdminEnv();
    process.env.FIREBASE_PROJECT_ID = prev.pid;
    process.env.FIREBASE_CLIENT_EMAIL = prev.email;
    process.env.FIREBASE_PRIVATE_KEY = prev.key;
    expect(result.ok).toBe(true);
  });

  it("returns missing when neither set", () => {
    const prev = {
      b64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      pid: process.env.FIREBASE_PROJECT_ID,
      email: process.env.FIREBASE_CLIENT_EMAIL,
      key: process.env.FIREBASE_PRIVATE_KEY,
    };
    delete process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    const result = guardFirebaseAdminEnv();
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = prev.b64;
    process.env.FIREBASE_PROJECT_ID = prev.pid;
    process.env.FIREBASE_CLIENT_EMAIL = prev.email;
    process.env.FIREBASE_PRIVATE_KEY = prev.key;
    expect(result.ok).toBe(false);
    expect(result.missing?.length).toBeGreaterThan(0);
  });
});
