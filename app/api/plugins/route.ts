import { NextRequest, NextResponse } from 'next/server'
import { getPluginManager, getPluginRegistry, initializePluginSystem } from '../../../lib/plugins'
import { logger } from '../../../lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const enabled = searchParams.get('enabled')
    
    logger.info('Plugin list requested', 'api', { category, enabled }, 'plugins/route.ts')
    
    // Ensure plugin system is initialized
    await initializePluginSystem()
    const manager = getPluginManager()
    
    let plugins
    if (category) {
      plugins = manager.getPluginsByCategory(category as any)
    } else if (enabled === 'true') {
      plugins = manager.getEnabledPlugins()
    } else {
      plugins = manager.getAllPlugins()
    }
    
    return NextResponse.json({
      success: true,
      plugins: plugins.map(plugin => ({
        id: plugin.manifest.id,
        name: plugin.manifest.name,
        version: plugin.manifest.version,
        description: plugin.manifest.description,
        author: plugin.manifest.author,
        category: plugin.manifest.category,
        tags: plugin.manifest.tags,
        enabled: plugin.config.enabled,
        loaded: plugin.loaded,
        initialized: plugin.initialized,
        error: plugin.error,
        lastUsed: plugin.lastUsed,
        usageCount: plugin.usageCount
      }))
    })
  } catch (error: any) {
    logger.error(
      'Failed to get plugins',
      'api',
      { error: error.message, stack: error.stack },
      'plugins/route.ts'
    )
    return NextResponse.json(
      { error: error.message || 'Failed to get plugins' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()
    
    logger.info('Plugin operation requested', 'api', { action }, 'plugins/route.ts')
    
    // Ensure plugin system is initialized
    await initializePluginSystem()
    const manager = getPluginManager()
    
    switch (action) {
      case 'load':
        if (!data?.path) {
          return NextResponse.json(
            { error: 'Plugin path required for loading' },
            { status: 400 }
          )
        }
        
        const loadedPlugin = await manager.loadPlugin(data.path)
        return NextResponse.json({
          success: true,
          plugin: loadedPlugin
        })
        
      case 'unload':
        if (!data?.pluginId) {
          return NextResponse.json(
            { error: 'Plugin ID required for unloading' },
            { status: 400 }
          )
        }
        
        await manager.unloadPlugin(data.pluginId)
        return NextResponse.json({
          success: true,
          message: 'Plugin unloaded successfully'
        })
        
      case 'reload':
        if (!data?.pluginId) {
          return NextResponse.json(
            { error: 'Plugin ID required for reloading' },
            { status: 400 }
          )
        }
        
        const reloadedPlugin = await manager.reloadPlugin(data.pluginId)
        return NextResponse.json({
          success: true,
          plugin: reloadedPlugin
        })
        
      case 'install':
        if (!data?.packageName) {
          return NextResponse.json(
            { error: 'Package name required for installation' },
            { status: 400 }
          )
        }
        
        const installedPlugin = await manager.installPlugin(
          data.packageName, 
          data.version
        )
        return NextResponse.json({
          success: true,
          plugin: installedPlugin
        })
        
      case 'uninstall':
        if (!data?.pluginId) {
          return NextResponse.json(
            { error: 'Plugin ID required for uninstallation' },
            { status: 400 }
          )
        }
        
        await manager.uninstallPlugin(data.pluginId)
        return NextResponse.json({
          success: true,
          message: 'Plugin uninstalled successfully'
        })
        
      case 'discover':
        const discoveredPlugins = await manager.discoverPlugins()
        return NextResponse.json({
          success: true,
          plugins: discoveredPlugins
        })
        
      case 'execute':
        if (!data?.pluginId || !data?.operation) {
          return NextResponse.json(
            { error: 'Plugin ID and operation required for execution' },
            { status: 400 }
          )
        }
        
        const plugin = manager.executePlugin(data.pluginId)
        if (!plugin) {
          return NextResponse.json(
            { error: 'Plugin not found or not loaded' },
            { status: 404 }
          )
        }
        
        // Execute plugin operation based on type
        let result
        switch (data.operation) {
          case 'testConnection':
            result = await (plugin as any).testConnection(data.config)
            break
          case 'getSchema':
            result = await (plugin as any).getSchema(data.config)
            break
          case 'fetchData':
            result = await (plugin as any).fetchData(data.config, data.options)
            break
          case 'transform':
            result = await (plugin as any).transform(data.data, data.config)
            break
          case 'export':
            result = await (plugin as any).export(data.data, data.config)
            break
          default:
            return NextResponse.json(
              { error: `Unknown operation: ${data.operation}` },
              { status: 400 }
            )
        }
        
        return NextResponse.json({
          success: true,
          result
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    logger.error(
      'Plugin operation failed',
      'api',
      { error: error.message, stack: error.stack },
      'plugins/route.ts'
    )
    return NextResponse.json(
      { error: error.message || 'Plugin operation failed' },
      { status: 500 }
    )
  }
}
