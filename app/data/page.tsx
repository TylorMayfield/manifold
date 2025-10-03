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
  Zap,
  Edit,
  Trash2,
  Upload,
  History
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dataSourceToDelete, setDataSourceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const api = useApi();
  const { get } = api;
  
  useEffect(() => {
    loadDataSources();
  }, []);

  const loadSourceData = async (sourceId: string) => {
    if (!sourceId) return;
    
    try {
      const response = await get(`/api/data-sources/${sourceId}/data?limit=1000`);
      if (response && response.data) {
        // Update the selected source with the loaded data
        setDataSources(prev => prev.map(source => 
          source.id === sourceId 
            ? { ...source, data: response.data, totalCount: response.totalCount || response.data.length }
            : source
        ));
        
        // Update selected source
        if (selectedSource?.id === sourceId) {
          setSelectedSource(prev => prev ? { ...prev, data: response.data, totalCount: response.totalCount || response.data.length } : null);
        }
      }
    } catch (error) {
      console.error('Error loading source data:', error);
      // Mark the source with an error
      setDataSources(prev => prev.map(source => 
        source.id === sourceId 
          ? { ...source, error: 'Failed to load data' }
          : source
      ));
    }
  };
  
  const loadDataSources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data sources
      const response = await get('/api/data-sources?projectId=default');
      if (response && Array.isArray(response)) {
        // Just load data sources without fetching data yet
        const sourcesWithData = response.map((source: DataProvider) => ({
          id: source.id,
          name: source.name,
          type: source.type,
          status: source.status,
          data: [],
          totalCount: 0,
          error: null
        }));
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

  const handleDeleteDataSource = async () => {
    console.log('=== DELETE HANDLER CALLED ===');
    console.log('dataSourceToDelete:', dataSourceToDelete);
    console.log('isDeleting:', isDeleting);
    
    if (!dataSourceToDelete) {
      console.error('ERROR: No data source ID to delete!');
      alert('Error: No data source selected to delete');
      return;
    }
    
    if (isDeleting) {
      console.log('Already deleting, skipping...');
      return;
    }
    
    setIsDeleting(true);
    console.log('Starting deletion for:', dataSourceToDelete);
    
    try {
      console.log('Making DELETE request to:', `/api/data-sources?dataSourceId=${dataSourceToDelete}`);
      
      const response = await fetch(`/api/data-sources?dataSourceId=${dataSourceToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete failed with error:', errorText);
        throw new Error(`Failed to delete: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Delete successful, result:', result);
      
      // Remove from list
      setDataSources(prev => {
        const filtered = prev.filter(ds => ds.id !== dataSourceToDelete);
        console.log('Removed from list, remaining count:', filtered.length);
        return filtered;
      });
      
      // Clear selection if deleted source was selected
      if (selectedSource?.id === dataSourceToDelete) {
        console.log('Clearing selected source');
        setSelectedSource(null);
      }
      
      // Close modal
      setShowDeleteConfirm(false);
      setDataSourceToDelete(null);
      
      // Show success message
      alert('✅ Data source deleted successfully!');
      
    } catch (error) {
      console.error('=== DELETE ERROR ===');
      console.error('Error type:', error instanceof Error ? 'Error' : typeof error);
      console.error('Error details:', error);
      alert(`❌ Failed to delete data source: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      console.log('=== DELETE HANDLER COMPLETE ===');
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'csv': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'mysql': return <Database className="w-4 h-4 text-green-600" />;
      case 'json': return <FileText className="w-4 h-4 text-green-600" />;
      case 'api_script': return <Database className="w-4 h-4 text-orange-600" />;
      case 'mock': return <Zap className="w-4 h-4 text-purple-600" />;
      default: return <Database className="w-4 h-4 text-gray-600" />;
    }
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
        <LoadingSpinner />
      ) : error ? (
        <CellCard className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-heading mb-4 text-gray-900">Error Loading Data</h2>
          <p className="text-body text-gray-700 mb-6">{error}</p>
          <CellButton onClick={loadDataSources} variant="accent">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </CellButton>
        </CellCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Data Sources Sidebar */}
          <div className="lg:col-span-1">
            <CellCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-subheading text-gray-900">Data Sources</h2>
                {selectedSource && (
                  <div className="flex items-center space-x-1">
                    <CellButton
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Import button clicked! Modal state will be:', !showImportModal);
                        setShowImportModal(true);
                      }}
                      title="Import Data"
                    >
                      <Upload className="w-4 h-4" />
                    </CellButton>
                    <CellButton
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Edit button clicked!');
                        alert('Edit functionality coming soon');
                      }}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </CellButton>
                    <CellButton
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🗑️ Trash icon clicked');
                        console.log('Selected source:', selectedSource);
                        console.log('Setting dataSourceToDelete to:', selectedSource.id);
                        setDataSourceToDelete(selectedSource.id);
                        setShowDeleteConfirm(true);
                        console.log('Modal should now open');
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </CellButton>
                  </div>
                )}
              </div>
              
              {dataSources.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-caption text-gray-700">No data sources found</p>
                  <p className="text-caption text-gray-600 mt-2">Add data sources to explore your data</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dataSources.map((source) => (
                    <button
                      key={source.id}
                      className={`w-full p-3 border rounded-lg cursor-pointer transition-all text-left ${
                        selectedSource?.id === source.id 
                          ? 'bg-blue-50 border-blue-500 shadow-md' 
                          : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-sm'
                      }`}
                      onClick={() => {
                        setSelectedSource(source);
                        loadSourceData(source.id);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(source.type)}
                          <span className="font-bold text-sm text-gray-900">{source.name}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>{source.type.toUpperCase()}</div>
                        <div>
                          {source.error ? (
                            <span className="text-red-600">Error loading</span>
                          ) : source.totalCount > 0 ? (
                            `${source.totalCount.toLocaleString()} records`
                          ) : (
                            'Click to load data'
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CellCard>
            
      
          </div>

          {/* Data Viewer */}
          <div className="lg:col-span-3">
            {!selectedSource ? (
              <CellCard className="p-12 text-center">
                <Eye className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h2 className="text-heading mb-4 text-gray-900">Select a Data Source</h2>
                <p className="text-body text-gray-700">
                  Choose a data source from the sidebar to browse its data.
                </p>
              </CellCard>
            ) : (
              <CellCard className="p-6">
                {/* Table Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-subheading font-bold text-gray-900 font-mono">{selectedSource.name}</h2>
                    <p className="text-caption text-gray-700">
                      Type: {selectedSource.type.toUpperCase()} • {selectedSource.totalCount.toLocaleString()} total records
                    </p>
                    {selectedSource.error && (
                      <p className="text-caption text-red-400 mt-1">
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
                  <CellButton variant="secondary" size="sm">
                    <Filter className="w-4 h-4" />
                  </CellButton>
                </div>
              </div>

                {/* Data Table */}
                {selectedSource.error ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                    <p className="text-body text-red-400">
                      Unable to load data from this source.
                    </p>
                    <p className="text-caption text-red-600 mt-2">
                      {selectedSource.error}
                    </p>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-body text-gray-700">
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
                      <div className="text-caption text-gray-700 font-mono">
                        Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} results
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <CellButton
                          variant="secondary"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </CellButton>
                        
                        <span className="font-mono text-sm px-3 py-1 border border-gray-300 bg-white text-gray-900 rounded">
                          {currentPage} / {totalPages}
                        </span>
                        
                        <CellButton
                          variant="secondary"
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Data Source?</h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this data source? This will also delete all imported data and version history.
              This action cannot be undone.
            </p>
            {/* Debug info */}
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs font-mono">
              <div>ID to delete: {dataSourceToDelete || 'NULL'}</div>
              <div>Selected: {selectedSource?.id || 'NONE'}</div>
            </div>
            <div className="flex justify-end space-x-3">
              <CellButton
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDataSourceToDelete(null);
                }}
              >
                Cancel
              </CellButton>
              <CellButton
                variant="accent"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🗑️ DELETE BUTTON CLICKED IN MODAL');
                  await handleDeleteDataSource();
                }}
                disabled={isDeleting}
                isLoading={isDeleting}
              >
                {!isDeleting && <Trash2 className="w-4 h-4 mr-2" />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </CellButton>
            </div>
          </div>
        </div>
      )}

      {/* Import Data Modal */}
      {showImportModal && selectedSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Import Data - {selectedSource.name}</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Import Options</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Import data to create a new version. You can import from a file or paste JSON data.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">Drag and drop a CSV or JSON file here</p>
                <p className="text-xs text-gray-500 mb-4">or</p>
                <CellButton variant="secondary" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </CellButton>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Or paste JSON data:
                </label>
                <textarea
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder='[
  {"column1": "value1", "column2": 123},
  {"column1": "value2", "column2": 456}
]'
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <CellButton
                  variant="secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </CellButton>
                <CellButton
                  variant="primary"
                  onClick={() => {
                    alert('Import functionality will be implemented next');
                    setShowImportModal(false);
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </CellButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}