// Plugin Manager
// Central manager for loading, managing, and executing plugins

import { 
  PluginManager as IPluginManager,
  PluginMetadata,
  PluginManifest,
  PluginConfig,
  PluginCategory,
  BasePlugin,
  DataSourcePlugin,
  TransformerPlugin,
  ExporterPlugin,
  VisualizationPlugin,
  PluginContext,
  PluginRegistry,
  PluginEvents
} from './types'
import { logger } from '../utils/logger'
import path from 'path'
import fs from 'fs/promises'

export class PluginManager implements IPluginManager {
  private plugins: Map<string, PluginMetadata> = new Map()
  private pluginInstances: Map<string, BasePlugin> = new Map()
  private registry: PluginRegistry
  private context: PluginContext
  private pluginPaths: Set<string> = new Set()

  constructor(registry: PluginRegistry, context: PluginContext) {
    this.registry = registry
    this.context = context
  }

  /**
   * Load a plugin from a file path
   */
  async loadPlugin(pluginPath: string): Promise<PluginMetadata> {
    try {
      this.context.logger.info(
        'Loading plugin',
        'plugin-manager',
        { path: pluginPath }
      )

      // Check if plugin is already loaded
      const existingPlugin = Array.from(this.plugins.values()).find(
        p => p.manifest.main === pluginPath
      )
      if (existingPlugin) {
        this.context.logger.warn(
          'Plugin already loaded',
          'plugin-manager',
          { pluginId: existingPlugin.manifest.id, path: pluginPath }
        )
        return existingPlugin
      }

      // Load plugin manifest
      const manifest = await this.loadManifest(pluginPath)
      
      // Validate manifest
      const validation = this.validateManifest(manifest)
      if (!validation.valid) {
        throw new Error(`Invalid plugin manifest: ${validation.errors.join(', ')}`)
      }

      // Load plugin configuration
      const config = await this.loadPluginConfig(manifest.id)

      // Create plugin metadata
      const metadata: PluginMetadata = {
        manifest,
        config,
        loaded: false,
        initialized: false,
        usageCount: 0,
        loadTime: Date.now()
      }

      // Register plugin
      this.plugins.set(manifest.id, metadata)
      this.pluginPaths.add(pluginPath)

      this.context.logger.info(
        'Plugin loaded successfully',
        'plugin-manager',
        { 
          pluginId: manifest.id, 
          name: manifest.name,
          version: manifest.version 
        }
      )

      return metadata
    } catch (error: any) {
      this.context.logger.error(
        'Failed to load plugin',
        'plugin-manager',
        { path: pluginPath, error: error.message }
      )
      throw error
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    try {
      const metadata = this.plugins.get(pluginId)
      if (!metadata) {
        throw new Error(`Plugin not found: ${pluginId}`)
      }

      this.context.logger.info(
        'Unloading plugin',
        'plugin-manager',
        { pluginId, name: metadata.manifest.name }
      )

      // Destroy plugin instance if it exists
      const instance = this.pluginInstances.get(pluginId)
      if (instance) {
        await instance.destroy()
        this.pluginInstances.delete(pluginId)
      }

      // Remove from registry
      this.registry.unregister(metadata.manifest.category, pluginId)

      // Remove plugin
      this.plugins.delete(pluginId)

      this.context.logger.info(
        'Plugin unloaded successfully',
        'plugin-manager',
        { pluginId, name: metadata.manifest.name }
      )
    } catch (error: any) {
      this.context.logger.error(
        'Failed to unload plugin',
        'plugin-manager',
        { pluginId, error: error.message }
      )
      throw error
    }
  }

  /**
   * Reload a plugin
   */
  async reloadPlugin(pluginId: string): Promise<PluginMetadata> {
    try {
      const metadata = this.plugins.get(pluginId)
      if (!metadata) {
        throw new Error(`Plugin not found: ${pluginId}`)
      }

      this.context.logger.info(
        'Reloading plugin',
        'plugin-manager',
        { pluginId, name: metadata.manifest.name }
      )

      // Unload first
      await this.unloadPlugin(pluginId)

      // Reload
      const reloadedMetadata = await this.loadPlugin(metadata.manifest.main)
      
      this.context.logger.info(
        'Plugin reloaded successfully',
        'plugin-manager',
        { pluginId, name: metadata.manifest.name }
      )

      return reloadedMetadata
    } catch (error: any) {
      this.context.logger.error(
        'Failed to reload plugin',
        'plugin-manager',
        { pluginId, error: error.message }
      )
      throw error
    }
  }

  /**
   * Discover plugins in a directory
   */
  async discoverPlugins(): Promise<PluginMetadata[]> {
    try {
      const discoveredPlugins: PluginMetadata[] = []
      const pluginDirectories = await this.getPluginDirectories()

      for (const dir of pluginDirectories) {
        try {
          const plugins = await this.discoverPluginsInDirectory(dir)
          discoveredPlugins.push(...plugins)
        } catch (error: any) {
          this.context.logger.warn(
            'Failed to discover plugins in directory',
            'plugin-manager',
            { directory: dir, error: error.message }
          )
        }
      }

      this.context.logger.info(
        'Plugin discovery completed',
        'plugin-manager',
        { discoveredCount: discoveredPlugins.length }
      )

      return discoveredPlugins
    } catch (error: any) {
      this.context.logger.error(
        'Failed to discover plugins',
        'plugin-manager',
        { error: error.message }
      )
      throw error
    }
  }

  /**
   * Install a plugin from npm package
   */
  async installPlugin(packageName: string, version?: string): Promise<PluginMetadata> {
    try {
      this.context.logger.info(
        'Installing plugin',
        'plugin-manager',
        { packageName, version }
      )

      // This would integrate with npm or a custom plugin registry
      // For now, we'll simulate the installation
      const installPath = path.join(process.cwd(), 'plugins', packageName)
      
      // Check if already installed
      if (this.pluginPaths.has(installPath)) {
        throw new Error(`Plugin already installed: ${packageName}`)
      }

      // In a real implementation, this would:
      // 1. Download the package from npm
      // 2. Install dependencies
      // 3. Validate the plugin
      // 4. Load the plugin
      
      // For now, we'll create a mock plugin
      const mockManifest: PluginManifest = {
        id: packageName,
        name: packageName,
        version: version || '1.0.0',
        description: `Installed plugin: ${packageName}`,
        author: 'Unknown',
        main: installPath,
        category: 'data-source',
        tags: ['installed']
      }

      const config: PluginConfig = {
        id: mockManifest.id,
        enabled: true,
        settings: {},
        version: mockManifest.version,
        lastUpdated: new Date()
      }

      const metadata: PluginMetadata = {
        manifest: mockManifest,
        config,
        loaded: false,
        initialized: false,
        usageCount: 0,
        loadTime: Date.now()
      }

      this.plugins.set(mockManifest.id, metadata)
      this.pluginPaths.add(installPath)

      this.context.logger.info(
        'Plugin installed successfully',
        'plugin-manager',
        { pluginId: mockManifest.id, name: mockManifest.name }
      )

      return metadata
    } catch (error: any) {
      this.context.logger.error(
        'Failed to install plugin',
        'plugin-manager',
        { packageName, version, error: error.message }
      )
      throw error
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    try {
      const metadata = this.plugins.get(pluginId)
      if (!metadata) {
        throw new Error(`Plugin not found: ${pluginId}`)
      }

      this.context.logger.info(
        'Uninstalling plugin',
        'plugin-manager',
        { pluginId, name: metadata.manifest.name }
      )

      // Unload first
      await this.unloadPlugin(pluginId)

      // Remove plugin files
      const pluginPath = metadata.manifest.main
      try {
        await fs.rm(pluginPath, { recursive: true, force: true })
      } catch (error: any) {
        this.context.logger.warn(
          'Failed to remove plugin files',
          'plugin-manager',
          { pluginId, path: pluginPath, error: error.message }
        )
      }

      this.pluginPaths.delete(pluginPath)

      this.context.logger.info(
        'Plugin uninstalled successfully',
        'plugin-manager',
        { pluginId, name: metadata.manifest.name }
      )
    } catch (error: any) {
      this.context.logger.error(
        'Failed to uninstall plugin',
        'plugin-manager',
        { pluginId, error: error.message }
      )
      throw error
    }
  }

  /**
   * Get a plugin by ID
   */
  getPlugin(pluginId: string): PluginMetadata | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: PluginCategory): PluginMetadata[] {
    return Array.from(this.plugins.values()).filter(
      p => p.manifest.category === category
    )
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values()).filter(
      p => p.config.enabled
    )
  }

  /**
   * Execute a plugin (get instance)
   */
  executePlugin<T extends BasePlugin>(pluginId: string): T | undefined {
    return this.getPluginInstance<T>(pluginId)
  }

  /**
   * Get plugin instance
   */
  getPluginInstance<T extends BasePlugin>(pluginId: string): T | undefined {
    const instance = this.pluginInstances.get(pluginId)
    if (instance) {
      // Update usage count
      const metadata = this.plugins.get(pluginId)
      if (metadata) {
        metadata.usageCount++
        metadata.lastUsed = new Date()
      }
      return instance as T
    }

    // Try to create instance
    return this.createPluginInstance<T>(pluginId)
  }

  /**
   * Create plugin instance
   */
  private async createPluginInstance<T extends BasePlugin>(pluginId: string): Promise<T | undefined> {
    try {
      const metadata = this.plugins.get(pluginId)
      if (!metadata) {
        return undefined
      }

      const PluginClass = this.registry.get(metadata.manifest.category, pluginId)
      if (!PluginClass) {
        this.context.logger.error(
          'Plugin class not found in registry',
          'plugin-manager',
          { pluginId, category: metadata.manifest.category }
        )
        return undefined
      }

      // Create instance
      const instance = new PluginClass(metadata.manifest, this.context, metadata.config)
      
      // Initialize if not already initialized
      if (!metadata.initialized) {
        await instance.initialize()
        metadata.initialized = true
      }

      // Store instance
      this.pluginInstances.set(pluginId, instance)
      metadata.loaded = true

      return instance as T
    } catch (error: any) {
      this.context.logger.error(
        'Failed to create plugin instance',
        'plugin-manager',
        { pluginId, error: error.message }
      )
      
      const metadata = this.plugins.get(pluginId)
      if (metadata) {
        metadata.error = error.message
      }
      
      return undefined
    }
  }

  /**
   * Load plugin manifest
   */
  private async loadManifest(pluginPath: string): Promise<PluginManifest> {
    try {
      const manifestPath = path.join(pluginPath, 'plugin.json')
      const manifestData = await fs.readFile(manifestPath, 'utf-8')
      return JSON.parse(manifestData)
    } catch (error: any) {
      throw new Error(`Failed to load plugin manifest: ${error.message}`)
    }
  }

  /**
   * Load plugin configuration
   */
  private async loadPluginConfig(pluginId: string): Promise<PluginConfig> {
    try {
      const configData = await this.context.storage.get(`plugin:${pluginId}:config`)
      if (configData) {
        return {
          ...configData,
          lastUpdated: new Date(configData.lastUpdated)
        }
      }
    } catch (error: any) {
      this.context.logger.warn(
        'Failed to load plugin configuration',
        'plugin-manager',
        { pluginId, error: error.message }
      )
    }

    // Return default configuration
    return {
      id: pluginId,
      enabled: true,
      settings: {},
      version: '1.0.0',
      lastUpdated: new Date()
    }
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'main', 'category']
    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    }

    // Validate category
    const validCategories = ['data-source', 'transformer', 'exporter', 'visualization', 'authentication', 'notification', 'integration', 'utility']
    if (manifest.category && !validCategories.includes(manifest.category)) {
      errors.push(`Invalid category: ${manifest.category}`)
    }

    // Validate version format
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push(`Invalid version format: ${manifest.version}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get plugin directories
   */
  private async getPluginDirectories(): Promise<string[]> {
    const directories: string[] = []
    
    // Built-in plugins
    directories.push(path.join(process.cwd(), 'lib', 'plugins', 'built-in'))
    
    // User plugins
    directories.push(path.join(process.cwd(), 'plugins'))
    
    // Node modules plugins
    directories.push(path.join(process.cwd(), 'node_modules', '@manifold', 'plugins'))

    // Filter existing directories
    const existingDirectories: string[] = []
    for (const dir of directories) {
      try {
        await fs.access(dir)
        existingDirectories.push(dir)
      } catch {
        // Directory doesn't exist, skip
      }
    }

    return existingDirectories
  }

  /**
   * Discover plugins in a directory
   */
  private async discoverPluginsInDirectory(directory: string): Promise<PluginMetadata[]> {
    const plugins: PluginMetadata[] = []

    try {
      const entries = await fs.readdir(directory, { withFileTypes: true })
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(directory, entry.name)
          
          try {
            const metadata = await this.loadPlugin(pluginPath)
            plugins.push(metadata)
          } catch (error: any) {
            this.context.logger.warn(
              'Failed to load plugin during discovery',
              'plugin-manager',
              { path: pluginPath, error: error.message }
            )
          }
        }
      }
    } catch (error: any) {
      this.context.logger.warn(
        'Failed to read plugin directory',
        'plugin-manager',
        { directory, error: error.message }
      )
    }

    return plugins
  }
}
