// SQL Data Source Plugin
// Built-in plugin for SQL file data sources

import React from 'react'
import { AbstractDataSourcePlugin } from '../BasePlugin'
import { 
  PluginManifest, 
  PluginContext, 
  PluginConfig, 
  ImportMethod,
  FetchOptions,
  FetchResult
} from '../types'
import { Database, Upload } from 'lucide-react'
import { CellInput, CellSelect, CellTextarea, CellCheckbox, FormField, CellStack, CellCard, CellGrid } from '../../../components/ui'

export class SQLDataSourcePlugin extends AbstractDataSourcePlugin {
  constructor(manifest: PluginManifest, context: PluginContext, config: PluginConfig) {
    super(manifest, context, config)
  }

  protected async onInitialize(): Promise<void> {
    this.logOperation('SQL plugin initialized')
  }

  protected async onDestroy(): Promise<void> {
    this.logOperation('SQL plugin destroyed')
  }

  protected async onValidateConfig(config: Partial<PluginConfig>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (config.settings) {
      const settings = config.settings as any
      
      if (!settings.filePath && !settings.sqlContent) {
        errors.push('Either file path or SQL content must be provided')
      }
      
      if (settings.dialect && !['mysql', 'postgresql', 'sqlite', 'generic'].includes(settings.dialect)) {
        errors.push('Invalid SQL dialect')
      }
      
      if (settings.batchSize && (settings.batchSize < 1 || settings.batchSize > 1000)) {
        errors.push('Batch size must be between 1 and 1000')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  protected async onConfigUpdate(config: PluginConfig): Promise<void> {
    this.logOperation('SQL plugin config updated', { config })
  }

  async testConnection(config: any): Promise<{ success: boolean; error?: string }> {
    try {
      this.logOperation('Testing SQL connection', { config })

      if (!config.filePath && !config.sqlContent) {
        return { success: false, error: 'No SQL file or content provided' }
      }

      // In a real implementation, this would validate the SQL syntax
      // For now, we'll simulate a successful test
      await new Promise(resolve => setTimeout(resolve, 100))

      return { success: true }
    } catch (error: any) {
      this.logError('SQL connection test failed', error, { config })
      return { success: false, error: error.message }
    }
  }

  async getSchema(config: any): Promise<any[]> {
    try {
      this.logOperation('Getting SQL schema', { config })

      // In a real implementation, this would parse the SQL and extract table schemas
      // For now, we'll return a mock schema
      const mockSchema = [
        { name: 'users', type: 'table', columns: [
          { name: 'id', type: 'integer', nullable: false, primaryKey: true },
          { name: 'name', type: 'varchar', nullable: false },
          { name: 'email', type: 'varchar', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ]},
        { name: 'orders', type: 'table', columns: [
          { name: 'id', type: 'integer', nullable: false, primaryKey: true },
          { name: 'user_id', type: 'integer', nullable: false, foreignKey: 'users.id' },
          { name: 'total', type: 'decimal', nullable: false },
          { name: 'status', type: 'varchar', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ]}
      ]

      await this.cacheSchema(mockSchema)
      return mockSchema
    } catch (error: any) {
      this.logError('Failed to get SQL schema', error, { config })
      throw error
    }
  }

  async fetchData(config: any, options?: FetchOptions): Promise<FetchResult> {
    try {
      this.logOperation('Fetching SQL data', { config, options })

      if (!config.filePath && !config.sqlContent) {
        throw new Error('No SQL file or content provided')
      }

      const startTime = Date.now()

      // In a real implementation, this would execute the SQL and return the results
      // For now, we'll return mock data
      const mockData = [
        { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2023-01-01T00:00:00Z' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2023-01-02T00:00:00Z' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2023-01-03T00:00:00Z' }
      ]

      // Apply options
      let filteredData = mockData
      if (options?.limit) {
        filteredData = filteredData.slice(0, options.limit)
      }
      if (options?.offset) {
        filteredData = filteredData.slice(options.offset)
      }

      const executionTime = Date.now() - startTime

      const result: FetchResult = {
        data: filteredData,
        totalCount: mockData.length,
        hasMore: options?.limit ? filteredData.length < mockData.length : false,
        schema: await this.getSchema(config),
        metadata: {
          filePath: config.filePath,
          sqlContent: config.sqlContent ? config.sqlContent.substring(0, 100) + '...' : undefined,
          dialect: config.dialect || 'generic',
          batchSize: config.batchSize || 100
        },
        executionTime
      }

      this.logOperation('SQL data fetched successfully', { 
        recordCount: result.data.length,
        executionTime 
      })

      return result
    } catch (error: any) {
      this.logError('Failed to fetch SQL data', error, { config, options })
      throw error
    }
  }

  getConfigUI(): React.ComponentType<any> {
    return SQLConfigComponent
  }

  getImportMethods(): ImportMethod[] {
    return [
      {
        id: 'sql-import',
        name: 'SQL File Import',
        description: 'Import from SQL dump files or paste SQL statements',
        icon: React.createElement(Upload, { className: 'h-5 w-5' })
      }
    ]
  }
}

// Configuration UI Component
interface SQLConfigProps {
  config: any
  onConfigChange: (config: any) => void
  onNext: () => void
  onBack: () => void
}

const SQLConfigComponent: React.FC<SQLConfigProps> = ({ 
  config, 
  onConfigChange, 
  onNext, 
  onBack 
}) => {
  const [dragActive, setDragActive] = React.useState(false)

  const handleFileUpload = (file: File) => {
    if (file && (file.type === 'text/plain' || file.name.endsWith('.sql'))) {
      onConfigChange({
        ...config,
        filePath: file.name,
        uploadFile: file
      })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  return (
    <CellStack spacing="lg">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">SQL Import Configuration</h3>
        <p className="text-gray-600 mb-6">
          Import data from SQL dump files or paste SQL statements directly
        </p>
      </div>

      {/* File Upload */}
      <FormField label="SQL File Upload">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setDragActive(false)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop your SQL file here, or click to browse
          </p>
          <input
            type="file"
            accept=".sql,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleFileUpload(file)
              }
            }}
            className="hidden"
            id="sql-file-input"
          />
          <button
            onClick={() => document.getElementById('sql-file-input')?.click()}
            className="px-4 py-2 bg-white border-2 border-black text-black rounded hover:bg-gray-50"
          >
            Choose File
          </button>
          {config.filePath && (
            <p className="text-sm text-green-600 mt-2">
              Selected: {config.filePath}
            </p>
          )}
        </div>
      </FormField>

      {/* SQL Content */}
      <FormField label="Or Paste SQL Content">
        <CellTextarea
          value={config.sqlContent || ''}
          onChange={(e) => onConfigChange({
            ...config,
            sqlContent: e.target.value,
            filePath: undefined
          })}
          placeholder="Paste your SQL statements here..."
          rows={8}
        />
      </FormField>

      {/* SQL Options */}
      <CellGrid cols={2} gap="md">
        <FormField label="SQL Dialect">
          <CellSelect
            value={config.dialect || 'generic'}
            onChange={(e) => onConfigChange({ ...config, dialect: e.target.value })}
          >
            <option value="generic">Generic SQL</option>
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="sqlite">SQLite</option>
          </CellSelect>
        </FormField>

        <FormField label="File Encoding">
          <CellSelect
            value={config.encoding || 'utf8'}
            onChange={(e) => onConfigChange({ ...config, encoding: e.target.value })}
          >
            <option value="utf8">UTF-8</option>
            <option value="utf16">UTF-16</option>
            <option value="latin1">Latin-1</option>
          </CellSelect>
        </FormField>
      </CellGrid>

      <CellGrid cols={2} gap="md">
        <FormField 
          label="Batch Size"
          helper="Number of statements to process at once"
        >
          <CellInput
            type="number"
            min="1"
            max="1000"
            value={config.batchSize || 100}
            onChange={(e) => onConfigChange({ ...config, batchSize: parseInt(e.target.value) })}
          />
        </FormField>

        <FormField label="Statement Delimiter">
          <CellInput
            value={config.customDelimiter || ';'}
            onChange={(e) => onConfigChange({ ...config, customDelimiter: e.target.value })}
            placeholder=";"
            maxLength={1}
          />
        </FormField>
      </CellGrid>

      {/* Processing Options */}
      <CellCard padding="md">
        <h4 className="font-bold mb-4">Processing Options</h4>
        
        <CellGrid cols={2} gap="md">
          <CellStack spacing="sm">
            <CellCheckbox
              label="Create Tables (DDL)"
              checked={config.createTables !== false}
              onChange={(e) => onConfigChange({ ...config, createTables: e.target.checked })}
            />

            <CellCheckbox
              label="Insert Data (DML)"
              checked={config.insertData !== false}
              onChange={(e) => onConfigChange({ ...config, insertData: e.target.checked })}
            />

            <CellCheckbox
              label="Create Indexes"
              checked={config.indexes !== false}
              onChange={(e) => onConfigChange({ ...config, indexes: e.target.checked })}
            />
          </CellStack>

          <CellStack spacing="sm">
            <CellCheckbox
              label="Create Constraints"
              checked={config.constraints !== false}
              onChange={(e) => onConfigChange({ ...config, constraints: e.target.checked })}
            />

            <CellCheckbox
              label="Skip Errors"
              checked={config.skipErrors || false}
              onChange={(e) => onConfigChange({ ...config, skipErrors: e.target.checked })}
            />

            <CellCheckbox
              label="Data Only"
              checked={config.dataOnly || false}
              onChange={(e) => onConfigChange({ 
                ...config, 
                dataOnly: e.target.checked,
                schemaOnly: false 
              })}
            />
          </CellStack>
        </CellGrid>
      </CellCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 border-2 border-black text-black rounded hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!config.filePath && !config.sqlContent}
          className="px-4 py-2 bg-white border-2 border-black text-black rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </CellStack>
  )
}

// Plugin Manifest
export const SQL_PLUGIN_MANIFEST: PluginManifest = {
  id: 'sql-data-source',
  name: 'SQL Import',
  version: '1.0.0',
  description: 'Import data from SQL dump files or raw SQL statements',
  author: 'Manifold Team',
  license: 'MIT',
  main: 'built-in',
  category: 'data-source',
  tags: ['sql', 'database', 'import'],
  icon: '🗄️'
}
