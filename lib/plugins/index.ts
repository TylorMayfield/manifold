// Plugin System Entry Point
// Main exports and initialization for the plugin system

export * from './types'
export * from './BasePlugin'
export { PluginManager } from './PluginManager'
export { PluginRegistry } from './PluginRegistry'
export * from './PluginContext'

// Built-in plugins
export * from './built-in/CSVDataSourcePlugin'
export * from './built-in/SQLDataSourcePlugin'

// Plugin System Initialization
import { PluginManager } from './PluginManager'
import { PluginRegistry } from './PluginRegistry'
import { DefaultPluginContext, ServerPluginContext } from './PluginContext'
import { CSVDataSourcePlugin, CSV_PLUGIN_MANIFEST } from './built-in/CSVDataSourcePlugin'
import { SQLDataSourcePlugin, SQL_PLUGIN_MANIFEST } from './built-in/SQLDataSourcePlugin'

class PluginSystem {
  private static instance: PluginSystem
  private registry: PluginRegistry
  private manager: PluginManager
  private context: DefaultPluginContext | ServerPluginContext
  private initialized: boolean = false

  private constructor() {
    // Lazy initialization to avoid build-time issues
    this.registry = null as any
    this.context = null as any
    this.manager = null as any
  }

  static getInstance(): PluginSystem {
    if (!PluginSystem.instance) {
      PluginSystem.instance = new PluginSystem()
    }
    return PluginSystem.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // Initialize components if not already done
      if (!this.registry) {
        this.registry = new PluginRegistry()
        this.context = typeof window !== 'undefined' 
          ? new DefaultPluginContext() 
          : new ServerPluginContext()
        this.manager = new PluginManager(this.registry, this.context)
      }

      // Register built-in plugins
      await this.registerBuiltInPlugins()

      // Discover and load plugins
      await this.discoverAndLoadPlugins()

      this.initialized = true
      
      this.context.logger.info(
        'Plugin system initialized successfully',
        'plugin-system',
        { 
          totalPlugins: this.manager.getAllPlugins().length,
          enabledPlugins: this.manager.getEnabledPlugins().length
        }
      )
    } catch (error: any) {
      if (this.context) {
        this.context.logger.error(
          'Failed to initialize plugin system',
          'plugin-system',
          { error: error.message }
        )
      }
      throw error
    }
  }

  private async registerBuiltInPlugins(): Promise<void> {
    // TODO: Register CSV and SQL plugins once plugin system is fully implemented
    // this.registry.register('data-source', CSVDataSourcePlugin)
    // this.registry.register('data-source', SQLDataSourcePlugin)

    this.context.logger.info(
      'Built-in plugins registration skipped (pending implementation)',
      'plugin-system',
      { 
        dataSourcePlugins: 0
      }
    )
  }

  private async discoverAndLoadPlugins(): Promise<void> {
    try {
      const discoveredPlugins = await this.manager.discoverPlugins()
      
      // Load discovered plugins
      for (const plugin of discoveredPlugins) {
        try {
          await this.manager.loadPlugin(plugin.manifest.main)
        } catch (error: any) {
          this.context.logger.warn(
            'Failed to load discovered plugin',
            'plugin-system',
            { 
              pluginId: plugin.manifest.id, 
              error: error.message 
            }
          )
        }
      }

      this.context.logger.info(
        'Plugin discovery completed',
        'plugin-system',
        { discoveredCount: discoveredPlugins.length }
      )
    } catch (error: any) {
      this.context.logger.error(
        'Failed to discover plugins',
        'plugin-system',
        { error: error.message }
      )
    }
  }

  getManager(): PluginManager {
    if (!this.manager) {
      throw new Error('Plugin system not initialized. Call initialize() first.')
    }
    return this.manager
  }

  getRegistry(): PluginRegistry {
    if (!this.registry) {
      throw new Error('Plugin system not initialized. Call initialize() first.')
    }
    return this.registry
  }

  getContext(): DefaultPluginContext | ServerPluginContext {
    if (!this.context) {
      throw new Error('Plugin system not initialized. Call initialize() first.')
    }
    return this.context
  }

  isInitialized(): boolean {
    return this.initialized
  }

  async destroy(): Promise<void> {
    if (!this.initialized || !this.manager || !this.registry || !this.context) {
      return
    }

    try {
      // Unload all plugins
      const allPlugins = this.manager.getAllPlugins()
      for (const plugin of allPlugins) {
        try {
          await this.manager.unloadPlugin(plugin.manifest.id)
        } catch (error: any) {
          this.context.logger.warn(
            'Failed to unload plugin during destruction',
            'plugin-system',
            { pluginId: plugin.manifest.id, error: error.message }
          )
        }
      }

      // Cleanup
      this.registry.clearAll()
      this.context.destroy()

      this.initialized = false

      this.context.logger.info(
        'Plugin system destroyed successfully',
        'plugin-system'
      )
    } catch (error: any) {
      if (this.context) {
        this.context.logger.error(
          'Failed to destroy plugin system',
          'plugin-system',
          { error: error.message }
        )
      }
      throw error
    }
  }
}

// Export singleton instance (lazy loaded)
let _pluginSystem: PluginSystem | null = null

export function getPluginSystem(): PluginSystem {
  if (!_pluginSystem) {
    _pluginSystem = PluginSystem.getInstance()
  }
  return _pluginSystem
}

// Export initialization function
export async function initializePluginSystem(): Promise<void> {
  const system = getPluginSystem()
  return system.initialize()
}

// Export cleanup function
export async function destroyPluginSystem(): Promise<void> {
  if (_pluginSystem) {
    await _pluginSystem.destroy()
    _pluginSystem = null
  }
}

// Export getters for easy access
export function getPluginManager() {
  const system = getPluginSystem()
  return system.getManager()
}

export function getPluginRegistry() {
  const system = getPluginSystem()
  return system.getRegistry()
}

export function getPluginContext() {
  const system = getPluginSystem()
  return system.getContext()
}

// Helper functions for common operations
export async function getDataSourcePlugins() {
  const manager = getPluginManager()
  return manager.getPluginsByCategory('data-source')
}

export async function getEnabledDataSourcePlugins() {
  const manager = getPluginManager()
  const allPlugins = manager.getPluginsByCategory('data-source')
  return allPlugins.filter(plugin => plugin.config.enabled)
}

export async function executeDataSourcePlugin(pluginId: string, operation: string, config: any, options?: any) {
  const manager = getPluginManager()
  const plugin = manager.executePlugin(pluginId)
  
  if (!plugin) {
    throw new Error(`Plugin not found: ${pluginId}`)
  }

  switch (operation) {
    case 'testConnection':
      return await (plugin as any).testConnection(config)
    case 'getSchema':
      return await (plugin as any).getSchema(config)
    case 'fetchData':
      return await (plugin as any).fetchData(config, options)
    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}

// Plugin development utilities
export function createPluginManifest(manifest: Partial<any>): any {
  return {
    id: manifest.id || 'unknown',
    name: manifest.name || 'Unknown Plugin',
    version: manifest.version || '1.0.0',
    description: manifest.description || 'No description provided',
    author: manifest.author || 'Unknown',
    license: manifest.license || 'MIT',
    main: manifest.main || 'index.js',
    category: manifest.category || 'utility',
    tags: manifest.tags || [],
    ...manifest
  }
}

export function validatePluginManifest(manifest: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  const requiredFields = ['id', 'name', 'version', 'description', 'author', 'main', 'category']
  for (const field of requiredFields) {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  const validCategories = ['data-source', 'transformer', 'exporter', 'visualization', 'authentication', 'notification', 'integration', 'utility']
  if (manifest.category && !validCategories.includes(manifest.category)) {
    errors.push(`Invalid category: ${manifest.category}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
