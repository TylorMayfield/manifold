"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Database, Plus, Settings, Play, Eye, Download, Trash2, AlertCircle, CheckCircle, Clock, BarChart3, Table, Link2 } from 'lucide-react'
import CellCard from '../ui/CellCard'
import CellButton from '../ui/CellButton'
import CellModal from '../ui/CellModal'
import { DataLake, DataLakeConfig, DataSourceConfig } from '../../types/dataLake'
import { logger } from '../../lib/utils/logger'

interface DataLakeBuilderProps {
  projectId: string
  dataSources: DataSourceConfig[]
  onDataLakeCreated?: (dataLake: DataLake) => void
  onDataLakeBuilt?: (buildResult: any) => void
}

interface DataSourcePreview {
  id: string
  name: string
  type: string
  recordCount: number
  lastSyncAt?: Date
  columns: string[]
  sampleData: any[]
}

export default function DataLakeBuilder({ 
  projectId, 
  dataSources, 
  onDataLakeCreated, 
  onDataLakeBuilt 
}: DataLakeBuilderProps) {
  const [showBuilder, setShowBuilder] = useState(false)
  const [dataLakes, setDataLakes] = useState<DataLake[]>([])
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([])
  const [dataSourcePreviews, setDataSourcePreviews] = useState<DataSourcePreview[]>([])
  const [dataLakeConfig, setDataLakeConfig] = useState<Partial<DataLakeConfig>>({
    dataSourceIds: [],
    settings: {
      storageType: 'sqlite',
      compression: true,
      partitioning: 'data_source',
      deduplication: true,
      dataValidation: true,
      schemaEvolution: 'auto',
      indexing: true,
      caching: true,
      autoRefresh: false,
    }
  })
  const [dataLakeName, setDataLakeName] = useState('')
  const [dataLakeDescription, setDataLakeDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [building, setBuilding] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    loadDataLakes()
  }, [projectId])

  const loadDataLakes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/data-lakes?projectId=${projectId}`)
      if (response.ok) {
        const lakes = await response.json()
        setDataLakes(lakes)
      }
    } catch (error: any) {
      logger.error('Failed to load data lakes', 'ui', { error: error.message }, 'DataLakeBuilder')
    } finally {
      setLoading(false)
    }
  }

  const loadDataSourcePreviews = async () => {
    try {
      setLoading(true)
      const previews: DataSourcePreview[] = []

      for (const dataSource of dataSources) {
        try {
          const response = await fetch(`/api/data-sources/${dataSource.id}/preview`)
          if (response.ok) {
            const preview = await response.json()
            previews.push({
              id: dataSource.id,
              name: dataSource.name,
              type: dataSource.type,
              recordCount: preview.recordCount || 0,
              lastSyncAt: dataSource.lastSyncAt,
              columns: preview.columns || [],
              sampleData: preview.sampleData || []
            })
          }
        } catch (error) {
          logger.warn(`Failed to load preview for data source: ${dataSource.name}`, 'ui', { error }, 'DataLakeBuilder')
        }
      }

      setDataSourcePreviews(previews)
    } catch (error: any) {
      logger.error('Failed to load data source previews', 'ui', { error: error.message }, 'DataLakeBuilder')
    } finally {
      setLoading(false)
    }
  }

  const handleDataSourceSelection = (dataSourceId: string, selected: boolean) => {
    if (selected) {
      setSelectedDataSources(prev => [...prev, dataSourceId])
    } else {
      setSelectedDataSources(prev => prev.filter(id => id !== dataSourceId))
    }
  }

  const handleSelectAll = () => {
    if (selectedDataSources.length === dataSources.length) {
      setSelectedDataSources([])
    } else {
      setSelectedDataSources(dataSources.map(ds => ds.id))
    }
  }

  const createDataLake = async () => {
    if (!dataLakeName.trim() || selectedDataSources.length === 0) {
      return
    }

    try {
      setLoading(true)
      
      const config: DataLakeConfig = {
        dataSourceIds: selectedDataSources,
        settings: {
          ...dataLakeConfig.settings!,
          indexFields: selectedDataSources.map(id => 'id'), // Default indexing
        },
        relationships: [],
      }

      const response = await fetch('/api/data-lakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: dataLakeName,
          description: dataLakeDescription,
          config,
        }),
      })

      if (response.ok) {
        const dataLake = await response.json()
        setDataLakes(prev => [...prev, dataLake])
        setShowBuilder(false)
        setDataLakeName('')
        setDataLakeDescription('')
        setSelectedDataSources([])
        onDataLakeCreated?.(dataLake)
        
        logger.success(`Data lake created: ${dataLake.name}`, 'ui', { dataLakeId: dataLake.id }, 'DataLakeBuilder')
      } else {
        throw new Error('Failed to create data lake')
      }
    } catch (error: any) {
      logger.error('Failed to create data lake', 'ui', { error: error.message }, 'DataLakeBuilder')
    } finally {
      setLoading(false)
    }
  }

  const buildDataLake = async (dataLakeId: string) => {
    try {
      setBuilding(dataLakeId)
      
      const response = await fetch(`/api/data-lakes/${dataLakeId}/build`, {
        method: 'POST',
      })

      if (response.ok) {
        const buildResult = await response.json()
        await loadDataLakes() // Refresh data lakes
        onDataLakeBuilt?.(buildResult)
        
        logger.success(`Data lake build completed: ${dataLakeId}`, 'ui', { buildResult }, 'DataLakeBuilder')
      } else {
        throw new Error('Failed to build data lake')
      }
    } catch (error: any) {
      logger.error('Failed to build data lake', 'ui', { error: error.message }, 'DataLakeBuilder')
    } finally {
      setBuilding(null)
    }
  }

  const deleteDataLake = async (dataLakeId: string) => {
    if (!confirm('Are you sure you want to delete this data lake? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/data-lakes/${dataLakeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDataLakes(prev => prev.filter(dl => dl.id !== dataLakeId))
        logger.success(`Data lake deleted: ${dataLakeId}`, 'ui', {}, 'DataLakeBuilder')
      } else {
        throw new Error('Failed to delete data lake')
      }
    } catch (error: any) {
      logger.error('Failed to delete data lake', 'ui', { error: error.message }, 'DataLakeBuilder')
    }
  }

  const getStatusIcon = (status: DataLake['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'building':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'draft':
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusText = (status: DataLake['status']) => {
    switch (status) {
      case 'ready':
        return 'Ready'
      case 'building':
        return 'Building'
      case 'error':
        return 'Error'
      case 'draft':
      default:
        return 'Draft'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading font-bold flex items-center">
            <Database className="w-6 h-6 mr-3" />
            Data Lakes
          </h2>
          <p className="text-body text-gray-600 mt-1">
            Combine multiple data sources into unified data lakes for analysis and reporting
          </p>
        </div>
        <CellButton
          onClick={() => setShowBuilder(true)}
          variant="primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Data Lake
        </CellButton>
      </div>

      {/* Data Lakes List */}
      {loading && dataLakes.length === 0 ? (
        <CellCard className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-body text-gray-600">Loading data lakes...</p>
        </CellCard>
      ) : dataLakes.length === 0 ? (
        <CellCard className="p-8 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-subheading font-bold mb-2">No Data Lakes</h3>
          <p className="text-body text-gray-600 mb-4">
            Create your first data lake to combine multiple data sources
          </p>
          <CellButton
            onClick={() => setShowBuilder(true)}
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Data Lake
          </CellButton>
        </CellCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataLakes.map((dataLake) => (
            <CellCard key={dataLake.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  {getStatusIcon(dataLake.status)}
                  <span className="ml-2 text-sm font-medium">
                    {getStatusText(dataLake.status)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <CellButton
                    size="sm"
                    variant="ghost"
                    onClick={() => {/* TODO: View data lake */}}
                  >
                    <Eye className="w-3 h-3" />
                  </CellButton>
                  <CellButton
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteDataLake(dataLake.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </CellButton>
                </div>
              </div>

              <h3 className="font-bold text-body mb-1">{dataLake.name}</h3>
              {dataLake.description && (
                <p className="text-caption text-gray-600 mb-3">{dataLake.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Table className="w-3 h-3 mr-2 text-gray-500" />
                  <span>{dataLake.config.dataSourceIds.length} data sources</span>
                </div>
                <div className="flex items-center text-sm">
                  <BarChart3 className="w-3 h-3 mr-2 text-gray-500" />
                  <span>{dataLake.metadata.totalRecords.toLocaleString()} records</span>
                </div>
                {dataLake.lastBuiltAt && (
                  <div className="flex items-center text-sm">
                    <Clock className="w-3 h-3 mr-2 text-gray-500" />
                    <span>Built {new Date(dataLake.lastBuiltAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                {dataLake.status === 'draft' && (
                  <CellButton
                    size="sm"
                    variant="secondary"
                    onClick={() => buildDataLake(dataLake.id)}
                    disabled={building === dataLake.id}
                    className="flex-1"
                  >
                    {building === dataLake.id ? (
                      <Clock className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 mr-1" />
                    )}
                    Build
                  </CellButton>
                )}
                {dataLake.status === 'ready' && (
                  <CellButton
                    size="sm"
                    variant="primary"
                    onClick={() => {/* TODO: Query data lake */}}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Query
                  </CellButton>
                )}
              </div>
            </CellCard>
          ))}
        </div>
      )}

      {/* Data Lake Builder Modal */}
      <CellModal
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        title="Create Data Lake"
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <label className="block text-body font-bold text-gray-700 mb-2">
              Data Lake Name
            </label>
            <input
              type="text"
              value={dataLakeName}
              onChange={(e) => setDataLakeName(e.target.value)}
              className="cell-input w-full"
              placeholder="Enter data lake name"
            />
          </div>

          <div>
            <label className="block text-body font-bold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={dataLakeDescription}
              onChange={(e) => setDataLakeDescription(e.target.value)}
              className="cell-input w-full h-20"
              placeholder="Describe the purpose of this data lake"
            />
          </div>

          {/* Data Source Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-body font-bold text-gray-700">
                Select Data Sources
              </label>
              <CellButton
                size="sm"
                variant="ghost"
                onClick={handleSelectAll}
              >
                {selectedDataSources.length === dataSources.length ? 'Deselect All' : 'Select All'}
              </CellButton>
            </div>

            {dataSources.length === 0 ? (
              <CellCard className="p-4 text-center">
                <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-caption text-gray-600">
                  No data sources available. Create data sources first.
                </p>
              </CellCard>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dataSources.map((dataSource) => (
                  <CellCard
                    key={dataSource.id}
                    className={`p-3 cursor-pointer transition-all duration-200 ${
                      selectedDataSources.includes(dataSource.id)
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleDataSourceSelection(
                      dataSource.id, 
                      !selectedDataSources.includes(dataSource.id)
                    )}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedDataSources.includes(dataSource.id)}
                        onChange={() => {}}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-body">{dataSource.name}</h4>
                          <span className="text-caption text-gray-500">{dataSource.type}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Database className="w-3 h-3 mr-1" />
                          <span>Last sync: {dataSource.lastSyncAt ? new Date(dataSource.lastSyncAt).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                    </div>
                  </CellCard>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div>
            <CellButton
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mb-3"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </CellButton>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 rounded border-2 border-black">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body font-bold text-gray-700 mb-2">
                      Storage Type
                    </label>
                    <select
                      value={dataLakeConfig.settings?.storageType}
                      onChange={(e) => setDataLakeConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, storageType: e.target.value as any }
                      }))}
                      className="cell-input w-full"
                    >
                      <option value="sqlite">SQLite</option>
                      <option value="parquet">Parquet</option>
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-body font-bold text-gray-700 mb-2">
                      Partitioning
                    </label>
                    <select
                      value={dataLakeConfig.settings?.partitioning}
                      onChange={(e) => setDataLakeConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, partitioning: e.target.value as any }
                      }))}
                      className="cell-input w-full"
                    >
                      <option value="none">None</option>
                      <option value="date">By Date</option>
                      <option value="data_source">By Data Source</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dataLakeConfig.settings?.deduplication}
                      onChange={(e) => setDataLakeConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, deduplication: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-body">Enable deduplication</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dataLakeConfig.settings?.dataValidation}
                      onChange={(e) => setDataLakeConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, dataValidation: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-body">Enable data validation</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dataLakeConfig.settings?.indexing}
                      onChange={(e) => setDataLakeConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, indexing: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-body">Enable indexing</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dataLakeConfig.settings?.caching}
                      onChange={(e) => setDataLakeConfig(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, caching: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-body">Enable caching</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <CellButton
              variant="ghost"
              onClick={() => setShowBuilder(false)}
            >
              Cancel
            </CellButton>
            <CellButton
              variant="primary"
              onClick={createDataLake}
              disabled={!dataLakeName.trim() || selectedDataSources.length === 0 || loading}
            >
              {loading ? 'Creating...' : 'Create Data Lake'}
            </CellButton>
          </div>
        </div>
      </CellModal>
    </div>
  )
}
