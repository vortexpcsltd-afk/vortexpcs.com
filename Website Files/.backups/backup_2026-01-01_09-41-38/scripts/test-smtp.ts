/**
 * SMTP Configuration & Send Test
 * ---------------------------------
 * Usage (PowerShell):
 *   $env:SMTP_HOST="smtp.example.com"; $env:SMTP_PORT="465"; $env:SMTP_SECURE="true"; $env:SMTP_USER="accounts@vortexpcs.com"; $env:SMTP_PASS="YOUR_PASS"; $env:BUSINESS_EMAIL="info@vortexpcs.com"; node scripts/test-smtp.ts
 *
 * In Vercel: Run via a one-off build or temporary script execution if needed.
 */
import nodemailer from "nodemailer";

function readEnv(name: string): string | undefined {
  return process.env[name] || process.env[`VITE_${name}`];
}

async function main() {
  const host = readEnv("SMTP_HOST");
  const portStr = readEnv("SMTP_PORT") || "465";
  const secureStr = readEnv("SMTP_SECURE");
  const user = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASS");
  const businessEmail = readEnv("BUSINESS_EMAIL") || "info@vortexpcs.com";
  const testRecipient = process.argv[2] || businessEmail;

  const port = parseInt(portStr, 10) || 465;
  const secure = secureStr ? secureStr === "true" : port === 465;

  console.log("============================================");
  console.log("🔧 SMTP TEST START");
  console.log(" Host:", host);
  console.log(" Port:", port);
  console.log(" Secure:", secure);
  console.log(" User:", user ? "SET" : "MISSING");
  console.log(" Pass:", pass ? "SET" : "MISSING");
  console.log(" Business Email:", businessEmail);
  console.log(" Test Recipient:", testRecipient);
  console.log("============================================");

  if (!host || !user || !pass) {
    console.error(
      "❌ Missing required SMTP env vars (SMTP_HOST / SMTP_USER / SMTP_PASS)"
    );
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: user!, pass: pass! },
    logger: true,
    debug: true,
  });

  try {
    console.log("🔍 Verifying transporter...");
    await transporter.verify();
    console.log("✅ Transport verified");
  } catch (e) {
    console.warn("⚠️ Transport verify failed (will attempt send anyway):", e);
  }

  try {
    const info = await transporter.sendMail({
      from: `"Vortex PCs SMTP Test" <${user}>`,
      to: testRecipient,
      subject: "Vortex PCs SMTP Test Email",
      text:
        "If you received this, SMTP is working. Time: " +
        new Date().toISOString(),
      html: `<p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#111">SMTP test succeeded at <strong>${new Date().toISOString()}</strong>.</p>`,
    });
    console.log("✅ Message sent");
    console.log(" Message ID:", info.messageId);
    console.log(" Accepted:", info.accepted);
    console.log(" Rejected:", info.rejected);
  } catch (e) {
    console.error("❌ Send failed:", e);
    process.exit(2);
  }

  console.log("============================================");
  console.log("🎉 SMTP TEST COMPLETE");
  console.log("============================================");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(99);
});
