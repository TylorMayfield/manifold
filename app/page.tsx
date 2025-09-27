"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CellButton from "../components/ui/CellButton";
import CellCard from "../components/ui/CellCard";
import CellModal from "../components/ui/CellModal";
import { useDataSources } from "../contexts/DataSourceContext";
import { Database, FileText, Zap, Settings, Plus, Play } from "lucide-react";

function HomePageContent() {
  const router = useRouter();
  const { dataSources, snapshots, addDataSource, addSnapshot } =
    useDataSources();

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <header className="cell-nav mb-8">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-heading font-bold">Manifold ETL</h1>
            <span className="text-caption">Data Pipeline Management</span>
          </div>
          <div className="flex items-center space-x-2">
            <CellButton variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </CellButton>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="cell-nav mb-8">
        <div className="flex">
          <button className="cell-nav-item active">
            <Database className="w-4 h-4 mr-2" />
            Sources
          </button>
          <a href="/pipelines" className="cell-nav-item">
            <Zap className="w-4 h-4 mr-2" />
            Pipelines
          </a>
          <a href="/jobs" className="cell-nav-item">
            <Play className="w-4 h-4 mr-2" />
            Jobs
          </a>
          <a href="/snapshots" className="cell-nav-item">
            <FileText className="w-4 h-4 mr-2" />
            Snapshots
          </a>
          <a href="/logs" className="cell-nav-item">
            <FileText className="w-4 h-4 mr-2" />
            Logs
          </a>
          <a href="/settings" className="cell-nav-item">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Data Sources */}
        <CellCard className="p-6">
          <h2 className="text-subheading mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Data Sources ({dataSources.length})
          </h2>

          {dataSources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-mono text-sm mb-4">
                No data sources configured
              </p>
              <p className="text-caption mb-6">
                Add your first data source to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {dataSources.slice(0, 3).map((source) => (
                <div
                  key={source.id}
                  className="p-3 border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm font-bold">
                        {source.name}
                      </p>
                      <p className="text-caption text-gray-600">
                        {source.type} • {source.status}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-mono ${
                        source.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : source.status === "running"
                          ? "bg-yellow-100 text-yellow-800"
                          : source.status === "error"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {source.status}
                    </span>
                  </div>
                </div>
              ))}
              {dataSources.length > 3 && (
                <p className="text-caption text-center text-gray-500">
                  +{dataSources.length - 3} more sources
                </p>
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

          <div className="text-center py-8 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-mono text-sm mb-4">No pipelines created</p>
            <p className="text-caption mb-6">
              Create data transformation pipelines
            </p>
          </div>

          <CellButton className="w-full" variant="ghost" disabled>
            Build Pipeline
            <span className="text-caption ml-2">(Add data sources first)</span>
          </CellButton>
        </CellCard>

        {/* Jobs */}
        <CellCard className="p-6">
          <h2 className="text-subheading mb-4 flex items-center">
            <Play className="w-5 h-5 mr-2" />
            Scheduled Jobs
          </h2>

          <div className="text-center py-8 text-gray-500">
            <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-mono text-sm mb-4">No jobs scheduled</p>
            <p className="text-caption mb-6">Automate your data processing</p>
          </div>

          <CellButton className="w-full" variant="ghost" disabled>
            Schedule Job
            <span className="text-caption ml-2">(Create pipelines first)</span>
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
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-mono text-lg mb-2">No data imported yet</p>
            <p className="text-caption mb-8 max-w-md mx-auto">
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
                    className="p-4 border border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono text-sm font-bold">
                          {dataSource?.name || "Unknown Source"}
                        </p>
                        <p className="text-caption text-gray-600">
                          v{snapshot.version}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-mono bg-blue-100 text-blue-800">
                        {snapshot.recordCount} rows
                      </span>
                    </div>
                    <p className="text-caption text-gray-600">
                      {new Date(snapshot.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
            {snapshots.length > 6 && (
              <p className="text-caption text-center text-gray-500">
                +{snapshots.length - 6} more snapshots
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="cell-card p-4 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="font-mono text-sm font-bold">CSV Files</p>
            <p className="text-caption">Import structured data</p>
          </div>

          <div className="cell-card p-4 text-center">
            <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="font-mono text-sm font-bold">Database</p>
            <p className="text-caption">Connect to live data</p>
          </div>

          <div className="cell-card p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="font-mono text-sm font-bold">Mock Data</p>
            <p className="text-caption">Generate test datasets</p>
          </div>
        </div>
      </CellCard>

      {/* Quick Start Guide */}
      <div className="mt-8">
        <CellCard className="p-6">
          <h2 className="text-subheading mb-4">Getting Started with ETL</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-accent text-white border-2 border-black shadow-cell flex items-center justify-center font-bold text-xl">
                1
              </div>
              <h3 className="font-mono font-bold mb-2">Add Data Sources</h3>
              <p className="text-caption mb-3">
                Import CSV files, connect to databases, or generate mock data
              </p>
              <CellButton
                size="sm"
                variant="primary"
                onClick={() => router.push("/add-data-source")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </CellButton>
            </div>

            <div className="text-center opacity-50">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-300 text-gray-600 border-2 border-black shadow-cell flex items-center justify-center font-bold text-xl">
                2
              </div>
              <h3 className="font-mono font-bold mb-2">Build Pipelines</h3>
              <p className="text-caption mb-3">
                Create transformation steps to clean and merge data
              </p>
              <CellButton size="sm" variant="ghost" disabled>
                Build Pipeline
              </CellButton>
            </div>

            <div className="text-center opacity-50">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-300 text-gray-600 border-2 border-black shadow-cell flex items-center justify-center font-bold text-xl">
                3
              </div>
              <h3 className="font-mono font-bold mb-2">Schedule Jobs</h3>
              <p className="text-caption mb-3">
                Automate your data processing with cron schedules
              </p>
              <CellButton size="sm" variant="ghost" disabled>
                Schedule Job
              </CellButton>
            </div>

            <div className="text-center opacity-50">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-300 text-gray-600 border-2 border-black shadow-cell flex items-center justify-center font-bold text-xl">
                4
              </div>
              <h3 className="font-mono font-bold mb-2">Export Data</h3>
              <p className="text-caption mb-3">
                Send processed data to files, APIs, or databases
              </p>
              <CellButton size="sm" variant="ghost" disabled>
                Export Data
              </CellButton>
            </div>
          </div>
        </CellCard>
      </div>
    </div>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
