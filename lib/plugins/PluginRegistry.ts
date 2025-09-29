// Plugin Registry
// Registry for managing plugin classes and categories

import { PluginRegistry as IPluginRegistry, PluginCategory, BasePlugin } from './types'
import { logger } from '../utils/logger'

export class PluginRegistry implements IPluginRegistry {
  private registry: Map<PluginCategory, Map<string, new (manifest: any, context: any) => BasePlugin>> = new Map()

  constructor() {
    // Initialize registry for all categories
    const categories: PluginCategory[] = [
      'data-source',
      'transformer', 
      'exporter',
      'visualization',
      'authentication',
      'notification',
      'integration',
      'utility'
    ]

    for (const category of categories) {
      this.registry.set(category, new Map())
    }
  }

  /**
   * Register a plugin class
   */
  register<T extends BasePlugin>(
    category: PluginCategory,
    plugin: new (manifest: any, context: any) => T
  ): void {
    try {
      // Get category registry
      let categoryRegistry = this.registry.get(category)
      if (!categoryRegistry) {
        categoryRegistry = new Map()
        this.registry.set(category, categoryRegistry)
      }

      // Create a temporary instance to get the plugin ID
      // This is a bit hacky, but we need the manifest to get the ID
      // In a real implementation, we might store the manifest separately
      const tempInstance = new plugin({ id: 'temp' }, {} as any)
      const pluginId = tempInstance.manifest?.id || 'unknown'

      // Register the plugin
      categoryRegistry.set(pluginId, plugin)

      logger.info(
        'Plugin registered',
        'plugin-registry',
        { category, pluginId }
      )
    } catch (error: any) {
      logger.error(
        'Failed to register plugin',
        'plugin-registry',
        { category, error: error.message }
      )
      throw error
    }
  }

  /**
   * Get a plugin class by category and ID
   */
  get<T extends BasePlugin>(
    category: PluginCategory,
    id: string
  ): new (manifest: any, context: any) => T | undefined {
    const categoryRegistry = this.registry.get(category)
    if (!categoryRegistry) {
      return undefined
    }

    const pluginClass = categoryRegistry.get(id)
    return pluginClass as new (manifest: any, context: any) => T | undefined
  }

  /**
   * Get all plugins in a category
   */
  getAll(category: PluginCategory): Array<{
    id: string
    constructor: new (manifest: any, context: any) => BasePlugin
  }> {
    const categoryRegistry = this.registry.get(category)
    if (!categoryRegistry) {
      return []
    }

    return Array.from(categoryRegistry.entries()).map(([id, constructor]) => ({
      id,
      constructor
    }))
  }

  /**
   * Unregister a plugin
   */
  unregister(category: PluginCategory, id: string): void {
    const categoryRegistry = this.registry.get(category)
    if (categoryRegistry) {
      const removed = categoryRegistry.delete(id)
      
      if (removed) {
        logger.info(
          'Plugin unregistered',
          'plugin-registry',
          { category, id }
        )
      } else {
        logger.warn(
          'Plugin not found for unregistration',
          'plugin-registry',
          { category, id }
        )
      }
    }
  }

  /**
   * Check if a plugin is registered
   */
  isRegistered(category: PluginCategory, id: string): boolean {
    const categoryRegistry = this.registry.get(category)
    return categoryRegistry ? categoryRegistry.has(id) : false
  }

  /**
   * Get all registered plugin IDs in a category
   */
  getPluginIds(category: PluginCategory): string[] {
    const categoryRegistry = this.registry.get(category)
    return categoryRegistry ? Array.from(categoryRegistry.keys()) : []
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalPlugins: number
    pluginsByCategory: Record<PluginCategory, number>
  } {
    const stats = {
      totalPlugins: 0,
      pluginsByCategory: {} as Record<PluginCategory, number>
    }

    for (const [category, categoryRegistry] of this.registry.entries()) {
      const count = categoryRegistry.size
      stats.pluginsByCategory[category] = count
      stats.totalPlugins += count
    }

    return stats
  }

  /**
   * Clear all plugins in a category
   */
  clearCategory(category: PluginCategory): void {
    const categoryRegistry = this.registry.get(category)
    if (categoryRegistry) {
      const count = categoryRegistry.size
      categoryRegistry.clear()
      
      logger.info(
        'Plugin category cleared',
        'plugin-registry',
        { category, clearedCount: count }
      )
    }
  }

  /**
   * Clear all plugins
   */
  clearAll(): void {
    const totalCount = Array.from(this.registry.values()).reduce(
      (sum, categoryRegistry) => sum + categoryRegistry.size,
      0
    )

    this.registry.clear()

    // Re-initialize empty registries
    const categories: PluginCategory[] = [
      'data-source',
      'transformer', 
      'exporter',
      'visualization',
      'authentication',
      'notification',
      'integration',
      'utility'
    ]

    for (const category of categories) {
      this.registry.set(category, new Map())
    }

    logger.info(
      'Plugin registry cleared',
      'plugin-registry',
      { clearedCount: totalCount }
    )
  }

  /**
   * Validate plugin compatibility
   */
  validatePlugin(
    category: PluginCategory,
    pluginClass: new (manifest: any, context: any) => BasePlugin
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Try to create a temporary instance
      const tempInstance = new pluginClass({ id: 'temp' }, {} as any)
      
      // Check required methods
      const requiredMethods = ['initialize', 'destroy', 'getConfig', 'updateConfig', 'validateConfig']
      for (const method of requiredMethods) {
        if (typeof tempInstance[method as keyof BasePlugin] !== 'function') {
          errors.push(`Missing required method: ${method}`)
        }
      }

      // Check manifest
      if (!tempInstance.manifest) {
        errors.push('Missing manifest property')
      } else {
        const manifest = tempInstance.manifest
        if (!manifest.id) errors.push('Missing manifest.id')
        if (!manifest.name) errors.push('Missing manifest.name')
        if (!manifest.version) errors.push('Missing manifest.version')
        if (!manifest.category) errors.push('Missing manifest.category')
        if (manifest.category !== category) {
          errors.push(`Category mismatch: expected ${category}, got ${manifest.category}`)
        }
      }

    } catch (error: any) {
      errors.push(`Plugin validation failed: ${error.message}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get plugin dependencies
   */
  getPluginDependencies(category: PluginCategory, id: string): string[] {
    // This would analyze the plugin class to determine dependencies
    // For now, return empty array
    return []
  }

  /**
   * Check for circular dependencies
   */
  checkCircularDependencies(): { hasCircular: boolean; cycles: string[][] } {
    // This would analyze the plugin registry for circular dependencies
    // For now, return no cycles
    return {
      hasCircular: false,
      cycles: []
    }
  }

  /**
   * Get plugin load order
   */
  getPluginLoadOrder(category: PluginCategory): string[] {
    const categoryRegistry = this.registry.get(category)
    if (!categoryRegistry) {
      return []
    }

    // Simple topological sort based on dependencies
    // In a real implementation, this would be more sophisticated
    return Array.from(categoryRegistry.keys())
  }
}
