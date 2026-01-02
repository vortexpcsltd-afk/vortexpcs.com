import { useEffect, useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { contentfulClient, isContentfulEnabled } from "../config/contentful";
import { logger } from "../services/logger";
import { CheckCircle, AlertTriangle, Copy, RefreshCw } from "lucide-react";

interface TypeStatus {
  id: string;
  exists: boolean;
  optional?: boolean;
  error?: string;
  items?: number;
}

const EXPECTED_TYPES: Array<{ id: string; optional?: boolean }> = [
  // Core (some optional)
  { id: "product", optional: true },
  { id: "pcBuild", optional: true },
  // Note: category is hardcoded in services/cms.ts, not in Contentful
  { id: "pageContent" },
  { id: "faqItem", optional: true },
  { id: "serviceItem", optional: true },
  { id: "featureItem" },
  { id: "navigationMenu", optional: true },
  { id: "contactInformation", optional: true },
  { id: "legalPage", optional: true },
  { id: "pricingTier", optional: true },
  { id: "testimonial" },
  { id: "optionalExtra" },
  // PC Builder (required for PC Builder flows)
  { id: "pcCase" },
  { id: "pcMotherboard" },
  { id: "pcCpu" },
  { id: "pcGpu" },
  { id: "pcRam" },
  { id: "pcStorage" },
  { id: "pcPsu" },
  { id: "pcCooling" },
  // Settings
  { id: "siteSettings", optional: true },
];

export function CmsDiagnostics() {
  const [statuses, setStatuses] = useState<TypeStatus[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string>("");
  const [durationMs, setDurationMs] = useState<number>(0);
  const [flash, setFlash] = useState(false);

  const env = useMemo(
    () => ({
      space: import.meta.env.VITE_CONTENTFUL_SPACE_ID ? "present" : "missing",
      token: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN
        ? "present"
        : "missing",
      disableSettings:
        import.meta.env.VITE_CMS_DISABLE_SETTINGS === "true" ? "true" : "false",
      disablePages:
        import.meta.env.VITE_CMS_DISABLE_PAGES === "true" ? "true" : "false",
    }),
    []
  );

  const runChecks = async () => {
    if (!isContentfulEnabled || !contentfulClient) {
      setStatuses([]);
      return;
    }
    setRunning(true);
    const started = performance.now();
    const client = contentfulClient as NonNullable<typeof contentfulClient>;

    // Check all types in parallel for speed and better UX
    const results: TypeStatus[] = await Promise.all(
      EXPECTED_TYPES.map(async (t) => {
        const id = t.id;
        try {
          const res = await client.getEntries({
            content_type: id,
            limit: 1,
          });
          return {
            id,
            exists: true,
            optional: t.optional,
            items: res.items?.length || 0,
          } as TypeStatus;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            id,
            exists: false,
            optional: t.optional,
            error: message,
          } as TypeStatus;
        }
      })
    );

    setStatuses(results);
    setDurationMs(Math.max(0, Math.round(performance.now() - started)));
    setLastRun(new Date().toLocaleString());
    setRunning(false);
    // Trigger flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);

    // Log summary for quick copy
    logger.info("CMS diagnostics summary", {
      table: results.map((r) => ({
        type: r.id,
        exists: r.exists,
        items: r.items ?? 0,
        error: r.error ? r.error.slice(0, 120) : "",
      })),
    });
  };

  useEffect(() => {
    runChecks();
  }, []);

  const summary = useMemo(() => {
    const ok = statuses.filter((s) => s.exists).length;
    const missing = statuses.filter((s) => !s.exists).length;
    return { ok, missing };
  }, [statuses]);

  const copyReport = async () => {
    const lines = [
      `Contentful enabled: ${isContentfulEnabled}`,
      `VITE_CONTENTFUL_SPACE_ID: ${env.space}`,
      `VITE_CONTENTFUL_ACCESS_TOKEN: ${env.token}`,
      `VITE_CMS_DISABLE_SETTINGS: ${env.disableSettings}`,
      `VITE_CMS_DISABLE_PAGES: ${env.disablePages}`,
      "",
      "Content types:",
      ...statuses.map(
        (s) =>
          `${s.id}: ${s.exists ? "OK" : "MISSING"}${
            s.items !== undefined ? ` (items: ${s.items})` : ""
          }${s.error ? ` | ${s.error}` : ""}`
      ),
    ].join("\n");
    await navigator.clipboard.writeText(lines);
    alert("Diagnostics copied to clipboard.");
  };

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-2">CMS Diagnostics</h1>
        <p className="text-gray-400 mb-6">
          Quickly validate Contentful connectivity and expected content types.
          Use this to align your space setup and stop 400s.
        </p>

        <Card className="bg-white/5 border-white/10 p-5 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <Badge
              className={
                isContentfulEnabled
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              }
            >
              Delivery SDK: {isContentfulEnabled ? "Connected" : "Disabled"}
            </Badge>
            <Badge
              className={
                env.space === "present"
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              }
            >
              Space ID: {env.space}
            </Badge>
            <Badge
              className={
                env.token === "present"
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              }
            >
              Access Token: {env.token}
            </Badge>
            <Badge className="bg-white/10 text-white border-white/20">
              Disable Settings: {env.disableSettings}
            </Badge>
            <Badge className="bg-white/10 text-white border-white/20">
              Disable Pages: {env.disablePages}
            </Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" onClick={runChecks} disabled={running}>
                <RefreshCw
                  className={`w-4 h-4 ${running ? "animate-spin" : ""}`}
                />
                {running ? "Checking…" : "Re-run"}
              </Button>
              <Button onClick={copyReport} variant="primary">
                <Copy className="w-4 h-4" />
                Copy report
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 p-5">
          {running && (
            <div className="mb-4 text-xs text-gray-400">Running checks…</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXPECTED_TYPES.map((t) => {
              const s = statuses.find((x) => x.id === t.id);
              const exists = !!s?.exists;
              const optional = !!t.optional;
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-lg border transition-colors duration-300 ${
                    exists
                      ? "border-green-500/30 bg-green-500/5"
                      : optional
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  } ${flash && exists ? "success-flash" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        <span>{t.id}</span>
                        {optional && (
                          <Badge className="bg-white/10 text-white border-white/20">
                            optional
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {exists
                          ? `${s?.items ?? 0} item(s) available`
                          : optional
                          ? s?.error?.includes("unknownContentType")
                            ? "Not configured yet (optional)"
                            : s?.error?.slice(0, 160) ||
                              "Optional: Missing or inaccessible"
                          : s?.error?.slice(0, 160) ||
                            "Missing or inaccessible"}
                      </div>
                    </div>
                    {exists ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : optional ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-sm text-gray-400">
            Summary: <span className="text-green-300">{summary.ok} OK</span> ·{" "}
            <span className="text-red-300">{summary.missing} missing</span>
            <div className="mt-2 text-xs">
              Note: Amber items are optional content types. The app will fall
              back to mock/default content until you create them in Contentful.
            </div>
            {lastRun && (
              <div className="mt-2 text-xs text-gray-500">
                Last run: {lastRun} ({durationMs} ms)
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
