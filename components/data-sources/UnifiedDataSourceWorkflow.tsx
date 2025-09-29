"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  FileText,
  Globe,
  Code,
  Cloud,
  Upload,
  Download,
  Zap,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Settings,
} from "lucide-react";
import CellButton from "../ui/CellButton";
import CellCard from "../ui/CellCard";
import { DataProvider, DataProviderType } from "../../types";
import { useDataSources } from "../../contexts/DataSourceContext";
import ImportMethodConfigs from "./ImportMethodConfigs";

// Step 1: Data Source Type Selection
interface DataSourceTypeOption {
  id: DataProviderType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  importMethods: ImportMethod[];
}

// Step 2: Import Method Selection
interface ImportMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  configComponent?: React.ComponentType<ImportMethodConfigProps>;
}

// Step 3: Configuration
interface ImportMethodConfigProps {
  dataSourceType: DataProviderType;
  importMethod: ImportMethod;
  config: any;
  onConfigChange: (config: any) => void;
  onNext: () => void;
  onBack: () => void;
}

// Workflow Steps
type WorkflowStep =
  | "type-selection"
  | "import-method"
  | "configuration"
  | "summary";

interface UnifiedDataSourceWorkflowProps {
  projectId: string;
  onComplete?: (dataSource: DataProvider) => void;
  onCancel?: () => void;
}

export default function UnifiedDataSourceWorkflow({
  projectId,
  onComplete,
  onCancel,
}: UnifiedDataSourceWorkflowProps) {
  const router = useRouter();
  const { addDataSource } = useDataSources();

  // Workflow state
  const [currentStep, setCurrentStep] =
    useState<WorkflowStep>("type-selection");
  const [selectedType, setSelectedType] = useState<DataProviderType | null>(
    null
  );
  const [selectedImportMethod, setSelectedImportMethod] =
    useState<ImportMethod | null>(null);
  const [dataSourceConfig, setDataSourceConfig] = useState<any>({});
  const [dataSourceName, setDataSourceName] = useState("");
  const [loading, setLoading] = useState(false);

  // Data source type options with their available import methods
  const dataSourceTypes: DataSourceTypeOption[] = [
    {
      id: "mysql",
      name: "MySQL Database",
      description: "Connect to MySQL databases for real-time data access",
      icon: <Database className="h-6 w-6" />,
      color: "bg-blue-500",
      importMethods: [
        {
          id: "direct-connection",
          name: "Direct Connection",
          description: "Connect directly to MySQL database",
          icon: <Database className="h-5 w-5" />,
        },
        {
          id: "sql-dump-import",
          name: "SQL Dump Import",
          description: "Import data from MySQL dump files",
          icon: <Upload className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "csv",
      name: "CSV File",
      description: "Import data from CSV files with flexible parsing options",
      icon: <FileText className="h-6 w-6" />,
      color: "bg-green-500",
      importMethods: [
        {
          id: "file-upload",
          name: "File Upload",
          description: "Upload CSV files directly to the platform",
          icon: <Upload className="h-5 w-5" />,
        },
        {
          id: "url-import",
          name: "URL Import",
          description: "Import CSV files from web URLs",
          icon: <Download className="h-5 w-5" />,
        },
        {
          id: "path-import",
          name: "Local Path",
          description: "Import from local file system paths",
          icon: <FileText className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "json",
      name: "JSON File",
      description: "Import structured data from JSON files",
      icon: <FileText className="h-6 w-6" />,
      color: "bg-purple-500",
      importMethods: [
        {
          id: "file-upload",
          name: "File Upload",
          description: "Upload JSON files directly",
          icon: <Upload className="h-5 w-5" />,
        },
        {
          id: "url-import",
          name: "URL Import",
          description: "Import JSON from web URLs",
          icon: <Download className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "api_script",
      name: "API Endpoint",
      description: "Connect to REST APIs and web services",
      icon: <Globe className="h-6 w-6" />,
      color: "bg-orange-500",
      importMethods: [
        {
          id: "rest-api",
          name: "REST API",
          description: "Connect to REST API endpoints",
          icon: <Globe className="h-5 w-5" />,
        },
        {
          id: "graphql-api",
          name: "GraphQL API",
          description: "Connect to GraphQL endpoints",
          icon: <Zap className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "mock",
      name: "Mock Data",
      description: "Generate sample data for testing and development",
      icon: <Cloud className="h-6 w-6" />,
      color: "bg-gray-500",
      importMethods: [
        {
          id: "template-based",
          name: "Template Based",
          description: "Generate data from predefined templates",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          id: "custom-schema",
          name: "Custom Schema",
          description: "Define custom data schemas",
          icon: <Code className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "javascript",
      name: "JavaScript Script",
      description: "Execute custom JavaScript code to fetch and process data",
      icon: <Code className="h-6 w-6" />,
      color: "bg-yellow-500",
      importMethods: [
        {
          id: "custom-script",
          name: "Custom Script",
          description: "Write JavaScript code to fetch and transform data",
          icon: <Code className="h-5 w-5" />,
        },
        {
          id: "scheduled-script",
          name: "Scheduled Script",
          description: "Run JavaScript code at specified intervals",
          icon: <Settings className="h-5 w-5" />,
        },
      ],
    },
    {
      id: "sql",
      name: "SQL Import",
      description: "Import data from SQL dump files or raw SQL statements",
      icon: <Database className="h-6 w-6" />,
      color: "bg-purple-500",
      importMethods: [
        {
          id: "sql-import",
          name: "SQL File Import",
          description: "Import from SQL dump files or paste SQL statements",
          icon: <Upload className="h-5 w-5" />,
        },
      ],
    },
  ];

  // Step navigation handlers
  const handleTypeSelection = (type: DataProviderType) => {
    setSelectedType(type);
    setCurrentStep("import-method");
  };

  const handleImportMethodSelection = (method: ImportMethod) => {
    setSelectedImportMethod(method);
    setCurrentStep("configuration");
  };

  const handleConfigurationComplete = () => {
    setCurrentStep("summary");
  };

  const handleBack = () => {
    switch (currentStep) {
      case "import-method":
        setCurrentStep("type-selection");
        setSelectedType(null);
        break;
      case "configuration":
        setCurrentStep("import-method");
        setSelectedImportMethod(null);
        break;
      case "summary":
        setCurrentStep("configuration");
        break;
    }
  };

  const handleCreateDataSource = async () => {
    if (!selectedType || !selectedImportMethod || !dataSourceName.trim()) {
      return;
    }

    setLoading(true);
    try {
      const dataSource: DataProvider = {
        id: `${selectedType}_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        projectId,
        name: dataSourceName.trim(),
        type: selectedType,
        config: {
          importMethod: selectedImportMethod.id,
          ...dataSourceConfig,
        },
        status: "idle",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDataSource(dataSource);

      if (onComplete) {
        onComplete(dataSource);
      } else {
        router.push(`/project/${projectId}/data-sources`);
      }
    } catch (error) {
      console.error("Failed to create data source:", error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: "type-selection", label: "Select Type" },
      { key: "import-method", label: "Import Method" },
      { key: "configuration", label: "Configure" },
      { key: "summary", label: "Review" },
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted =
            steps.findIndex((s) => s.key === currentStep) > index;

          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  isActive ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTypeSelection = () => {
    const selectedTypeOption = dataSourceTypes.find(
      (t) => t.id === selectedType
    );

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-heading font-bold mb-2">
            Choose Data Source Type
          </h2>
          <p className="text-body text-gray-600">
            Select the type of data source you want to connect
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSourceTypes.map((type) => (
            <CellCard
              key={type.id}
              className="p-6 cursor-pointer hover:bg-gray-50 transition-all duration-200 group"
              onClick={() => handleTypeSelection(type.id)}
            >
              <div className="flex items-center mb-4">
                <div
                  className={`p-3 border-2 border-black shadow-cell text-white mr-4 group-hover:shadow-cell-sm group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all duration-100 ${type.color}`}
                >
                  {type.icon}
                </div>
                <div>
                  <h3 className="text-subheading font-bold">
                    {type.name}
                  </h3>
                  <p className="text-caption text-gray-600">
                    {type.importMethods.length} import method
                    {type.importMethods.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
              <p className="text-body text-gray-600 mb-4">{type.description}</p>
              <div className="flex flex-wrap gap-1">
                {type.importMethods.slice(0, 2).map((method) => (
                  <span
                    key={method.id}
                    className="px-2 py-1 border border-black bg-gray-100 text-gray-600 text-caption font-mono"
                  >
                    {method.name}
                  </span>
                ))}
                {type.importMethods.length > 2 && (
                  <span className="px-2 py-1 border border-black bg-gray-100 text-gray-600 text-caption font-mono">
                    +{type.importMethods.length - 2} more
                  </span>
                )}
              </div>
            </CellCard>
          ))}
        </div>
      </div>
    );
  };

  const renderImportMethodSelection = () => {
    const selectedTypeOption = dataSourceTypes.find(
      (t) => t.id === selectedType
    );
    if (!selectedTypeOption) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div
              className={`p-3 border-2 border-black shadow-cell text-white mr-4 ${selectedTypeOption.color}`}
            >
              {selectedTypeOption.icon}
            </div>
            <div>
              <h2 className="text-heading font-bold">
                {selectedTypeOption.name}
              </h2>
              <p className="text-body text-gray-600">Choose how to import your data</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedTypeOption.importMethods.map((method) => (
            <CellCard
              key={method.id}
              className="p-6 cursor-pointer hover:bg-gray-50 transition-all duration-200"
              onClick={() => handleImportMethodSelection(method)}
            >
              <div className="flex items-center mb-4">
                <div className="p-2 border border-black bg-gray-100 mr-4">
                  {method.icon}
                </div>
                <div>
                  <h3 className="text-subheading font-bold">
                    {method.name}
                  </h3>
                </div>
              </div>
              <p className="text-body text-gray-600">{method.description}</p>
            </CellCard>
          ))}
        </div>
      </div>
    );
  };

  const renderConfiguration = () => {
    if (!selectedType || !selectedImportMethod) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-heading font-bold mb-2">
            Configure {selectedType} Import
          </h2>
          <p className="text-body text-gray-600">
            Set up your {selectedImportMethod.name.toLowerCase()} configuration
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <CellCard className="p-6">
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-body font-bold text-gray-700 mb-2">
                  Data Source Name
                </label>
                <input
                  type="text"
                  value={dataSourceName}
                  onChange={(e) => setDataSourceName(e.target.value)}
                  className="cell-input px-3 py-2"
                  placeholder="Enter a name for your data source"
                />
              </div>
            </div>

            <ImportMethodConfigs
              dataSourceType={selectedType}
              importMethod={selectedImportMethod.id}
              config={dataSourceConfig}
              onConfigChange={setDataSourceConfig}
              onNext={handleConfigurationComplete}
              onBack={() => setCurrentStep("import-method")}
            />
          </CellCard>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const selectedTypeOption = dataSourceTypes.find(
      (t) => t.id === selectedType
    );

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-heading font-bold mb-2">
            Review Your Data Source
          </h2>
          <p className="text-body text-gray-600">
            Confirm your settings before creating the data source
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <CellCard className="p-6">
            <div className="flex items-center mb-6">
              <div
                className={`p-3 border-2 border-black shadow-cell text-white mr-4 ${selectedTypeOption?.color}`}
              >
                {selectedTypeOption?.icon}
              </div>
              <div>
                <h3 className="text-subheading font-bold">
                  {dataSourceName || "Unnamed Data Source"}
                </h3>
                <p className="text-body text-gray-600">{selectedTypeOption?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b-2 border-black">
                <span className="text-body text-gray-600">Type:</span>
                <span className="text-body font-bold font-mono">{selectedTypeOption?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-black">
                <span className="text-body text-gray-600">Import Method:</span>
                <span className="text-body font-bold font-mono">
                  {selectedImportMethod?.name}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-body text-gray-600">Project:</span>
                <span className="text-body font-bold font-mono">{projectId}</span>
              </div>
            </div>
          </CellCard>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "type-selection":
        return renderTypeSelection();
      case "import-method":
        return renderImportMethodSelection();
      case "configuration":
        return renderConfiguration();
      case "summary":
        return renderSummary();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <CellCard className="p-8">
          {renderCurrentStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t-2 border-black">
            <CellButton
              onClick={handleBack}
              variant="ghost"
              disabled={currentStep === "type-selection"}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </CellButton>

            <div className="flex space-x-3">
              {currentStep === "summary" ? (
                <CellButton
                  onClick={handleCreateDataSource}
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Data Source
                    </>
                  )}
                </CellButton>
              ) : currentStep === "configuration" ? (
                <CellButton
                  onClick={handleConfigurationComplete}
                  variant="primary"
                  disabled={!dataSourceName.trim()}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Review
                </CellButton>
              ) : null}
            </div>
          </div>
        </CellCard>
    </div>
  );
}
