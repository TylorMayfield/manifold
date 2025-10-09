"use client";

import { useEffect } from "react";
import Button from "../components/ui/Button";
import { Home, RefreshCw, AlertTriangle, Bug } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error);
  }, [error]);

  const handleRetry = () => {
    reset();
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <html>
      <body>
        <div className="min-h-screen gradient-bg flex items-center justify-center">
          <div className="max-w-2xl mx-auto p-8 text-center">
            {/* Error Icon */}
            <div className="mb-8">
              <div className="mx-auto w-32 h-32 rounded-full bg-jasper-500/20 flex items-center justify-center mb-6">
                <Bug className="w-16 h-16 text-jasper-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Application Error
              </h1>
              <p className="text-dark_cyan-400 text-lg mb-8">
                A critical error occurred in the application. Please try
                refreshing the page.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                onClick={handleRetry}
                icon={<RefreshCw className="h-4 w-4" />}
                className="flex-1 sm:flex-none"
              >
                Try Again
              </Button>
              <Button
                onClick={handleReload}
                variant="outline"
                icon={<RefreshCw className="h-4 w-4" />}
                className="flex-1 sm:flex-none"
              >
                Reload Page
              </Button>
            </div>

            {/* Error Details */}
            <div className="glass-card p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-jasper-500/20">
                  <AlertTriangle className="h-5 w-5 text-jasper-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Error Details
                </h3>
              </div>

              <div className="text-left space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Error Message
                  </label>
                  <div className="p-3 rounded-lg bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20">
                    <code className="text-jasper-300 text-sm break-words">
                      {error.message || "A critical application error occurred"}
                    </code>
                  </div>
                </div>

                {error.digest && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Error ID
                    </label>
                    <div className="p-3 rounded-lg bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20">
                      <code className="text-dark_cyan-400 text-sm font-mono">
                        {error.digest}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Helpful Information */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                What can you do?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-tangerine-500/20">
                    <RefreshCw className="h-5 w-5 text-tangerine-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Try Again</h4>
                    <p className="text-sm text-dark_cyan-400">
                      Click "Try Again" to attempt to recover from the error
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-apricot-500/20">
                    <RefreshCw className="h-5 w-5 text-apricot-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Reload Page</h4>
                    <p className="text-sm text-dark_cyan-400">
                      Refresh the entire page to reset the application state
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Information */}
            <div className="mt-8 text-sm text-dark_cyan-500">
              <p>
                If this error persists, please contact support with the Error ID
                above.
              </p>
              <p className="mt-1">We apologize for the inconvenience.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}






