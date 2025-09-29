// Plugin System Types
// Core interfaces and types for the plugin architecture

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  license?: string
  homepage?: string
  repository?: string
  keywords?: string[]
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  main: string
  icon?: string
  category: PluginCategory
  tags: string[]
  minManifoldVersion?: string
  maxManifoldVersion?: string
}

export type PluginCategory = 
  | 'data-source'
  | 'transformer'
  | 'exporter'
  | 'visualization'
  | 'authentication'
  | 'notification'
  | 'integration'
  | 'utility'

export interface PluginConfig {
  id: string
  enabled: boolean
  settings: Record<string, any>
  version: string
  lastUpdated: Date
}

export interface PluginContext {
  logger: {
    info: (message: string, category?: string, data?: any) => void
    warn: (message: string, category?: string, data?: any) => void
    error: (message: string, category?: string, data?: any) => void
    debug: (message: string, category?: string, data?: any) => void
  }
  api: {
    request: (endpoint: string, options?: RequestInit) => Promise<Response>
    get: (endpoint: string) => Promise<any>
    post: (endpoint: string, data?: any) => Promise<any>
    put: (endpoint: string, data?: any) => Promise<any>
    delete: (endpoint: string) => Promise<any>
  }
  storage: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
    delete: (key: string) => Promise<void>
    clear: () => Promise<void>
  }
  events: {
    emit: (event: string, data?: any) => void
    on: (event: string, handler: (data?: any) => void) => void
    off: (event: string, handler: (data?: any) => void) => void
  }
  ui: {
    showNotification: (message: string, type: 'success' | 'warning' | 'error' | 'info') => void
    showModal: (component: React.ComponentType, props?: any) => void
    hideModal: () => void
  }
}

export interface PluginMetadata {
  manifest: PluginManifest
  config: PluginConfig
  loaded: boolean
  initialized: boolean
  error?: string
  loadTime?: number
  lastUsed?: Date
  usageCount: number
}

// Base Plugin Interface
export interface BasePlugin {
  readonly manifest: PluginManifest
  readonly context: PluginContext
  
  // Lifecycle methods
  initialize(): Promise<void>
  destroy(): Promise<void>
  
  // Configuration
  getConfig(): PluginConfig
  updateConfig(config: Partial<PluginConfig>): Promise<void>
  validateConfig(config: Partial<PluginConfig>): Promise<{ valid: boolean; errors: string[] }>
}

// Data Source Plugin Interface
export interface DataSourcePlugin extends BasePlugin {
  // Data source specific methods
  testConnection(config: any): Promise<{ success: boolean; error?: string }>
  getSchema(config: any): Promise<any[]>
  fetchData(config: any, options?: FetchOptions): Promise<FetchResult>
  
  // Configuration UI
  getConfigUI(): React.ComponentType<DataSourceConfigProps>
  getImportMethods(): ImportMethod[]
}

// Transformer Plugin Interface
export interface TransformerPlugin extends BasePlugin {
  // Transformation methods
  transform(data: any[], config: any): Promise<any[]>
  validateTransformation(config: any): Promise<{ valid: boolean; errors: string[] }>
  
  // Configuration UI
  getConfigUI(): React.ComponentType<TransformerConfigProps>
}

// Exporter Plugin Interface
export interface ExporterPlugin extends BasePlugin {
  // Export methods
  export(data: any[], config: any): Promise<ExportResult>
  validateExportConfig(config: any): Promise<{ valid: boolean; errors: string[] }>
  
  // Configuration UI
  getConfigUI(): React.ComponentType<ExporterConfigProps>
}

// Visualization Plugin Interface
export interface VisualizationPlugin extends BasePlugin {
  // Visualization methods
  render(data: any[], config: any): Promise<React.ReactElement>
  getSupportedDataTypes(): string[]
  
  // Configuration UI
  getConfigUI(): React.ComponentType<VisualizationConfigProps>
}

// Plugin Manager Interface
export interface PluginManager {
  // Plugin lifecycle
  loadPlugin(path: string): Promise<PluginMetadata>
  unloadPlugin(id: string): Promise<void>
  reloadPlugin(id: string): Promise<PluginMetadata>
  
  // Plugin discovery
  discoverPlugins(): Promise<PluginMetadata[]>
  installPlugin(packageName: string, version?: string): Promise<PluginMetadata>
  uninstallPlugin(id: string): Promise<void>
  
  // Plugin management
  getPlugin(id: string): PluginMetadata | undefined
  getAllPlugins(): PluginMetadata[]
  getPluginsByCategory(category: PluginCategory): PluginMetadata[]
  getEnabledPlugins(): PluginMetadata[]
  
  // Plugin execution
  executePlugin<T extends BasePlugin>(id: string): T | undefined
  getPluginInstance<T extends BasePlugin>(id: string): T | undefined
}

// Configuration Props
export interface DataSourceConfigProps {
  config: any
  onConfigChange: (config: any) => void
  onNext: () => void
  onBack: () => void
}

export interface TransformerConfigProps {
  config: any
  onConfigChange: (config: any) => void
  onNext: () => void
  onBack: () => void
}

export interface ExporterConfigProps {
  config: any
  onConfigChange: (config: any) => void
  onNext: () => void
  onBack: () => void
}

export interface VisualizationConfigProps {
  config: any
  onConfigChange: (config: any) => void
  onNext: () => void
  onBack: () => void
}

// Data Source Specific Types
export interface ImportMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  configSchema?: any
}

export interface FetchOptions {
  limit?: number
  offset?: number
  filters?: Record<string, any>
  sort?: { field: string; direction: 'asc' | 'desc' }
  timeout?: number
}

export interface FetchResult {
  data: any[]
  totalCount?: number
  hasMore?: boolean
  schema?: any[]
  metadata?: any
  executionTime: number
}

export interface ExportResult {
  success: boolean
  path?: string
  url?: string
  data?: any
  error?: string
  metadata?: any
}

// Plugin Registry
export interface PluginRegistry {
  register<T extends BasePlugin>(
    category: PluginCategory,
    plugin: new (manifest: PluginManifest, context: PluginContext) => T
  ): void
  
  get<T extends BasePlugin>(
    category: PluginCategory,
    id: string
  ): new (manifest: PluginManifest, context: PluginContext) => T | undefined
  
  getAll(category: PluginCategory): Array<{
    id: string
    constructor: new (manifest: PluginManifest, context: PluginContext) => BasePlugin
  }>
  
  unregister(category: PluginCategory, id: string): void
}

// Plugin Events
export interface PluginEvents {
  'plugin:loaded': { pluginId: string; manifest: PluginManifest }
  'plugin:unloaded': { pluginId: string }
  'plugin:error': { pluginId: string; error: Error }
  'plugin:config:updated': { pluginId: string; config: PluginConfig }
  'data:fetched': { pluginId: string; data: any[] }
  'data:transformed': { pluginId: string; data: any[] }
  'data:exported': { pluginId: string; result: ExportResult }
}

// Plugin Development Types
export interface PluginDevelopmentContext {
  // Development tools
  hotReload: boolean
  debugMode: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  
  // Development utilities
  createMockData: (schema: any[], count: number) => any[]
  validateSchema: (schema: any) => boolean
  generateTestConfig: (pluginId: string) => any
}

// Plugin Package Structure
export interface PluginPackage {
  manifest: PluginManifest
  main: string
  files: Record<string, string>
  dependencies: Record<string, string>
  devDependencies?: Record<string, string>
}

export interface PluginInstallationOptions {
  version?: string
  force?: boolean
  dev?: boolean
  registry?: string
}

export interface PluginInstallationResult {
  success: boolean
  plugin?: PluginMetadata
  error?: string
  warnings?: string[]
}
