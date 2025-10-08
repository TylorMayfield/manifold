"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import ProgressBar from '../../components/ui/ProgressBar';
import { useApi } from '../../hooks/useApi';
import { DataProvider } from '../../types';
import { useDataSources } from '../../contexts/DataSourceContext';
import { clientLogger } from '../../lib/utils/ClientLogger';

interface DataSourceWithData {
  id: string;
  name: string;
  type: string;
  status: string;
  data: any[];
  totalCount: number;
  error?: string;
  currentVersion?: number;
  snapshotId?: string;
}

export default function DataBrowserPage() {
  const router = useRouter();
  const [dataSources, setDataSources] = useState<DataSourceWithData[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSourceWithData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Increased default from 10 to 50
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dataSourceToDelete, setDataSourceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  const api = useApi();
  const { get } = api;
  const { removeDataSource: contextRemoveDataSource } = useDataSources();
  
  useEffect(() => {
    loadDataSources();
  }, []);

  const loadSourceData = async (sourceId: string, page: number = 1, customPageSize?: number) => {
    if (!sourceId) return;
    
    try {
      const effectivePageSize = customPageSize || pageSize;
      const offset = (page - 1) * effectivePageSize;
      clientLogger.info('Loading versioned data for source', 'data-processing', {
        sourceId,
        offset,
        limit: effectivePageSize
      });
      
      // First, get the latest snapshot for this data source
      const snapshotsResponse = await get(`/api/snapshots?projectId=default&dataSourceId=${sourceId}`);
      const snapshots = Array.isArray(snapshotsResponse) ? snapshotsResponse : [];
      
      if (snapshots.length === 0) {
        clientLogger.warn('No snapshots found, falling back to mock data', 'data-processing', { sourceId });
        // Fallback to mock data endpoint if no snapshots exist
        const response = await get(`/api/data-sources/${sourceId}/data?limit=${effectivePageSize}&offset=${offset}`);
        if (response && response.data) {
          setDataSources(prev => prev.map(source => 
            source.id === sourceId 
              ? { ...source, data: response.data, totalCount: response.totalCount || response.data.length }
              : source
          ));
          if (selectedSource?.id === sourceId) {
            setSelectedSource(prev => prev ? { ...prev, data: response.data, totalCount: response.totalCount || response.data.length } : null);
          }
        }
        return;
      }
      
      // Get the latest snapshot (sorted by version desc)
      const latestSnapshot = snapshots.sort((a: any, b: any) => 
        (b.version || 0) - (a.version || 0)
      )[0];
      
      clientLogger.info('Loading data from snapshot', 'data-processing', {
        snapshotId: latestSnapshot.id,
        version: latestSnapshot.version,
        sourceId
      });
      
      // Load data from the snapshot (stored in ImportedData collection)
      const response = await fetch(`/api/snapshots/${latestSnapshot.id}/data?limit=${effectivePageSize}&offset=${offset}`);
      
      if (response.ok) {
        const data = await response.json();
        clientLogger.success('Snapshot data loaded successfully', 'data-processing', {
          recordCount: data.data?.length,
          version: latestSnapshot.version,
          sourceId
        });
        
        setDataSources(prev => prev.map(source => 
          source.id === sourceId 
            ? { 
                ...source, 
                data: data.data || [], 
                totalCount: data.totalCount || (latestSnapshot.recordCount || 0),
                currentVersion: latestSnapshot.version,
                snapshotId: latestSnapshot.id
              }
            : source
        ));
        
        if (selectedSource?.id === sourceId) {
          setSelectedSource(prev => prev ? { 
            ...prev, 
            data: data.data || [], 
            totalCount: data.totalCount || (latestSnapshot.recordCount || 0),
            currentVersion: latestSnapshot.version,
            snapshotId: latestSnapshot.id
          } : null);
        }
      } else {
        clientLogger.error('Failed to load snapshot data, using fallback', 'data-processing', {
          httpStatus: response.status,
          sourceId
        });
        // Fallback to generating mock data
        const mockResponse = await get(`/api/data-sources/${sourceId}/data?limit=${effectivePageSize}&offset=${offset}`);
        if (mockResponse && mockResponse.data) {
          setDataSources(prev => prev.map(source => 
            source.id === sourceId 
              ? { ...source, data: mockResponse.data, totalCount: mockResponse.totalCount || mockResponse.data.length }
              : source
          ));
          if (selectedSource?.id === sourceId) {
            setSelectedSource(prev => prev ? { ...prev, data: mockResponse.data, totalCount: mockResponse.totalCount || mockResponse.data.length } : null);
          }
        }
      }
    } catch (error) {
      clientLogger.error('Error loading source data', 'data-processing', { error, sourceId });
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
      console.log('[DataBrowserPage] Loaded data sources:', response);
      
      if (response && Array.isArray(response)) {
        // Fetch snapshots to get record counts
        const snapshotsResponse = await get('/api/snapshots?projectId=default');
        console.log('[DataBrowserPage] Loaded snapshots:', snapshotsResponse);
        
        const snapshots = Array.isArray(snapshotsResponse) ? snapshotsResponse : [];
        
        // Map data sources with their record counts from snapshots
        const sourcesWithData = response.map((source: DataProvider) => {
          // Find the latest snapshot for this data source
          const dataSourceSnapshots = snapshots.filter((s: any) => s.dataSourceId === source.id);
          const latestSnapshot = dataSourceSnapshots.length > 0 
            ? dataSourceSnapshots.sort((a: any, b: any) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0]
            : null;
          
          const totalCount = latestSnapshot?.recordCount || latestSnapshot?.data?.length || 0;
          console.log(`[DataBrowserPage] Source ${source.name} (${source.id}): ${totalCount} records`);
          
          return {
            id: source.id,
            name: source.name,
            type: source.type,
            status: source.status,
            data: [],
            totalCount,
            error: null
          };
        });
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (selectedSource) {
      loadSourceData(selectedSource.id, newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    if (selectedSource) {
      loadSourceData(selectedSource.id, 1, newSize);
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
      console.log('Calling context removeDataSource for:', dataSourceToDelete);
      
      // Use the context's removeDataSource which will update all consumers including home page
      await contextRemoveDataSource(dataSourceToDelete);
      
      console.log('Delete successful via context!');
      
      // Remove from local list
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

  // For server-side pagination, we don't slice the data - it's already paginated
  const displayData = selectedSource?.data || [];
  
  // Client-side search filtering (optional - could be moved to server)
  const filteredData = searchTerm 
    ? displayData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : displayData;
  
  const totalRecords = selectedSource?.totalCount || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  const getColumns = (data: any[]) => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  const handleImportData = async () => {
    if (!importData.trim()) {
      alert('Please enter JSON data to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Parse JSON data
      setImportProgress(20);
      const parsedData = JSON.parse(importData);
      
      if (!Array.isArray(parsedData)) {
        throw new Error('Data must be an array of objects');
      }

      setImportProgress(40);

      // Create a new data source for the imported data
      const newDataSourceId = `imported_${Date.now()}`;
      const dataSourceName = `Imported Data ${new Date().toLocaleString()}`;

      // Import via API
      const response = await fetch(`/api/data-sources/${newDataSourceId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parsedData,
          schema: null, // Auto-infer
          metadata: {
            importType: 'manual',
            importSource: 'data-browser',
            originalName: dataSourceName,
          },
        }),
      });

      setImportProgress(80);

      if (response.ok) {
        const result = await response.json();
        setImportProgress(100);
        
        alert(`✅ Successfully imported ${result.snapshot.recordCount} records!`);
        
        // Reload data sources
        await loadDataSources();
        
        // Close modal and reset
        setShowImportModal(false);
        setImportData('');
        setImportProgress(0);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`❌ Import failed: ${error instanceof Error ? error.message : 'Invalid JSON data'}`);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
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
                        router.push(`/add-data-source?edit=${selectedSource.id}`);
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
                        setCurrentPage(1);
                        setSearchTerm('');
                        loadSourceData(source.id, 1);
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
                      {selectedSource.currentVersion && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                          v{selectedSource.currentVersion}
                        </span>
                      )}
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
                          {getColumns(filteredData).map((column) => (
                            <th key={column}>
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((row, index) => (
                          <tr key={index}>
                            {getColumns(filteredData).map((column) => (
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
                  <div className="flex items-center justify-between pt-4 border-t border-gray-300">
                    <div className="flex items-center space-x-4">
                      <div className="text-caption text-gray-700 font-mono">
                        Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalRecords)} of {totalRecords.toLocaleString()} records
                      </div>
                      
                      {/* Page Size Selector */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Rows:</label>
                        <select
                          value={pageSize}
                          onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                          className="px-2 py-1 border border-gray-300 rounded bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                          <option value="500">500</option>
                          <option value="1000">1000</option>
                        </select>
                      </div>
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2">
                        <CellButton
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </CellButton>
                        
                        <span className="font-mono text-sm px-3 py-1 border border-gray-300 bg-white text-gray-900 rounded">
                          Page {currentPage} of {totalPages}
                        </span>
                        
                        <CellButton
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </CellButton>
                      </div>
                    )}
                  </div>
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
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder='[
  {"column1": "value1", "column2": 123},
  {"column1": "value2", "column2": 456}
]'
                />
              </div>

              {/* Import Progress */}
              {isImporting && (
                <div className="mt-4">
                  <ProgressBar
                    progress={importProgress}
                    label="Importing data..."
                    color="green"
                    showPercentage={true}
                    animated={true}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <CellButton
                  variant="secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </CellButton>
                <CellButton
                  variant="primary"
                  onClick={handleImportData}
                  disabled={isImporting || !importData.trim()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Data'}
                </CellButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}