// Base Plugin Class
// Abstract base class that all plugins must extend

import { BasePlugin, PluginManifest, PluginContext, PluginConfig } from './types'
import { logger } from '../utils/logger'

export abstract class AbstractBasePlugin implements BasePlugin {
  public readonly manifest: PluginManifest
  public readonly context: PluginContext
  protected _config: PluginConfig
  protected _initialized: boolean = false

  constructor(manifest: PluginManifest, context: PluginContext, config: PluginConfig) {
    this.manifest = manifest
    this.context = context
    this._config = config
  }

  /**
   * Initialize the plugin
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      return
    }

    try {
      this.context.logger.info(
        `Initializing plugin: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id, version: this.manifest.version }
      )

      await this.onInitialize()
      this._initialized = true

      this.context.logger.info(
        `Plugin initialized successfully: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id }
      )

      this.context.events.emit('plugin:loaded', {
        pluginId: this.manifest.id,
        manifest: this.manifest
      })
    } catch (error: any) {
      this.context.logger.error(
        `Failed to initialize plugin: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id, error: error.message }
      )

      this.context.events.emit('plugin:error', {
        pluginId: this.manifest.id,
        error
      })

      throw error
    }
  }

  /**
   * Destroy the plugin
   */
  async destroy(): Promise<void> {
    if (!this._initialized) {
      return
    }

    try {
      this.context.logger.info(
        `Destroying plugin: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id }
      )

      await this.onDestroy()
      this._initialized = false

      this.context.logger.info(
        `Plugin destroyed successfully: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id }
      )

      this.context.events.emit('plugin:unloaded', {
        pluginId: this.manifest.id
      })
    } catch (error: any) {
      this.context.logger.error(
        `Failed to destroy plugin: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id, error: error.message }
      )

      throw error
    }
  }

  /**
   * Get current plugin configuration
   */
  getConfig(): PluginConfig {
    return { ...this._config }
  }

  /**
   * Update plugin configuration
   */
  async updateConfig(config: Partial<PluginConfig>): Promise<void> {
    try {
      // Validate the configuration
      const validation = await this.validateConfig(config)
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
      }

      // Merge with existing config
      this._config = {
        ...this._config,
        ...config,
        lastUpdated: new Date()
      }

      // Save configuration
      await this.context.storage.set(`plugin:${this.manifest.id}:config`, this._config)

      this.context.logger.info(
        `Plugin configuration updated: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id }
      )

      this.context.events.emit('plugin:config:updated', {
        pluginId: this.manifest.id,
        config: this._config
      })

      // Notify plugin of config change
      await this.onConfigUpdate(this._config)
    } catch (error: any) {
      this.context.logger.error(
        `Failed to update plugin configuration: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id, error: error.message }
      )

      throw error
    }
  }

  /**
   * Validate plugin configuration
   */
  async validateConfig(config: Partial<PluginConfig>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    // Basic validation
    if (config.id && config.id !== this.manifest.id) {
      errors.push('Plugin ID cannot be changed')
    }

    if (config.version && config.version !== this.manifest.version) {
      errors.push('Plugin version cannot be changed')
    }

    // Plugin-specific validation
    const pluginValidation = await this.onValidateConfig(config)
    if (!pluginValidation.valid) {
      errors.push(...pluginValidation.errors)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check if plugin is initialized
   */
  get initialized(): boolean {
    return this._initialized
  }

  /**
   * Get plugin status
   */
  getStatus(): {
    id: string
    name: string
    version: string
    initialized: boolean
    enabled: boolean
    lastUpdated: Date
  } {
    return {
      id: this.manifest.id,
      name: this.manifest.name,
      version: this.manifest.version,
      initialized: this._initialized,
      enabled: this._config.enabled,
      lastUpdated: this._config.lastUpdated
    }
  }

  // Abstract methods to be implemented by subclasses
  protected abstract onInitialize(): Promise<void>
  protected abstract onDestroy(): Promise<void>
  protected abstract onValidateConfig(config: Partial<PluginConfig>): Promise<{ valid: boolean; errors: string[] }>
  protected abstract onConfigUpdate(config: PluginConfig): Promise<void>

  // Utility methods
  protected async loadPluginConfig(): Promise<PluginConfig> {
    try {
      const config = await this.context.storage.get(`plugin:${this.manifest.id}:config`)
      if (config) {
        return {
          ...config,
          lastUpdated: new Date(config.lastUpdated)
        }
      }
    } catch (error) {
      this.context.logger.warn(
        `Failed to load plugin configuration: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id, error: error instanceof Error ? error.message : 'Unknown error' }
      )
    }

    // Return default config
    return {
      id: this.manifest.id,
      enabled: true,
      settings: {},
      version: this.manifest.version,
      lastUpdated: new Date()
    }
  }

  protected async savePluginConfig(config: PluginConfig): Promise<void> {
    try {
      await this.context.storage.set(`plugin:${this.manifest.id}:config`, config)
    } catch (error) {
      this.context.logger.error(
        `Failed to save plugin configuration: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id, error: error instanceof Error ? error.message : 'Unknown error' }
      )
      throw error
    }
  }

  protected createError(message: string, code?: string): Error {
    const error = new Error(message)
    if (code) {
      ;(error as any).code = code
    }
    return error
  }

  protected logOperation(operation: string, data?: any): void {
    this.context.logger.info(
      `Plugin operation: ${operation}`,
      'plugin-system',
      {
        pluginId: this.manifest.id,
        pluginName: this.manifest.name,
        ...data
      }
    )
  }

  protected logError(operation: string, error: Error, data?: any): void {
    this.context.logger.error(
      `Plugin operation failed: ${operation}`,
      'plugin-system',
      {
        pluginId: this.manifest.id,
        pluginName: this.manifest.name,
        error: error.message,
        ...data
      }
    )
  }
}

// Data Source Plugin Base Class
export abstract class AbstractDataSourcePlugin extends AbstractBasePlugin {
  protected _connectionTested: boolean = false
  protected _schema: any[] = []

  /**
   * Test connection to data source
   */
  abstract testConnection(config: any): Promise<{ success: boolean; error?: string }>

  /**
   * Get data source schema
   */
  abstract getSchema(config: any): Promise<any[]>

  /**
   * Fetch data from source
   */
  abstract fetchData(config: any, options?: any): Promise<any>

  /**
   * Get configuration UI component
   */
  abstract getConfigUI(): React.ComponentType<any>

  /**
   * Get available import methods
   */
  abstract getImportMethods(): any[]

  /**
   * Cache schema for performance
   */
  async cacheSchema(schema: any[]): Promise<void> {
    this._schema = schema
    try {
      await this.context.storage.set(`plugin:${this.manifest.id}:schema`, schema)
    } catch (error) {
      this.context.logger.warn(
        `Failed to cache schema for plugin: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id }
      )
    }
  }

  /**
   * Get cached schema
   */
  async getCachedSchema(): Promise<any[]> {
    if (this._schema.length > 0) {
      return this._schema
    }

    try {
      const cachedSchema = await this.context.storage.get(`plugin:${this.manifest.id}:schema`)
      if (cachedSchema) {
        this._schema = cachedSchema
        return cachedSchema
      }
    } catch (error) {
      this.context.logger.warn(
        `Failed to load cached schema for plugin: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id }
      )
    }

    return []
  }

  /**
   * Clear cached schema
   */
  async clearCachedSchema(): Promise<void> {
    this._schema = []
    try {
      await this.context.storage.delete(`plugin:${this.manifest.id}:schema`)
    } catch (error) {
      this.context.logger.warn(
        `Failed to clear cached schema for plugin: ${this.manifest.name}`,
        'plugin-system',
        { pluginId: this.manifest.id }
      )
    }
  }
}

// Transformer Plugin Base Class
export abstract class AbstractTransformerPlugin extends AbstractBasePlugin {
  /**
   * Transform data
   */
  abstract transform(data: any[], config: any): Promise<any[]>

  /**
   * Validate transformation configuration
   */
  abstract validateTransformation(config: any): Promise<{ valid: boolean; errors: string[] }>

  /**
   * Get configuration UI component
   */
  abstract getConfigUI(): React.ComponentType<any>
}

// Exporter Plugin Base Class
export abstract class AbstractExporterPlugin extends AbstractBasePlugin {
  /**
   * Export data
   */
  abstract export(data: any[], config: any): Promise<any>

  /**
   * Validate export configuration
   */
  abstract validateExportConfig(config: any): Promise<{ valid: boolean; errors: string[] }>

  /**
   * Get configuration UI component
   */
  abstract getConfigUI(): React.ComponentType<any>
}

// Visualization Plugin Base Class
export abstract class AbstractVisualizationPlugin extends AbstractBasePlugin {
  /**
   * Render visualization
   */
  abstract render(data: any[], config: any): Promise<React.ReactElement>

  /**
   * Get supported data types
   */
  abstract getSupportedDataTypes(): string[]

  /**
   * Get configuration UI component
   */
  abstract getConfigUI(): React.ComponentType<any>
}
