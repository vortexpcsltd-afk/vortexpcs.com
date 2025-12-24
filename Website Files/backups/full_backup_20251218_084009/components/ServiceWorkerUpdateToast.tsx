import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { RefreshCw } from "lucide-react";

export default function ServiceWorkerUpdateToast() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ waiting?: ServiceWorker }>;
      if (ce.detail?.waiting) {
        setWaiting(ce.detail.waiting);
        setVisible(true);
      }
    };
    // Cast to a basic event function to satisfy TS without relying on DOM lib unions
    const listener = handler as unknown as (evt: Event) => void;
    window.addEventListener("sw-update", listener);
    return () => window.removeEventListener("sw-update", listener);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-sky-400" />
          <div>
            <p className="text-white font-medium">New version available</p>
            <p className="text-gray-400 text-sm">
              Refresh to update to the latest build.
            </p>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <Button
              onClick={() => setVisible(false)}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Later
            </Button>
            <Button
              onClick={() => {
                // Tell the waiting SW to skip waiting, then reload
                waiting?.postMessage({ type: "SKIP_WAITING" });
                setTimeout(() => window.location.reload(), 300);
              }}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
