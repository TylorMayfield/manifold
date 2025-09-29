// CSV Data Source Plugin
// Built-in plugin for CSV file data sources

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
import { Upload, Download, FileText } from 'lucide-react'
import { CellInput, FormField, CellStack, CellCard } from '../../../components/ui'

export class CSVDataSourcePlugin extends AbstractDataSourcePlugin {
  constructor(manifest: PluginManifest, context: PluginContext, config: PluginConfig) {
    super(manifest, context, config)
  }

  protected async onInitialize(): Promise<void> {
    this.logOperation('CSV plugin initialized')
  }

  protected async onDestroy(): Promise<void> {
    this.logOperation('CSV plugin destroyed')
  }

  protected async onValidateConfig(config: Partial<PluginConfig>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    if (config.settings) {
      const settings = config.settings as any
      
      if (settings.filePath && !settings.filePath.endsWith('.csv')) {
        errors.push('File must be a CSV file')
      }
      
      if (settings.delimiter && typeof settings.delimiter !== 'string') {
        errors.push('Delimiter must be a string')
      }
      
      if (settings.hasHeader !== undefined && typeof settings.hasHeader !== 'boolean') {
        errors.push('Has header must be a boolean')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  protected async onConfigUpdate(config: PluginConfig): Promise<void> {
    this.logOperation('CSV plugin config updated', { config })
  }

  async testConnection(config: any): Promise<{ success: boolean; error?: string }> {
    try {
      this.logOperation('Testing CSV connection', { config })

      if (!config.filePath) {
        return { success: false, error: 'No file path provided' }
      }

      // In a real implementation, this would check if the file exists and is readable
      // For now, we'll simulate a successful test
      await new Promise(resolve => setTimeout(resolve, 100))

      return { success: true }
    } catch (error: any) {
      this.logError('CSV connection test failed', error, { config })
      return { success: false, error: error.message }
    }
  }

  async getSchema(config: any): Promise<any[]> {
    try {
      this.logOperation('Getting CSV schema', { config })

      if (!config.filePath) {
        throw new Error('No file path provided')
      }

      // In a real implementation, this would parse the CSV file and infer the schema
      // For now, we'll return a mock schema
      const mockSchema = [
        { name: 'id', type: 'string', nullable: false },
        { name: 'name', type: 'string', nullable: true },
        { name: 'email', type: 'string', nullable: true },
        { name: 'age', type: 'number', nullable: true },
        { name: 'created_at', type: 'date', nullable: false }
      ]

      await this.cacheSchema(mockSchema)
      return mockSchema
    } catch (error: any) {
      this.logError('Failed to get CSV schema', error, { config })
      throw error
    }
  }

  async fetchData(config: any, options?: FetchOptions): Promise<FetchResult> {
    try {
      this.logOperation('Fetching CSV data', { config, options })

      if (!config.filePath) {
        throw new Error('No file path provided')
      }

      const startTime = Date.now()

      // In a real implementation, this would parse the CSV file and return the data
      // For now, we'll return mock data
      const mockData = [
        { id: '1', name: 'John Doe', email: 'john@example.com', age: 30, created_at: '2023-01-01' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25, created_at: '2023-01-02' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', age: 35, created_at: '2023-01-03' }
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
          delimiter: config.delimiter || ',',
          hasHeader: config.hasHeader !== false
        },
        executionTime
      }

      this.logOperation('CSV data fetched successfully', { 
        recordCount: result.data.length,
        executionTime 
      })

      return result
    } catch (error: any) {
      this.logError('Failed to fetch CSV data', error, { config, options })
      throw error
    }
  }

  getConfigUI(): React.ComponentType<any> {
    return CSVConfigComponent
  }

  getImportMethods(): ImportMethod[] {
    return [
      {
        id: 'file-upload',
        name: 'File Upload',
        description: 'Upload CSV files directly to the platform',
        icon: React.createElement(Upload, { className: 'h-5 w-5' })
      },
      {
        id: 'url-import',
        name: 'URL Import',
        description: 'Import CSV files from web URLs',
        icon: React.createElement(Download, { className: 'h-5 w-5' })
      },
      {
        id: 'path-import',
        name: 'Local Path',
        description: 'Import from local file system paths',
        icon: React.createElement(FileText, { className: 'h-5 w-5' })
      }
    ]
  }
}

// Configuration UI Component
interface CSVConfigProps {
  config: any
  onConfigChange: (config: any) => void
  onNext: () => void
  onBack: () => void
}

const CSVConfigComponent: React.FC<CSVConfigProps> = ({ 
  config, 
  onConfigChange, 
  onNext, 
  onBack 
}) => {
  const [dragActive, setDragActive] = React.useState(false)

  const handleFileUpload = (file: File) => {
    if (file && file.name.endsWith('.csv')) {
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
        <h3 className="text-lg font-bold text-gray-900 mb-4">CSV Configuration</h3>
        <p className="text-gray-600 mb-6">
          Configure your CSV data source import settings
        </p>
      </div>

      {/* File Upload */}
      <FormField label="CSV File">
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
          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop your CSV file here, or click to browse
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                handleFileUpload(file)
              }
            }}
            className="hidden"
            id="csv-file-input"
          />
          <button
            onClick={() => document.getElementById('csv-file-input')?.click()}
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

      {/* CSV Options */}
      <CellCard padding="md">
        <h4 className="font-bold mb-4">CSV Options</h4>
        
        <CellStack spacing="md">
          <FormField 
            label="Delimiter" 
            helper="Character used to separate values (default: comma)"
          >
            <CellInput
              value={config.delimiter || ','}
              onChange={(e) => onConfigChange({ ...config, delimiter: e.target.value })}
              placeholder=","
              maxLength={1}
            />
          </FormField>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasHeader"
              checked={config.hasHeader !== false}
              onChange={(e) => onConfigChange({ ...config, hasHeader: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="hasHeader" className="text-gray-900">
              First row contains headers
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="trimWhitespace"
              checked={config.trimWhitespace !== false}
              onChange={(e) => onConfigChange({ ...config, trimWhitespace: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="trimWhitespace" className="text-gray-900">
              Trim whitespace from values
            </label>
          </div>
        </CellStack>
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
          disabled={!config.filePath}
          className="px-4 py-2 bg-white border-2 border-black text-black rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </CellStack>
  )
}

// Plugin Manifest
export const CSV_PLUGIN_MANIFEST: PluginManifest = {
  id: 'csv-data-source',
  name: 'CSV Data Source',
  version: '1.0.0',
  description: 'Import data from CSV files with flexible parsing options',
  author: 'Manifold Team',
  license: 'MIT',
  main: 'built-in',
  category: 'data-source',
  tags: ['csv', 'file', 'import'],
  icon: '📊'
}
