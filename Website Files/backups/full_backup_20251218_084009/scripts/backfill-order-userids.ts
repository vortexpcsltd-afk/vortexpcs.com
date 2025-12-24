/**
 * Backfill Order User IDs
 *
 * Associates existing orders with userId based on matching customerEmail to auth users.
 * Only updates orders where userId is missing or 'guest'.
 *
 * Usage:
 *   npx tsx scripts/backfill-order-userids.ts
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import admin from "firebase-admin";

function loadEnv() {
  const root = process.cwd();
  const localPath = path.resolve(root, ".env.local");
  const envPath = path.resolve(root, ".env");
  if (fs.existsSync(localPath)) dotenv.config({ path: localPath });
  else if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
  else dotenv.config();
}

function loadServiceAccount(): any | null {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
  }
  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const tryPaths = [
    gac,
    path.resolve(process.cwd(), "config/serviceAccount.json"),
  ].filter(Boolean) as string[];
  for (const p of tryPaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        return JSON.parse(raw);
      }
    } catch {}
  }
  return null;
}

function initAdmin() {
  // Handle ESM import quirk: admin.apps may be undefined, use optional chaining.
  const maybeApps = (admin as any).apps;
  if (maybeApps && maybeApps.length) return;
  const svc = loadServiceAccount();
  if (!svc) {
    throw new Error(
      "Firebase Admin credentials not found. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or provide GOOGLE_APPLICATION_CREDENTIALS or config/serviceAccount.json"
    );
  }
  admin.initializeApp({ credential: admin.credential.cert(svc) });
}

async function main() {
  loadEnv();
  console.log("🔄 Starting order userId backfill...");
  initAdmin();
  const fdb = admin.firestore();
  const auth = admin.auth();

  // Load all users (paginate if large)
  const usersByEmail: Record<string, string> = {};
  let nextPageToken: string | undefined;
  do {
    const list = await auth.listUsers(1000, nextPageToken);
    for (const u of list.users) {
      if (u.email) usersByEmail[u.email.toLowerCase()] = u.uid;
    }
    nextPageToken = list.pageToken;
  } while (nextPageToken);
  console.log(
    `👥 Loaded ${Object.keys(usersByEmail).length} auth users with emails.`
  );

  // Query orders with userId missing or guest
  const ordersSnap = await fdb.collection("orders").get();
  let toUpdate = 0;
  let updated = 0;

  const batch = fdb.batch();
  for (const doc of ordersSnap.docs) {
    const data = doc.data();
    const currentUserId = data.userId;
    const email = (data.customerEmail || "").toLowerCase();
    if (!email) continue;
    if (!currentUserId || currentUserId === "guest") {
      const matchUid = usersByEmail[email];
      if (matchUid) {
        toUpdate++;
        batch.update(doc.ref, {
          userId: matchUid,
          userLinkBackfilledAt: admin.firestore.Timestamp.now(),
        });
        console.log(`✅ Will backfill order ${doc.id} -> userId ${matchUid}`);
      } else {
        console.log(`⚠️ No auth user match for order ${doc.id} email ${email}`);
      }
    }
  }

  if (toUpdate) {
    await batch.commit();
    updated = toUpdate;
  }

  console.log("\n📊 Backfill Summary");
  console.log("---------------------------");
  console.log(`Orders scanned: ${ordersSnap.size}`);
  console.log(`Orders updated: ${updated}`);
  console.log(
    `Skipped (already linked or no match): ${ordersSnap.size - updated}`
  );
  console.log(
    "\n💡 If many orders were guest, ensure checkout passes userId metadata when user is logged in."
  );
}

main().catch((err) => {
  console.error("❌ Backfill failed:", err);
  process.exit(1);
});
