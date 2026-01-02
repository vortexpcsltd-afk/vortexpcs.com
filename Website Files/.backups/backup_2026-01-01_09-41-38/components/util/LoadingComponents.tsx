import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import type { ReactNode, ButtonHTMLAttributes } from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({
  isLoading,
  message = "Loading...",
  fullScreen = false,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  const content = (
    <div className="flex items-center justify-center gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
      <span className="text-gray-300">{message}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

interface LoadingStateProps {
  isLoading: boolean;
  error: Error | null;
  children: ReactNode;
  loadingMessage?: string;
  onRetry?: () => void;
}

export function LoadingState({
  isLoading,
  error,
  children,
  loadingMessage = "Loading content...",
  onRetry,
}: LoadingStateProps) {
  if (error) {
    return (
      <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>
            {error.message || "An error occurred while loading content"}
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded transition-colors text-sm font-medium"
            >
              Retry
            </button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingOverlay isLoading={true} message={loadingMessage} />
      </div>
    );
  }

  return <>{children}</>;
}

interface ButtonLoadingProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function ButtonWithLoading({
  isLoading = false,
  loadingText = "Processing...",
  children,
  disabled,
  className = "",
  ...props
}: ButtonLoadingProps) {
  return (
    <button
      disabled={isLoading || disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all whitespace-nowrap ${
        isLoading || disabled ? "opacity-70 cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading ? loadingText : children}
    </button>
  );
}
