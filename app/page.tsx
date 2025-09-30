"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "../components/layout/PageLayout";
import CellButton from "../components/ui/CellButton";
import CellCard from "../components/ui/CellCard";
import CellModal from "../components/ui/CellModal";
import StatusBadge from "../components/ui/StatusBadge";
import { useDataSources } from "../contexts/DataSourceContext";
import { Database, FileText, Zap, Settings, Plus, Play, Home, ArrowRight } from "lucide-react";

function HomePageContent() {
  const router = useRouter();
  const { dataSources, snapshots, addDataSource, addSnapshot } =
    useDataSources();

  return (
    <PageLayout
      title="Manifold ETL"
      subtitle="Data Pipeline Management"
      icon={Home}
      showNavigation={true}
    >

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Data Sources */}
        <CellCard className="p-6">
          <h2 className="text-subheading mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Data Sources ({dataSources.length})
          </h2>

          {dataSources.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="font-mono text-sm mb-4 text-gray-400">
                No data sources configured
              </p>
              <p className="text-caption mb-6 text-gray-500">
                Add your first data source to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {dataSources.slice(0, 3).map((source) => (
                <div
                  key={source.id}
                  className="p-3 border-2 border-gray-700 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 cursor-pointer hover:border-blue-500 hover:shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)] transition-all group rounded-md"
                  onClick={() => router.push(`/data?source=${source.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/data?source=${source.id}`);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-mono text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                        {source.name}
                      </p>
                      <p className="text-caption text-gray-500">
                        {source.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge 
                        status={
                          source.status === "completed" ? "completed" : 
                          source.status === "running" ? "pending" : 
                          source.status === "error" ? "failed" : "paused"
                        }
                        label={source.status}
                      />
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
              {dataSources.length > 3 && (
                <button
                  onClick={() => router.push('/data')}
                  className="text-caption text-center text-gray-500 hover:text-blue-400 hover:underline w-full py-2 cursor-pointer transition-colors font-mono"
                >
                  +{dataSources.length - 3} more sources • View all
                </button>
              )}
            </div>
          )}

          <div className="space-y-2">
            <CellButton
              className="w-full"
              variant="primary"
              onClick={() => router.push("/add-data-source")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Data Source
            </CellButton>
          </div>
        </CellCard>

        {/* Pipelines */}
        <CellCard className="p-6">
          <h2 className="text-subheading mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Pipelines
          </h2>

          <div className="text-center py-8">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="font-mono text-sm mb-4 text-gray-400">No pipelines created</p>
            <p className="text-caption mb-6 text-gray-500">
              Create data transformation pipelines
            </p>
          </div>

          <CellButton className="w-full" variant="secondary" disabled>
            Build Pipeline
            <span className="text-caption ml-2 text-gray-500">(Add data sources first)</span>
          </CellButton>
        </CellCard>

        {/* Jobs */}
        <CellCard className="p-6">
          <h2 className="text-subheading mb-4 flex items-center">
            <Play className="w-5 h-5 mr-2" />
            Scheduled Jobs
          </h2>

          <div className="text-center py-8">
            <Play className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="font-mono text-sm mb-4 text-gray-400">No jobs scheduled</p>
            <p className="text-caption mb-6 text-gray-500">Automate your data processing</p>
          </div>

          <CellButton className="w-full" variant="secondary" disabled>
            Schedule Job
            <span className="text-caption ml-2 text-gray-500">(Create pipelines first)</span>
          </CellButton>
        </CellCard>
      </div>

      {/* Data Snapshots */}
      <CellCard className="p-6">
        <h2 className="text-subheading mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Data Snapshots ({snapshots.length})
        </h2>

        {snapshots.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="font-mono text-lg mb-2 text-gray-400">No data imported yet</p>
            <p className="text-caption mb-8 max-w-md mx-auto text-gray-500">
              Data snapshots will appear here when you import data from your
              sources. Each import creates a versioned snapshot that you can
              compare and rollback.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshots.slice(0, 6).map((snapshot) => {
                const dataSource = dataSources.find(
                  (ds) => ds.id === snapshot.dataSourceId
                );
                return (
                  <div
                    key={snapshot.id}
                    className="p-4 border-2 border-gray-700 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-md hover:border-blue-500 hover:shadow-[2px_2px_0px_0px_rgba(59,130,246,0.2)] transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono text-sm font-bold text-white">
                          {dataSource?.name || "Unknown Source"}
                        </p>
                        <p className="text-caption text-gray-500">
                          v{snapshot.version}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-600/30 rounded">
                        {snapshot.recordCount} rows
                      </span>
                    </div>
                    <p className="text-caption text-gray-500">
                      {new Date(snapshot.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
            {snapshots.length > 6 && (
              <p className="text-caption text-center text-gray-500 hover:text-blue-400 transition-colors">
                +{snapshots.length - 6} more snapshots
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-2 border-gray-700 p-4 text-center rounded-md hover:border-blue-500 transition-all shadow-cell">
            <FileText className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <p className="font-mono text-sm font-bold text-white">CSV Files</p>
            <p className="text-caption text-gray-500">Import structured data</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-2 border-gray-700 p-4 text-center rounded-md hover:border-green-500 transition-all shadow-cell">
            <Database className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="font-mono text-sm font-bold text-white">Database</p>
            <p className="text-caption text-gray-500">Connect to live data</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-2 border-gray-700 p-4 text-center rounded-md hover:border-yellow-500 transition-all shadow-cell">
            <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <p className="font-mono text-sm font-bold text-white">Mock Data</p>
            <p className="text-caption text-gray-500">Generate test datasets</p>
          </div>
        </div>
      </CellCard>

      {/* Quick Start Guide */}
      <div className="mt-8">
        <CellCard className="p-6">
          <h2 className="text-subheading mb-4 text-white font-mono">Getting Started with ETL</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-700 text-white border-2 border-blue-900 shadow-[2px_2px_0px_0px_rgba(30,58,138,0.5)] flex items-center justify-center font-bold text-xl rounded-lg">
                1
              </div>
              <h3 className="font-mono font-bold mb-2 text-white">Add Data Sources</h3>
              <p className="text-caption mb-3 text-gray-400">
                Import CSV files, connect to databases, or generate mock data
              </p>
              <CellButton
                size="sm"
                variant="accent"
                onClick={() => router.push("/add-data-source")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </CellButton>
            </div>

            <div className="text-center opacity-40">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-700 text-gray-400 border-2 border-gray-600 shadow-cell flex items-center justify-center font-bold text-xl rounded-lg">
                2
              </div>
              <h3 className="font-mono font-bold mb-2 text-gray-400">Build Pipelines</h3>
              <p className="text-caption mb-3 text-gray-600">
                Create transformation steps to clean and merge data
              </p>
              <CellButton size="sm" variant="secondary" disabled>
                Build Pipeline
              </CellButton>
            </div>

            <div className="text-center opacity-40">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-700 text-gray-400 border-2 border-gray-600 shadow-cell flex items-center justify-center font-bold text-xl rounded-lg">
                3
              </div>
              <h3 className="font-mono font-bold mb-2 text-gray-400">Schedule Jobs</h3>
              <p className="text-caption mb-3 text-gray-600">
                Automate your data processing with cron schedules
              </p>
              <CellButton size="sm" variant="secondary" disabled>
                Schedule Job
              </CellButton>
            </div>

            <div className="text-center opacity-40">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-700 text-gray-400 border-2 border-gray-600 shadow-cell flex items-center justify-center font-bold text-xl rounded-lg">
                4
              </div>
              <h3 className="font-mono font-bold mb-2 text-gray-400">Export Data</h3>
              <p className="text-caption mb-3 text-gray-600">
                Send processed data to files, APIs, or databases
              </p>
              <CellButton size="sm" variant="secondary" disabled>
                Export Data
              </CellButton>
            </div>
          </div>
        </CellCard>
      </div>
    </PageLayout>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
