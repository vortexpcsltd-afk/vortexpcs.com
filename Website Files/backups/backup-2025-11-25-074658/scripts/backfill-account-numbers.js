/*
  Backfill account numbers for existing users without one
  Usage (PowerShell):
    $env:FIREBASE_SERVICE_ACCOUNT_BASE64 = "<base64-json>"; node scripts/backfill-account-numbers.js
*/

async function initAdmin() {
  const imported = await import("firebase-admin");
  const admin = imported.default ? imported.default : imported;

  const saB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (saB64) {
    const json = Buffer.from(saB64, "base64").toString("utf-8");
    const creds = JSON.parse(json);
    if (!admin.apps?.length) {
      admin.initializeApp({
        credential: admin.credential.cert(creds),
        projectId: creds.project_id,
      });
    }
  } else {
    if (!admin.apps?.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  }
  return admin;
}

(async () => {
  const admin = await initAdmin();
  const db = admin.firestore();

  console.log("Starting backfill of account numbers...");

  const usersSnap = await db.collection("users").get();
  console.log(`Loaded ${usersSnap.size} user docs.`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data() || {};
    if (data.accountNumber) {
      skipped++;
      continue;
    }
    const uid = data.uid || doc.id;
    const type = data.accountType === "business" ? "business" : "general";

    try {
      await db.runTransaction(async (tx) => {
        const userRef = db.collection("users").doc(uid);
        const countersRef = db.collection("counters").doc("accountNumbers");

        const [userSnap, countersSnap] = await Promise.all([
          tx.get(userRef),
          tx.get(countersRef),
        ]);

        const current = countersSnap.exists ? countersSnap.data() : {};
        if (userSnap.exists && userSnap.data()?.accountNumber) {
          return; // idempotent
        }

        if (type === "business") {
          const seq =
            (typeof current.business === "number" ? current.business : 0) + 1;
          tx.set(countersRef, { business: seq }, { merge: true });
          const padded = String(seq).padStart(6, "0");
          const acct = `VTXBUS-${padded}`;
          tx.set(
            userRef,
            { accountNumber: acct, accountType: "business" },
            { merge: true }
          );
        } else {
          const seq =
            (typeof current.general === "number" ? current.general : 0) + 1;
          tx.set(countersRef, { general: seq }, { merge: true });
          const padded = String(seq).padStart(6, "0");
          const acct = `VTX-${padded}`;
          tx.set(
            userRef,
            { accountNumber: acct, accountType: "general" },
            { merge: true }
          );
        }
      });
      // Write audit record (best effort)
      try {
        const fresh = await db.collection("users").doc(uid).get();
        const acct = fresh.exists ? fresh.data().accountNumber : undefined;
        await db.collection("admin_audit_logs").add({
          type: "backfill_account_number",
          targetUid: uid,
          accountNumber: acct || null,
          accountType: type,
          performedBy: "script/backfill-account-numbers",
          performedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (_) {}
      updated++;
      console.log(`✅ Assigned account number for ${uid} (${type})`);
    } catch (e) {
      failed++;
      console.error(`❌ Failed to assign for ${uid}:`, e?.message || e);
    }
  }

  console.log("Backfill complete.", { updated, skipped, failed });
  process.exit(0);
})().catch((e) => {
  console.error("Backfill encountered an error:", e);
  process.exit(1);
});
