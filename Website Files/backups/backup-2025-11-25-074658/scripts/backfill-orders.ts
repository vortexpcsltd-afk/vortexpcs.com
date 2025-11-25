/**
 * Backfill Orders Script
 * ---------------------------------
 * Adds missing human-friendly orderNumber and stripePaymentIntentId fields
 * for legacy order documents. Safe to run multiple times (idempotent).
 *
 * Usage:
 *   1. Set FIREBASE_SERVICE_ACCOUNT_BASE64 in environment (same as webhook).
 *   2. (Optional) DRY_RUN=1 node scripts/backfill-orders.ts
 *   3. Remove DRY_RUN or set DRY_RUN=0 to apply changes.
 */

import admin from "firebase-admin";

function initFirebase(): admin.firestore.Firestore {
  if (admin.apps.length) return admin.firestore();
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 not set");
  const creds = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
  admin.initializeApp({ credential: admin.credential.cert(creds) });
  return admin.firestore();
}

// Generate human friendly order number (same logic style as webhook)
function generateOrderNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars
  let code = "";
  for (let i = 0; i < 4; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return `VPC-${y}${m}${day}-${code}`;
}

async function run() {
  const db = initFirebase();
  const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

  console.log("============================================");
  console.log("🔧 ORDER BACKFILL START");
  console.log(" Mode:", dryRun ? "DRY RUN (no writes)" : "APPLY CHANGES");
  console.log("============================================");

  const snapshot = await db.collection("orders").get();
  console.log(`📦 Found ${snapshot.size} order documents`);

  let updated = 0;
  let skipped = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as Record<string, any>;
    const needsNumber =
      !data.orderNumber || typeof data.orderNumber !== "string";
    const docIdLooksLikePi = /^pi_/.test(docSnap.id);
    const hasStripePIField = !!data.stripePaymentIntentId;
    const needsStripePI = !hasStripePIField && docIdLooksLikePi;

    if (!needsNumber && !needsStripePI) {
      skipped++;
      continue;
    }

    const updatePayload: Record<string, any> = {};
    if (needsNumber) {
      updatePayload.orderNumber = generateOrderNumber();
    }
    if (needsStripePI) {
      updatePayload.stripePaymentIntentId = docSnap.id; // doc id is the PI id
    }

    console.log(
      `➡️  ${docSnap.id} | add: ${
        Object.keys(updatePayload).join(", ") || "(none)"
      }`
    );
    if (!dryRun) {
      await docSnap.ref.update(updatePayload);
      updated++;
    }
  }

  console.log("============================================");
  console.log("✅ BACKFILL COMPLETE");
  console.log(" Updated:", updated);
  console.log(" Skipped (already complete):", skipped);
  console.log(" Dry Run:", dryRun);
  console.log("============================================");
}

run().catch((e) => {
  console.error("❌ Backfill failed", e);
  process.exit(1);
});
