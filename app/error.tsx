"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";
import { ArrowLeft, Home, RefreshCw, AlertTriangle, Bug } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleRetry = () => {
    reset();
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="mx-auto w-32 h-32 rounded-full bg-jasper-500/20 flex items-center justify-center mb-6">
            <Bug className="w-16 h-16 text-jasper-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Something went wrong
          </h1>
          <p className="text-dark_cyan-400 text-lg mb-8">
            We encountered an unexpected error. Don't worry, we're working on
            it.
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
            onClick={handleGoHome}
            variant="outline"
            icon={<Home className="h-4 w-4" />}
            className="flex-1 sm:flex-none"
          >
            Go Home
          </Button>
          <Button
            onClick={handleGoBack}
            variant="outline"
            icon={<ArrowLeft className="h-4 w-4" />}
            className="flex-1 sm:flex-none"
          >
            Go Back
          </Button>
        </div>

        {/* Error Details */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-jasper-500/20">
              <AlertTriangle className="h-5 w-5 text-jasper-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Error Details</h3>
          </div>

          <div className="text-left space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Error Message
              </label>
              <div className="p-3 rounded-lg bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20">
                <code className="text-jasper-300 text-sm break-words">
                  {error.message || "An unexpected error occurred"}
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
                  The error might be temporary. Click "Try Again" to retry.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-apricot-500/20">
                <Home className="h-5 w-5 text-apricot-400" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Go to Homepage</h4>
                <p className="text-sm text-dark_cyan-400">
                  Return to the main dashboard and try a different action
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
  );
}


