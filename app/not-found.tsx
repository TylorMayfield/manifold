"use client";

import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";
import { ArrowLeft, Home, Search, AlertTriangle } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="mx-auto w-32 h-32 rounded-full bg-jasper-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-16 h-16 text-jasper-400" />
          </div>
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-dark_cyan-400 text-lg mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            onClick={handleGoHome}
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

        {/* Helpful Links */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            What can you do?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-tangerine-500/20">
                <Home className="h-5 w-5 text-tangerine-400" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Go to Homepage</h4>
                <p className="text-sm text-dark_cyan-400">
                  Return to the main dashboard to explore your projects
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-apricot-500/20">
                <Search className="h-5 w-5 text-apricot-400" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Check the URL</h4>
                <p className="text-sm text-dark_cyan-400">
                  Make sure the URL is spelled correctly
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Details */}
        <div className="mt-8 text-sm text-dark_cyan-500">
          <p>Error Code: 404</p>
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  );
}


