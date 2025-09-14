"use client";

import { DataSource, DataSourceType } from "../../types";
import {
  Plus,
  FileText,
  Database,
  Code,
  Globe,
  Play,
  Eye,
  Trash2,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import Button from "../ui/Button";
import DataView from "../data/DataView";

interface DataSourcesPanelProps {
  dataSources: DataSource[];
  onAddSource: () => void;
  onRunSource: (source: DataSource) => void;
  onViewData?: (source: DataSource) => void;
  onEditSource?: (source: DataSource) => void;
  onDeleteSource?: (source: DataSource) => void;
  selectedSource?: DataSource | null;
  sourceData?: any[];
}

export default function DataSourcesPanel({
  dataSources,
  onAddSource,
  onRunSource,
  onViewData,
  onEditSource,
  onDeleteSource,
  selectedSource,
  sourceData,
}: DataSourcesPanelProps) {
  const getDataSourceIcon = (type: DataSourceType) => {
    switch (type) {
      case "file":
        return <FileText className="h-4 w-4" />;
      case "sql_dump":
        return <Database className="h-4 w-4" />;
      case "custom_script":
        return <Code className="h-4 w-4" />;
      case "api":
        return <Globe className="h-4 w-4" />;
      case "mock":
        return <Database className="h-4 w-4" />;
      case "mysql":
        return <Database className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDataSourceTypeLabel = (type: DataSourceType) => {
    switch (type) {
      case "file":
        return "File Upload";
      case "sql_dump":
        return "SQL Dump";
      case "custom_script":
        return "Custom Script";
      case "api":
        return "API Endpoint";
      case "mock":
        return "Mock Data";
      case "mysql":
        return "MySQL Database";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="lg:col-span-2">
      <div className="card rounded-2xl">
        <div className="px-6 py-4 border-b border-white border-opacity-10">
          <div className="flex justify-between items-center">
            <h2 className="text-subheading text-white">Data Sources</h2>
            <Button onClick={onAddSource} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>
        </div>

        <div className="p-6">
          {dataSources.length === 0 ? (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-white text-opacity-40 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No Data Sources
              </h3>
              <p className="text-white text-opacity-60 mb-6">
                Add your first data source to get started
              </p>
              <Button onClick={onAddSource} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Data Source
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {dataSources.map((source) => (
                <div
                  key={source.id}
                  className="card p-4 hover:card-elevated transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg btn-primary mr-3">
                        {getDataSourceIcon(source.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">
                          {source.name}
                        </h3>
                        <p className="text-sm text-white text-opacity-60">
                          {getDataSourceTypeLabel(source.type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-white text-opacity-60">
                        {source.status}
                      </span>
                      {onViewData && (
                        <Button
                          onClick={() => onViewData(source)}
                          size="sm"
                          variant="ghost"
                          icon={<Eye className="h-4 w-4" />}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        onClick={() => onRunSource(source)}
                        size="sm"
                        variant="ghost"
                        icon={<Play className="h-4 w-4" />}
                      >
                        Run
                      </Button>
                      {onEditSource && (
                        <Button
                          onClick={() => onEditSource(source)}
                          size="sm"
                          variant="ghost"
                          icon={<Edit3 className="h-4 w-4" />}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          Edit
                        </Button>
                      )}
                      {onDeleteSource && (
                        <Button
                          onClick={() => onDeleteSource(source)}
                          size="sm"
                          variant="ghost"
                          icon={<Trash2 className="h-4 w-4" />}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data View */}
      {selectedSource && sourceData && (
        <div className="mt-6">
          <DataView
            data={sourceData}
            columns={Object.keys(sourceData[0] || {})}
            title={`${selectedSource.name} Data`}
          />
        </div>
      )}
    </div>
  );
}
