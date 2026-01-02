/**
 * RouteLoader - Suspense fallback component for lazy-loaded routes
 * Displays a smooth loading indicator while async components are loading
 */
export function RouteLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {/* Animated loading spinner */}
        <div className="relative w-20 h-20">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 border-r-blue-500 animate-spin" />

          {/* Middle pulsing ring */}
          <div className="absolute inset-2 rounded-full border-2 border-sky-500/30 animate-pulse" />

          {/* Inner dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-sky-400 to-blue-400 animate-pulse" />
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <p className="text-sky-300 font-medium tracking-wide">
            Loading page...
          </p>
          <p className="text-gray-400 text-sm">
            Please wait while we prepare your content
          </p>
        </div>

        {/* Loading dots animation */}
        <div className="flex items-center space-x-1.5">
          <div
            className="w-2 h-2 rounded-full bg-sky-500 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
