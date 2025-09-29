"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Play, Save, History, Download, Database, Table, BarChart3, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import CellCard from '../ui/CellCard'
import CellButton from '../ui/CellButton'
import CellModal from '../ui/CellModal'
import { DataLake, DataLakeQuery, DataLakeQueryResult } from '../../types/dataLake'
import { logger } from '../../lib/utils/logger'

interface DataLakeQueryInterfaceProps {
  dataLake: DataLake
  onQueryExecuted?: (result: DataLakeQueryResult) => void
  onQuerySaved?: (query: DataLakeQuery) => void
}

interface SavedQuery {
  id: string
  name: string
  sql: string
  lastExecuted?: Date
  executionCount: number
}

export default function DataLakeQueryInterface({ 
  dataLake, 
  onQueryExecuted, 
  onQuerySaved 
}: DataLakeQueryInterfaceProps) {
  const [sql, setSql] = useState('')
  const [queryResult, setQueryResult] = useState<DataLakeQueryResult | null>(null)
  const [executing, setExecuting] = useState(false)
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [queryName, setQueryName] = useState('')
  const [queryHistory, setQueryHistory] = useState<DataLakeQueryResult[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSchema, setShowSchema] = useState(false)
  const [schemaInfo, setSchemaInfo] = useState<any>(null)
  const [limit, setLimit] = useState(1000)

  useEffect(() => {
    loadSavedQueries()
    loadQueryHistory()
    loadSchemaInfo()
  }, [dataLake.id])

  const loadSavedQueries = async () => {
    try {
      const response = await fetch(`/api/data-lakes/${dataLake.id}/queries`)
      if (response.ok) {
        const queries = await response.json()
        setSavedQueries(queries)
      }
    } catch (error: any) {
      logger.error('Failed to load saved queries', 'ui', { error: error.message }, 'DataLakeQueryInterface')
    }
  }

  const loadQueryHistory = async () => {
    try {
      const response = await fetch(`/api/data-lakes/${dataLake.id}/query-history`)
      if (response.ok) {
        const history = await response.json()
        setQueryHistory(history)
      }
    } catch (error: any) {
      logger.error('Failed to load query history', 'ui', { error: error.message }, 'DataLakeQueryInterface')
    }
  }

  const loadSchemaInfo = async () => {
    try {
      const response = await fetch(`/api/data-lakes/${dataLake.id}/schema`)
      if (response.ok) {
        const schema = await response.json()
        setSchemaInfo(schema)
      }
    } catch (error: any) {
      logger.error('Failed to load schema info', 'ui', { error: error.message }, 'DataLakeQueryInterface')
    }
  }

  const executeQuery = async () => {
    if (!sql.trim()) return

    try {
      setExecuting(true)
      setQueryResult(null)

      // Add LIMIT clause if not present
      let querySql = sql.trim()
      if (!querySql.toLowerCase().includes('limit')) {
        querySql += ` LIMIT ${limit}`
      }

      const response = await fetch(`/api/data-lakes/${dataLake.id}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: querySql,
          parameters: {}
        })
      })

      if (response.ok) {
        const result = await response.json()
        setQueryResult(result)
        onQueryExecuted?.(result)
        
        // Add to history
        setQueryHistory(prev => [result, ...prev.slice(0, 49)]) // Keep last 50 queries
        
        logger.success('Query executed successfully', 'ui', { 
          dataLakeId: dataLake.id, 
          duration: result.duration,
          rowsReturned: result.returnedRows 
        }, 'DataLakeQueryInterface')
      } else {
        const error = await response.json()
        setQueryResult({
          id: `error_${Date.now()}`,
          queryId: '',
          executedAt: new Date(),
          duration: 0,
          status: 'failed',
          error: error.message || 'Query execution failed',
          errorType: 'sql_error'
        })
      }
    } catch (error: any) {
      logger.error('Failed to execute query', 'ui', { error: error.message }, 'DataLakeQueryInterface')
      setQueryResult({
        id: `error_${Date.now()}`,
        queryId: '',
        executedAt: new Date(),
        duration: 0,
        status: 'failed',
        error: error.message,
        errorType: 'network_error'
      })
    } finally {
      setExecuting(false)
    }
  }

  const saveQuery = async () => {
    if (!queryName.trim() || !sql.trim()) return

    try {
      const query: DataLakeQuery = {
        id: `query_${Date.now()}`,
        dataLakeId: dataLake.id,
        name: queryName,
        sql: sql,
        isPublic: false,
        createdAt: new Date(),
        executionCount: 0
      }

      const response = await fetch(`/api/data-lakes/${dataLake.id}/queries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      })

      if (response.ok) {
        const savedQuery = await response.json()
        setSavedQueries(prev => [...prev, savedQuery])
        setShowSaveModal(false)
        setQueryName('')
        onQuerySaved?.(savedQuery)
        
        logger.success('Query saved successfully', 'ui', { queryId: savedQuery.id }, 'DataLakeQueryInterface')
      } else {
        throw new Error('Failed to save query')
      }
    } catch (error: any) {
      logger.error('Failed to save query', 'ui', { error: error.message }, 'DataLakeQueryInterface')
    }
  }

  const loadSavedQuery = (savedQuery: SavedQuery) => {
    setSql(savedQuery.sql)
    setShowHistory(false)
  }

  const exportResults = async () => {
    if (!queryResult || !queryResult.rows) return

    try {
      const csvContent = [
        queryResult.columns?.join(','),
        ...queryResult.rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `data-lake-query-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      logger.success('Query results exported', 'ui', { 
        rowsExported: queryResult.returnedRows 
      }, 'DataLakeQueryInterface')
    } catch (error: any) {
      logger.error('Failed to export results', 'ui', { error: error.message }, 'DataLakeQueryInterface')
    }
  }

  const getStatusIcon = (status: DataLakeQueryResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'running':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const formatDuration = (duration: number) => {
    if (duration < 1000) {
      return `${duration}ms`
    } else {
      return `${(duration / 1000).toFixed(2)}s`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading font-bold flex items-center">
            <Database className="w-6 h-6 mr-3" />
            Query Data Lake: {dataLake.name}
          </h2>
          <p className="text-body text-gray-600 mt-1">
            Execute SQL queries against your unified data lake
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CellButton
            variant="ghost"
            onClick={() => setShowSchema(true)}
          >
            <Table className="w-4 h-4 mr-2" />
            Schema
          </CellButton>
          <CellButton
            variant="ghost"
            onClick={() => setShowHistory(true)}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </CellButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Editor */}
        <div className="lg:col-span-2 space-y-4">
          <CellCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-body">SQL Query</h3>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Limit:</label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 1000)}
                  className="cell-input w-20"
                  min="1"
                  max="10000"
                />
              </div>
            </div>
            
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="cell-input w-full h-64 font-mono text-sm"
              placeholder={`-- Example queries:
SELECT * FROM ds_customers LIMIT 10;
SELECT customer_id, COUNT(*) as order_count 
FROM ds_orders 
GROUP BY customer_id 
ORDER BY order_count DESC;
SELECT c.name, o.total 
FROM ds_customers c 
JOIN ds_orders o ON c.id = o.customer_id;`}
            />
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <CellButton
                  variant="primary"
                  onClick={executeQuery}
                  disabled={!sql.trim() || executing}
                >
                  {executing ? (
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {executing ? 'Executing...' : 'Execute'}
                </CellButton>
                
                <CellButton
                  variant="secondary"
                  onClick={() => setShowSaveModal(true)}
                  disabled={!sql.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </CellButton>
              </div>
              
              {queryResult && queryResult.status === 'completed' && (
                <CellButton
                  variant="ghost"
                  onClick={exportResults}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </CellButton>
              )}
            </div>
          </CellCard>

          {/* Query Results */}
          {queryResult && (
            <CellCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {getStatusIcon(queryResult.status)}
                  <span className="ml-2 font-bold text-body">
                    {queryResult.status === 'completed' ? 'Query Results' : 'Query Error'}
                  </span>
                </div>
                {queryResult.duration > 0 && (
                  <span className="text-sm text-gray-600">
                    {formatDuration(queryResult.duration)}
                  </span>
                )}
              </div>

              {queryResult.status === 'completed' && queryResult.rows ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {queryResult.returnedRows?.toLocaleString()} rows returned
                      {queryResult.totalRows && queryResult.totalRows !== queryResult.returnedRows && 
                        ` of ${queryResult.totalRows.toLocaleString()} total`
                      }
                    </span>
                    <span>
                      {queryResult.columns?.length} columns
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border-2 border-black">
                      <thead>
                        <tr className="bg-gray-100">
                          {queryResult.columns?.map((column, index) => (
                            <th key={index} className="border border-black px-3 py-2 text-left font-bold">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.rows?.slice(0, 100).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="border border-black px-3 py-2">
                                {cell !== null && cell !== undefined ? String(cell) : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {queryResult.rows && queryResult.rows.length > 100 && (
                    <p className="text-sm text-gray-600 text-center">
                      Showing first 100 rows of {queryResult.returnedRows?.toLocaleString()} results
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 font-medium">Query Error:</p>
                  <p className="text-red-700 mt-1">{queryResult.error}</p>
                </div>
              )}
            </CellCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Data Lake Info */}
          <CellCard className="p-4">
            <h3 className="font-bold text-body mb-3">Data Lake Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Database className="w-3 h-3 mr-2 text-gray-500" />
                <span>{dataLake.config.dataSourceIds.length} data sources</span>
              </div>
              <div className="flex items-center">
                <BarChart3 className="w-3 h-3 mr-2 text-gray-500" />
                <span>{dataLake.metadata.totalRecords.toLocaleString()} records</span>
              </div>
              <div className="flex items-center">
                <Table className="w-3 h-3 mr-2 text-gray-500" />
                <span>{dataLake.metadata.columnCount} columns</span>
              </div>
              {dataLake.lastBuiltAt && (
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-2 text-gray-500" />
                  <span>Built {new Date(dataLake.lastBuiltAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CellCard>

          {/* Saved Queries */}
          <CellCard className="p-4">
            <h3 className="font-bold text-body mb-3">Saved Queries</h3>
            {savedQueries.length === 0 ? (
              <p className="text-sm text-gray-600">No saved queries yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedQueries.map((query) => (
                  <div
                    key={query.id}
                    className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => loadSavedQuery(query)}
                  >
                    <div className="font-medium text-sm">{query.name}</div>
                    <div className="text-xs text-gray-600">
                      {query.executionCount} executions
                      {query.lastExecuted && (
                        <span className="ml-2">
                          • {new Date(query.lastExecuted).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CellCard>

          {/* Query History */}
          <CellCard className="p-4">
            <h3 className="font-bold text-body mb-3">Recent Queries</h3>
            {queryHistory.length === 0 ? (
              <p className="text-sm text-gray-600">No query history</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {queryHistory.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      // Could load the query back into editor
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(result.status)}
                        <span className="ml-2 text-sm">
                          {result.returnedRows?.toLocaleString() || 0} rows
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {formatDuration(result.duration)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(result.executedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CellCard>
        </div>
      </div>

      {/* Save Query Modal */}
      <CellModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Query"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-body font-bold text-gray-700 mb-2">
              Query Name
            </label>
            <input
              type="text"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              className="cell-input w-full"
              placeholder="Enter a name for this query"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <CellButton
              variant="ghost"
              onClick={() => setShowSaveModal(false)}
            >
              Cancel
            </CellButton>
            <CellButton
              variant="primary"
              onClick={saveQuery}
              disabled={!queryName.trim()}
            >
              Save Query
            </CellButton>
          </div>
        </div>
      </CellModal>

      {/* Schema Modal */}
      <CellModal
        isOpen={showSchema}
        onClose={() => setShowSchema(false)}
        title="Data Lake Schema"
        size="lg"
      >
        <div className="space-y-4">
          {schemaInfo ? (
            <div>
              <h3 className="font-bold text-body mb-3">Tables and Columns</h3>
              <div className="space-y-4">
                {schemaInfo.tables?.map((table: any) => (
                  <div key={table.id} className="border-2 border-black p-3">
                    <h4 className="font-bold text-body mb-2">{table.name}</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      {table.recordCount.toLocaleString()} records
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {table.columns?.map((column: any) => (
                        <div key={column.name} className="text-sm">
                          <span className="font-medium">{column.name}</span>
                          <span className="text-gray-600 ml-2">({column.dataType})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schema information...</p>
            </div>
          )}
        </div>
      </CellModal>

      {/* History Modal */}
      <CellModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Query History"
        size="lg"
      >
        <div className="space-y-4">
          {queryHistory.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No query history available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queryHistory.map((result) => (
                <div key={result.id} className="border-2 border-black p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getStatusIcon(result.status)}
                      <span className="ml-2 font-medium">
                        {result.returnedRows?.toLocaleString() || 0} rows
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{formatDuration(result.duration)}</span>
                      <span>{new Date(result.executedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {result.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CellModal>
    </div>
  )
}
