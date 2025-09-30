"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Database,
  FileText,
  Zap,
  Code,
  Upload,
  Settings,
  Play,
  Eye,
  Calendar,
} from "lucide-react";
import PageLayout from "../../components/layout/PageLayout";
import CellButton from "../../components/ui/CellButton";
import CellCard from "../../components/ui/CellCard";
import CellInput from "../../components/ui/CellInput";
import CellModal from "../../components/ui/CellModal";
import MockDataGenerator from "../../components/sources/MockDataGenerator";
import { DataProvider, DataProviderType } from "../../types";

const sourceTypeIcons: Record<DataProviderType, React.ComponentType<any>> = {
  csv: FileText,
  json: FileText,
  sql_dump: Database,
  api_script: Code,
  mock: Zap,
  mysql: Database,
  postgres: Database,
  sqlite: Database,
  javascript: Code,
  sql: Database,
};

const sourceTypeColors: Record<DataProviderType, string> = {
  csv: "text-blue-400",
  json: "text-green-400",
  sql_dump: "text-purple-400",
  api_script: "text-orange-400",
  mock: "text-yellow-400",
  mysql: "text-red-400",
  postgres: "text-indigo-400",
  sqlite: "text-gray-400",
  javascript: "text-yellow-400",
  sql: "text-purple-400",
};

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataProvider[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [createType, setCreateType] = useState<DataProviderType>("csv");

  const handleCreateSource = (sourceData: Partial<DataProvider>) => {
    const newSource: DataProvider = {
      id: `source_${Date.now()}`,
      projectId: "default",
      name: sourceData.name || "New Source",
      type: createType,
      config: sourceData.config || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "idle",
    };

    setSources([...sources, newSource]);
    setShowCreateModal(false);
    setShowMockModal(false);
    setShowScriptModal(false);
  };

  const handleMockDataGenerate = (template: any, recordCount: number) => {
    handleCreateSource({
      name: `Mock ${template.name}`,
      type: "mock",
      config: {
        mockConfig: {
          templateId: template.id,
          recordCount,
          schema: {
            columns: template.fields.map((f: string) => ({
              name: f,
              type: "string",
              nullable: true,
            })),
          },
          dataTypes: template.fields.reduce(
            (acc: any, field: string) => ({ ...acc, [field]: "string" }),
            {}
          ),
        },
      },
    });
  };

  return (
    <PageLayout
      title="Data Sources"
      subtitle="Connect and import your data"
      icon={Database}
      showNavigation={true}
      showBackButton={true}
      backButtonText="Back to Home"
      backButtonHref="/"
      headerActions={
        <CellButton
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Source
        </CellButton>
      }
    >

      {sources.length === 0 ? (
        // Empty State
        <CellCard className="p-12 text-center">
            <Database className="w-20 h-20 mx-auto mb-6 text-gray-600" />
            <h2 className="text-heading mb-4 text-white">No Data Sources Connected</h2>
            <p className="text-body text-gray-400 mb-8 max-w-2xl mx-auto">
              Connect your data sources to start building ETL pipelines. Import
              files, connect databases, or generate mock data for testing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <CellCard className="p-6">
                <Upload className="w-10 h-10 mx-auto mb-4 text-blue-400" />
                <h3 className="font-mono font-bold mb-2 text-white">Upload Files</h3>
                <p className="text-caption mb-4 text-gray-400">
                  CSV, JSON, and other structured data files
                </p>
                <CellButton size="sm" variant="accent" className="w-full">
                  Browse Files
                </CellButton>
              </CellCard>

              <CellCard className="p-6">
                <Database className="w-10 h-10 mx-auto mb-4 text-green-400" />
                <h3 className="font-mono font-bold mb-2 text-white">Connect Database</h3>
                <p className="text-caption mb-4 text-gray-400">
                  MySQL, PostgreSQL, SQLite connections
                </p>
                <CellButton size="sm" variant="success" className="w-full">
                  Connect DB
                </CellButton>
              </CellCard>

              <CellCard className="p-6">
                <Code className="w-10 h-10 mx-auto mb-4 text-orange-400" />
                <h3 className="font-mono font-bold mb-2 text-white">API Script</h3>
                <p className="text-caption mb-4 text-gray-400">Fetch data using JavaScript</p>
                <CellButton
                  size="sm"
                  variant="accent"
                  className="w-full"
                  onClick={() => setShowScriptModal(true)}
                >
                  Write Script
                </CellButton>
              </CellCard>

              <CellCard className="p-6">
                <Zap className="w-10 h-10 mx-auto mb-4 text-yellow-400" />
                <h3 className="font-mono font-bold mb-2 text-white">Mock Data</h3>
                <p className="text-caption mb-4 text-gray-400">Generate sample datasets</p>
                <CellButton
                  size="sm"
                  variant="accent"
                  className="w-full"
                  onClick={() => setShowMockModal(true)}
                >
                  Generate Data
                </CellButton>
              </CellCard>
            </div>

            <CellButton
              variant="accent"
              size="lg"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Data Source
            </CellButton>
          </CellCard>
      ) : (
        // Sources List
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sources.map((source) => {
              const Icon = sourceTypeIcons[source.type];
              const colorClass = sourceTypeColors[source.type];

              return (
                <CellCard key={source.id} className="p-6 hover:border-blue-500 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-800 border-2 border-gray-700 rounded">
                        <Icon className={`w-6 h-6 ${colorClass}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-mono font-bold text-lg mb-1 text-white">
                          {source.name}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-2 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-600/30 rounded">
                            {source.type.toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-mono rounded border ${
                              source.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-600/30' :
                              source.status === 'running' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-600/30' :
                              source.status === 'error' ? 'bg-red-500/20 text-red-300 border-red-600/30' :
                              'bg-gray-500/20 text-gray-300 border-gray-600/30'
                            }`}
                          >
                            {source.status?.toUpperCase() || "IDLE"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <CellButton variant="secondary" size="sm">
                        <Eye className="w-4 h-4" />
                      </CellButton>
                      <CellButton variant="secondary" size="sm">
                        <Settings className="w-4 h-4" />
                      </CellButton>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {source.lastSyncAt && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-caption text-gray-400">
                          Last sync: {source.lastSyncAt.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {source.type === "mock" && source.config.mockConfig && (
                      <div className="text-caption text-gray-400">
                        {source.config.mockConfig.recordCount} records
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <CellButton variant="accent" size="sm" className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Sync Now
                    </CellButton>
                    <CellButton
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Browse Data
                    </CellButton>
                  </div>
                </CellCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Source Modal */}
      <CellModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Data Source"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-subheading mb-4">Choose Source Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(
                ["csv", "json", "mysql", "api_script"] as DataProviderType[]
              ).map((type) => {
                const Icon = sourceTypeIcons[type];
                const isSelected = createType === type;
                return (
                  <CellCard
                    key={type}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-accent-50 border-accent"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setCreateType(type)}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-caption text-center font-mono font-bold">
                      {type.toUpperCase()}
                    </p>
                  </CellCard>
                );
              })}
            </div>
          </div>

          <CellInput
            label="Source Name"
            placeholder="e.g., Customer Database"
          />

          <div className="flex justify-end space-x-3">
            <CellButton
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </CellButton>
            <CellButton variant="primary">Add Source</CellButton>
          </div>
        </div>
      </CellModal>

      {/* Mock Data Modal */}
      <CellModal
        isOpen={showMockModal}
        onClose={() => setShowMockModal(false)}
        title="Generate Mock Data"
        size="lg"
      >
        <MockDataGenerator onGenerate={handleMockDataGenerate} />
      </CellModal>

      {/* API Script Modal */}
      <CellModal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        title="Create API Script Data Source"
        size="xl"
      >
        <ApiScriptBuilder onSave={handleCreateSource} />
      </CellModal>
    </PageLayout>
  );
}

// API Script Builder Component
interface ApiScriptBuilderProps {
  onSave: (sourceData: Partial<DataProvider>) => void;
}

function ApiScriptBuilder({ onSave }: ApiScriptBuilderProps) {
  const [scriptName, setScriptName] = useState("");
  const [script, setScript] = useState(`// Fetch data from an API
async function fetchData() {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  
  // Transform data if needed
  return data.map(item => ({
    id: item.id,
    name: item.name,
    // ... map your fields
  }));
}

// Export the fetch function
module.exports = { fetchData };`);

  const handleSave = () => {
    if (!scriptName.trim()) return;

    onSave({
      name: scriptName,
      type: "api_script",
      config: {
        customScriptConfig: {
          language: "javascript",
          code: script,
          schedule: "0 */6 * * *", // Every 6 hours
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <CellInput
          label="Script Name"
          placeholder="e.g., Customer API Loader"
          value={scriptName}
          onChange={(e) => setScriptName(e.target.value)}
        />
      </div>

      <div>
        <label className="text-label mb-2 block">JavaScript Code</label>
        <div className="border-2 border-black bg-gray-50 h-80 font-mono text-sm">
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full h-full p-4 bg-transparent resize-none outline-none"
            placeholder="Write your data fetching script..."
          />
        </div>
        <p className="text-caption mt-2">
          Your script should export a{" "}
          <code className="font-mono bg-gray-100 px-1">fetchData</code> function
          that returns an array of objects.
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        <CellButton variant="secondary">Cancel</CellButton>
        <CellButton
          variant="primary"
          onClick={handleSave}
          disabled={!scriptName.trim()}
        >
          Save Script
        </CellButton>
      </div>
    </div>
  );
}
