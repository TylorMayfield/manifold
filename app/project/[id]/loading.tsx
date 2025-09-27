"use client";

import { Database, Zap, Network, Code } from "lucide-react";

export default function ProjectLoading() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="max-w-md mx-auto p-8 text-center">
        {/* Loading Animation */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 rounded-full bg-tangerine-500/20 flex items-center justify-center mb-6">
            <div className="w-12 h-12 border-4 border-tangerine-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Loading Project...
          </h1>
          <p className="text-dark_cyan-400">
            Please wait while we load your project data
          </p>
        </div>

        {/* Loading Steps */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Loading Project Components
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-tangerine-500/20">
                <Database className="h-5 w-5 text-tangerine-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">Data Sources</span>
                  <span className="text-tangerine-400 text-sm">Loading...</span>
                </div>
                <div className="w-full bg-dark_cyan-300 bg-opacity-20 rounded-full h-2">
                  <div
                    className="bg-tangerine-400 h-2 rounded-full animate-pulse"
                    style={{ width: "80%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-apricot-500/20">
                <Zap className="h-5 w-5 text-apricot-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">Workflows</span>
                  <span className="text-apricot-400 text-sm">Loading...</span>
                </div>
                <div className="w-full bg-dark_cyan-300 bg-opacity-20 rounded-full h-2">
                  <div
                    className="bg-apricot-400 h-2 rounded-full animate-pulse"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-jasper-500/20">
                <Network className="h-5 w-5 text-jasper-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">Data Models</span>
                  <span className="text-jasper-400 text-sm">Loading...</span>
                </div>
                <div className="w-full bg-dark_cyan-300 bg-opacity-20 rounded-full h-2">
                  <div
                    className="bg-jasper-400 h-2 rounded-full animate-pulse"
                    style={{ width: "50%" }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-dark_cyan-500/20">
                <Code className="h-5 w-5 text-dark_cyan-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">SQL Editor</span>
                  <span className="text-dark_cyan-400 text-sm">Loading...</span>
                </div>
                <div className="w-full bg-dark_cyan-300 bg-opacity-20 rounded-full h-2">
                  <div
                    className="bg-dark_cyan-400 h-2 rounded-full animate-pulse"
                    style={{ width: "70%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Tips */}
        <div className="mt-8 text-sm text-dark_cyan-500">
          <p>Loading project data and configurations...</p>
        </div>
      </div>
    </div>
  );
}

