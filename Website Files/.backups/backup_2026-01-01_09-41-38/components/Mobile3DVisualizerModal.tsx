import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertCircle, Smartphone, Cpu, Zap } from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";

interface Mobile3DVisualizerModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

/**
 * Modal that appears when users access the 3D visualiser on mobile devices.
 * Explains the limitation and directs users to PC Finder or PC Builder instead.
 */
export function Mobile3DVisualizerModal({
  isOpen,
  onClose,
}: Mobile3DVisualizerModalProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showModal, setShowModal] = useState(false);

  // Show modal only on mobile and when isOpen prop is true
  useEffect(() => {
    setShowModal(isOpen && isMobile);
  }, [isOpen, isMobile]);

  const handleNavigatePCFinder = () => {
    setShowModal(false);
    navigate("/pc-finder");
  };

  const handleNavigatePCBuilder = () => {
    setShowModal(false);
    navigate("/pc-builder");
  };

  const handleClose = () => {
    setShowModal(false);
    onClose?.();
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-md border-sky-500/30 bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <Smartphone className="h-5 w-5 text-sky-400" />
          </div>
          <DialogTitle className="text-xl">
            3D Visualiser Not Available on Mobile
          </DialogTitle>
          <DialogDescription className="text-gray-300 pt-2">
            The interactive 3D PC visualiser requires a larger screen to work
            properly. Your device doesn't have enough space for the full 3D
            experience.
          </DialogDescription>
        </DialogHeader>

        {/* Explanation section */}
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-3">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-sky-400">Why?</span> The 3D
              visualiser needs a desktop or tablet to display your PC build with
              full interactive controls.
            </p>

            {/* Alternative options */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3 items-start">
                <Cpu className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">PC Builder</p>
                  <p className="text-xs text-gray-400">
                    Assemble your PC with detailed component selection and
                    real-time specifications
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Zap className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">PC Finder</p>
                  <p className="text-xs text-gray-400">
                    Get personalised PC recommendations based on your budget and
                    needs
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pro tip */}
          <div className="text-xs text-gray-400 bg-blue-500/5 border border-blue-500/20 rounded p-3">
            💡 <span className="font-semibold">Pro Tip:</span> Rotate your
            device to landscape for a better experience with any configurator.
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleNavigatePCBuilder}
            className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold h-10 rounded-lg transition-all duration-300"
          >
            Go to PC Builder
          </Button>

          <Button
            onClick={handleNavigatePCFinder}
            variant="outline"
            className="w-full border-sky-500/30 hover:bg-sky-500/10 text-sky-400 font-semibold h-10 rounded-lg transition-all duration-300"
          >
            Go to PC Finder
          </Button>

          <Button
            onClick={handleClose}
            variant="ghost"
            className="w-full text-gray-400 hover:text-white hover:bg-white/5 h-10 rounded-lg transition-all duration-300"
          >
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
