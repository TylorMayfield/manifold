"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Database,
  RefreshCw,
  AlertTriangle,
  GitBranch,
  History,
  GitCompare,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { CellButton, CellCard, CellInput, LoadingState, StatusBadge, EmptyState } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import { DataProvider } from '../../types';

interface DataSourceWithData {
  id: string;
  name: string;
  type: string;
  status: string;
  data: any[];
  totalCount: number;
  error?: string;
}

interface DataVersion {
  id: string;
  version: number;
  recordCount: number;
  createdAt: string;
  status: string;
  importType: string;
}

export default function DataBrowserPage() {
  const [dataSources, setDataSources] = useState<DataSourceWithData[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSourceWithData | null>(null);
  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DataVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<DataVersion | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showAllData, setShowAllData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { get } = useApi();
  
  useEffect(() => {
    loadDataSources();
  }, []);
  
  useEffect(() => {
    if (selectedSource) {
      loadVersions(selectedSource.id);
    }
  }, [selectedSource]);

  useEffect(() => {
    if (selectedSource && selectedVersion) {
      loadVersionData(selectedSource.id, selectedVersion.id);
    }
  }, [selectedVersion]);
  
  const loadDataSources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await get('/api/data-sources?projectId=default');
      if (response && Array.isArray(response)) {
        const sourcesWithData = await Promise.all(
          response.map(async (source: DataProvider) => {
            try {
              const dataResponse = await get(`/api/data-sources/${source.id}/data?limit=50`);
              return {
                id: source.id,
                name: source.name,
                type: source.type,
                status: source.status,
                data: dataResponse?.data || [],
                totalCount: dataResponse?.totalCount || 0,
                error: dataResponse?.error
              };
            } catch (error) {
              return {
                id: source.id,
                name: source.name,
                type: source.type,
                status: source.status,
                data: [],
                totalCount: 0,
                error: 'Failed to load data'
              };
            }
          })
        );
        setDataSources(sourcesWithData);
      }
    } catch (error) {
      setError('Failed to load data sources');
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (dataSourceId: string) => {
    try {
      const response = await get(`/api/snapshots?projectId=default&dataSourceId=${dataSourceId}`);
      if (response && Array.isArray(response)) {
        setVersions(response);
        if (response.length > 0) {
          setSelectedVersion(response[0]); // Select latest version
        }
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
      setVersions([]);
    }
  };

  const loadVersionData = async (dataSourceId: string, versionId: string) => {
    try {
      const limit = showAllData ? 999999 : pageSize * 5; // Load more for scrolling
      const dataResponse = await get(`/api/data-sources/${dataSourceId}/data?versionId=${versionId}&limit=${limit}`);
      
      if (dataResponse && selectedSource) {
        setSelectedSource({
          ...selectedSource,
          data: dataResponse.data || [],
          totalCount: dataResponse.totalCount || 0
        });
      }
    } catch (error) {
      console.error('Failed to load version data:', error);
    }
  };

  const filteredData = selectedSource?.data.filter(row => 
    Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = showAllData ? filteredData : filteredData.slice(startIndex, startIndex + pageSize);

  const getColumns = (data: any[]) => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  const getDiffForRow = (rowIndex: number) => {
    if (!compareVersion || !selectedVersion) return null;
    // Placeholder for diff logic - would need to load compare version data
    return null;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'csv': case 'json': return <FileText className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  return (
    <PageLayout
      title="Data Browser"
      subtitle="Explore your imported data with version history"
      icon={Database}
      showBackButton={true}
      headerActions={
        <div className="flex items-center space-x-2">
          {selectedSource && (
            <>
              <CellButton variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </CellButton>
              {showDiff && compareVersion && (
                <CellButton 
                  variant="accent" 
                  size="sm"
                  onClick={() => setShowDiff(false)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Exit Diff Mode
                </CellButton>
              )}
            </>
          )}
          <CellButton 
            variant="secondary" 
            size="sm"
            onClick={loadDataSources}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </CellButton>
        </div>
      }
    >

      {loading ? (
        <LoadingState variant="page" message="Loading data sources..." />
      ) : error ? (
        <CellCard className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-heading mb-4 text-white">Error Loading Data</h2>
          <p className="text-body text-gray-400 mb-6">{error}</p>
          <CellButton onClick={loadDataSources} variant="accent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </CellButton>
        </CellCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Data Sources Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Data Sources List */}
            <CellCard className="p-4">
              <h2 className="text-subheading mb-4 text-white font-mono">Data Sources</h2>
              
              {dataSources.length === 0 ? (
                <EmptyState
                  icon={Database}
                  title="No data sources"
                  description="Add data sources to explore your data"
                />
              ) : (
                <div className="space-y-2">
                  {dataSources.map((source) => (
                    <div
                      key={source.id}
                      className={`p-3 border-2 rounded-md cursor-pointer transition-all ${
                        selectedSource?.id === source.id 
                          ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-500 shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)]' 
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedSource(source)}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {getTypeIcon(source.type)}
                        <span className="font-bold text-sm text-white">{source.name}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        <div>{source.type.toUpperCase()}</div>
                        <div>
                          {source.error ? (
                            <span className="text-red-400">Error loading</span>
                          ) : (
                            `${source.totalCount.toLocaleString()} records`
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CellCard>

            {/* Version History */}
            {selectedSource && versions.length > 0 && (
              <CellCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    Version History
                  </h3>
                  <span className="text-xs text-gray-500">{versions.length} versions</span>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-2 border-2 rounded cursor-pointer transition-all ${
                        selectedVersion?.id === version.id
                          ? 'bg-purple-900/40 border-purple-500'
                          : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-white">
                          v{version.version}
                        </span>
                        <StatusBadge 
                          status={version.status === 'completed' ? 'completed' : 'pending'} 
                          label={version.status}
                        />
                      </div>
                      <div className="text-xs text-gray-400">
                        {version.recordCount.toLocaleString()} rows
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleString()}
                      </div>
                      {compareVersion?.id !== version.id && selectedVersion?.id !== version.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompareVersion(version);
                            setShowDiff(true);
                          }}
                          className="mt-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          <GitCompare className="w-3 h-3 inline mr-1" />
                          Compare
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </CellCard>
            )}
          </div>

          {/* Data Viewer */}
          <div className="lg:col-span-3">
            {!selectedSource ? (
              <EmptyState
                icon={Eye}
                title="Select a Data Source"
                description="Choose a data source from the sidebar to browse its data and version history."
              />
            ) : (
              <CellCard className="p-6">
                {/* Table Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-subheading font-bold text-white font-mono">{selectedSource.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-caption text-gray-400">
                        Type: {selectedSource.type.toUpperCase()}
                      </p>
                      <span className="text-gray-700">•</span>
                      <p className="text-caption text-gray-400">
                        {selectedSource.totalCount.toLocaleString()} total records
                      </p>
                      {selectedVersion && (
                        <>
                          <span className="text-gray-700">•</span>
                          <span className="text-xs font-mono text-purple-400">
                            Viewing v{selectedVersion.version}
                          </span>
                        </>
                      )}
                    </div>
                    {selectedSource.error && (
                      <p className="text-caption text-red-400 mt-1">
                        ⚠️ {selectedSource.error}
                      </p>
                    )}
                  </div>
                
                  <div className="flex items-center space-x-2">
                    <CellInput
                      placeholder="Search data..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-48"
                    />
                    <CellButton 
                      variant="secondary" 
                      size="sm"
                      onClick={() => setShowAllData(!showAllData)}
                    >
                      <Maximize2 className="w-4 h-4 mr-1" />
                      {showAllData ? 'Paginate' : 'View All'}
                    </CellButton>
                    {versions.length > 1 && !showDiff && (
                      <CellButton 
                        variant="accent" 
                        size="sm"
                        onClick={() => setShowDiff(true)}
                      >
                        <GitCompare className="w-4 h-4 mr-1" />
                        Diff Mode
                      </CellButton>
                    )}
                  </div>
                </div>

                {showDiff && compareVersion && (
                  <div className="mb-4 p-3 bg-blue-500/10 border-2 border-blue-600/30 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GitCompare className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-mono text-white">
                          Comparing: v{selectedVersion?.version} ↔ v{compareVersion.version}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-xs font-mono"
                          value={compareVersion.id}
                          onChange={(e) => {
                            const version = versions.find(v => v.id === e.target.value);
                            if (version) setCompareVersion(version);
                          }}
                        >
                          {versions
                            .filter(v => v.id !== selectedVersion?.id)
                            .map(v => (
                              <option key={v.id} value={v.id}>
                                v{v.version} - {v.recordCount} rows
                              </option>
                            ))}
                        </select>
                        <CellButton 
                          variant="secondary" 
                          size="sm"
                          onClick={() => {
                            setShowDiff(false);
                            setCompareVersion(null);
                          }}
                        >
                          Close
                        </CellButton>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Table */}
                {selectedSource.error ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                    <p className="text-body text-gray-400">{selectedSource.error}</p>
                  </div>
                ) : selectedSource.data.length === 0 ? (
                  <EmptyState
                    icon={Database}
                    title="No Data Available"
                    description="This data source doesn't have any data yet. Try syncing or importing data."
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-gray-700 bg-gray-900">
                        <thead>
                          <tr className="bg-gray-800 border-b-2 border-gray-700">
                            {getColumns(paginatedData).map((column) => (
                              <th
                                key={column}
                                className="px-4 py-3 text-left text-xs font-bold font-mono text-gray-300 border-r-2 border-gray-700 last:border-r-0"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                            >
                              {getColumns(paginatedData).map((column) => (
                                <td
                                  key={column}
                                  className="px-4 py-3 text-sm font-mono text-gray-300 border-r border-gray-700 last:border-r-0"
                                >
                                  {String(row[column] ?? '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {!showAllData && totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-400 font-mono">
                          Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length}
                          {searchTerm && ' (filtered)'}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <CellButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </CellButton>
                          
                          <span className="text-sm font-mono text-gray-400">
                            Page {currentPage} of {totalPages}
                          </span>
                          
                          <CellButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </CellButton>

                          <select
                            className="ml-4 px-3 py-1.5 bg-gray-900 border-2 border-gray-700 rounded text-white text-sm font-mono"
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                          >
                            <option value={10}>10 rows</option>
                            <option value={25}>25 rows</option>
                            <option value={50}>50 rows</option>
                            <option value={100}>100 rows</option>
                            <option value={500}>500 rows</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {showAllData && (
                      <div className="mt-4 text-center text-sm font-mono text-gray-400">
                        Showing all {filteredData.length} rows
                      </div>
                    )}
                  </>
                )}
              </CellCard>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
