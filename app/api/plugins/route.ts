import { NextRequest, NextResponse } from 'next/server'
import { getPluginManager, getPluginRegistry, initializePluginSystem } from '../../../lib/plugins'
import { logger } from '../../../lib/utils/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const enabled = searchParams.get('enabled')
    
    logger.info('Plugin list requested', 'api', { category, enabled }, 'plugins/route.ts')
    
    // Return default built-in plugins for now
    // TODO: Integrate with actual plugin system when ready
    const defaultPlugins = [
      {
        id: 'csv-data-source',
        name: 'CSV Data Source',
        version: '1.0.0',
        description: 'Import and parse CSV files with automatic schema detection',
        author: 'Manifold Team',
        category: 'data-source',
        tags: ['csv', 'import', 'file'],
        enabled: true,
        loaded: true,
        initialized: true,
        usageCount: 0
      },
      {
        id: 'json-data-source',
        name: 'JSON Data Source',
        version: '1.0.0',
        description: 'Import and parse JSON files with nested object support',
        author: 'Manifold Team',
        category: 'data-source',
        tags: ['json', 'import', 'file'],
        enabled: true,
        loaded: true,
        initialized: true,
        usageCount: 0
      },
      {
        id: 'database-connector',
        name: 'Database Connector',
        version: '1.0.0',
        description: 'Connect to MySQL, PostgreSQL, and SQLite databases',
        author: 'Manifold Team',
        category: 'data-source',
        tags: ['database', 'sql', 'connector'],
        enabled: true,
        loaded: true,
        initialized: true,
        usageCount: 0
      },
      {
        id: 'data-transformer',
        name: 'Data Transformer',
        version: '1.0.0',
        description: 'Transform, filter, and map data with custom JavaScript',
        author: 'Manifold Team',
        category: 'transformation',
        tags: ['transform', 'filter', 'map'],
        enabled: true,
        loaded: true,
        initialized: true,
        usageCount: 0
      },
      {
        id: 'export-plugin',
        name: 'Data Export',
        version: '1.0.0',
        description: 'Export data to CSV, JSON, Excel, or custom formats',
        author: 'Manifold Team',
        category: 'export',
        tags: ['export', 'csv', 'json', 'excel'],
        enabled: true,
        loaded: true,
        initialized: true,
        usageCount: 0
      }
    ];
    
    let plugins = defaultPlugins;
    
    // Filter by category if requested
    if (category && category !== 'all') {
      plugins = plugins.filter(p => p.category === category);
    }
    
    // Filter by enabled if requested
    if (enabled === 'true') {
      plugins = plugins.filter(p => p.enabled);
    }
    
    return NextResponse.json({
      success: true,
      plugins
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
