"use client";

import React, { useState } from "react";
import {
  Database,
  Settings,
  Plus,
  Play,
  FileText,
  BarChart3,
  Users,
  ShoppingCart,
  Plus as PlusIcon,
  Trash2,
  Edit3,
} from "lucide-react";
import {
  mockDataProvider,
  MockDataConfig,
} from "../../lib/providers/MockDataProvider";
import { clientLogger } from "../../lib/utils/ClientLogger";
import { Project, DataProvider, TableSchema } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";

// Column types for custom schema
type ColumnType =
  | "string"
  | "number"
  | "date"
  | "boolean"
  | "email"
  | "phone"
  | "url"
  | "address"
  | "name"
  | "company";

interface CustomColumn {
  name: string;
  type: ColumnType;
  nullable: boolean;
  unique: boolean;
}

const COLUMN_TYPES: {
  value: ColumnType;
  label: string;
  description: string;
}[] = [
  { value: "string", label: "Text", description: "Generic text field" },
  { value: "number", label: "Number", description: "Numeric values" },
  { value: "date", label: "Date", description: "Date and time values" },
  { value: "boolean", label: "Boolean", description: "True/false values" },
  { value: "email", label: "Email", description: "Email addresses" },
  { value: "phone", label: "Phone", description: "Phone numbers" },
  { value: "url", label: "URL", description: "Web URLs" },
  { value: "address", label: "Address", description: "Street addresses" },
  { value: "name", label: "Name", description: "Person names" },
  { value: "company", label: "Company", description: "Company names" },
];

// Map extended column types to basic ColumnSchema types
const mapColumnType = (
  type: ColumnType
): "string" | "number" | "boolean" | "date" => {
  switch (type) {
    case "string":
    case "email":
    case "phone":
    case "url":
    case "address":
    case "name":
    case "company":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "date";
    default:
      return "string";
  }
};

interface MockDataProviderProps {
  project: Project;
  onDataSourceCreated?: (dataSource: DataProvider) => void;
  embedded?: boolean; // If true, only show the content without the wrapper and modal
}

const MockDataProviderComponent: React.FC<MockDataProviderProps> = ({
  project,
  onDataSourceCreated,
  embedded = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customConfig, setCustomConfig] = useState<MockDataConfig>({
    templateId: "user-data",
    recordCount: 100,
    schema: {
      columns: [
        { name: "id", type: "number", nullable: false, unique: true },
        { name: "name", type: "string", nullable: false },
        { name: "created_at", type: "date", nullable: false },
      ],
    },
    dataTypes: {
      id: "number",
      name: "string",
      created_at: "date",
    },
  });
  const [dataSourceName, setDataSourceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([
    { name: "id", type: "number", nullable: false, unique: true },
    { name: "name", type: "string", nullable: false, unique: false },
  ]);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [editingColumn, setEditingColumn] = useState<CustomColumn | null>(null);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number>(-1);

  const templates = mockDataProvider.getTemplates();

  // Column management functions
  const addColumn = () => {
    setEditingColumn({
      name: "",
      type: "string",
      nullable: false,
      unique: false,
    });
    setEditingColumnIndex(-1);
    setShowColumnEditor(true);
  };

  const editColumn = (index: number) => {
    setEditingColumn({ ...customColumns[index] });
    setEditingColumnIndex(index);
    setShowColumnEditor(true);
  };

  const deleteColumn = (index: number) => {
    if (customColumns.length > 1) {
      setCustomColumns((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const saveColumn = (column: CustomColumn) => {
    if (editingColumnIndex >= 0) {
      // Edit existing column
      setCustomColumns((prev) =>
        prev.map((col, i) => (i === editingColumnIndex ? column : col))
      );
    } else {
      // Add new column
      setCustomColumns((prev) => [...prev, column]);
    }
    setShowColumnEditor(false);
    setEditingColumn(null);
    setEditingColumnIndex(-1);
  };

  const updateCustomConfig = () => {
    const dataTypes: Record<string, string> = {};
    customColumns.forEach((col) => {
      dataTypes[col.name] = col.type;
    });

    setCustomConfig({
      templateId: customConfig.templateId,
      recordCount: customConfig.recordCount,
      schema: {
        columns: customColumns.map((col) => ({
          name: col.name,
          type: mapColumnType(col.type),
          nullable: col.nullable,
          unique: col.unique,
        })),
      },
      dataTypes: Object.fromEntries(
        Object.entries(dataTypes).map(([key, value]) => [
          key,
          mapColumnType(value as ColumnType),
        ])
      ),
    });
  };

  // Update custom config when columns change
  React.useEffect(() => {
    if (selectedTemplate === "") {
      updateCustomConfig();
    }
  }, [customColumns, customConfig.recordCount]);

  const handleCreateDataSource = async () => {
    if (!dataSourceName.trim()) {
      clientLogger.warn(
        "Data source name is required",
        "ui",
        {},
        "MockDataProvider"
      );
      return;
    }

    try {
      setLoading(true);

      const config =
        selectedTemplate && templates[selectedTemplate]
          ? templates[selectedTemplate]
          : customConfig;

      const dataSource = await mockDataProvider.createMockDataSource(
        project.id,
        dataSourceName,
        config
      );

      if (onDataSourceCreated) {
        onDataSourceCreated(dataSource);
      }

      clientLogger.success(
        "Mock data source created",
        "data-processing",
        {
          dataSourceId: dataSource.id,
          dataSourceName: dataSource.name,
          recordCount: config.recordCount,
        },
        "MockDataProvider"
      );

      setShowModal(false);
      setDataSourceName("");
      setSelectedTemplate("");
    } catch (error) {
      clientLogger.error(
        "Failed to create mock data source",
        "data-processing",
        { error },
        "MockDataProvider"
      );
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (templateName: string) => {
    switch (templateName) {
      case "customers":
        return <Users className="h-5 w-5" />;
      case "products":
        return <ShoppingCart className="h-5 w-5" />;
      case "sales":
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const getTemplateDescription = (templateName: string) => {
    switch (templateName) {
      case "customers":
        return "Customer data with names, emails, phone numbers, and addresses";
      case "products":
        return "Product catalog with names, prices, categories, and stock status";
      case "sales":
        return "Sales transactions with customer and product relationships";
      default:
        return "Custom data structure";
    }
  };

  // Column Editor Component
  const ColumnEditor = () => {
    if (!editingColumn) return null;

    const [column, setColumn] = useState<CustomColumn>(editingColumn);
    const [nameError, setNameError] = useState<string>("");

    const handleSave = () => {
      if (!column.name.trim()) {
        setNameError("Column name is required");
        return;
      }

      // Check for duplicate names
      const isDuplicate = customColumns.some(
        (col, index) =>
          col.name.toLowerCase() === column.name.toLowerCase() &&
          index !== editingColumnIndex
      );

      if (isDuplicate) {
        setNameError("Column name must be unique");
        return;
      }

      saveColumn(column);
    };

    return (
      <Modal
        isOpen={showColumnEditor}
        onClose={() => setShowColumnEditor(false)}
        title={editingColumnIndex >= 0 ? "Edit Column" : "Add Column"}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Column Name"
            value={column.name}
            onChange={(e) => {
              setColumn((prev) => ({ ...prev, name: e.target.value }));
              setNameError("");
            }}
            placeholder="e.g., email, age, created_at"
            error={nameError}
          />

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Data Type
            </label>
            <select
              value={column.type}
              onChange={(e) =>
                setColumn((prev) => ({
                  ...prev,
                  type: e.target.value as ColumnType,
                }))
              }
              className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COLUMN_TYPES.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                  className="bg-gray-800"
                >
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={column.nullable}
                onChange={(e) =>
                  setColumn((prev) => ({ ...prev, nullable: e.target.checked }))
                }
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <span className="text-white/70">Allow null values</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={column.unique}
                onChange={(e) =>
                  setColumn((prev) => ({ ...prev, unique: e.target.checked }))
                }
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <span className="text-white/70">Unique values only</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowColumnEditor(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingColumnIndex >= 0 ? "Update Column" : "Add Column"}
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  if (embedded) {
    return (
      <div className="space-y-6">
        <Input
          label="Data Source Name"
          value={dataSourceName}
          onChange={(e) => setDataSourceName(e.target.value)}
          placeholder="e.g., Customer Data, Product Catalog"
        />

        <div>
          <label className="block text-sm font-medium text-white/70 mb-3">
            Data Template
          </label>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setSelectedTemplate("")}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedTemplate === ""
                  ? "glass-button-primary"
                  : "glass-button hover:scale-105"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg glass-button-primary">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Custom Schema</p>
                  <p className="text-white/60 text-sm">
                    Define your own data structure
                  </p>
                </div>
              </div>
            </button>

            {Object.entries(templates).map(([name, template]) => (
              <button
                key={name}
                onClick={() => setSelectedTemplate(name)}
                className={`p-4 rounded-xl text-left transition-all ${
                  selectedTemplate === name
                    ? "glass-button-primary"
                    : "glass-button hover:scale-105"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg glass-button-primary">
                    {getTemplateIcon(name)}
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">{name}</p>
                    <p className="text-white/60 text-sm">
                      {getTemplateDescription(name)}
                    </p>
                    <p className="text-white/50 text-xs mt-1">
                      {template.recordCount} records •{" "}
                      {template.schema?.columns.length || 0} columns
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedTemplate && templates[selectedTemplate] && (
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-white font-medium mb-3">Template Preview</h4>
            <div className="space-y-2">
              {templates[selectedTemplate]?.schema?.columns.map((column) => (
                <div
                  key={column.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-white/70">{column.name}</span>
                  <span className="px-2 py-1 rounded text-xs glass-button-primary">
                    {column.type}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-white/60 text-sm">
                <strong>{templates[selectedTemplate]?.recordCount}</strong>{" "}
                records will be generated
              </p>
            </div>
          </div>
        )}

        {selectedTemplate === "" && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">Custom Schema</h4>
              <Button size="sm" onClick={addColumn}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </div>

            <div className="space-y-3 mb-4">
              <Input
                label="Number of Records"
                type="number"
                value={customConfig.recordCount}
                onChange={(e) =>
                  setCustomConfig((prev) => ({
                    ...prev,
                    recordCount: parseInt(e.target.value) || 100,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <h5 className="text-white/70 text-sm font-medium">
                Schema Columns
              </h5>
              {customColumns.map((column, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-medium">
                      {column.name}
                    </span>
                    <span className="px-2 py-1 rounded text-xs glass-button-primary">
                      {column.type}
                    </span>
                    {column.nullable && (
                      <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                        nullable
                      </span>
                    )}
                    {column.unique && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                        unique
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => editColumn(index)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Edit3 className="h-4 w-4 text-white/60" />
                    </button>
                    {customColumns.length > 1 && (
                      <button
                        onClick={() => deleteColumn(index)}
                        className="p-1 rounded hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            onClick={handleCreateDataSource}
            loading={loading}
            disabled={
              !dataSourceName.trim() ||
              (!selectedTemplate && selectedTemplate !== "")
            }
          >
            <Play className="h-4 w-4 mr-2" />
            Create Data Source
          </Button>
        </div>

        {/* Column Editor Modal */}
        <ColumnEditor />
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Mock Data Source</h3>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Data Source
          </Button>
        </div>

        <div className="text-center py-6">
          <Database className="mx-auto h-12 w-12 text-white/60 mb-4" />
          <p className="text-white/70 mb-4">
            Generate realistic mock data for testing and development
          </p>
          <p className="text-white/50 text-sm">
            Create sample datasets with customizable schemas and data types
          </p>
        </div>
      </div>

      {/* Create Data Source Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Mock Data Source"
        size="lg"
      >
        <div className="space-y-6">
          <Input
            label="Data Source Name"
            value={dataSourceName}
            onChange={(e) => setDataSourceName(e.target.value)}
            placeholder="e.g., Customer Data, Product Catalog"
          />

          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">
              Data Template
            </label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setSelectedTemplate("")}
                className={`p-4 rounded-xl text-left transition-all ${
                  selectedTemplate === ""
                    ? "glass-button-primary"
                    : "glass-button hover:scale-105"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg glass-button-primary">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Custom Schema</p>
                    <p className="text-white/60 text-sm">
                      Define your own data structure
                    </p>
                  </div>
                </div>
              </button>

              {Object.entries(templates).map(([name, template]) => (
                <button
                  key={name}
                  onClick={() => setSelectedTemplate(name)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedTemplate === name
                      ? "glass-button-primary"
                      : "glass-button hover:scale-105"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg glass-button-primary">
                      {getTemplateIcon(name)}
                    </div>
                    <div>
                      <p className="text-white font-medium capitalize">
                        {name}
                      </p>
                      <p className="text-white/60 text-sm">
                        {getTemplateDescription(name)}
                      </p>
                      <p className="text-white/50 text-xs mt-1">
                        {template.recordCount} records •{" "}
                        {template.schema?.columns.length || 0} columns
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedTemplate && templates[selectedTemplate] && (
            <div className="glass-card rounded-xl p-4">
              <h4 className="text-white font-medium mb-3">Template Preview</h4>
              <div className="space-y-2">
                {templates[selectedTemplate]?.schema?.columns.map((column) => (
                  <div
                    key={column.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-white/70">{column.name}</span>
                    <span className="px-2 py-1 rounded text-xs glass-button-primary">
                      {column.type}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-white/60 text-sm">
                  <strong>{templates[selectedTemplate]?.recordCount}</strong>{" "}
                  records will be generated
                </p>
              </div>
            </div>
          )}

          {selectedTemplate === "" && (
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-medium">Custom Schema</h4>
                <Button size="sm" onClick={addColumn}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>

              <div className="space-y-3 mb-4">
                <Input
                  label="Number of Records"
                  type="number"
                  value={customConfig.recordCount}
                  onChange={(e) =>
                    setCustomConfig((prev) => ({
                      ...prev,
                      recordCount: parseInt(e.target.value) || 100,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <h5 className="text-white/70 text-sm font-medium">
                  Schema Columns
                </h5>
                {customColumns.map((column, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-white font-medium">
                        {column.name}
                      </span>
                      <span className="px-2 py-1 rounded text-xs glass-button-primary">
                        {column.type}
                      </span>
                      {column.nullable && (
                        <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                          nullable
                        </span>
                      )}
                      {column.unique && (
                        <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                          unique
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => editColumn(index)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                      >
                        <Edit3 className="h-4 w-4 text-white/60" />
                      </button>
                      {customColumns.length > 1 && (
                        <button
                          onClick={() => deleteColumn(index)}
                          className="p-1 rounded hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateDataSource}
              loading={loading}
              disabled={
                !dataSourceName.trim() ||
                (!selectedTemplate && selectedTemplate !== "")
              }
            >
              <Play className="h-4 w-4 mr-2" />
              Create Data Source
            </Button>
          </div>
        </div>
      </Modal>

      {/* Column Editor Modal */}
      <ColumnEditor />
    </>
  );
};

export default MockDataProviderComponent;
