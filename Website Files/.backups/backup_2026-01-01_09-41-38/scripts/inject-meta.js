// CI helper: fetch Contentful site settings and homepage content and inject meta tags into dist/index.html
// Exits successfully if Contentful credentials are not provided so deploy can continue.
const fs = require("fs/promises");

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const TOKEN =
  process.env.CONTENTFUL_DELIVERY_TOKEN || process.env.CONTENTFUL_ACCESS_TOKEN;
const ENV = process.env.CONTENTFUL_ENV || "master";
const HOME_SLUG = process.env.CI_HOME_SLUG || "home";
const DIST_PATH = "dist/index.html";

function ensureUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `https:${u}`;
}

function extractImageUrl(field, includes) {
  if (!field) return null;
  if (typeof field === "string") return ensureUrl(field);
  if (Array.isArray(field) && field.length)
    return extractImageUrl(field[0], includes);
  if (field.fields && field.fields.file && field.fields.file.url)
    return ensureUrl(field.fields.file.url);
  if (
    field.sys &&
    field.sys.type === "Link" &&
    field.sys.linkType === "Asset"
  ) {
    const assets = includes && includes.Asset ? includes.Asset : [];
    const asset = assets.find((a) => a.sys.id === field.sys.id);
    if (asset && asset.fields && asset.fields.file && asset.fields.file.url)
      return ensureUrl(asset.fields.file.url);
  }
  return null;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} - ${url}`);
  }
  return res.json();
}

async function fetchSettings() {
  const base = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/${ENV}/entries`;
  const tokenParam = `access_token=${TOKEN}`;

  const types = ["siteSettings", "siteSetting"];
  for (const ct of types) {
    try {
      const url = `${base}?content_type=${ct}&limit=1&include=2&${tokenParam}`;
      const json = await fetchJson(url);
      if (json && json.items && json.items.length > 0) {
        return json;
      }
    } catch (err) {
      console.warn(`Lookup for ${ct} failed:`, err.message || err);
    }
  }
  return null;
}

async function fetchHomePage(slug) {
  const base = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/${ENV}/entries`;
  const tokenParam = `access_token=${TOKEN}`;
  const url = `${base}?content_type=pageContent&fields.pageSlug=${encodeURIComponent(
    slug
  )}&limit=1&include=2&${tokenParam}`;
  try {
    return await fetchJson(url);
  } catch (err) {
    console.warn("Failed to fetch pageContent:", err.message || err);
    return null;
  }
}

function buildMetaTags({
  title,
  description,
  keywords,
  author,
  ogImage,
  twitterImage,
  pageUrl,
}) {
  const lines = [];
  if (title) lines.push(`<title>${escapeHtml(title)}</title>`);
  if (description)
    lines.push(
      `<meta name="description" content="${escapeHtml(description)}">`
    );
  if (keywords)
    lines.push(`<meta name="keywords" content="${escapeHtml(keywords)}">`);
  if (author)
    lines.push(`<meta name="author" content="${escapeHtml(author)}">`);

  // Open Graph
  if (title)
    lines.push(`<meta property="og:title" content="${escapeHtml(title)}">`);
  if (description)
    lines.push(
      `<meta property="og:description" content="${escapeHtml(description)}">`
    );
  lines.push(`<meta property="og:type" content="website">`);
  if (pageUrl)
    lines.push(`<meta property="og:url" content="${escapeHtml(pageUrl)}">`);
  if (ogImage)
    lines.push(`<meta property="og:image" content="${escapeHtml(ogImage)}">`);

  // Twitter
  if (ogImage)
    lines.push(`<meta name="twitter:card" content="summary_large_image">`);
  else lines.push(`<meta name="twitter:card" content="summary">`);
  if (title)
    lines.push(`<meta name="twitter:title" content="${escapeHtml(title)}">`);
  if (description)
    lines.push(
      `<meta name="twitter:description" content="${escapeHtml(description)}">`
    );
  if (twitterImage)
    lines.push(
      `<meta name="twitter:image" content="${escapeHtml(twitterImage)}">`
    );

  return lines.join("\n    ");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function run() {
  try {
    if (!SPACE_ID || !TOKEN) {
      console.warn(
        "Contentful credentials not provided. Skipping meta injection."
      );
      return;
    }

    const settingsJson = await fetchSettings();
    const pageJson = await fetchHomePage(HOME_SLUG);

    // Resolve fields
    const settingsItem =
      settingsJson && settingsJson.items && settingsJson.items[0];
    const settingsFields = settingsItem ? settingsItem.fields || {} : {};
    const settingsIncludes = settingsJson ? settingsJson.includes : {};

    const pageItem = pageJson && pageJson.items && pageJson.items[0];
    const pageFields = pageItem ? pageItem.fields || {} : {};
    const pageIncludes = pageJson ? pageJson.includes : {};

    const title =
      pageFields.pageTitle || settingsFields.siteName || "Vortex PCs";
    const description =
      pageFields.metaDescription ||
      settingsFields.metaDescription ||
      "Premium custom PC builds and components.";
    const keywords = (pageFields.seo && pageFields.seo.keywords) || undefined;
    const author = settingsFields.siteName || "Vortex PCs";

    // Determine images
    const ogImage = extractImageUrl(
      pageFields.ogImage ||
        pageFields.heroBackgroundImage ||
        settingsFields.ogImage ||
        settingsFields.logoUrl,
      pageIncludes || settingsIncludes
    );
    const twitterImage = extractImageUrl(
      pageFields.twitterImage || settingsFields.twitterImage || ogImage,
      pageIncludes || settingsIncludes
    );

    const pageUrl = process.env.SITE_URL || `https://www.vortexpcs.com`;

    const meta = buildMetaTags({
      title,
      description,
      keywords,
      author,
      ogImage,
      twitterImage,
      pageUrl,
    });

    // Read dist/index.html
    let html = await fs.readFile(DIST_PATH, "utf8");

    // Insert after opening <head> tag
    const headOpen = html.search(/<head[^>]*>/i);
    if (headOpen === -1) {
      console.warn(
        "No <head> tag found in dist/index.html - skipping injection"
      );
      return;
    }
    const headEnd = html.indexOf(">", headOpen) + 1;

    const injected = `\n    <!-- Injected meta from Contentful (CI) -->\n    ${meta}\n    <!-- End injected meta -->\n`;

    // If there is already an injected block, replace it
    if (html.includes("<!-- Injected meta from Contentful (CI) -->")) {
      html = html.replace(
        /<!-- Injected meta from Contentful \(CI\)[\s\S]*?<!-- End injected meta -->/m,
        injected
      );
    } else {
      html = html.slice(0, headEnd) + injected + html.slice(headEnd);
    }

    await fs.writeFile(DIST_PATH, html, "utf8");
    console.log("✅ Injected CMS meta into", DIST_PATH);
  } catch (err) {
    console.error(
      "Meta injection failed:",
      err && err.message ? err.message : err
    );
    // Do not fail the build - log and continue
  }
}

run();
