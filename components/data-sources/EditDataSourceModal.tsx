"use client";

import React, { useState, useEffect } from "react";
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
  Eye,
  EyeOff,
  X,
  Plus,
  FileText,
  Database,
  Code,
} from "lucide-react";
import { logger } from "../../lib/utils/logger";
import { DataSource } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";

interface EditDataSourceModalProps {
  dataSource: DataSource;
  isOpen: boolean;
  onClose: () => void;
  onDataSourceUpdated: (dataSource: DataSource) => void;
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

// Union type for all possible config types
type DataSourceConfig = ApiConfig & {
  // MySQL config
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  // File config
  filePath?: string;
  fileType?: "csv" | "json";
  // Custom script config
  script?: string;
  language?: string;
  // SQL dump config
  sqlDialect?: "mysql" | "postgresql" | "sqlite";
  sqlFilePath?: string;
};

export default function EditDataSourceModal({
  dataSource,
  isOpen,
  onClose,
  onDataSourceUpdated,
}: EditDataSourceModalProps) {
  const [dataSourceName, setDataSourceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
    status?: number;
  } | null>(null);

  const [config, setConfig] = useState<DataSourceConfig>({
    url: "",
    method: "GET",
    headers: {},
    params: {},
    authType: "none",
    authConfig: {},
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Initialize form with existing data source data
  useEffect(() => {
    if (dataSource && isOpen) {
      setDataSourceName(dataSource.name);

      // Initialize config based on data source type
      if (dataSource.type === "api" && dataSource.config) {
        setConfig({
          url: dataSource.config.apiUrl || "",
          method: dataSource.config.apiMethod || "GET",
          headers: dataSource.config.apiHeaders || {},
          params: dataSource.config.apiParams || {},
          authType: dataSource.config.apiAuthType || "none",
          authConfig: dataSource.config.apiAuthConfig || {},
          body: dataSource.config.apiBody,
        });
      } else {
        // For non-API types, initialize with empty config
        setConfig({
          url: "",
          method: "GET",
          headers: {},
          params: {},
          authType: "none",
          authConfig: {},
        });
      }
    }
  }, [dataSource, isOpen]);

  const handleConfigChange = (field: keyof DataSourceConfig, value: any) => {
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
      alert("Please enter a valid API URL");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
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

      // Build URL with query parameters
      const url = new URL(config.url);
      Object.entries(config.params).forEach(([key, value]) => {
        if (key && value) {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url.toString(), {
        method: config.method,
        headers,
        body: config.method !== "GET" ? config.body : undefined,
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: "Connection successful!",
          data: data,
          status: response.status,
        });
      } else {
        setTestResult({
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          data: data,
          status: response.status,
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Connection failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const updateDataSource = async () => {
    if (!dataSourceName.trim()) {
      alert("Please enter a data source name");
      return;
    }

    // Type-specific validation
    if (dataSource.type === "api" && !config.url?.trim()) {
      alert("Please enter a valid API URL");
      return;
    }

    if (
      dataSource.type === "mysql" &&
      (!config.host?.trim() || !config.database?.trim())
    ) {
      alert("Please enter host and database name");
      return;
    }

    if (dataSource.type === "file" && !config.filePath?.trim()) {
      alert("Please enter a file path");
      return;
    }

    if (dataSource.type === "sql_dump" && !config.sqlFilePath?.trim()) {
      alert("Please enter a SQL file path");
      return;
    }

    setLoading(true);

    try {
      let updatedConfig;

      // Build config based on data source type
      if (dataSource.type === "api") {
        updatedConfig = {
          apiUrl: config.url,
          apiMethod: config.method,
          apiHeaders: config.headers,
          apiParams: config.params,
          apiAuthType: config.authType,
          apiAuthConfig: config.authConfig,
          apiBody: config.body,
        };
      } else {
        // For other types, use the config directly
        updatedConfig = config;
      }

      const updatedDataSource: DataSource = {
        ...dataSource,
        name: dataSourceName.trim(),
        config: updatedConfig,
        updatedAt: new Date(),
      };

      onDataSourceUpdated(updatedDataSource);
      onClose();

      logger.success(
        `${getDataSourceTypeLabel(
          dataSource.type
        )} data source updated successfully`,
        "data-processing",
        {
          dataSourceId: updatedDataSource.id,
          dataSourceName: updatedDataSource.name,
          dataSourceType: dataSource.type,
        },
        "EditDataSourceModal"
      );
    } catch (error) {
      console.error(`Failed to update ${dataSource.type} data source:`, error);
      logger.error(
        `Failed to update ${dataSource.type} data source`,
        "data-processing",
        { error },
        "EditDataSourceModal"
      );
    } finally {
      setLoading(false);
    }
  };

  // Get the appropriate icon for the data source type
  const getDataSourceIcon = (type: string) => {
    switch (type) {
      case "api":
        return <Globe className="h-5 w-5" />;
      case "file":
        return <FileText className="h-5 w-5" />;
      case "mysql":
        return <Database className="h-5 w-5" />;
      case "custom_script":
        return <Code className="h-5 w-5" />;
      case "sql_dump":
        return <Database className="h-5 w-5" />;
      case "mock":
        return <Database className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  // Get the display name for the data source type
  const getDataSourceTypeLabel = (type: string) => {
    switch (type) {
      case "api":
        return "API Endpoint";
      case "file":
        return "File Upload";
      case "mysql":
        return "MySQL Database";
      case "custom_script":
        return "Custom Script";
      case "sql_dump":
        return "SQL Dump";
      case "mock":
        return "Mock Data";
      default:
        return "Data Source";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Data Source">
      <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg btn-primary mr-3">
              {getDataSourceIcon(dataSource.type)}
            </div>
            <h2 className="text-xl font-bold text-white">
              Edit {getDataSourceTypeLabel(dataSource.type)}
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            icon={<X className="h-4 w-4" />}
          >
            Close
          </Button>
        </div>

        <div className="space-y-6">
          {/* Data Source Name - Common to all types */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Data Source Name
            </label>
            <Input
              value={dataSourceName}
              onChange={(e) => setDataSourceName(e.target.value)}
              placeholder="Enter data source name"
            />
          </div>

          {/* Type-specific configuration forms */}
          {dataSource.type === "api" && (
            <>
              {/* API URL */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  API URL
                </label>
                <Input
                  value={config.url}
                  onChange={(e) => handleConfigChange("url", e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
            </>
          )}

          {dataSource.type === "file" && (
            <>
              {/* File Upload Configuration */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  File Path
                </label>
                <Input
                  value={dataSource.config?.filePath || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, filePath: e.target.value }))
                  }
                  placeholder="/path/to/your/file.csv"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  File Type
                </label>
                <select
                  value={dataSource.config?.fileType || "csv"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      fileType: e.target.value as "csv" | "json",
                    }))
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="xlsx">Excel</option>
                  <option value="xml">XML</option>
                </select>
              </div>
            </>
          )}

          {dataSource.type === "mysql" && (
            <>
              {/* MySQL Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Host
                  </label>
                  <Input
                    value={dataSource.config?.mysqlConfig?.host || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, host: e.target.value }))
                    }
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Port
                  </label>
                  <Input
                    type="number"
                    value={dataSource.config?.mysqlConfig?.port || 3306}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        port: parseInt(e.target.value) || 3306,
                      }))
                    }
                    placeholder="3306"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Database Name
                </label>
                <Input
                  value={dataSource.config?.mysqlConfig?.database || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, database: e.target.value }))
                  }
                  placeholder="my_database"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Username
                  </label>
                  <Input
                    value={dataSource.config?.mysqlConfig?.username || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={dataSource.config?.mysqlConfig?.password || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="password"
                  />
                </div>
              </div>
            </>
          )}

          {dataSource.type === "custom_script" && (
            <>
              {/* Custom Script Configuration */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Script Language
                </label>
                <select
                  value={dataSource.config?.scriptLanguage || "javascript"}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, language: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="sql">SQL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Script Code
                </label>
                <textarea
                  value={dataSource.config?.scriptContent || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, script: e.target.value }))
                  }
                  placeholder="// Enter your custom script here"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] font-mono text-sm"
                />
              </div>
            </>
          )}

          {dataSource.type === "sql_dump" && (
            <>
              {/* SQL Dump Configuration */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  SQL File Path
                </label>
                <Input
                  value={dataSource.config?.sqlPath || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      sqlFilePath: e.target.value,
                    }))
                  }
                  placeholder="/path/to/your/dump.sql"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Database Type
                </label>
                <select
                  value={dataSource.config?.sqlDialect || "mysql"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      databaseType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>
            </>
          )}

          {dataSource.type === "mock" && (
            <>
              {/* Mock Data Configuration */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Data Size
                </label>
                <Input
                  type="number"
                  value={dataSource.config?.mockConfig?.recordCount || 100}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dataSize: parseInt(e.target.value) || 100,
                    }))
                  }
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Schema Type
                </label>
                <select
                  value="users"
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      schemaType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="users">Users</option>
                  <option value="products">Products</option>
                  <option value="orders">Orders</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </>
          )}

          {/* API-specific fields - only show for API type */}
          {dataSource.type === "api" && (
            <>
              {/* HTTP Method */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  HTTP Method
                </label>
                <select
                  value={config.method}
                  onChange={(e) => handleConfigChange("method", e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              {/* Headers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">
                    Headers
                  </label>
                  <Button onClick={addHeader} size="sm" variant="ghost">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Header
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(config.headers).map(([key, value], index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={key}
                        onChange={(e) =>
                          updateHeader(index, e.target.value, value)
                        }
                        placeholder="Header name"
                        className="flex-1"
                      />
                      <Input
                        value={value}
                        onChange={(e) =>
                          updateHeader(index, key, e.target.value)
                        }
                        placeholder="Header value"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeHeader(index)}
                        size="sm"
                        variant="ghost"
                        icon={<X className="h-4 w-4" />}
                        className="text-red-400 hover:text-red-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Query Parameters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white">
                    Query Parameters
                  </label>
                  <Button onClick={addParam} size="sm" variant="ghost">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Param
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(config.params).map(([key, value], index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={key}
                        onChange={(e) =>
                          updateParam(index, e.target.value, value)
                        }
                        placeholder="Parameter name"
                        className="flex-1"
                      />
                      <Input
                        value={value}
                        onChange={(e) =>
                          updateParam(index, key, e.target.value)
                        }
                        placeholder="Parameter value"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeParam(index)}
                        size="sm"
                        variant="ghost"
                        icon={<X className="h-4 w-4" />}
                        className="text-red-400 hover:text-red-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Authentication */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Authentication
                </label>
                <select
                  value={config.authType}
                  onChange={(e) =>
                    handleConfigChange("authType", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                >
                  <option value="none">None</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="api_key">API Key</option>
                </select>

                {config.authType === "bearer" && (
                  <div className="space-y-2">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={config.authConfig.token || ""}
                      onChange={(e) =>
                        handleAuthConfigChange("token", e.target.value)
                      }
                      placeholder="Bearer token"
                    />
                  </div>
                )}

                {config.authType === "basic" && (
                  <div className="space-y-2">
                    <Input
                      value={config.authConfig.username || ""}
                      onChange={(e) =>
                        handleAuthConfigChange("username", e.target.value)
                      }
                      placeholder="Username"
                    />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={config.authConfig.password || ""}
                      onChange={(e) =>
                        handleAuthConfigChange("password", e.target.value)
                      }
                      placeholder="Password"
                    />
                  </div>
                )}

                {config.authType === "api_key" && (
                  <div className="space-y-2">
                    <Input
                      value={config.authConfig.apiKeyHeader || ""}
                      onChange={(e) =>
                        handleAuthConfigChange("apiKeyHeader", e.target.value)
                      }
                      placeholder="Header name (e.g., X-API-Key)"
                    />
                    <Input
                      type={showToken ? "text" : "password"}
                      value={config.authConfig.apiKey || ""}
                      onChange={(e) =>
                        handleAuthConfigChange("apiKey", e.target.value)
                      }
                      placeholder="API key"
                    />
                  </div>
                )}
              </div>

              {/* Request Body */}
              {config.method !== "GET" && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Request Body
                  </label>
                  <textarea
                    value={config.body || ""}
                    onChange={(e) => handleConfigChange("body", e.target.value)}
                    placeholder="Request body (JSON format)"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  />
                </div>
              )}

              {/* Test Connection */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={testConnection}
                  disabled={testing || !config.url.trim()}
                  variant="ghost"
                  icon={
                    testing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )
                  }
                >
                  {testing ? "Testing..." : "Test Connection"}
                </Button>

                {testResult && (
                  <div className="flex items-center">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    )}
                    <span
                      className={`ml-2 text-sm ${
                        testResult.success ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {testResult.message}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button
              onClick={updateDataSource}
              disabled={loading}
              icon={<Settings className="h-4 w-4" />}
            >
              {loading ? "Updating..." : "Update Data Source"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
