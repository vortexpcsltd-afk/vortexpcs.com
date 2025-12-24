import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

// Version marker for diagnostics
const SMTP_TEST_VERSION = "smtp-live-test-v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ message: "Method not allowed", version: SMTP_TEST_VERSION });
  }

  const businessEmail =
    process.env.VITE_BUSINESS_EMAIL ||
    process.env.BUSINESS_EMAIL ||
    "info@vortexpcs.com";
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPortStr = process.env.SMTP_PORT || "465";
  const smtpSecureStr = process.env.SMTP_SECURE;
  const smtpPort = parseInt(smtpPortStr, 10);
  const secure =
    typeof smtpSecureStr === "string"
      ? smtpSecureStr === "true"
      : smtpPort === 465;

  const missing = [] as string[];
  if (!smtpHost) missing.push("SMTP_HOST");
  if (!smtpUser) missing.push("SMTP_USER");
  if (!smtpPass) missing.push("SMTP_PASS");

  if (missing.length) {
    return res.status(200).json({
      version: SMTP_TEST_VERSION,
      ok: false,
      stage: "env_check",
      missing,
      message: "SMTP configuration incomplete",
    });
  }

  let verifyOk = false;
  let sendOk = false;
  let sendInfo: unknown = null;
  let errorMessage: string | undefined;
  let errorStack: string | undefined;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure,
      auth: { user: smtpUser!, pass: smtpPass! },
      logger: true,
      debug: true,
    });

    // Verify connection
    try {
      await transporter.verify();
      verifyOk = true;
    } catch (e) {
      errorMessage = `Verify failed: ${
        e instanceof Error ? e.message : String(e)
      }`;
    }

    // Attempt a lightweight send regardless of verify result
    try {
      sendInfo = await transporter.sendMail({
        from: `Vortex SMTP Test <${smtpUser}>`,
        to: businessEmail,
        subject: "SMTP Live Test",
        text: "SMTP test endpoint executed successfully.",
      });
      sendOk = true;
    } catch (e) {
      if (!errorMessage)
        errorMessage = `Send failed: ${
          e instanceof Error ? e.message : String(e)
        }`;
      if (e instanceof Error) errorStack = e.stack;
    }
  } catch (fatal) {
    return res.status(200).json({
      version: SMTP_TEST_VERSION,
      ok: false,
      fatal: true,
      message: fatal instanceof Error ? fatal.message : String(fatal),
    });
  }

  return res.status(200).json({
    version: SMTP_TEST_VERSION,
    ok: verifyOk && sendOk,
    verifyOk,
    sendOk,
    sendInfo,
    errorMessage,
    errorStack: errorStack ? errorStack.split("\n").slice(0, 5) : undefined,
    host: smtpHost,
    port: smtpPort,
    secure,
  });
}
