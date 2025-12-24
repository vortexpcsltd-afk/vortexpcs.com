import React, { Component, ReactNode } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { errorLogger } from "../services/errorLogger";
import { logger } from "../services/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  isolate?: boolean; // If true, only shows error for this component, not full page
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showStackTrace: boolean;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStackTrace: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to logger service which handles both development and production
    logger.error("ErrorBoundary caught an error", error, {
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service
    errorLogger.log(error, {
      componentStack: errorInfo.componentStack || undefined,
      severity: this.props.isolate ? "medium" : "critical",
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showStackTrace: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  toggleStackTrace = () => {
    this.setState((prev) => ({ showStackTrace: !prev.showStackTrace }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showStackTrace } = this.state;
      const { isolate = false, showDetails = import.meta.env.DEV } = this.props;

      // Isolated error (component-level)
      if (isolate) {
        return (
          <Card className="bg-red-500/10 border-red-500/30 backdrop-blur-xl p-6 my-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-red-300 mb-2">
                  Component Error
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  This component encountered an error and couldn't load
                  properly.
                </p>
                {showDetails && error && (
                  <Alert className="bg-black/20 border-red-500/30 mb-4">
                    <AlertDescription className="text-xs text-red-200 font-mono">
                      {error.toString()}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={this.handleReset}
                  size="sm"
                  variant="outline"
                  className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        );
      }

      // Full-page error
      return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Card className="bg-white/5 border-red-500/30 backdrop-blur-xl p-8 md:p-12">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-400" />
                </div>
              </div>

              {/* Error Message */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-300 text-lg mb-6">
                  We encountered an unexpected error. Don't worry, our team has
                  been notified and we're working on it.
                </p>
              </div>

              {/* Error Details (Development Only) */}
              {showDetails && error && (
                <div className="mb-6">
                  <button
                    onClick={this.toggleStackTrace}
                    className="flex items-center gap-2 text-red-300 hover:text-red-200 mb-3 transition-colors"
                  >
                    <Bug className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Technical Details (Dev Mode)
                    </span>
                    {showStackTrace ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showStackTrace && (
                    <div className="space-y-3">
                      <Alert className="bg-black/40 border-red-500/30">
                        <AlertDescription className="text-xs text-red-200 font-mono break-all">
                          <strong className="block mb-2">Error:</strong>
                          {error.toString()}
                        </AlertDescription>
                      </Alert>

                      {errorInfo && errorInfo.componentStack && (
                        <Alert className="bg-black/40 border-red-500/30 max-h-48 overflow-y-auto">
                          <AlertDescription className="text-xs text-red-200 font-mono whitespace-pre-wrap">
                            <strong className="block mb-2">
                              Component Stack:
                            </strong>
                            {errorInfo.componentStack}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-gray-400 text-sm">
                  If this problem persists, please{" "}
                  <a
                    href="/contact"
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    contact our support team
                  </a>
                  .
                </p>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * PageErrorBoundary - Full page error boundary for route-level errors
 */
export const PageErrorBoundary: React.FC<{
  children: ReactNode;
  pageName?: string;
}> = ({ children, pageName }) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error(`Error in ${pageName || "page"}`, {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * ComponentErrorBoundary - Component-level error boundary that shows inline error
 */
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  componentName?: string;
}> = ({ children, componentName }) => {
  return (
    <ErrorBoundary
      isolate={true}
      onError={(error, errorInfo) => {
        logger.error(`Error in ${componentName || "component"}`, {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * AsyncErrorBoundary - For async operations and data fetching
 */
export const AsyncErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  const defaultFallback = (
    <Card className="bg-yellow-500/10 border-yellow-500/30 backdrop-blur-xl p-6 my-4">
      <div className="flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-yellow-300 mb-2">
            Loading Error
          </h3>
          <p className="text-gray-300 text-sm">
            We couldn't load this content. Please try refreshing the page.
          </p>
        </div>
      </div>
    </Card>
  );

  return (
    <ErrorBoundary isolate={true} fallback={fallback || defaultFallback}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
