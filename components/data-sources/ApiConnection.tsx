"use client";

import React, { useState } from "react";
import {
  Globe,
  Play,
  TestTube,
  Settings,
  Key,
  Lock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { logger } from "../../lib/utils/logger";
import { Project, DataProvider } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";

interface ApiConnectionProps {
  project: Project;
  onDataSourceCreated?: (dataSource: DataProvider) => void;
  embedded?: boolean;
}

interface ApiConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: Record<string, string>;
  params: Record<string, string>;
  body?: string;
  authType: "none" | "bearer" | "basic" | "api_key";
  authConfig: {
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  schedule?: string;
}

export default function ApiConnection({
  project,
  onDataSourceCreated,
  embedded = false,
}: ApiConnectionProps) {
  const [showModal, setShowModal] = useState(!embedded);
  const [dataSourceName, setDataSourceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    status?: number;
  } | null>(null);

  const [config, setConfig] = useState<ApiConfig>({
    url: "",
    method: "GET",
    headers: {},
    params: {},
    authType: "none",
    authConfig: {},
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const handleConfigChange = (field: keyof ApiConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAuthConfigChange = (field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      authConfig: {
        ...prev.authConfig,
        [field]: value,
      },
    }));
  };

  const addHeader = () => {
    setConfig((prev) => ({
      ...prev,
      headers: {
        ...prev.headers,
        "": "",
      },
    }));
  };

  const updateHeader = (index: number, key: string, value: string) => {
    const headers = Object.entries(config.headers);
    headers[index] = [key, value];
    setConfig((prev) => ({
      ...prev,
      headers: Object.fromEntries(headers),
    }));
  };

  const removeHeader = (index: number) => {
    const headers = Object.entries(config.headers);
    headers.splice(index, 1);
    setConfig((prev) => ({
      ...prev,
      headers: Object.fromEntries(headers),
    }));
  };

  const addParam = () => {
    setConfig((prev) => ({
      ...prev,
      params: {
        ...prev.params,
        "": "",
      },
    }));
  };

  const updateParam = (index: number, key: string, value: string) => {
    const params = Object.entries(config.params);
    params[index] = [key, value];
    setConfig((prev) => ({
      ...prev,
      params: Object.fromEntries(params),
    }));
  };

  const removeParam = (index: number) => {
    const params = Object.entries(config.params);
    params.splice(index, 1);
    setConfig((prev) => ({
      ...prev,
      params: Object.fromEntries(params),
    }));
  };

  const testConnection = async () => {
    if (!config.url.trim()) {
      setTestResult({
        success: false,
        message: "Please enter a valid URL",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Build the request URL with query parameters
      const url = new URL(config.url);
      Object.entries(config.params).forEach(([key, value]) => {
        if (key.trim() && value.trim()) {
          url.searchParams.append(key, value);
        }
      });

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...config.headers,
      };

      // Add authentication headers
      if (config.authType === "bearer" && config.authConfig.token) {
        headers.Authorization = `Bearer ${config.authConfig.token}`;
      } else if (
        config.authType === "basic" &&
        config.authConfig.username &&
        config.authConfig.password
      ) {
        const credentials = btoa(
          `${config.authConfig.username}:${config.authConfig.password}`
        );
        headers.Authorization = `Basic ${credentials}`;
      } else if (
        config.authType === "api_key" &&
        config.authConfig.apiKey &&
        config.authConfig.apiKeyHeader
      ) {
        headers[config.authConfig.apiKeyHeader] = config.authConfig.apiKey;
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method: config.method,
        headers,
      };

      // Add body for POST/PUT requests
      if (config.method === "POST" || config.method === "PUT") {
        if (config.body?.trim()) {
          requestOptions.body = config.body;
        }
      }

      // Make the request
      const response = await fetch(url.toString(), requestOptions);
      const data = await response.json();

      setTestResult({
        success: response.ok,
        message: response.ok
          ? `Connection successful! Status: ${response.status}`
          : `Request failed: ${response.status} ${response.statusText}`,
        data: data,
        status: response.status,
      });

      logger.info(
        "API connection test completed",
        "data-processing",
        {
          url: config.url,
          method: config.method,
          status: response.status,
          success: response.ok,
        },
        "ApiConnection"
      );
    } catch (error) {
      console.error("API test error:", error);
      setTestResult({
        success: false,
        message: `Connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });

      logger.error(
        "API connection test failed",
        "data-processing",
        { error, url: config.url },
        "ApiConnection"
      );
    } finally {
      setTesting(false);
    }
  };

  const createDataSource = async () => {
    if (!dataSourceName.trim()) {
      alert("Please enter a data source name");
      return;
    }

    if (!config.url.trim()) {
      alert("Please enter a valid API URL");
      return;
    }

    setLoading(true);

    try {
      const dataSource: DataProvider = {
        id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId: project.id,
        name: dataSourceName.trim(),
        type: "api",
        config: {
          apiUrl: config.url,
          apiMethod: config.method,
          apiHeaders: config.headers,
          apiParams: config.params,
          apiAuthType: config.authType,
          apiAuthConfig: config.authConfig,
          apiBody: config.body,
        },
        status: "idle",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (onDataSourceCreated) {
        onDataSourceCreated(dataSource);
      }

      setShowModal(false);
      setDataSourceName("");
      setConfig({
        url: "",
        method: "GET",
        headers: {},
        params: {},
        authType: "none",
        authConfig: {},
      });

      logger.success(
        "API data source created successfully",
        "data-processing",
        {
          dataSourceId: dataSource.id,
          dataSourceName: dataSource.name,
          apiUrl: config.url,
        },
        "ApiConnection"
      );
    } catch (error) {
      console.error("Failed to create API data source:", error);
      logger.error(
        "Failed to create API data source",
        "data-processing",
        { error },
        "ApiConnection"
      );
    } finally {
      setLoading(false);
    }
  };

  if (embedded) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
            <Globe className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-white font-medium mb-2">API Endpoint</h3>
          <p className="text-white/60 text-sm">
            Connect to external APIs and import data automatically
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Data Source Name"
            value={dataSourceName}
            onChange={(e) => setDataSourceName(e.target.value)}
            placeholder="e.g., Customer API, Product Catalog API"
          />

          <Input
            label="API URL"
            value={config.url}
            onChange={(e) => handleConfigChange("url", e.target.value)}
            placeholder="https://api.example.com/data"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Method
              </label>
              <select
                value={config.method}
                onChange={(e) => handleConfigChange("method", e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Authentication
              </label>
              <select
                value={config.authType}
                onChange={(e) => handleConfigChange("authType", e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="api_key">API Key</option>
              </select>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-4 rounded-lg border ${
                testResult.success
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <span
                  className={`font-medium ${
                    testResult.success ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {testResult.message}
                </span>
              </div>
              {testResult.data && (
                <div className="mt-3">
                  <details className="text-sm text-white/70">
                    <summary className="cursor-pointer hover:text-white">
                      View Response Data
                    </summary>
                    <pre className="mt-2 p-3 bg-black/20 rounded text-xs overflow-x-auto">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={testConnection}
              variant="outline"
              loading={testing}
              disabled={testing || !config.url.trim()}
              className="flex-1"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            <Button
              onClick={createDataSource}
              variant="primary"
              loading={loading}
              disabled={loading || !dataSourceName.trim() || !config.url.trim()}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Create Data Source
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
          <Globe className="h-8 w-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">API Endpoint</h3>
        <p className="text-white/60 mb-6">
          Connect to external APIs and import data automatically
        </p>
        <Button
          onClick={() => setShowModal(true)}
          variant="primary"
          icon={<Globe className="h-5 w-5" />}
        >
          Configure API Connection
        </Button>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="API Endpoint Configuration"
        size="xl"
      >
        <div className="space-y-6">
          <Input
            label="Data Source Name"
            value={dataSourceName}
            onChange={(e) => setDataSourceName(e.target.value)}
            placeholder="e.g., Customer API, Product Catalog API"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="API URL"
              value={config.url}
              onChange={(e) => handleConfigChange("url", e.target.value)}
              placeholder="https://api.example.com/data"
              required
            />

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                HTTP Method
              </label>
              <select
                value={config.method}
                onChange={(e) => handleConfigChange("method", e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          {/* Authentication Section */}
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center">
              <Lock className="h-5 w-5 mr-2 text-blue-400" />
              Authentication
            </h4>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Authentication Type
              </label>
              <select
                value={config.authType}
                onChange={(e) => handleConfigChange("authType", e.target.value)}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Authentication</option>
                <option value="api_key">API Key</option>
              </select>
            </div>

            {config.authType === "bearer" && (
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Bearer Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={config.authConfig.token || ""}
                    onChange={(e) =>
                      handleAuthConfigChange("token", e.target.value)
                    }
                    placeholder="Enter your bearer token"
                    className="w-full p-3 pr-10 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {config.authType === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Username"
                  value={config.authConfig.username || ""}
                  onChange={(e) =>
                    handleAuthConfigChange("username", e.target.value)
                  }
                  placeholder="Enter username"
                />
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={config.authConfig.password || ""}
                      onChange={(e) =>
                        handleAuthConfigChange("password", e.target.value)
                      }
                      placeholder="Enter password"
                      className="w-full p-3 pr-10 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {config.authType === "api_key" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="API Key"
                  value={config.authConfig.apiKey || ""}
                  onChange={(e) =>
                    handleAuthConfigChange("apiKey", e.target.value)
                  }
                  placeholder="Enter your API key"
                />
                <Input
                  label="Header Name"
                  value={config.authConfig.apiKeyHeader || "X-API-Key"}
                  onChange={(e) =>
                    handleAuthConfigChange("apiKeyHeader", e.target.value)
                  }
                  placeholder="X-API-Key"
                />
              </div>
            )}
          </div>

          {/* Headers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-400" />
                Custom Headers
              </h4>
              <Button onClick={addHeader} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Header
              </Button>
            </div>

            {Object.entries(config.headers).map(([key, value], index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => updateHeader(index, e.target.value, value)}
                    placeholder="Header name"
                    className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-6">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateHeader(index, key, e.target.value)}
                    placeholder="Header value"
                    className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => removeHeader(index)}
                    className="w-full p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Query Parameters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium flex items-center">
                <Key className="h-5 w-5 mr-2 text-blue-400" />
                Query Parameters
              </h4>
              <Button onClick={addParam} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Parameter
              </Button>
            </div>

            {Object.entries(config.params).map(([key, value], index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => updateParam(index, e.target.value, value)}
                    placeholder="Parameter name"
                    className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-6">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateParam(index, key, e.target.value)}
                    placeholder="Parameter value"
                    className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => removeParam(index)}
                    className="w-full p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Request Body Section (for POST/PUT) */}
          {(config.method === "POST" || config.method === "PUT") && (
            <div className="space-y-4">
              <h4 className="text-white font-medium">Request Body</h4>
              <textarea
                value={config.body || ""}
                onChange={(e) => handleConfigChange("body", e.target.value)}
                placeholder='Enter JSON body (e.g., {"key": "value"})'
                rows={4}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-4 rounded-lg border ${
                testResult.success
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <span
                  className={`font-medium ${
                    testResult.success ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {testResult.message}
                </span>
              </div>
              {testResult.data && (
                <div className="mt-3">
                  <details className="text-sm text-white/70">
                    <summary className="cursor-pointer hover:text-white">
                      View Response Data
                    </summary>
                    <pre className="mt-2 p-3 bg-black/20 rounded text-xs overflow-x-auto">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={testConnection}
              variant="outline"
              loading={testing}
              disabled={testing}
              className="flex-1"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            <Button
              onClick={createDataSource}
              variant="primary"
              loading={loading}
              disabled={loading || !dataSourceName.trim() || !config.url.trim()}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Create Data Source
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
