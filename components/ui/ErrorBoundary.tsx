"use client";

import React, { Component, ReactNode } from "react";
import Button from "./Button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md mx-auto text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-jasper-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-10 h-10 text-jasper-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-dark_cyan-400 text-sm">
                An error occurred while rendering this component.
              </p>
            </div>

            {/* Error Details */}
            {this.state.error && (
              <div className="glass-card p-4 mb-6">
                <div className="text-left">
                  <label className="block text-sm font-medium text-white mb-2">
                    Error Message
                  </label>
                  <div className="p-3 rounded-lg bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20">
                    <code className="text-jasper-300 text-xs break-words">
                      {this.state.error.message}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                size="sm"
                icon={<RefreshCw className="h-4 w-4" />}
                className="flex-1 sm:flex-none"
              >
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                size="sm"
                icon={<Home className="h-4 w-4" />}
                className="flex-1 sm:flex-none"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


