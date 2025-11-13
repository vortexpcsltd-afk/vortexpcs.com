import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useNavigate } from "react-router-dom";

interface CTAInlineProps {
  className?: string;
}

export function CTAInline({ className }: CTAInlineProps) {
  const navigate = useNavigate();
  return (
    <Card
      className={`bg-white/5 backdrop-blur-xl border-white/10 p-6 md:p-8 text-center ${
        className || ""
      }`}
    >
      <h3 className="text-xl md:text-2xl font-semibold mb-2">
        Not sure what to pick?
      </h3>
      <p className="text-gray-300 mb-5">
        Tell us how you use your PC and budget—we’ll recommend a quiet,
        upgradeable build without the hype.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => navigate("/pc-finder")}
          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500"
        >
          PC Finder (60s)
        </Button>
        <Button
          onClick={() => navigate("/pc-builder")}
          variant="outline"
          className="border-white/20"
        >
          Start PC Builder
        </Button>
        <Button
          onClick={() => navigate("/contact")}
          variant="outline"
          className="border-white/20"
        >
          Talk to a Human
        </Button>
      </div>
    </Card>
  );
}
