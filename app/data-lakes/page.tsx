"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '../../components/layout/PageLayout'
import DataLakeBuilder from '../../components/data-lake/DataLakeBuilder'
import DataLakeQueryInterface from '../../components/data-lake/DataLakeQueryInterface'
import { Database, BarChart3, Settings, Eye, Play, Trash2 } from 'lucide-react'
import CellCard from '../../components/ui/CellCard'
import CellButton from '../../components/ui/CellButton'
import { DataLake } from '../../types/dataLake'
import { DataSourceConfig } from '../../lib/database/SeparatedDatabaseManager'
import { logger } from '../../lib/utils/logger'

export default function DataLakesPage() {
  const router = useRouter()
  const [dataLakes, setDataLakes] = useState<DataLake[]>([])
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([])
  const [selectedDataLake, setSelectedDataLake] = useState<DataLake | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'query' | 'monitoring'>('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load data sources
      const dataSourcesResponse = await fetch('/api/data-sources')
      if (dataSourcesResponse.ok) {
        const sources = await dataSourcesResponse.json()
        setDataSources(sources)
      }

      // Load data lakes
      const dataLakesResponse = await fetch('/api/data-lakes?projectId=default')
      if (dataLakesResponse.ok) {
        const lakes = await dataLakesResponse.json()
        setDataLakes(lakes)
      }
    } catch (error: any) {
      logger.error('Failed to load data', 'ui', { error: error.message }, 'DataLakesPage')
    } finally {
      setLoading(false)
    }
  }

  const handleDataLakeCreated = (dataLake: DataLake) => {
    setDataLakes(prev => [...prev, dataLake])
  }

  const handleDataLakeBuilt = (buildResult: any) => {
    logger.success('Data lake build completed', 'ui', { buildResult }, 'DataLakesPage')
    // Refresh data lakes to get updated status
    loadData()
  }

  const handleQueryDataLake = (dataLake: DataLake) => {
    setSelectedDataLake(dataLake)
    setActiveTab('query')
  }

  const getStatusColor = (status: DataLake['status']) => {
    switch (status) {
      case 'ready':
        return 'text-green-600 bg-green-100'
      case 'building':
        return 'text-blue-600 bg-blue-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      case 'draft':
      default:
        return 'text-gray-600 bg-gray-100'
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

  if (loading) {
    return (
      <PageLayout
        title="Data Lakes"
        subtitle="Unified data lake management"
        icon={Database}
        showNavigation={true}
        showBackButton={true}
        backButtonHref="/"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Data Lakes"
      subtitle="Unified data lake management and querying"
      icon={Database}
      showNavigation={true}
      showBackButton={true}
      backButtonHref="/"
    >
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <DataLakeBuilder
            projectId="default"
            dataSources={dataSources}
            onDataLakeCreated={handleDataLakeCreated}
            onDataLakeBuilt={handleDataLakeBuilt}
          />
        )}

        {/* Query Tab */}
        {activeTab === 'query' && selectedDataLake && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-heading font-bold">Query Data Lake</h2>
                <p className="text-body text-gray-600">
                  Execute SQL queries against: {selectedDataLake.name}
                </p>
              </div>
              <CellButton
                variant="ghost"
                onClick={() => setActiveTab('overview')}
              >
                Back to Overview
              </CellButton>
            </div>

            <DataLakeQueryInterface
              dataLake={selectedDataLake}
              onQueryExecuted={(result) => {
                logger.success('Query executed', 'ui', { result }, 'DataLakesPage')
              }}
              onQuerySaved={(query) => {
                logger.success('Query saved', 'ui', { query }, 'DataLakesPage')
              }}
            />
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-heading font-bold">Data Lake Monitoring</h2>
                <p className="text-body text-gray-600">
                  Monitor data lake health, performance, and usage
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dataLakes.map((dataLake) => (
                <CellCard key={dataLake.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <Database className="w-5 h-5 mr-2 text-blue-600" />
                      <h3 className="font-bold text-body">{dataLake.name}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(dataLake.status)}`}>
                      {getStatusText(dataLake.status)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Data Sources</span>
                      <span className="font-medium">{dataLake.config.dataSourceIds.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Records</span>
                      <span className="font-medium">{dataLake.metadata.totalRecords.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Storage Size</span>
                      <span className="font-medium">
                        {dataLake.metadata.totalSize > 0 
                          ? `${(dataLake.metadata.totalSize / 1024 / 1024).toFixed(1)} MB`
                          : 'Unknown'
                        }
                      </span>
                    </div>
                    {dataLake.lastBuiltAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Built</span>
                        <span className="font-medium">
                          {new Date(dataLake.lastBuiltAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {dataLake.status === 'ready' && (
                      <CellButton
                        size="sm"
                        variant="primary"
                        onClick={() => handleQueryDataLake(dataLake)}
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Query
                      </CellButton>
                    )}
                    {dataLake.status === 'draft' && (
                      <CellButton
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          // Trigger build
                          fetch(`/api/data-lakes/${dataLake.id}/build`, { method: 'POST' })
                            .then(() => loadData())
                        }}
                        className="flex-1"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Build
                      </CellButton>
                    )}
                    <CellButton
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this data lake?')) {
                          // Delete data lake
                          fetch(`/api/data-lakes/${dataLake.id}`, { method: 'DELETE' })
                            .then(() => loadData())
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </CellButton>
                  </div>
                </CellCard>
              ))}
            </div>

            {dataLakes.length === 0 && (
              <CellCard className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-subheading font-bold mb-2">No Data Lakes</h3>
                <p className="text-body text-gray-600 mb-4">
                  Create your first data lake to start monitoring data lake performance
                </p>
                <CellButton
                  variant="primary"
                  onClick={() => setActiveTab('overview')}
                >
                  Create Data Lake
                </CellButton>
              </CellCard>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        {!selectedDataLake && (
          <div className="flex items-center justify-center space-x-4">
            <CellButton
              variant={activeTab === 'overview' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('overview')}
            >
              <Database className="w-4 h-4 mr-2" />
              Overview
            </CellButton>
            <CellButton
              variant={activeTab === 'monitoring' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('monitoring')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Monitoring
            </CellButton>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
