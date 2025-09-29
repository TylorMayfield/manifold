// Data Source Plugin Integration
// Integration layer between the plugin system and existing data source workflow

import { getPluginManager, initializePluginSystem } from '../index'
import { DataProviderType } from '../../types'
import { logger } from '../../utils/logger'

export class DataSourcePluginIntegration {
  private static instance: DataSourcePluginIntegration
  private pluginManager: any

  private constructor() {
    this.pluginManager = getPluginManager()
  }

  static getInstance(): DataSourcePluginIntegration {
    if (!DataSourcePluginIntegration.instance) {
      DataSourcePluginIntegration.instance = new DataSourcePluginIntegration()
    }
    return DataSourcePluginIntegration.instance
  }

  /**
   * Get available data source types from plugins
   */
  getAvailableDataSourceTypes(): Array<{
    id: string
    name: string
    description: string
    category: string
    pluginId: string
    importMethods: any[]
  }> {
    try {
      if (!this.pluginManager) {
        return []
      }
      const dataSourcePlugins = this.pluginManager.getPluginsByCategory('data-source')
      const enabledPlugins = dataSourcePlugins.filter(plugin => plugin.config.enabled)

      return enabledPlugins.map(plugin => {
        const pluginInstance = this.pluginManager.executePlugin(plugin.manifest.id)
        const importMethods = pluginInstance ? pluginInstance.getImportMethods() : []

        return {
          id: plugin.manifest.id,
          name: plugin.manifest.name,
          description: plugin.manifest.description,
          category: plugin.manifest.category,
          pluginId: plugin.manifest.id,
          importMethods
        }
      })
    } catch (error: any) {
      logger.error(
        'Failed to get available data source types',
        'plugin-integration',
        { error: error.message }
      )
      return []
    }
  }

  /**
   * Get configuration UI component for a plugin
   */
  getConfigUI(pluginId: string): React.ComponentType<any> | null {
    try {
      const plugin = this.pluginManager.executePlugin(pluginId)
      if (!plugin) {
        logger.warn('Plugin not found for config UI', 'plugin-integration', { pluginId })
        return null
      }

      return plugin.getConfigUI()
    } catch (error: any) {
      logger.error(
        'Failed to get config UI for plugin',
        'plugin-integration',
        { pluginId, error: error.message }
      )
      return null
    }
  }

  /**
   * Test connection for a plugin
   */
  async testConnection(pluginId: string, config: any): Promise<{ success: boolean; error?: string }> {
    try {
      const plugin = this.pluginManager.executePlugin(pluginId)
      if (!plugin) {
        return { success: false, error: 'Plugin not found' }
      }

      return await plugin.testConnection(config)
    } catch (error: any) {
      logger.error(
        'Failed to test connection for plugin',
        'plugin-integration',
        { pluginId, error: error.message }
      )
      return { success: false, error: error.message }
    }
  }

  /**
   * Get schema for a plugin
   */
  async getSchema(pluginId: string, config: any): Promise<any[]> {
    try {
      const plugin = this.pluginManager.executePlugin(pluginId)
      if (!plugin) {
        throw new Error('Plugin not found')
      }

      return await plugin.getSchema(config)
    } catch (error: any) {
      logger.error(
        'Failed to get schema for plugin',
        'plugin-integration',
        { pluginId, error: error.message }
      )
      throw error
    }
  }

  /**
   * Fetch data from a plugin
   */
  async fetchData(pluginId: string, config: any, options?: any): Promise<any> {
    try {
      const plugin = this.pluginManager.executePlugin(pluginId)
      if (!plugin) {
        throw new Error('Plugin not found')
      }

      return await plugin.fetchData(config, options)
    } catch (error: any) {
      logger.error(
        'Failed to fetch data from plugin',
        'plugin-integration',
        { pluginId, error: error.message }
      )
      throw error
    }
  }

  /**
   * Check if a data source type is provided by a plugin
   */
  isPluginDataSourceType(type: DataProviderType): boolean {
    try {
      const dataSourcePlugins = this.pluginManager.getPluginsByCategory('data-source')
      return dataSourcePlugins.some(plugin => plugin.manifest.id === type)
    } catch (error: any) {
      logger.error(
        'Failed to check if data source type is plugin-based',
        'plugin-integration',
        { type, error: error.message }
      )
      return false
    }
  }

  /**
   * Get plugin metadata for a data source type
   */
  getPluginMetadata(type: DataProviderType): any | null {
    try {
      const dataSourcePlugins = this.pluginManager.getPluginsByCategory('data-source')
      const plugin = dataSourcePlugins.find(p => p.manifest.id === type)
      return plugin || null
    } catch (error: any) {
      logger.error(
        'Failed to get plugin metadata',
        'plugin-integration',
        { type, error: error.message }
      )
      return null
    }
  }

  /**
   * Validate plugin configuration
   */
  async validatePluginConfig(pluginId: string, config: any): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const plugin = this.pluginManager.executePlugin(pluginId)
      if (!plugin) {
        return { valid: false, errors: ['Plugin not found'] }
      }

      return await plugin.validateConfig({ settings: config })
    } catch (error: any) {
      logger.error(
        'Failed to validate plugin configuration',
        'plugin-integration',
        { pluginId, error: error.message }
      )
      return { valid: false, errors: [error.message] }
    }
  }

  /**
   * Get all available import methods across all plugins
   */
  getAllImportMethods(): Array<{
    id: string
    name: string
    description: string
    pluginId: string
    pluginName: string
    icon: React.ReactNode
  }> {
    try {
      const dataSourcePlugins = this.pluginManager.getPluginsByCategory('data-source')
      const enabledPlugins = dataSourcePlugins.filter(plugin => plugin.config.enabled)

      const allMethods: any[] = []

      enabledPlugins.forEach(plugin => {
        try {
          const pluginInstance = this.pluginManager.executePlugin(plugin.manifest.id)
          if (pluginInstance) {
            const methods = pluginInstance.getImportMethods()
            methods.forEach(method => {
              allMethods.push({
                ...method,
                pluginId: plugin.manifest.id,
                pluginName: plugin.manifest.name
              })
            })
          }
        } catch (error: any) {
          logger.warn(
            'Failed to get import methods for plugin',
            'plugin-integration',
            { pluginId: plugin.manifest.id, error: error.message }
          )
        }
      })

      return allMethods
    } catch (error: any) {
      logger.error(
        'Failed to get all import methods',
        'plugin-integration',
        { error: error.message }
      )
      return []
    }
  }

  /**
   * Initialize plugin integration
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing data source plugin integration', 'plugin-integration')
      
      // Ensure plugin system is initialized
      await initializePluginSystem()
      this.pluginManager = getPluginManager()

      logger.info(
        'Data source plugin integration initialized',
        'plugin-integration',
        { 
          availablePlugins: this.getAvailableDataSourceTypes().length,
          totalImportMethods: this.getAllImportMethods().length
        }
      )
    } catch (error: any) {
      logger.error(
        'Failed to initialize data source plugin integration',
        'plugin-integration',
        { error: error.message }
      )
      throw error
    }
  }
}

// Export singleton instance
export const dataSourcePluginIntegration = DataSourcePluginIntegration.getInstance()
