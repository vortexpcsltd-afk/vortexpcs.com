export const config = { runtime: "edge" };

export default async function handler() {
  // Non-sensitive diagnostics — do NOT include any secret values
  const hasKey = !!process.env.OPENAI_API_KEY;
  const meta = {
    hasKey,
    hasBaseUrl: !!process.env.OPENAI_BASE_URL,
    vercelEnv: process.env.VERCEL_ENV || "unknown",
    projectId: process.env.VERCEL_PROJECT_ID || "unknown",
    projectName: process.env.VERCEL_PROJECT_NAME || "unknown",
    region: process.env.VERCEL_REGION || "unknown",
    url: process.env.VERCEL_URL || "unknown",
  } as const;

  return new Response(JSON.stringify(meta), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });
}
