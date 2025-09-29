# 🔌 Manifold Plugin System

A comprehensive plugin architecture that allows developers to easily extend Manifold with custom data sources, transformers, exporters, and visualizations.

## 🎯 Overview

The Manifold Plugin System provides a robust, type-safe foundation for creating extensible data processing capabilities. Plugins can be:

- **Data Sources**: Import data from various sources (APIs, databases, files)
- **Transformers**: Process and transform data
- **Exporters**: Export data to different formats and destinations
- **Visualizations**: Create custom charts and visualizations
- **Utilities**: Add helper functions and tools

## 🏗️ Architecture

### Core Components

1. **Plugin Registry**: Manages plugin classes and categories
2. **Plugin Manager**: Handles plugin lifecycle (load, unload, execute)
3. **Plugin Context**: Provides plugins with logging, API, storage, and UI access
4. **Base Plugin Classes**: Abstract classes that plugins extend
5. **Built-in Plugins**: Pre-installed plugins (CSV, SQL, etc.)

### Plugin Lifecycle

```
Discovery → Loading → Registration → Initialization → Execution → Destruction
```

## 🚀 Quick Start

### Creating a Data Source Plugin

```typescript
import { AbstractDataSourcePlugin } from '@/lib/plugins'
import { PluginManifest, PluginContext, PluginConfig } from '@/lib/plugins/types'

export class MyDataSourcePlugin extends AbstractDataSourcePlugin {
  constructor(manifest: PluginManifest, context: PluginContext, config: PluginConfig) {
    super(manifest, context, config)
  }

  protected async onInitialize(): Promise<void> {
    this.logOperation('My plugin initialized')
  }

  protected async onDestroy(): Promise<void> {
    this.logOperation('My plugin destroyed')
  }

  protected async onValidateConfig(config: Partial<PluginConfig>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []
    // Add validation logic
    return { valid: errors.length === 0, errors }
  }

  protected async onConfigUpdate(config: PluginConfig): Promise<void> {
    this.logOperation('Config updated', { config })
  }

  async testConnection(config: any): Promise<{ success: boolean; error?: string }> {
    // Test connection logic
    return { success: true }
  }

  async getSchema(config: any): Promise<any[]> {
    // Return data schema
    return []
  }

  async fetchData(config: any, options?: any): Promise<any> {
    // Fetch data logic
    return { data: [], totalCount: 0 }
  }

  getConfigUI(): React.ComponentType<any> {
    return MyConfigComponent
  }

  getImportMethods(): any[] {
    return [
      {
        id: 'my-method',
        name: 'My Import Method',
        description: 'Import data using my method',
        icon: <MyIcon />
      }
    ]
  }
}

// Plugin Manifest
export const MY_PLUGIN_MANIFEST: PluginManifest = {
  id: 'my-data-source',
  name: 'My Data Source',
  version: '1.0.0',
  description: 'A custom data source plugin',
  author: 'Your Name',
  main: 'index.js',
  category: 'data-source',
  tags: ['custom', 'api']
}
```

### Configuration UI Component

```typescript
import React from 'react'
import { CellInput, FormField, CellStack } from '@/components/ui'

interface MyConfigProps {
  config: any
  onConfigChange: (config: any) => void
  onNext: () => void
  onBack: () => void
}

const MyConfigComponent: React.FC<MyConfigProps> = ({ 
  config, 
  onConfigChange, 
  onNext, 
  onBack 
}) => {
  return (
    <CellStack spacing="lg">
      <FormField label="API Endpoint">
        <CellInput
          value={config.endpoint || ''}
          onChange={(e) => onConfigChange({ ...config, endpoint: e.target.value })}
          placeholder="https://api.example.com/data"
        />
      </FormField>

      <FormField label="API Key">
        <CellInput
          type="password"
          value={config.apiKey || ''}
          onChange={(e) => onConfigChange({ ...config, apiKey: e.target.value })}
          placeholder="Enter your API key"
        />
      </FormField>

      <div className="flex justify-between">
        <button onClick={onBack}>Back</button>
        <button onClick={onNext}>Next</button>
      </div>
    </CellStack>
  )
}
```

## 📋 Plugin Categories

### Data Source Plugins

Extend data import capabilities:

```typescript
export class MyDataSourcePlugin extends AbstractDataSourcePlugin {
  // Required methods
  async testConnection(config: any): Promise<{ success: boolean; error?: string }>
  async getSchema(config: any): Promise<any[]>
  async fetchData(config: any, options?: any): Promise<FetchResult>
  getConfigUI(): React.ComponentType<any>
  getImportMethods(): ImportMethod[]
}
```

### Transformer Plugins

Process and transform data:

```typescript
export class MyTransformerPlugin extends AbstractTransformerPlugin {
  // Required methods
  async transform(data: any[], config: any): Promise<any[]>
  async validateTransformation(config: any): Promise<{ valid: boolean; errors: string[] }>
  getConfigUI(): React.ComponentType<any>
}
```

### Exporter Plugins

Export data to various formats:

```typescript
export class MyExporterPlugin extends AbstractExporterPlugin {
  // Required methods
  async export(data: any[], config: any): Promise<ExportResult>
  async validateExportConfig(config: any): Promise<{ valid: boolean; errors: string[] }>
  getConfigUI(): React.ComponentType<any>
}
```

### Visualization Plugins

Create custom visualizations:

```typescript
export class MyVisualizationPlugin extends AbstractVisualizationPlugin {
  // Required methods
  async render(data: any[], config: any): Promise<React.ReactElement>
  getSupportedDataTypes(): string[]
  getConfigUI(): React.ComponentType<any>
}
```

## 🛠️ Plugin Context

Plugins receive a context object with utilities:

### Logging
```typescript
this.context.logger.info('Plugin operation completed')
this.context.logger.warn('Warning message')
this.context.logger.error('Error occurred', { error })
this.context.logger.debug('Debug information')
```

### API Access
```typescript
const data = await this.context.api.get('/api/data')
const result = await this.context.api.post('/api/process', { data })
```

### Storage
```typescript
await this.context.storage.set('key', value)
const value = await this.context.storage.get('key')
await this.context.storage.delete('key')
```

### Events
```typescript
this.context.events.emit('data:processed', { count: 100 })
this.context.events.on('config:updated', (data) => {
  // Handle event
})
```

### UI Utilities
```typescript
this.context.ui.showNotification('Success!', 'success')
this.context.ui.showModal(MyModalComponent, { data })
this.context.ui.hideModal()
```

## 📦 Plugin Manifest

Every plugin requires a manifest file (`plugin.json`):

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Author Name",
  "license": "MIT",
  "main": "index.js",
  "category": "data-source",
  "tags": ["api", "custom"],
  "icon": "🚀",
  "keywords": ["data", "import"],
  "minManifoldVersion": "1.0.0",
  "maxManifoldVersion": "2.0.0"
}
```

### Manifest Fields

- **id**: Unique plugin identifier
- **name**: Human-readable plugin name
- **version**: Semantic version
- **description**: Plugin description
- **author**: Plugin author
- **license**: License type
- **main**: Entry point file
- **category**: Plugin category
- **tags**: Search tags
- **icon**: Display icon
- **minManifoldVersion**: Minimum required Manifold version
- **maxManifoldVersion**: Maximum supported Manifold version

## 🔧 Development Workflow

### 1. Create Plugin Structure

```
my-plugin/
├── plugin.json          # Plugin manifest
├── index.js            # Main plugin file
├── components/         # UI components
│   └── ConfigUI.tsx
├── utils/             # Helper utilities
│   └── helpers.js
└── README.md          # Plugin documentation
```

### 2. Implement Plugin Class

```typescript
// index.js
import { MyDataSourcePlugin, MY_PLUGIN_MANIFEST } from './MyDataSourcePlugin'

export default MyDataSourcePlugin
export { MY_PLUGIN_MANIFEST }
```

### 3. Test Plugin

```typescript
import { pluginSystem } from '@/lib/plugins'

// Load plugin
const plugin = await pluginSystem.getManager().loadPlugin('./my-plugin')

// Test functionality
const result = await pluginSystem.getManager().executePlugin('my-plugin')
await result.testConnection({ endpoint: 'https://api.example.com' })
```

### 4. Package Plugin

```bash
# Create plugin package
npm pack

# Or publish to registry
npm publish
```

## 📚 Built-in Plugins

### CSV Data Source
- **ID**: `csv-data-source`
- **Description**: Import data from CSV files
- **Features**: Custom delimiters, header detection, whitespace trimming

### SQL Data Source
- **ID**: `sql-data-source`
- **Description**: Import data from SQL dump files
- **Features**: Multiple dialects, batch processing, selective import

## 🔍 Plugin Discovery

Plugins are discovered in these locations:

1. **Built-in**: `lib/plugins/built-in/`
2. **User Plugins**: `plugins/`
3. **NPM Packages**: `node_modules/@manifold/plugins/`

## 🚀 Plugin Installation

### From NPM
```bash
npm install @manifold/plugin-my-source
```

### From Local Path
```typescript
import { pluginSystem } from '@/lib/plugins'

await pluginSystem.getManager().installPlugin('./path/to/plugin')
```

### From URL
```typescript
await pluginSystem.getManager().installPlugin('https://github.com/user/plugin')
```

## 🧪 Testing Plugins

### Unit Tests
```typescript
import { MyDataSourcePlugin } from './MyDataSourcePlugin'
import { createMockContext } from '@/lib/plugins/test-utils'

describe('MyDataSourcePlugin', () => {
  let plugin: MyDataSourcePlugin
  let context: PluginContext

  beforeEach(() => {
    context = createMockContext()
    plugin = new MyDataSourcePlugin(MY_PLUGIN_MANIFEST, context, mockConfig)
  })

  it('should initialize successfully', async () => {
    await plugin.initialize()
    expect(plugin.initialized).toBe(true)
  })

  it('should test connection', async () => {
    const result = await plugin.testConnection({ endpoint: 'https://api.example.com' })
    expect(result.success).toBe(true)
  })
})
```

### Integration Tests
```typescript
import { pluginSystem } from '@/lib/plugins'

describe('Plugin Integration', () => {
  beforeEach(async () => {
    await pluginSystem.initialize()
  })

  it('should load and execute plugin', async () => {
    const plugin = pluginSystem.getManager().executePlugin('my-plugin')
    expect(plugin).toBeDefined()
  })
})
```

## 🔒 Security Considerations

### Sandboxing
- Plugins run in isolated contexts
- Limited access to system resources
- Controlled API surface

### Validation
- Plugin manifests are validated
- Configuration schemas are enforced
- Runtime error handling

### Permissions
- Plugins request specific permissions
- User approval required for sensitive operations
- Audit logging for security events

## 📈 Performance

### Lazy Loading
- Plugins are loaded on demand
- Unused plugins are unloaded
- Memory usage is optimized

### Caching
- Schema and configuration caching
- Result caching for expensive operations
- Plugin instance pooling

### Monitoring
- Performance metrics collection
- Resource usage tracking
- Error rate monitoring

## 🐛 Debugging

### Plugin Logs
```typescript
// Enable debug logging
this.context.logger.debug('Debug information', { data })
```

### Plugin Inspector
```typescript
// Get plugin status
const status = plugin.getStatus()
console.log('Plugin Status:', status)
```

### Error Handling
```typescript
try {
  await plugin.initialize()
} catch (error) {
  this.context.logger.error('Plugin initialization failed', { error })
  throw error
}
```

## 📖 Best Practices

### 1. Plugin Design
- Keep plugins focused and single-purpose
- Use clear, descriptive names
- Follow semantic versioning

### 2. Configuration
- Provide sensible defaults
- Validate all configuration
- Document configuration options

### 3. Error Handling
- Graceful error handling
- Informative error messages
- Proper logging

### 4. Performance
- Minimize resource usage
- Cache expensive operations
- Use streaming for large datasets

### 5. Testing
- Comprehensive unit tests
- Integration tests
- Error scenario testing

## 🤝 Contributing

### Plugin Development
1. Fork the repository
2. Create a feature branch
3. Implement your plugin
4. Add tests and documentation
5. Submit a pull request

### Built-in Plugins
1. Create plugin in `lib/plugins/built-in/`
2. Register in `lib/plugins/index.ts`
3. Add tests and documentation
4. Update plugin system documentation

## 📞 Support

- **Documentation**: [Plugin System Guide](./PLUGIN_SYSTEM.md)
- **Examples**: [Plugin Examples](./examples/)
- **Community**: [GitHub Discussions](https://github.com/manifold/discussions)
- **Issues**: [GitHub Issues](https://github.com/manifold/issues)

The Manifold Plugin System provides a powerful, extensible foundation for building custom data processing capabilities. With comprehensive tooling, clear APIs, and robust architecture, developers can easily create plugins that integrate seamlessly with the Manifold ecosystem.
