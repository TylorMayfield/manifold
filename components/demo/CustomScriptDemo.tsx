"use client";

import React, { useState } from "react";
import {
  Code,
  Play,
  FileText,
  Globe,
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  customScriptProvider,
  ScriptTemplate,
} from "../../lib/services/CustomScriptProvider";
import Button from "../ui/Button";

export default function CustomScriptDemo() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ScriptTemplate | null>(null);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const templates = customScriptProvider.getScriptTemplates();

  const handleExecuteTemplate = async (template: ScriptTemplate) => {
    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      // Simulate script execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock result based on template type
      let mockResult: any[] = [];

      switch (template.id) {
        case "api-fetch":
          mockResult = [
            {
              id: 1,
              title: "Sample Post 1",
              body: "This is sample content from API",
            },
            {
              id: 2,
              title: "Sample Post 2",
              body: "Another sample post from API",
            },
          ];
          break;
        case "csv-parser":
          mockResult = [
            { name: "John Doe", email: "john@example.com", age: 30 },
            { name: "Jane Smith", email: "jane@example.com", age: 25 },
          ];
          break;
        case "json-transform":
          mockResult = [
            {
              id: 1,
              name: "Transformed User 1",
              createdAt: new Date().toISOString(),
            },
            {
              id: 2,
              name: "Transformed User 2",
              createdAt: new Date().toISOString(),
            },
          ];
          break;
        case "web-scraper":
          mockResult = [
            {
              url: "https://example.com",
              title: "Example Domain",
              scrapedAt: new Date().toISOString(),
            },
          ];
          break;
        default:
          mockResult = [{ message: "Script executed successfully" }];
      }

      setResult(mockResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Script execution failed");
    } finally {
      setExecuting(false);
    }
  };

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case "javascript":
        return <Code className="h-4 w-4" />;
      case "python":
        return <FileText className="h-4 w-4" />;
      case "bash":
        return <Zap className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Custom Script Provider Demo
        </h2>
        <p className="text-white/70">
          Create and execute custom scripts to fetch data from various sources
        </p>
      </div>

      {/* Template Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="card-interactive rounded-xl p-6 group"
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-lg btn-primary">
                {getLanguageIcon(template.language)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-white/70 mb-4">
                  {template.description}
                </p>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                    {template.language}
                  </span>
                  <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                    {template.example}
                  </span>
                </div>
                <Button
                  onClick={() => handleExecuteTemplate(template)}
                  disabled={executing}
                  loading={executing && selectedTemplate?.id === template.id}
                  icon={<Play className="h-4 w-4" />}
                  className="button-interactive w-full"
                >
                  {executing && selectedTemplate?.id === template.id
                    ? "Executing..."
                    : "Execute Script"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Execution Results */}
      {(result || error) && (
        <div className="card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Execution Results
          </h3>

          {error ? (
            <div className="flex items-center space-x-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-green-300 text-sm">
                  Script executed successfully! Found {result.length} records.
                </span>
              </div>

              <div className="bg-black/20 rounded-lg p-4 max-h-64 overflow-auto">
                <pre className="text-sm text-white/80">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Features List */}
      <div className="card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Custom Script Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Code className="h-5 w-5 text-blue-400" />
              <span className="text-white/80">Multiple Languages</span>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-green-400" />
              <span className="text-white/80">Pre-built Templates</span>
            </div>
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-purple-400" />
              <span className="text-white/80">API Integration</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-orange-400" />
              <span className="text-white/80">Data Processing</span>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="text-white/80">Scheduled Execution</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-white/80">Syntax Validation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
