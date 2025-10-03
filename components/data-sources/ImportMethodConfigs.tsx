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
  const [variables, setVariables] = useState<Record<string, any>>(
    config.javascriptConfig?.variables || {}
  );
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

  const handleVariablesChange = (key: string, value: string) => {
    const newVariables = { ...variables, [key]: value };
    setVariables(newVariables);
    onConfigChange({
      ...config,
      javascriptConfig: {
        ...config.javascriptConfig,
        variables: newVariables,
      },
    });
  };

  const addVariable = () => {
    const newKey = `variable_${Object.keys(variables).length + 1}`;
    handleVariablesChange(newKey, "");
  };

  const removeVariable = (key: string) => {
    const newVariables = { ...variables };
    delete newVariables[key];
    setVariables(newVariables);
    onConfigChange({
      ...config,
      javascriptConfig: {
        ...config.javascriptConfig,
        variables: newVariables,
      },
    });
  };

  const handleNext = () => {
    onConfigChange({
      ...config,
      javascriptConfig: {
        ...config.javascriptConfig,
        script,
        variables,
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
          Environment Variables
        </label>
        <p className="text-caption text-gray-600 mb-4">
          Define variables that will be available in your script context.
        </p>
        
        <div className="space-y-2">
          {Object.entries(variables).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  const newVariables = { ...variables };
                  delete newVariables[key];
                  newVariables[e.target.value] = value;
                  setVariables(newVariables);
                }}
                className="cell-input flex-1 px-3 py-2"
                placeholder="Variable name"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => handleVariablesChange(key, e.target.value)}
                className="cell-input flex-2 px-3 py-2"
                placeholder="Variable value"
              />
              <CellButton
                variant="danger"
                size="sm"
                onClick={() => removeVariable(key)}
              >
                Remove
              </CellButton>
            </div>
          ))}
        </div>
        
        <CellButton
          variant="ghost"
          size="sm"
          onClick={addVariable}
          className="mt-2"
        >
          Add Variable
        </CellButton>
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
    case "custom-script":
      return <JavaScriptCustomScriptConfig {...props} />;
    case "scheduled-script":
      return <JavaScriptScheduledScriptConfig {...props} />;
    case "sql-import":
      return <SQLFileConfig {...props} />;
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
