import { useEffect, useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { contentfulClient, isContentfulEnabled } from "../config/contentful";
import { CheckCircle, AlertTriangle, Copy, RefreshCw } from "lucide-react";

interface TypeStatus {
  id: string;
  exists: boolean;
  error?: string;
  items?: number;
}

const EXPECTED_TYPES: string[] = [
  // Core
  "product",
  "pcBuild",
  "category",
  "pageContent",
  "faqItem",
  "serviceItem",
  "featureItem",
  "teamMember",
  "companyStats",
  "navigationMenu",
  "contactInformation",
  "legalPage",
  "pricingTier",
  "testimonial",
  "optionalExtra",
  // PC Builder
  "pcCase",
  "pcMotherboard",
  "pcCpu",
  "pcGpu",
  "pcRam",
  "pcStorage",
  "pcPsu",
  "pcCooling",
  // Settings (plural and legacy singular)
  "siteSettings",
  "siteSetting",
];

export function CmsDiagnostics() {
  const [statuses, setStatuses] = useState<TypeStatus[]>([]);
  const [running, setRunning] = useState(false);

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
    const results: TypeStatus[] = [];

    for (const id of EXPECTED_TYPES) {
      try {
        const res = await contentfulClient.getEntries({
          content_type: id,
          limit: 1,
        });
        results.push({ id, exists: true, items: res.items?.length || 0 });
      } catch (err: unknown) {
        // Mark missing or error; no throw
        const message = err instanceof Error ? err.message : String(err);
        results.push({ id, exists: false, error: message });
      }
    }

    setStatuses(results);
    setRunning(false);

    // Console summary for quick copy
    console.table(
      results.map((r) => ({
        type: r.id,
        exists: r.exists,
        items: r.items ?? 0,
        error: r.error ? r.error.slice(0, 120) : "",
      }))
    );
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
                <RefreshCw className="w-4 h-4" />
                Re-run
              </Button>
              <Button onClick={copyReport} variant="primary">
                <Copy className="w-4 h-4" />
                Copy report
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXPECTED_TYPES.map((id) => {
              const s = statuses.find((x) => x.id === id);
              const exists = !!s?.exists;
              return (
                <div
                  key={id}
                  className={`p-4 rounded-lg border ${
                    exists
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{id}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {exists
                          ? `${s?.items ?? 0} item(s) available`
                          : s?.error?.slice(0, 160) ||
                            "Missing or inaccessible"}
                      </div>
                    </div>
                    {exists ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
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
          </div>
        </Card>
      </div>
    </div>
  );
}
