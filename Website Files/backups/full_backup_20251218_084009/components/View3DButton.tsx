import { useState, lazy, Suspense } from "react";
import { Button } from "./ui/button";
import { Box } from "lucide-react";
import { is3DEnabled } from "../utils/featureFlags";

interface View3DButtonProps {
  productName: string;
  caseType?: "mid-tower" | "full-tower" | "mini-itx" | "atx" | "e-atx";
  color?: string;
  className?: string;
}

// Lazy-load the heavy AR3DViewer only when needed
const LazyAR3DViewer = lazy(() =>
  import("./AR3DViewer").then((m) => ({ default: m.default }))
);

export function View3DButton({
  productName,
  caseType,
  color,
  className = "",
}: View3DButtonProps) {
  const enabled = is3DEnabled();
  const [showViewer, setShowViewer] = useState(false);

  if (!enabled) return null;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className={`border-sky-500/40 text-sky-400 hover:bg-sky-500/10 ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          setShowViewer(true);
        }}
      >
        <Box className="w-4 h-4 mr-2" />
        View in 3D
      </Button>

      <Suspense fallback={null}>
        {showViewer && (
          <LazyAR3DViewer
            productName={productName}
            caseType={caseType}
            color={color}
            isOpen={showViewer}
            onClose={() => setShowViewer(false)}
          />
        )}
      </Suspense>
    </>
  );
}
