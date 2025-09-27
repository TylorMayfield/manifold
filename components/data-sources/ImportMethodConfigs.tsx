"use client";

import React, { useState } from "react";
import {
  Upload,
  Download,
  FileText,
  Database,
  Globe,
  Settings,
  Code,
} from "lucide-react";
import Button from "../ui/Button";
import { DataProviderType } from "../../types";

interface ImportMethodConfigProps {
  dataSourceType: DataProviderType;
  importMethod: string;
  config: any;
  onConfigChange: (config: any) => void;
  onNext: () => void;
  onBack: () => void;
}

// File Upload Configuration
function FileUploadConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    onConfigChange({
      ...config,
      uploadFile: selectedFile,
      fileType: selectedFile.name.split(".").pop()?.toLowerCase(),
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="h-12 w-12 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload File</h3>
        <p className="text-gray-600">
          Drag and drop your file or click to browse
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {file ? (
          <div className="space-y-4">
            <FileText className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button variant="outline" onClick={() => setFile(null)} size="sm">
              Remove File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <p className="text-gray-600 mb-2">Choose a file to upload</p>
              <input
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    handleFileSelect(files[0]);
                  }
                }}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Browse Files
              </label>
            </div>
          </div>
        )}
      </div>

      {file && (
        <div className="flex justify-end">
          <Button onClick={onNext} variant="primary">
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}

// URL Import Configuration
function UrlImportConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [url, setUrl] = useState(config.importUrl || "");

  const handleNext = () => {
    onConfigChange({ ...config, importUrl: url });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Download className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Import from URL</h3>
        <p className="text-gray-600">Enter the URL to import data from</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/data.csv"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Supported formats:</strong> CSV, JSON, Excel files
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} variant="primary" disabled={!url.trim()}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// MySQL Direct Connection Configuration
function MysqlDirectConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [connectionConfig, setConnectionConfig] = useState({
    host: config.mysqlConfig?.host || "localhost",
    port: config.mysqlConfig?.port || 3306,
    database: config.mysqlConfig?.database || "",
    username: config.mysqlConfig?.username || "",
    password: config.mysqlConfig?.password || "",
    ssl: config.mysqlConfig?.ssl || false,
  });

  const handleNext = () => {
    onConfigChange({
      ...config,
      mysqlConfig: connectionConfig,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Database className="h-12 w-12 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">MySQL Connection</h3>
        <p className="text-gray-600">
          Configure your MySQL database connection
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Host
          </label>
          <input
            type="text"
            value={connectionConfig.host}
            onChange={(e) =>
              setConnectionConfig({ ...connectionConfig, host: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="localhost"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Port
          </label>
          <input
            type="number"
            value={connectionConfig.port}
            onChange={(e) =>
              setConnectionConfig({
                ...connectionConfig,
                port: parseInt(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="3306"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Database Name
        </label>
        <input
          type="text"
          value={connectionConfig.database}
          onChange={(e) =>
            setConnectionConfig({
              ...connectionConfig,
              database: e.target.value,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your_database_name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={connectionConfig.username}
            onChange={(e) =>
              setConnectionConfig({
                ...connectionConfig,
                username: e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={connectionConfig.password}
            onChange={(e) =>
              setConnectionConfig({
                ...connectionConfig,
                password: e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="password"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="ssl"
          checked={connectionConfig.ssl}
          onChange={(e) =>
            setConnectionConfig({ ...connectionConfig, ssl: e.target.checked })
          }
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="ssl" className="ml-2 block text-sm text-gray-900">
          Use SSL connection
        </label>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          variant="primary"
          disabled={
            !connectionConfig.host ||
            !connectionConfig.database ||
            !connectionConfig.username
          }
        >
          Test Connection & Continue
        </Button>
      </div>
    </div>
  );
}

// REST API Configuration
function RestApiConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [apiConfig, setApiConfig] = useState({
    url: config.apiConfig?.url || "",
    method: config.apiConfig?.method || "GET",
    headers: config.apiConfig?.headers || {},
    authType: config.apiConfig?.authType || "none",
  });

  const handleNext = () => {
    onConfigChange({
      ...config,
      apiConfig: apiConfig,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Globe className="h-12 w-12 mx-auto text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">REST API Configuration</h3>
        <p className="text-gray-600">Configure your REST API connection</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API URL
          </label>
          <input
            type="url"
            value={apiConfig.url}
            onChange={(e) =>
              setApiConfig({ ...apiConfig, url: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://api.example.com/data"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HTTP Method
          </label>
          <select
            value={apiConfig.method}
            onChange={(e) =>
              setApiConfig({ ...apiConfig, method: e.target.value as any })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Authentication
          </label>
          <select
            value={apiConfig.authType}
            onChange={(e) =>
              setApiConfig({ ...apiConfig, authType: e.target.value as any })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">No Authentication</option>
            <option value="basic">Basic Auth</option>
            <option value="bearer">Bearer Token</option>
            <option value="api-key">API Key</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          variant="primary"
          disabled={!apiConfig.url.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

// Mock Data Template Configuration
function MockDataConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [template, setTemplate] = useState("user-data");
  const [recordCount, setRecordCount] = useState(100);

  const templates = [
    {
      id: "user-data",
      name: "User Data",
      description: "Names, emails, addresses",
    },
    {
      id: "product-data",
      name: "Product Data",
      description: "Products, prices, categories",
    },
    {
      id: "sales-data",
      name: "Sales Data",
      description: "Transactions, dates, amounts",
    },
  ];

  const handleNext = () => {
    onConfigChange({
      ...config,
      mockConfig: {
        template,
        recordCount,
      },
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="h-12 w-12 mx-auto text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Mock Data Generation</h3>
        <p className="text-gray-600">
          Choose a template and configure generation
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Template
          </label>
          <div className="space-y-2">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => setTemplate(tmpl.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  template === tmpl.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{tmpl.name}</p>
                    <p className="text-sm text-gray-600">{tmpl.description}</p>
                  </div>
                  <input
                    type="radio"
                    checked={template === tmpl.id}
                    onChange={() => setTemplate(tmpl.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Records
          </label>
          <input
            type="number"
            value={recordCount}
            onChange={(e) => setRecordCount(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="10000"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} variant="primary">
          Generate Data
        </Button>
      </div>
    </div>
  );
}

// Main configuration component
export default function ImportMethodConfigs(props: ImportMethodConfigProps) {
  const { dataSourceType, importMethod } = props;

  switch (importMethod) {
    case "file-upload":
      return <FileUploadConfig {...props} />;
    case "url-import":
      return <UrlImportConfig {...props} />;
    case "direct-connection":
      return <MysqlDirectConfig {...props} />;
    case "rest-api":
      return <RestApiConfig {...props} />;
    case "template-based":
      return <MockDataConfig {...props} />;
    default:
      return (
        <div className="text-center py-8">
          <Code className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Configuration Not Available
          </h3>
          <p className="text-gray-600">
            Configuration for {importMethod} is not yet implemented.
          </p>
        </div>
      );
  }
}
