#!/usr/bin/env node
import "dotenv/config";
import contentfulManagement from "contentful-management";

function usage() {
  console.log(`Usage: node scripts/update-blog-post.mjs --slug <slug> [--publish] [--locale en-US]

Required env vars:
  CONTENTFUL_MANAGEMENT_TOKEN
  CONTENTFUL_SPACE_ID
  CONTENTFUL_ENVIRONMENT_ID (default: master)
`);
}

function arg(name, def) {
  const idx = process.argv.indexOf(name);
  if (
    idx !== -1 &&
    process.argv[idx + 1] &&
    !process.argv[idx + 1].startsWith("--")
  )
    return process.argv[idx + 1];
  if (process.argv.includes(name) && !def) return true;
  return def;
}

const slug = arg("--slug");
const publish = process.argv.includes("--publish");
const locale = arg("--locale", process.env.CONTENTFUL_LOCALE || "en-US");

if (!slug) {
  usage();
  process.exit(1);
}

const token = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const spaceId = process.env.CONTENTFUL_SPACE_ID;
const envId = process.env.CONTENTFUL_ENVIRONMENT_ID || "master";

const missing = [];
if (!token) missing.push("CONTENTFUL_MANAGEMENT_TOKEN");
if (!spaceId) missing.push("CONTENTFUL_SPACE_ID");
if (!envId) missing.push("CONTENTFUL_ENVIRONMENT_ID");
if (missing.length) {
  console.error("\u274c Missing env vars:", missing.join(", "));
  console.error(
    'Tip: add them to a local .env or run "vercel env pull .env --environment=development".'
  );
  usage();
  process.exit(1);
}

const client = contentfulManagement.createClient({ accessToken: token });

// Minimal helpers to build a Contentful Rich Text Document
const doc = (nodes) => ({ nodeType: "document", data: {}, content: nodes });
const text = (value, marks = []) => ({
  nodeType: "text",
  value,
  marks,
  data: {},
});
const p = (children) => ({
  nodeType: "paragraph",
  content: children,
  data: {},
});
const h = (level, children) => ({
  nodeType: `heading-${level}`,
  content: children,
  data: {},
});
const li = (children) => ({
  nodeType: "list-item",
  content: [p(children)],
  data: {},
});
const ul = (items) => ({
  nodeType: "unordered-list",
  content: items,
  data: {},
});
const ol = (items) => ({ nodeType: "ordered-list", content: items, data: {} });
const quote = (children) => ({
  nodeType: "blockquote",
  content: [p(children)],
  data: {},
});
const hr = () => ({ nodeType: "hr", content: [], data: {} });

// Curated content for the post (can be tweaked as needed)
const title =
  "The 2026 UK PC Buyer’s Playbook: Buy Smart, Avoid Traps, Future‑Proof Your Rig";
const excerpt =
  "2026 UK PC buying guide: smarter AI, fewer surprises. What to prioritise, what to avoid, and how to save money over 3 years.";

const richNodes = [
  h(2, [text("TL;DR (read this first)")]),
  ul([
    li([
      text(
        "Pick a trustworthy seller with fast support and real diagnostics. Local beats anonymous marketplaces for aftercare."
      ),
    ]),
    li([
      text(
        "Prefer on‑device AI; cloud AI can leak data and add ongoing costs."
      ),
    ]),
    li([
      text(
        "Spend on cooling and proper delivery. Stability beats tiny benchmark wins."
      ),
    ]),
    li([
      text(
        "Keep proof of provenance (serials, firmware, invoice). It protects warranty and resale."
      ),
    ]),
    li([
      text(
        "Decide your upgrade path (RAM/SSD/PSU/GPU space). That’s where long‑term value lives."
      ),
    ]),
  ]),
  h(2, [text("What changed for 2026")]),
  ul([
    li([
      text(
        "Smarter PCs, not just faster: AI co‑processors, firmware updates, background optimisations."
      ),
    ]),
    li([
      text(
        "On‑device vs cloud AI: On‑device = faster, private, one‑off cost. Cloud = more powerful, but sends data and may add fees."
      ),
    ]),
    li([
      text(
        "Prices shifted: The very cheapest boxes are often hot, loud, or fragile. Look at the 3‑year cost, not just the sticker."
      ),
    ]),
    li([
      text(
        "Repairability and standards: Upgradeable RAM/SSD, clean cable management, modern sockets = longer life and cheaper fixes."
      ),
    ]),
  ]),
  h(2, [text("Questions to ask before you buy")]),
  ul([
    li([
      text(
        "Do AI features run locally or in the cloud? If cloud, what data leaves the PC?"
      ),
    ]),
    li([
      text(
        "What’s covered by the warranty and support? Labour? Collections? Turnaround? Accidental damage?"
      ),
    ]),
    li([
      text(
        "Can you verify component provenance or firmware signing? Reduces risk of counterfeit parts or rogue firmware."
      ),
    ]),
    li([
      text(
        "How easy is it to upgrade later? RAM, storage, GPU clearance, spare PSU headroom."
      ),
    ]),
    li([
      text(
        "Who does real diagnostics if something goes wrong? Diagnostics beat RMA ping‑pong."
      ),
    ]),
  ]),
  h(2, [text("Three sensible buys that protect your money")]),
  h(3, [text("1) Choose the seller, not just the spec")]),
  p([
    text(
      "Pick an authorised retailer or a reputable local builder. Read support SLAs, not just reviews. Fast, human support is a feature."
    ),
  ]),
  h(3, [text("2) Bundle for how you use it")]),
  p([
    text(
      "Work? Gaming? Editing? Bundle to the use case. That’s how you avoid paying for the wrong “top spec”."
    ),
  ]),
  h(3, [text("3) Spend on cooling and delivery")]),
  p([
    text(
      "Quiet, cool systems last longer and crash less. Add quality fans and proper packaging/delivery—cheap courier damage is the hidden cost no one budgets for."
    ),
  ]),
  h(2, [text("Privacy and AI features — simple rules")]),
  ul([
    li([
      text(
        "Prefer offline/on‑device AI for image upscaling, noise reduction, and everyday tasks."
      ),
    ]),
    li([
      text(
        "If a feature needs the cloud, read the privacy controls and opt‑outs."
      ),
    ]),
    li([
      text(
        "Look for “human‑in‑the‑loop” controls before the system makes big changes without asking."
      ),
    ]),
  ]),
  h(2, [text("Warranties, repairs and returns — what really matters")]),
  ul([
    li([
      text(
        "Confirm what’s included: collection/return, labour, parts, accidental damage (usually extra)."
      ),
    ]),
    li([
      text("Keep serial photos and receipts. Claim approvals get much faster."),
    ]),
    li([
      text(
        "Short‑term paid support (or collect‑and‑return) can be cheaper than losing days to courier logistics."
      ),
    ]),
    li([
      text(
        "UK consumer protections help—but a responsive seller helps faster."
      ),
    ]),
  ]),
  h(2, [text("How to avoid being upsold")]),
  ul([
    li([
      text(
        "Ignore vague “AI inside” stickers unless the feature actually solves your problem."
      ),
    ]),
    li([
      text(
        "If a build is way cheaper than peers, check noise, thermals, and PSU quality."
      ),
    ]),
    li([
      text(
        "Ask for the total out‑the‑door price (with mandatory extras) and a 3‑year view (upgrades + repairs)."
      ),
    ]),
    li([
      text(
        "Compare a reliable mid‑tier build vs a cheap one that needs frequent fixes—the mid‑tier often wins."
      ),
    ]),
  ]),
  h(2, [text("The 3‑year cost view (why it saves you money)")]),
  ul([
    li([
      text(
        "A quiet, reliable PC you can upgrade once often beats replacing a cheap, hot, loud box."
      ),
    ]),
    li([
      text(
        "Parts with longer platform life (e.g., quality PSU, case airflow, modern sockets) pay for themselves."
      ),
    ]),
  ]),
  quote([
    text(
      "Buy for the way you work or play—then choose the quietest, coolest version of that build you can afford."
    ),
  ]),
  hr(),
  h(2, [text("Quick checklist (print this)")]),
  ul([
    li([text("Use case clear (work/gaming/editing)? Yes / No")]),
    li([text("Upgrade path chosen (RAM/SSD/GPU space)? Yes / No")]),
    li([text("On‑device AI where possible? Yes / No")]),
    li([text("Warranty covers labour and shipping? Yes / No")]),
    li([text("Proof of provenance kept (serials + receipt)? Yes / No")]),
    li([text("Acceptable noise levels and temps under load? Yes / No")]),
    li([
      text(
        "Trusted support channel (phone/email/chat, response times)? Yes / No"
      ),
    ]),
  ]),
];

(async () => {
  const space = await client.getSpace(spaceId);
  const env = await space.getEnvironment(envId);

  const entries = await env.getEntries({
    content_type: "blogPost",
    "fields.slug": slug,
    limit: 1,
  });
  if (!entries.items.length) {
    console.error(`No blogPost found for slug: ${slug}`);
    process.exit(1);
  }
  const entry = entries.items[0];
  const fields = entry.fields || {};

  // Update excerpt if field exists
  if (fields.excerpt) {
    fields.excerpt[locale] = excerpt;
  }

  // Prefer setting a Rich Text field if present
  const richFieldKey = [
    "contentRich",
    "content",
    "body",
    "article",
    "main",
  ].find((k) => fields[k] !== undefined);
  if (richFieldKey) {
    fields[richFieldKey][locale] = doc(richNodes);
  } else if (fields.contentHtml) {
    // Fallback to HTML field
    const html = `<h2>TL;DR (read this first)</h2><ul><li>Pick a trustworthy seller with fast support and real diagnostics. Local beats anonymous marketplaces for aftercare.</li><li>Prefer on‑device AI; cloud AI can leak data and add ongoing costs.</li><li>Spend on cooling and proper delivery. Stability beats tiny benchmark wins.</li><li>Keep proof of provenance (serials, firmware, invoice). It protects warranty and resale.</li><li>Decide your upgrade path (RAM/SSD/PSU/GPU space). That’s where long‑term value lives.</li></ul>`;
    fields.contentHtml[locale] = html;
  } else {
    console.warn(
      "No known content field found; set one of contentRich/content/body/article/main/contentHtml in your content type."
    );
  }

  entry.fields = fields;
  const updated = await entry.update();
  console.log("Entry updated:", updated.sys.id);

  if (publish) {
    const pub = await updated.publish();
    console.log("Entry published:", pub.sys.publishedVersion);
  } else {
    console.log("Draft saved. Re-run with --publish to publish.");
  }
})();
