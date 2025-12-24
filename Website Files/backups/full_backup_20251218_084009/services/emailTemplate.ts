export type EmailTemplateOptions = {
  title?: string;
  preheader?: string;
  logoUrl?: string;
  accentFrom?: string; // tail color start hex
  accentTo?: string; // tail color end hex
  contentHtml: string; // already-sanitized HTML
  footerHtml?: string;
};

/**
 * Build a modern, responsive HTML email with inline CSS compatible with major clients.
 * Keep structure simple: single column, inline styles, table-ish layout avoided where possible.
 */
export function buildBrandedEmailHtml(opts: EmailTemplateOptions): string {
  const {
    title = "A message from Vortex PCs",
    preheader = "",
    logoUrl = "https://vortexpcs.com/vortexpcs-logo.png",
    accentFrom = "#0ea5e9",
    accentTo = "#2563eb",
    contentHtml,
    footerHtml = defaultFooterHtml(),
  } = opts;

  const safePre = escapeHtml(preheader || "");

  // Transform CTA anchor tags to more bulletproof button markup (table-based) for broader client support
  // We look for <a ...> elements that include a gradient background inline style and convert them.
  const transformedContent = transformCtaButtons(contentHtml);

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
      <style>
        /* Basic reset */
        body { margin:0; padding:0; background:#0b0b0c; color:#e5e7eb; }
        img { border:0; outline:none; text-decoration:none; max-width:100%; }
        a { color:#0ea5e9; text-decoration:none; }
        .wrapper { width:100%; background: #0b0b0c; padding:24px 12px; }
        .container { max-width:640px; margin:0 auto; background:#0f172a; border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden; }
        .header { background: linear-gradient(135deg, ${accentFrom}, ${accentTo}); text-align:center; padding:32px 24px; }
        .logo-box { display:inline-block; background: rgba(0,0,0,0.2); padding:12px 16px; border-radius:12px; }
        .title { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#fff; font-size:22px; font-weight:700; margin:16px 0 0; }
        .content { padding:28px 24px; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.7; color:#e5e7eb; }
        .card { background:#0b1220; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:20px; }
        .footer { background:#0b0b0c; padding:20px; text-align:center; font-size:12px; color:#9ca3af; border-top:1px solid rgba(255,255,255,0.06); }
        .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; }
        @media only screen and (max-width:600px){ .content{ padding:22px 16px; } .header{ padding:24px 16px; } }
      </style>
    </head>
    <body>
      <span class="preheader">${safePre}</span>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <span class="logo-box">
              <img src="${logoUrl}" alt="Vortex PCs" style="height:48px;"/>
            </span>
            <div class="title">${escapeHtml(title)}</div>
          </div>
          <div class="content">
            <div class="card">${transformedContent}</div>
          </div>
          <div class="footer">${footerHtml}</div>
        </div>
      </div>
    </body>
  </html>`;
}

function transformCtaButtons(html: string): string {
  // Detect anchor tags with linear-gradient and replace with a table-based button structure.
  // This is a simplified approach; preserves original href and text.
  return html.replace(
    /<a([^>]*style="[^"]*linear-gradient[^"]*"[^>]*)>([\s\S]*?)<\/a>/gi,
    (_m, attr, inner) => {
      // Extract href
      const hrefMatch = attr.match(/href="([^"]+)"/i);
      const href = hrefMatch ? hrefMatch[1] : "#";
      const text = inner.replace(/<[^>]+>/g, "").trim();
      // Bulletproof button using table + inline styles
      return `
    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:16px auto;">
      <tr>
        <td style="border-radius:8px; background:${
          extractFirstGradientColor(attr) || "#0ea5e9"
        }; padding:0;">
          <a href="${href}" target="_blank" rel="noopener noreferrer" 
             style="display:inline-block;padding:12px 22px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;line-height:18px;color:#ffffff;text-decoration:none;border-radius:8px;background:linear-gradient(90deg,#0ea5e9,#2563eb);">
            ${escapeHtml(text || "Learn More")}
          </a>
        </td>
      </tr>
    </table>`;
    }
  );
}

function extractFirstGradientColor(attr: string): string | null {
  const match = attr.match(/linear-gradient\([^,]+,\s*([^,\s)]+)/i);
  return match ? match[1] : null;
}

export function defaultFooterHtml(): string {
  const year = new Date().getFullYear();
  return `
    <div style="margin-bottom:6px; color:#cbd5e1;">
      © ${year} Vortex PCs Ltd
    </div>
    <div>info@vortexpcs.com • 01603 975440 • vortexpcs.com</div>
    <div style="margin-top:8px; color:#94a3b8;">You received this email because you are a Vortex PCs customer.</div>
    <div style="margin-top:4px; color:#64748b; font-size:11px;">To stop receiving marketing emails, update your preferences in your <a href="https://vortexpcs.com/member" style="color:#0ea5e9;">profile</a>.</div>
  `;
}

export function buildPlainTextFromHtml(html: string): string {
  // very basic strip; email providers often show HTML anyway; this is fallback
  return html
    .replace(/<\/(?:p|div|h\d|li)>/gi, "\n")
    .replace(/<br\s*\/?>(?=\s*)/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Wrap raw HTML in the branded template if the logo is not already present.
 * Prevents double-wrapping bulk/admin emails.
 */
export function ensureBranded(
  html: string,
  subject: string,
  opts: Partial<EmailTemplateOptions> = {}
): string {
  if (/vortexpcs-logo\.png/i.test(html)) return html; // already branded
  return buildBrandedEmailHtml({
    title: subject || opts.title || "Vortex PCs",
    preheader: opts.preheader || "",
    logoUrl: opts.logoUrl || "https://vortexpcs.com/vortexpcs-logo.png",
    accentFrom: opts.accentFrom,
    accentTo: opts.accentTo,
    contentHtml: html,
    footerHtml: opts.footerHtml,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
