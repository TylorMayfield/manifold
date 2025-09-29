"use client"

import React, { useState, useEffect } from 'react'
import { CellCard, CellButton, CellBadge, CellAlert, CellStack, CellGrid, CellInput } from '../ui'
import { Database, Settings, Play, Square, RotateCcw, Download, Trash2, Search } from 'lucide-react'

interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: string
  tags: string[]
  enabled: boolean
  loaded: boolean
  initialized: boolean
  error?: string
  lastUsed?: string
  usageCount: number
}

interface PluginManagerProps {
  className?: string
}

export default function PluginManager({ className }: PluginManagerProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showEnabledOnly, setShowEnabledOnly] = useState(false)

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/plugins')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load plugins')
      }
      
      setPlugins(data.plugins)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePluginAction = async (action: string, pluginId: string, data?: any) => {
    try {
      const response = await fetch('/api/plugins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data: { pluginId, ...data }
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Operation failed')
      }
      
      // Reload plugins to reflect changes
      await loadPlugins()
      
      return result
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      await handlePluginAction('updateConfig', pluginId, { enabled })
    } catch (error) {
      // Error is already set in handlePluginAction
    }
  }

  const reloadPlugin = async (pluginId: string) => {
    try {
      await handlePluginAction('reload', pluginId)
    } catch (error) {
      // Error is already set in handlePluginAction
    }
  }

  const unloadPlugin = async (pluginId: string) => {
    try {
      await handlePluginAction('unload', pluginId)
    } catch (error) {
      // Error is already set in handlePluginAction
    }
  }

  const discoverPlugins = async () => {
    try {
      await handlePluginAction('discover')
    } catch (error) {
      // Error is already set in handlePluginAction
    }
  }

  const filteredPlugins = plugins.filter(plugin => {
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesEnabled = !showEnabledOnly || plugin.enabled
    
    return matchesCategory && matchesSearch && matchesEnabled
  })

  const categories = ['all', ...Array.from(new Set(plugins.map(p => p.category)))]

  if (loading) {
    return (
      <CellCard padding="lg" className={className}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plugins...</p>
        </div>
      </CellCard>
    )
  }

  return (
    <div className={className}>
      <CellCard padding="lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Plugin Manager</h2>
            <p className="text-gray-600">Manage your Manifold plugins</p>
          </div>
          
          <CellStack direction="horizontal" spacing="sm">
            <CellButton
              variant="secondary"
              size="sm"
              onClick={discoverPlugins}
            >
              <Database className="w-4 h-4 mr-2" />
              Discover
            </CellButton>
            
            <CellButton
              variant="secondary"
              size="sm"
              onClick={loadPlugins}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh
            </CellButton>
          </CellStack>
        </div>

        {error && (
          <CellAlert variant="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
            {error}
          </CellAlert>
        )}

        {/* Filters */}
        <CellStack spacing="md" className="mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <CellInput
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border-2 border-black bg-white rounded focus:outline-none"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.replace('-', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showEnabledOnly}
                onChange={(e) => setShowEnabledOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Enabled only</span>
            </label>
          </div>
        </CellStack>

        {/* Plugin List */}
        {filteredPlugins.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No plugins found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all' || showEnabledOnly
                ? 'Try adjusting your search criteria'
                : 'No plugins are installed. Click "Discover" to find available plugins.'}
            </p>
          </div>
        ) : (
          <CellGrid cols={1} gap="md">
            {filteredPlugins.map(plugin => (
              <CellCard key={plugin.id} padding="md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {plugin.name}
                      </h3>
                      
                      <CellBadge variant="default" size="sm">
                        v{plugin.version}
                      </CellBadge>
                      
                      <CellBadge 
                        variant={plugin.enabled ? 'success' : 'default'} 
                        size="sm"
                      >
                        {plugin.enabled ? 'Enabled' : 'Disabled'}
                      </CellBadge>
                      
                      {plugin.error && (
                        <CellBadge variant="error" size="sm">
                          Error
                        </CellBadge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-2">{plugin.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {plugin.tags?.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      )) || []}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>By {plugin.author}</span>
                      <span>•</span>
                      <span>{plugin.category}</span>
                      {plugin.lastUsed && (
                        <>
                          <span>•</span>
                          <span>Last used: {new Date(plugin.lastUsed).toLocaleDateString()}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Used {plugin.usageCount} times</span>
                    </div>
                  </div>
                  
                  <CellStack direction="horizontal" spacing="sm">
                    <CellButton
                      variant={plugin.enabled ? 'danger' : 'success'}
                      size="sm"
                      onClick={() => togglePlugin(plugin.id, !plugin.enabled)}
                    >
                      {plugin.enabled ? (
                        <>
                          <Square className="w-4 h-4 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Enable
                        </>
                      )}
                    </CellButton>
                    
                    <CellButton
                      variant="secondary"
                      size="sm"
                      onClick={() => reloadPlugin(plugin.id)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reload
                    </CellButton>
                    
                    <CellButton
                      variant="secondary"
                      size="sm"
                      onClick={() => unloadPlugin(plugin.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Unload
                    </CellButton>
                  </CellStack>
                </div>
                
                {plugin.error && (
                  <CellAlert variant="error" className="mt-4">
                    <strong>Error:</strong> {plugin.error}
                  </CellAlert>
                )}
              </CellCard>
            ))}
          </CellGrid>
        )}
      </CellCard>
    </div>
  )
}
