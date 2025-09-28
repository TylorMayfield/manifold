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
  AlertTriangle
} from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import CellButton from '../../components/ui/CellButton';
import CellCard from '../../components/ui/CellCard';
import CellInput from '../../components/ui/CellInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
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

export default function DataBrowserPage() {
  const [dataSources, setDataSources] = useState<DataSourceWithData[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSourceWithData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { get } = useApi();
  
  useEffect(() => {
    loadDataSources();
  }, []);
  
  const loadDataSources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data sources
      const response = await get('/api/data-sources?projectId=default');
      if (response && Array.isArray(response)) {
        const sourcesWithData = await Promise.all(
          response.map(async (source: DataProvider) => {
            try {
              // Try to fetch sample data for each source
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
              console.error(`Failed to load data for source ${source.name}:`, error);
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
      } else {
        setDataSources([]);
      }
    } catch (error) {
      console.error('Failed to load data sources:', error);
      setError('Failed to load data sources');
      setDataSources([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = selectedSource?.data.filter(row => 
    Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const getColumns = (data: any[]) => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  return (
    <PageLayout
      title="Data Browser"
      subtitle="Explore your imported data"
      icon={Database}
      showBackButton={true}
      headerActions={
        <div className="flex items-center space-x-2">
          {selectedSource && (
            <CellButton variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </CellButton>
          )}
          <CellButton 
            variant="ghost" 
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
        <LoadingSpinner />
      ) : error ? (
        <CellCard className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-heading mb-4">Error Loading Data</h2>
          <p className="text-body text-gray-600 mb-6">{error}</p>
          <CellButton onClick={loadDataSources}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </CellButton>
        </CellCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Data Sources Sidebar */}
          <div className="lg:col-span-1">
            <CellCard className="p-4">
              <h2 className="text-subheading mb-4">Data Sources</h2>
              
              {dataSources.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-caption text-gray-600">No data sources found</p>
                  <p className="text-caption text-gray-500 mt-2">Add data sources to explore your data</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dataSources.map((source) => {
                    const getTypeIcon = (type: string) => {
                      switch (type) {
                        case 'csv': return <FileText className="w-4 h-4" />;
                        case 'mysql': return <Database className="w-4 h-4" />;
                        case 'json': return <FileText className="w-4 h-4" />;
                        case 'api_script': return <Database className="w-4 h-4" />;
                        default: return <Database className="w-4 h-4" />;
                      }
                    };
                    
                    return (
                      <div
                        key={source.id}
                        className={`p-3 border border-gray-300 rounded-md cursor-pointer transition-colors ${
                          selectedSource?.id === source.id 
                            ? 'bg-dark_cyan-600 text-white border-dark_cyan-600' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSource(source)}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {getTypeIcon(source.type)}
                          <span className="font-bold text-sm">{source.name}</span>
                        </div>
                        <div className="text-xs opacity-75">
                          <div>{source.type.toUpperCase()}</div>
                          <div>
                            {source.error ? (
                              <span className="text-red-400">Error loading</span>
                            ) : (
                              `${source.data.length} / ${source.totalCount} records`
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CellCard>
          </div>

          {/* Data Viewer */}
          <div className="lg:col-span-3">
            {!selectedSource ? (
              <CellCard className="p-12 text-center">
                <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-heading mb-4">Select a Data Source</h2>
                <p className="text-body text-gray-600">
                  Choose a data source from the sidebar to browse its data.
                </p>
              </CellCard>
            ) : (
              <CellCard className="p-6">
                {/* Table Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-subheading font-bold">{selectedSource.name}</h2>
                    <p className="text-caption text-gray-600">
                      Type: {selectedSource.type.toUpperCase()} • {selectedSource.totalCount} total records
                    </p>
                    {selectedSource.error && (
                      <p className="text-caption text-red-600 mt-1">
                        ⚠️ {selectedSource.error}
                      </p>
                    )}
                  </div>
                
                <div className="flex items-center space-x-4">
                  <CellInput
                    placeholder="Search data..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-64"
                  />
                  <CellButton variant="ghost" size="sm">
                    <Filter className="w-4 h-4" />
                  </CellButton>
                </div>
              </div>

                {/* Data Table */}
                {selectedSource.error ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                    <p className="text-body text-red-600">
                      Unable to load data from this source.
                    </p>
                    <p className="text-caption text-gray-600 mt-2">
                      {selectedSource.error}
                    </p>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-body text-gray-600">
                      {searchTerm ? 'No results found for your search.' : 'No data available.'}
                    </p>
                  </div>
              ) : (
                <div>
                  <div className="overflow-x-auto mb-6">
                    <table className="cell-table w-full">
                      <thead>
                        <tr>
                          {getColumns(paginatedData).map((column) => (
                            <th key={column}>
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((row, index) => (
                          <tr key={index}>
                            {getColumns(paginatedData).map((column) => (
                              <td key={column}>
                                {String(row[column] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-caption">
                        Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} results
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <CellButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </CellButton>
                        
                        <span className="font-mono text-sm px-3 py-1 border border-gray-300 bg-white rounded">
                          {currentPage} / {totalPages}
                        </span>
                        
                        <CellButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </CellButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CellCard>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}