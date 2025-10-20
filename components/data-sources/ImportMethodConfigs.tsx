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
  Clock,
  Play,
  Plus,
  RefreshCw,
  Zap,
} from "lucide-react";
import Button from "../ui/Button";
import CellButton from "../ui/CellButton";
import CellCard from "../ui/CellCard";
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
                accept=".csv,.json,.xlsx,.xls,.xlsm"
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
  dataSourceType,
}: ImportMethodConfigProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Get database-specific defaults
  const getDefaultPort = () => {
    switch (dataSourceType) {
      case 'mysql': return 3306;
      case 'postgres': return 5432;
      case 'mssql': return 1433;
      default: return 3306;
    }
  };

  const getDatabaseLabel = () => {
    switch (dataSourceType) {
      case 'mysql': return 'MySQL';
      case 'postgres': return 'PostgreSQL';
      case 'mssql': return 'Microsoft SQL Server';
      case 'sqlite': return 'SQLite';
      case 'odbc': return 'ODBC';
      default: return 'Database';
    }
  };

  const [connectionConfig, setConnectionConfig] = useState({
    host: config.host || config.mysqlConfig?.host || "localhost",
    port: config.port || config.mysqlConfig?.port || getDefaultPort(),
    database: config.database || config.mysqlConfig?.database || "",
    username: config.username || config.mysqlConfig?.username || "",
    password: config.password || config.mysqlConfig?.password || "",
    filePath: config.filePath || "", // For SQLite
    driver: config.driver || "", // For ODBC
    ssl: config.ssl || config.mysqlConfig?.ssl || false,
    tables: config.tables || config.mysqlConfig?.tables || [],
    importAllTables: config.importAllTables !== false, // Default to true
    // Delta sync options
    deltaSync: config.deltaSync || config.mysqlConfig?.deltaSync || {
      enabled: false,
      trackingColumn: 'updated_at',
      trackingType: 'timestamp',
    },
    // Batch export options
    batchExport: config.batchExport || config.mysqlConfig?.batchExport || {
      enabled: false,
      batchSize: 1000,
      pauseBetweenBatches: 100,
    },
  });

  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const loadTables = async () => {
    if (dataSourceType === 'sqlite') return; // SQLite doesn't need this
    
    setLoadingTables(true);
    try {
      const response = await fetch('/api/data-sources/introspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: dataSourceType,
          config: {
            host: connectionConfig.host,
            port: connectionConfig.port,
            database: connectionConfig.database,
            username: connectionConfig.username,
            password: connectionConfig.password,
            driver: connectionConfig.driver,
            ssl: connectionConfig.ssl,
          },
        }),
      });

      const result = await response.json();
      if (response.ok && result.tables) {
        setAvailableTables(result.tables);
      } else {
        alert(`Failed to load tables: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
      alert('Failed to load tables. Please check your connection settings.');
    } finally {
      setLoadingTables(false);
    }
  };

  const toggleTable = (tableName: string) => {
    const newTables = connectionConfig.tables.includes(tableName)
      ? connectionConfig.tables.filter(t => t !== tableName)
      : [...connectionConfig.tables, tableName];
    
    setConnectionConfig({
      ...connectionConfig,
      tables: newTables,
    });
  };

  const selectAllTables = () => {
    setConnectionConfig({
      ...connectionConfig,
      tables: [...availableTables],
    });
  };

  const deselectAllTables = () => {
    setConnectionConfig({
      ...connectionConfig,
      tables: [],
    });
  };

  const handleNext = () => {
    const finalConfig = {
      ...config,
      ...connectionConfig,
      mysqlConfig: connectionConfig, // Keep for backward compatibility
    };
    
    console.log('[ImportMethodConfigs] handleNext - dataSourceType:', dataSourceType);
    console.log('[ImportMethodConfigs] handleNext - connectionConfig:', connectionConfig);
    console.log('[ImportMethodConfigs] handleNext - finalConfig:', finalConfig);
    
    onConfigChange(finalConfig);
    onNext();
  };

  const dbLabel = getDatabaseLabel();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Database className="h-12 w-12 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{dbLabel} Connection</h3>
        <p className="text-gray-600">
          Configure your {dbLabel} database connection
        </p>
      </div>

      {/* ODBC Driver Field */}
      {dataSourceType === 'odbc' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ODBC Driver Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={connectionConfig.driver}
            onChange={(e) =>
              setConnectionConfig({ ...connectionConfig, driver: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="SQL Server, PostgreSQL Unicode, etc."
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: "SQL Server", "PostgreSQL Unicode", "MySQL ODBC 8.0 Driver"
          </p>
        </div>
      )}

      {/* SQLite File Path */}
      {dataSourceType === 'sqlite' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Database File Path <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={connectionConfig.filePath}
            onChange={(e) =>
              setConnectionConfig({ ...connectionConfig, filePath: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="/path/to/database.sqlite"
          />
        </div>
      ) : (
        <>
          {/* Host and Port for non-SQLite databases */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Host <span className="text-red-500">*</span>
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
                placeholder={getDefaultPort().toString()}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Database Name <span className="text-red-500">*</span>
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
        </>
      )}

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

      {/* Table Selection */}
      {dataSourceType !== 'sqlite' && (
        <CellCard className="p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Table Selection</h4>
              <p className="text-xs text-gray-600">Choose which tables to import data from</p>
            </div>
            <CellButton 
              onClick={loadTables} 
              variant="secondary" 
              size="sm"
              disabled={loadingTables || !connectionConfig.host || !connectionConfig.database}
            >
              {loadingTables ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-1" />
                  Load Tables
                </>
              )}
            </CellButton>
          </div>

          {availableTables.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm text-gray-600">
                  {connectionConfig.tables.length} of {availableTables.length} tables selected
                </div>
                <div className="flex gap-2">
                  <CellButton onClick={selectAllTables} variant="ghost" size="sm">
                    Select All
                  </CellButton>
                  <CellButton onClick={deselectAllTables} variant="ghost" size="sm">
                    Deselect All
                  </CellButton>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded p-3 bg-white">
                <div className="space-y-2">
                  {availableTables.map((tableName) => (
                    <div key={tableName} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`table-${tableName}`}
                        checked={connectionConfig.tables.includes(tableName)}
                        onChange={() => toggleTable(tableName)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor={`table-${tableName}`} 
                        className="ml-2 block text-sm text-gray-900 cursor-pointer font-mono"
                      >
                        {tableName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {connectionConfig.tables.length === 0 && (
                <div className="mt-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
                  ⚠️ No tables selected. All tables will be imported by default.
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-sm text-gray-500">
              Click "Load Tables" to see available tables from the database
            </div>
          )}
        </CellCard>
      )}

      {/* Advanced Options */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
        >
          <Settings className="h-4 w-4 mr-1" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Delta Sync */}
            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="delta-sync"
                  checked={connectionConfig.deltaSync.enabled}
                  onChange={(e) =>
                    setConnectionConfig({
                      ...connectionConfig,
                      deltaSync: { ...connectionConfig.deltaSync, enabled: e.target.checked },
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="delta-sync" className="ml-2 block text-sm font-medium text-gray-900">
                  Enable Delta/Incremental Sync
                </label>
              </div>
              
              {connectionConfig.deltaSync.enabled && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking Column
                    </label>
                    <input
                      type="text"
                      value={connectionConfig.deltaSync.trackingColumn}
                      onChange={(e) =>
                        setConnectionConfig({
                          ...connectionConfig,
                          deltaSync: { ...connectionConfig.deltaSync, trackingColumn: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="updated_at"
                    />
                    <p className="text-xs text-gray-500 mt-1">Column used to track changes</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking Type
                    </label>
                    <select
                      value={connectionConfig.deltaSync.trackingType}
                      onChange={(e) =>
                        setConnectionConfig({
                          ...connectionConfig,
                          deltaSync: { ...connectionConfig.deltaSync, trackingType: e.target.value as any },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="timestamp">Timestamp</option>
                      <option value="integer">Integer/Version</option>
                      <option value="version">Row Version</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Batch Export */}
            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="batch-export"
                  checked={connectionConfig.batchExport.enabled}
                  onChange={(e) =>
                    setConnectionConfig({
                      ...connectionConfig,
                      batchExport: { ...connectionConfig.batchExport, enabled: e.target.checked },
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="batch-export" className="ml-2 block text-sm font-medium text-gray-900">
                  Enable Batch Export (Reduce DB Load)
                </label>
              </div>
              
              {connectionConfig.batchExport.enabled && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Size
                    </label>
                    <input
                      type="number"
                      value={connectionConfig.batchExport.batchSize}
                      onChange={(e) =>
                        setConnectionConfig({
                          ...connectionConfig,
                          batchExport: { ...connectionConfig.batchExport, batchSize: parseInt(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="1000"
                      min="100"
                      max="10000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of rows per batch (100-10000)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pause Between Batches (ms)
                    </label>
                    <input
                      type="number"
                      value={connectionConfig.batchExport.pauseBetweenBatches}
                      onChange={(e) =>
                        setConnectionConfig({
                          ...connectionConfig,
                          batchExport: { ...connectionConfig.batchExport, pauseBetweenBatches: parseInt(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="100"
                      min="0"
                      max="5000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Delay to reduce database load</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* No button here - workflow uses Review button at bottom */}
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
  const [template, setTemplate] = useState(config.mockConfig?.templateId || "user-data");
  const [recordCount, setRecordCount] = useState(config.mockConfig?.recordCount || 100);

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
    const newConfig = {
      ...config,
      mockConfig: {
        templateId: template,
        recordCount,
      },
    };
    console.log('[MockDataConfig] Config updated:', newConfig);
    onConfigChange(newConfig);
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
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setRecordCount(isNaN(val) ? 1 : val);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="10000"
          />
          <p className="text-sm text-gray-500 mt-1">Current: {recordCount} records</p>
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

// Example scripts for JavaScript data source
const EXAMPLE_SCRIPTS = {
  "api-fetch": {
    name: "API Data Fetch",
    description: "Fetch data from a REST API endpoint",
    script: `// Fetch data from an API endpoint
async function fetchApiData() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const data = await response.json();
    
    // Transform the data if needed
    return data.map(item => ({
      id: item.id,
      title: item.title,
      body: item.body,
      userId: item.userId,
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

return await fetchApiData();`
  },
  "web-scraping": {
    name: "Web Scraping",
    description: "Extract data from HTML pages (simplified example)",
    script: `// Example web scraping script (simplified)
async function scrapeData() {
  // Note: In a real implementation, you'd need a headless browser
  // This is a simplified example showing the structure
  
  const mockData = [
    { id: 1, title: "Article 1", content: "Content 1", url: "https://example.com/1" },
    { id: 2, title: "Article 2", content: "Content 2", url: "https://example.com/2" },
    { id: 3, title: "Article 3", content: "Content 3", url: "https://example.com/3" }
  ];
  
  return mockData;
}

return await scrapeData();`
  },
  "data-transformation": {
    name: "Data Transformation",
    description: "Transform and clean existing data",
    script: `// Transform and clean data
function transformData() {
  // Example: Clean and normalize user data
  const rawData = [
    { id: 1, name: "John Doe", email: "JOHN@EXAMPLE.COM", age: "25" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", age: 30 },
    { id: 3, name: "Bob Johnson", email: "BOB@EXAMPLE.COM", age: "35" }
  ];
  
  return rawData.map(user => ({
    id: user.id,
    name: user.name.trim(),
    email: user.email.toLowerCase().trim(),
    age: parseInt(user.age),
    isValid: user.email.includes('@') && user.age > 0
  }));
}

return transformData();`
  },
  "database-query": {
    name: "Database Query Simulation",
    description: "Simulate database queries and joins",
    script: `// Simulate complex database operations
function simulateDatabaseQuery() {
  // Mock users data
  const users = [
    { id: 1, name: "Alice", departmentId: 1, salary: 50000 },
    { id: 2, name: "Bob", departmentId: 2, salary: 60000 },
    { id: 3, name: "Charlie", departmentId: 1, salary: 55000 }
  ];
  
  // Mock departments data
  const departments = [
    { id: 1, name: "Engineering", budget: 200000 },
    { id: 2, name: "Marketing", budget: 150000 }
  ];
  
  // Perform a join operation
  return users.map(user => {
    const dept = departments.find(d => d.id === user.departmentId);
    return {
      userId: user.id,
      userName: user.name,
      department: dept?.name || 'Unknown',
      salary: user.salary,
      budget: dept?.budget || 0
    };
  });
}

return simulateDatabaseQuery();`
  },
  "external-service": {
    name: "External Service Integration",
    description: "Integrate with external services (GitHub, Slack, etc.)",
    script: `// Example: Fetch GitHub repository data
async function fetchGitHubData() {
  try {
    // Note: You would need to set up authentication for real GitHub API
    // This is a mock example
    const mockRepos = [
      {
        id: 1,
        name: "my-project",
        description: "A sample project",
        stars: 42,
        language: "JavaScript",
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "another-project", 
        description: "Another sample project",
        stars: 15,
        language: "Python",
        updatedAt: new Date().toISOString()
      }
    ];
    
    return mockRepos.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      stars: repo.stars,
      language: repo.language,
      lastUpdated: repo.updatedAt,
      popularity: repo.stars > 20 ? 'high' : 'low'
    }));
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    throw error;
  }
}

return await fetchGitHubData();`
  },
  "real-time-data": {
    name: "Real-time Data Aggregation",
    description: "Aggregate real-time data from multiple sources",
    script: `// Aggregate real-time data from multiple sources
async function aggregateRealTimeData() {
  // Simulate fetching from multiple data sources
  const sources = [
    { name: 'source1', url: 'https://api1.example.com/data' },
    { name: 'source2', url: 'https://api2.example.com/data' },
    { name: 'source3', url: 'https://api3.example.com/data' }
  ];
  
  const results = [];
  
  for (const source of sources) {
    try {
      // Mock API call - replace with actual fetch
      const mockData = {
        source: source.name,
        timestamp: new Date().toISOString(),
        value: Math.random() * 100,
        status: 'active'
      };
      
      results.push(mockData);
    } catch (error) {
      console.error(\`Error fetching from \${source.name}:\`, error);
      results.push({
        source: source.name,
        timestamp: new Date().toISOString(),
        value: 0,
        status: 'error',
        error: error.message
      });
    }
  }
  
  // Calculate aggregated metrics
  const totalValue = results.reduce((sum, item) => sum + item.value, 0);
  const averageValue = totalValue / results.length;
  const activeSources = results.filter(item => item.status === 'active').length;
  
  return {
    timestamp: new Date().toISOString(),
    sources: results,
    metrics: {
      totalValue,
      averageValue,
      activeSources,
      totalSources: sources.length
    }
  };
}

return await aggregateRealTimeData();`
  }
};

// JavaScript Custom Script Configuration
function JavaScriptCustomScriptConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [script, setScript] = useState(config.javascriptConfig?.script || "");
  const [selectedExample, setSelectedExample] = useState<string>("");
  const [outputFormat, setOutputFormat] = useState<"array" | "object">(
    config.javascriptConfig?.outputFormat || "array"
  );

  const handleScriptChange = (value: string) => {
    setScript(value);
    onConfigChange({
      ...config,
      javascriptConfig: {
        ...config.javascriptConfig,
        script: value,
      },
    });
  };

  const handleExampleSelect = (exampleKey: string) => {
    const example = EXAMPLE_SCRIPTS[exampleKey as keyof typeof EXAMPLE_SCRIPTS];
    if (example) {
      setScript(example.script);
      setSelectedExample(exampleKey);
      onConfigChange({
        ...config,
        javascriptConfig: {
          ...config.javascriptConfig,
          script: example.script,
        },
      });
    }
  };

  const handleNext = () => {
    onConfigChange({
      ...config,
      javascriptConfig: {
        ...config.javascriptConfig,
        script,
        outputFormat,
        enableDiff: true,
        diffKey: "id",
      },
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Example Scripts Selection */}
      <div>
        <label className="block text-body font-bold text-gray-700 mb-2">
          Choose Example Script
        </label>
        <p className="text-caption text-gray-600 mb-4">
          Select a template to get started, or write your own custom script below.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {Object.entries(EXAMPLE_SCRIPTS).map(([key, example]) => (
            <CellCard
              key={key}
              className={`p-3 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                selectedExample === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleExampleSelect(key)}
            >
              <h4 className="text-body font-bold mb-1">{example.name}</h4>
              <p className="text-caption text-gray-600">{example.description}</p>
            </CellCard>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-body font-bold text-gray-700 mb-2">
          JavaScript Code
        </label>
        <p className="text-caption text-gray-600 mb-4">
          Write JavaScript code that returns data. The script should return an array of objects or a single object.
        </p>
        <textarea
          value={script}
          onChange={(e) => handleScriptChange(e.target.value)}
          className="cell-input w-full h-64 font-mono text-sm"
          placeholder={`// Example JavaScript code
async function fetchData() {
  // Your data fetching logic here
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  return data;
}

// Return the data
return await fetchData();`}
        />
      </div>

      <div>
        <label className="block text-body font-bold text-gray-700 mb-2">
          Output Format
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="array"
              checked={outputFormat === "array"}
              onChange={(e) => setOutputFormat(e.target.value as "array" | "object")}
              className="mr-2"
            />
            Array of Objects
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="object"
              checked={outputFormat === "object"}
              onChange={(e) => setOutputFormat(e.target.value as "array" | "object")}
              className="mr-2"
            />
            Single Object
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <CellButton onClick={handleNext} variant="primary">
          <Play className="w-4 h-4 mr-2" />
          Test & Continue
        </CellButton>
      </div>
    </div>
  );
}

// JavaScript Scheduled Script Configuration
function JavaScriptScheduledScriptConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [script, setScript] = useState(config.javascriptConfig?.script || "");
  const [selectedExample, setSelectedExample] = useState<string>("");
  const [interval, setInterval] = useState(config.javascriptConfig?.interval || 60);
  const [schedule, setSchedule] = useState(config.javascriptConfig?.schedule || "");
  const [timeout, setTimeout] = useState(config.javascriptConfig?.timeout || 300);
  const [enableDiff, setEnableDiff] = useState(config.javascriptConfig?.enableDiff || true);
  const [diffKey, setDiffKey] = useState(config.javascriptConfig?.diffKey || "id");

  const handleExampleSelect = (exampleKey: string) => {
    const example = EXAMPLE_SCRIPTS[exampleKey as keyof typeof EXAMPLE_SCRIPTS];
    if (example) {
      setScript(example.script);
      setSelectedExample(exampleKey);
      onConfigChange({
        ...config,
        javascriptConfig: {
          ...config.javascriptConfig,
          script: example.script,
        },
      });
    }
  };

  const handleNext = () => {
    onConfigChange({
      ...config,
      javascriptConfig: {
        script,
        interval,
        schedule,
        timeout,
        enableDiff,
        diffKey,
        outputFormat: "array" as const,
      },
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Example Scripts Selection */}
      <div>
        <label className="block text-body font-bold text-gray-700 mb-2">
          Choose Example Script
        </label>
        <p className="text-caption text-gray-600 mb-4">
          Select a template for your scheduled script, or write your own custom script below.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {Object.entries(EXAMPLE_SCRIPTS).map(([key, example]) => (
            <CellCard
              key={key}
              className={`p-3 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                selectedExample === key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleExampleSelect(key)}
            >
              <h4 className="text-body font-bold mb-1">{example.name}</h4>
              <p className="text-caption text-gray-600">{example.description}</p>
            </CellCard>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-body font-bold text-gray-700 mb-2">
          JavaScript Code
        </label>
        <p className="text-caption text-gray-600 mb-4">
          Write JavaScript code that will be executed on a schedule. The script should return data for diffing.
        </p>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="cell-input w-full h-64 font-mono text-sm"
          placeholder={`// Scheduled JavaScript code
async function fetchData() {
  // Your data fetching logic here
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  return data;
}

// Return the data
return await fetchData();`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-body font-bold text-gray-700 mb-2">
            Execution Interval (minutes)
          </label>
          <input
            type="number"
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value))}
            className="cell-input w-full px-3 py-2"
            min="1"
            max="1440"
          />
        </div>

        <div>
          <label className="block text-body font-bold text-gray-700 mb-2">
            Script Timeout (seconds)
          </label>
          <input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(parseInt(e.target.value))}
            className="cell-input w-full px-3 py-2"
            min="10"
            max="3600"
          />
        </div>
      </div>

      <div>
        <label className="block text-body font-bold text-gray-700 mb-2">
          Advanced Schedule (Cron Expression)
        </label>
        <p className="text-caption text-gray-600 mb-2">
          Optional: Use cron expression for complex scheduling (overrides interval)
        </p>
        <input
          type="text"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          className="cell-input w-full px-3 py-2"
          placeholder="0 */6 * * * (every 6 hours)"
        />
      </div>

      <CellCard className="p-4">
        <h3 className="text-subheading font-bold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Diff Configuration
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={enableDiff}
              onChange={(e) => setEnableDiff(e.target.checked)}
              className="mr-2"
            />
            Enable data diffing between runs
          </label>

          {enableDiff && (
            <div>
              <label className="block text-body font-bold text-gray-700 mb-2">
                Diff Key Field
              </label>
              <input
                type="text"
                value={diffKey}
                onChange={(e) => setDiffKey(e.target.value)}
                className="cell-input w-full px-3 py-2"
                placeholder="id"
              />
              <p className="text-caption text-gray-600 mt-1">
                Field name to use for identifying unique records (default: "id")
              </p>
            </div>
          )}
        </div>
      </CellCard>

      <div className="flex justify-end">
        <CellButton onClick={handleNext} variant="primary">
          <Clock className="w-4 h-4 mr-2" />
          Configure Schedule
        </CellButton>
      </div>
    </div>
  );
}

// SQL File Configuration
function SQLFileConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (file: File) => {
    if (file && (file.type === 'text/plain' || file.name.endsWith('.sql'))) {
      onConfigChange({
        ...config,
        sqlConfig: {
          ...config.sqlConfig,
          filePath: file.name,
          sqlContent: undefined // Will be read from file
        }
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-subheading font-bold mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          SQL Import Configuration
        </h3>
        <p className="text-caption text-gray-600 mb-6">
          Import data from SQL dump files or paste SQL statements directly
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          SQL File Upload
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop your SQL file here, or click to browse
          </p>
          <input
            type="file"
            accept=".sql,.txt"
            onChange={handleFileInput}
            className="hidden"
            id="sql-file-input"
          />
          <CellButton
            variant="secondary"
            onClick={() => document.getElementById('sql-file-input')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose File
          </CellButton>
          {config.sqlConfig?.filePath && (
            <p className="text-sm text-green-600 mt-2">
              Selected: {config.sqlConfig.filePath}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Or Paste SQL Content
        </label>
        <textarea
          value={config.sqlConfig?.sqlContent || ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              sqlConfig: {
                ...config.sqlConfig,
                sqlContent: e.target.value,
                filePath: undefined
              }
            })
          }
          className="cell-input w-full h-48 font-mono text-sm"
          placeholder="Paste your SQL statements here..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            SQL Dialect
          </label>
          <select
            value={config.sqlConfig?.dialect || "generic"}
            onChange={(e) =>
              onConfigChange({
                ...config,
                sqlConfig: {
                  ...config.sqlConfig,
                  dialect: e.target.value as any
                }
              })
            }
            className="cell-input w-full"
          >
            <option value="generic">Generic SQL</option>
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            File Encoding
          </label>
          <select
            value={config.sqlConfig?.encoding || "utf8"}
            onChange={(e) =>
              onConfigChange({
                ...config,
                sqlConfig: {
                  ...config.sqlConfig,
                  encoding: e.target.value as any
                }
              })
            }
            className="cell-input w-full"
          >
            <option value="utf8">UTF-8</option>
            <option value="utf16">UTF-16</option>
            <option value="latin1">Latin-1</option>
          </select>
        </div>
      </div>

      <CellCard className="p-4">
        <h3 className="text-subheading font-bold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Processing Options
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createTables"
                checked={config.sqlConfig?.createTables !== false}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    sqlConfig: {
                      ...config.sqlConfig,
                      createTables: e.target.checked
                    }
                  })
                }
                className="w-4 h-4"
              />
              <label htmlFor="createTables" className="text-gray-900">
                Create Tables (DDL)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="insertData"
                checked={config.sqlConfig?.insertData !== false}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    sqlConfig: {
                      ...config.sqlConfig,
                      insertData: e.target.checked
                    }
                  })
                }
                className="w-4 h-4"
              />
              <label htmlFor="insertData" className="text-gray-900">
                Insert Data (DML)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="indexes"
                checked={config.sqlConfig?.indexes !== false}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    sqlConfig: {
                      ...config.sqlConfig,
                      indexes: e.target.checked
                    }
                  })
                }
                className="w-4 h-4"
              />
              <label htmlFor="indexes" className="text-gray-900">
                Create Indexes
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="constraints"
                checked={config.sqlConfig?.constraints !== false}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    sqlConfig: {
                      ...config.sqlConfig,
                      constraints: e.target.checked
                    }
                  })
                }
                className="w-4 h-4"
              />
              <label htmlFor="constraints" className="text-gray-900">
                Create Constraints
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="skipErrors"
                checked={config.sqlConfig?.skipErrors || false}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    sqlConfig: {
                      ...config.sqlConfig,
                      skipErrors: e.target.checked
                    }
                  })
                }
                className="w-4 h-4"
              />
              <label htmlFor="skipErrors" className="text-gray-900">
                Skip Errors
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dataOnly"
                checked={config.sqlConfig?.dataOnly || false}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    sqlConfig: {
                      ...config.sqlConfig,
                      dataOnly: e.target.checked,
                      schemaOnly: false
                    }
                  })
                }
                className="w-4 h-4"
              />
              <label htmlFor="dataOnly" className="text-gray-900">
                Data Only
              </label>
            </div>
          </div>
        </div>
      </CellCard>

      <div className="flex justify-end">
        <CellButton onClick={handleNext} variant="primary">
          <Database className="w-4 h-4 mr-2" />
          Import SQL Data
        </CellButton>
      </div>
    </div>
  );
}

// Shared Faker types configuration
const FAKER_TYPES = [
  { value: "number.int", label: "Integer (Auto-increment)" },
  { value: "string.uuid", label: "UUID" },
  { value: "person.firstName", label: "First Name" },
  { value: "person.lastName", label: "Last Name" },
  { value: "person.fullName", label: "Full Name" },
  { value: "internet.email", label: "Email Address" },
  { value: "internet.userName", label: "Username" },
  { value: "internet.password", label: "Password" },
  { value: "internet.url", label: "URL" },
  { value: "phone.number", label: "Phone Number" },
  { value: "location.streetAddress", label: "Street Address" },
  { value: "location.city", label: "City" },
  { value: "location.state", label: "State" },
  { value: "location.zipCode", label: "Zip Code" },
  { value: "location.country", label: "Country" },
  { value: "company.name", label: "Company Name" },
  { value: "lorem.sentence", label: "Sentence" },
  { value: "lorem.paragraph", label: "Paragraph" },
  { value: "date.past", label: "Past Date" },
  { value: "date.future", label: "Future Date" },
  { value: "date.birthdate", label: "Birthdate" },
  { value: "number.float", label: "Decimal Number" },
  { value: "datatype.boolean", label: "Boolean (true/false)" },
  { value: "finance.amount", label: "Currency Amount" },
  { value: "finance.creditCardNumber", label: "Credit Card Number" },
];

// JSON Generator Configuration with Faker
function JsonGeneratorConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [outputPath, setOutputPath] = useState(config.jsonGenerator?.outputPath || "");
  const [recordCount, setRecordCount] = useState(config.jsonGenerator?.recordCount || 100);
  const [fields, setFields] = useState<Array<{name: string; fakerType: string}>>(
    config.jsonGenerator?.fields || [
      { name: "id", fakerType: "number.int" },
      { name: "name", fakerType: "person.fullName" },
      { name: "email", fakerType: "internet.email" },
    ]
  );

  const addField = () => {
    setFields([...fields, { name: `field_${fields.length + 1}`, fakerType: "person.fullName" }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: 'name' | 'fakerType', value: string) => {
    const newFields = [...fields];
    newFields[index][field] = value;
    setFields(newFields);
  };

  const handleNext = () => {
    onConfigChange({
      ...config,
      jsonGenerator: {
        outputPath,
        recordCount,
        fields,
      },
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Generate JSON File</h3>
        <p className="text-gray-600">
          Create a JSON file with realistic test data using Faker
        </p>
      </div>

      {/* Output Path */}
      <CellCard className="p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output File Path <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={outputPath}
            onChange={(e) => setOutputPath(e.target.value)}
            className="cell-input px-3 py-2"
            placeholder="C:\data\test-data.json or /path/to/test-data.json"
          />
          <p className="text-xs text-gray-500 mt-1">
            Full path where the JSON file will be saved
          </p>
        </div>
      </CellCard>

      {/* Record Count */}
      <CellCard className="p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Records <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={recordCount}
            onChange={(e) => setRecordCount(parseInt(e.target.value))}
            className="cell-input px-3 py-2"
            placeholder="100"
            min="1"
            max="100000"
          />
        </div>
      </CellCard>

      {/* Field Schema */}
      <CellCard className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Field Schema</h4>
            <p className="text-xs text-gray-600">Define the fields and data types for your JSON objects</p>
          </div>
          <CellButton onClick={addField} variant="secondary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </CellButton>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(index, 'name', e.target.value)}
                  className="cell-input px-3 py-2 text-sm"
                  placeholder="Field name"
                />
              </div>
              <div className="flex-2">
                <select
                  value={field.fakerType}
                  onChange={(e) => updateField(index, 'fakerType', e.target.value)}
                  className="cell-input px-3 py-2 text-sm"
                >
                  {FAKER_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <CellButton
                onClick={() => removeField(index)}
                variant="danger"
                size="sm"
                disabled={fields.length === 1}
              >
                Remove
              </CellButton>
            </div>
          ))}
        </div>
      </CellCard>

      {/* Preview Info */}
      <CellCard className="p-4 bg-green-50 border-2 border-green-200">
        <div className="flex items-start">
          <Zap className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-green-900 mb-1">What will be generated:</h4>
            <ul className="text-xs text-green-800 space-y-1">
              <li>• JSON file at: <code className="bg-green-100 px-1 py-0.5 rounded">{outputPath || "(path not set)"}</code></li>
              <li>• Array of {recordCount} objects</li>
              <li>• {fields.length} fields per object with realistic test data</li>
            </ul>
          </div>
        </div>
      </CellCard>
    </div>
  );
}

// CSV Generator Configuration with Faker
function CsvGeneratorConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [outputPath, setOutputPath] = useState(config.csvGenerator?.outputPath || "");
  const [recordCount, setRecordCount] = useState(config.csvGenerator?.recordCount || 100);
  const [columns, setColumns] = useState<Array<{name: string; fakerType: string}>>(
    config.csvGenerator?.columns || [
      { name: "id", fakerType: "number.int" },
      { name: "name", fakerType: "person.fullName" },
      { name: "email", fakerType: "internet.email" },
    ]
  );

  const addColumn = () => {
    setColumns([...columns, { name: `column_${columns.length + 1}`, fakerType: "person.fullName" }]);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: 'name' | 'fakerType', value: string) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleNext = () => {
    onConfigChange({
      ...config,
      csvGenerator: {
        outputPath,
        recordCount,
        columns,
      },
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-12 w-12 mx-auto text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Generate CSV File</h3>
        <p className="text-gray-600">
          Create a CSV file with realistic test data using Faker
        </p>
      </div>

      {/* Output Path */}
      <CellCard className="p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output File Path <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={outputPath}
            onChange={(e) => setOutputPath(e.target.value)}
            className="cell-input px-3 py-2"
            placeholder="C:\data\test-data.csv or /path/to/test-data.csv"
          />
          <p className="text-xs text-gray-500 mt-1">
            Full path where the CSV file will be saved
          </p>
        </div>
      </CellCard>

      {/* Record Count */}
      <CellCard className="p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Records <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={recordCount}
            onChange={(e) => setRecordCount(parseInt(e.target.value))}
            className="cell-input px-3 py-2"
            placeholder="100"
            min="1"
            max="100000"
          />
        </div>
      </CellCard>

      {/* Column Schema */}
      <CellCard className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Column Schema</h4>
            <p className="text-xs text-gray-600">Define the columns and data types for your CSV file</p>
          </div>
          <CellButton onClick={addColumn} variant="secondary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </CellButton>
        </div>

        <div className="space-y-3">
          {columns.map((column, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={column.name}
                  onChange={(e) => updateColumn(index, 'name', e.target.value)}
                  className="cell-input px-3 py-2 text-sm"
                  placeholder="Column name"
                />
              </div>
              <div className="flex-2">
                <select
                  value={column.fakerType}
                  onChange={(e) => updateColumn(index, 'fakerType', e.target.value)}
                  className="cell-input px-3 py-2 text-sm"
                >
                  {FAKER_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <CellButton
                onClick={() => removeColumn(index)}
                variant="danger"
                size="sm"
                disabled={columns.length === 1}
              >
                Remove
              </CellButton>
            </div>
          ))}
        </div>
      </CellCard>

      {/* Preview Info */}
      <CellCard className="p-4 bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start">
          <Zap className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-900 mb-1">What will be generated:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• CSV file at: <code className="bg-blue-100 px-1 py-0.5 rounded">{outputPath || "(path not set)"}</code></li>
              <li>• Header row with column names</li>
              <li>• {recordCount} data rows</li>
              <li>• {columns.length} columns with realistic test data</li>
            </ul>
          </div>
        </div>
      </CellCard>
    </div>
  );
}

// SQLite Generator Configuration with Faker
function SqliteGeneratorConfig({
  config,
  onConfigChange,
  onNext,
}: ImportMethodConfigProps) {
  const [outputPath, setOutputPath] = useState(config.sqliteGenerator?.outputPath || "");
  const [tableName, setTableName] = useState(config.sqliteGenerator?.tableName || "users");
  const [recordCount, setRecordCount] = useState(config.sqliteGenerator?.recordCount || 100);
  const [columns, setColumns] = useState<Array<{name: string; fakerType: string}>>(
    config.sqliteGenerator?.columns || [
      { name: "id", fakerType: "number.int" },
      { name: "name", fakerType: "person.fullName" },
      { name: "email", fakerType: "internet.email" },
    ]
  );

  const addColumn = () => {
    setColumns([...columns, { name: `column_${columns.length + 1}`, fakerType: "person.fullName" }]);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: 'name' | 'fakerType', value: string) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleNext = () => {
    onConfigChange({
      ...config,
      sqliteGenerator: {
        outputPath,
        tableName,
        recordCount,
        columns,
      },
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Database className="h-12 w-12 mx-auto text-purple-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Generate SQLite Database</h3>
        <p className="text-gray-600">
          Create a SQLite database file with realistic test data using Faker
        </p>
      </div>

      {/* Output Path */}
      <CellCard className="p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output File Path <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={outputPath}
            onChange={(e) => setOutputPath(e.target.value)}
            className="cell-input px-3 py-2"
            placeholder="C:\data\test-database.sqlite or /path/to/test-database.sqlite"
          />
          <p className="text-xs text-gray-500 mt-1">
            Full path where the SQLite database file will be saved
          </p>
        </div>
      </CellCard>

      {/* Table Configuration */}
      <CellCard className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Table Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="cell-input px-3 py-2"
              placeholder="users"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Records <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={recordCount}
              onChange={(e) => setRecordCount(parseInt(e.target.value))}
              className="cell-input px-3 py-2"
              placeholder="100"
              min="1"
              max="100000"
            />
          </div>
        </div>
      </CellCard>

      {/* Column Schema */}
      <CellCard className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-sm font-bold text-gray-900">Column Schema</h4>
            <p className="text-xs text-gray-600">Define the columns and data types for your table</p>
          </div>
          <CellButton onClick={addColumn} variant="secondary" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </CellButton>
        </div>

        <div className="space-y-3">
          {columns.map((column, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={column.name}
                  onChange={(e) => updateColumn(index, 'name', e.target.value)}
                  className="cell-input px-3 py-2 text-sm"
                  placeholder="Column name"
                />
              </div>
              <div className="flex-2">
                <select
                  value={column.fakerType}
                  onChange={(e) => updateColumn(index, 'fakerType', e.target.value)}
                  className="cell-input px-3 py-2 text-sm"
                >
                  {FAKER_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <CellButton
                onClick={() => removeColumn(index)}
                variant="danger"
                size="sm"
                disabled={columns.length === 1}
              >
                Remove
              </CellButton>
            </div>
          ))}
        </div>
      </CellCard>

      {/* Preview Info */}
      <CellCard className="p-4 bg-purple-50 border-2 border-purple-200">
        <div className="flex items-start">
          <Zap className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-purple-900 mb-1">What will be generated:</h4>
            <ul className="text-xs text-purple-800 space-y-1">
              <li>• SQLite database file at: <code className="bg-purple-100 px-1 py-0.5 rounded">{outputPath || "(path not set)"}</code></li>
              <li>• Table: <code className="bg-purple-100 px-1 py-0.5 rounded">{tableName}</code> with {recordCount} records</li>
              <li>• {columns.length} columns with realistic test data</li>
            </ul>
          </div>
        </div>
      </CellCard>

      {/* No button here - workflow uses Review button at bottom */}
    </div>
  );
}

// Main configuration component
export default function ImportMethodConfigs(props: ImportMethodConfigProps) {
  const { dataSourceType, importMethod} = props;

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
    case "custom-schema":
      return <MockDataConfig {...props} />;
    case "custom-script":
      return <JavaScriptCustomScriptConfig {...props} />;
    case "scheduled-script":
      return <JavaScriptScheduledScriptConfig {...props} />;
    case "sql-import":
      return <SQLFileConfig {...props} />;
    case "faker-sqlite":
      return <SqliteGeneratorConfig {...props} />;
    case "faker-json":
      return <JsonGeneratorConfig {...props} />;
    case "faker-csv":
      return <CsvGeneratorConfig {...props} />;
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
