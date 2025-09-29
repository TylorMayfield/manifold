// Plugin Context
// Context provider for plugins with logging, API, storage, events, and UI utilities

import { PluginContext } from './types'
import { logger } from '../utils/logger'
import { EventEmitter } from 'events'

export class DefaultPluginContext implements PluginContext {
  public logger: PluginContext['logger']
  public api: PluginContext['api']
  public storage: PluginContext['storage']
  public events: PluginContext['events']
  public ui: PluginContext['ui']

  private eventEmitter: EventEmitter
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
    this.eventEmitter = new EventEmitter()

    // Initialize logger
    this.logger = {
      info: (message: string, category?: string, data?: any) => {
        logger.info(message, category || 'plugin', data)
      },
      warn: (message: string, category?: string, data?: any) => {
        logger.warn(message, category || 'plugin', data)
      },
      error: (message: string, category?: string, data?: any) => {
        logger.error(message, category || 'plugin', data)
      },
      debug: (message: string, category?: string, data?: any) => {
        logger.debug(message, category || 'plugin', data)
      }
    }

    // Initialize API client
    this.api = {
      request: async (endpoint: string, options?: RequestInit) => {
        const url = this.baseUrl + endpoint
        return fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers
          },
          ...options
        })
      },
      get: async (endpoint: string) => {
        const response = await this.api.request(endpoint, { method: 'GET' })
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        return response.json()
      },
      post: async (endpoint: string, data?: any) => {
        const response = await this.api.request(endpoint, {
          method: 'POST',
          body: data ? JSON.stringify(data) : undefined
        })
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        return response.json()
      },
      put: async (endpoint: string, data?: any) => {
        const response = await this.api.request(endpoint, {
          method: 'PUT',
          body: data ? JSON.stringify(data) : undefined
        })
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        return response.json()
      },
      delete: async (endpoint: string) => {
        const response = await this.api.request(endpoint, { method: 'DELETE' })
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        return response.json()
      }
    }

    // Initialize storage
    this.storage = {
      get: async (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : null
          }
          return null
        } catch (error) {
          this.logger.error('Failed to get storage item', 'plugin-context', { key, error })
          return null
        }
      },
      set: async (key: string, value: any) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(key, JSON.stringify(value))
          }
        } catch (error) {
          this.logger.error('Failed to set storage item', 'plugin-context', { key, error })
        }
      },
      delete: async (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem(key)
          }
        } catch (error) {
          this.logger.error('Failed to delete storage item', 'plugin-context', { key, error })
        }
      },
      clear: async () => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.clear()
          }
        } catch (error) {
          this.logger.error('Failed to clear storage', 'plugin-context', { error })
        }
      }
    }

    // Initialize events
    this.events = {
      emit: (event: string, data?: any) => {
        this.eventEmitter.emit(event, data)
      },
      on: (event: string, handler: (data?: any) => void) => {
        this.eventEmitter.on(event, handler)
      },
      off: (event: string, handler: (data?: any) => void) => {
        this.eventEmitter.off(event, handler)
      }
    }

    // Initialize UI utilities
    this.ui = {
      showNotification: (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
        // This would integrate with the actual UI notification system
        // For now, we'll just log it
        this.logger.info(`UI Notification [${type}]: ${message}`, 'plugin-context')
        
        // In a real implementation, this would show a toast notification
        // Example: toast[type](message)
      },
      showModal: (component: React.ComponentType, props?: any) => {
        // This would integrate with the actual modal system
        // For now, we'll just log it
        this.logger.info('UI Modal requested', 'plugin-context', { component: component.name, props })
        
        // In a real implementation, this would show a modal
        // Example: modalManager.show(component, props)
      },
      hideModal: () => {
        // This would integrate with the actual modal system
        // For now, we'll just log it
        this.logger.info('UI Modal hide requested', 'plugin-context')
        
        // In a real implementation, this would hide the modal
        // Example: modalManager.hide()
      }
    }
  }

  /**
   * Update base URL for API requests
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Add event listener with automatic cleanup
   */
  addEventListener(event: string, handler: (data?: any) => void): () => void {
    this.eventEmitter.on(event, handler)
    
    // Return cleanup function
    return () => {
      this.eventEmitter.off(event, handler)
    }
  }

  /**
   * Wait for an event to be emitted
   */
  waitForEvent(event: string, timeout?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = timeout ? setTimeout(() => {
        reject(new Error(`Event timeout: ${event}`))
      }, timeout) : undefined

      const handler = (data?: any) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        this.eventEmitter.off(event, handler)
        resolve(data)
      }

      this.eventEmitter.on(event, handler)
    })
  }

  /**
   * Create a scoped context for a specific plugin
   */
  createScopedContext(pluginId: string): PluginContext {
    const scopedContext = new DefaultPluginContext(this.baseUrl)
    
    // Override storage methods to be plugin-specific
    const originalStorage = scopedContext.storage
    scopedContext.storage = {
      get: async (key: string) => {
        return originalStorage.get(`plugin:${pluginId}:${key}`)
      },
      set: async (key: string, value: any) => {
        return originalStorage.set(`plugin:${pluginId}:${key}`, value)
      },
      delete: async (key: string) => {
        return originalStorage.delete(`plugin:${pluginId}:${key}`)
      },
      clear: async () => {
        // Clear only plugin-specific keys
        if (typeof window !== 'undefined' && window.localStorage) {
          const keys = Object.keys(localStorage)
          const pluginKeys = keys.filter(key => key.startsWith(`plugin:${pluginId}:`))
          for (const key of pluginKeys) {
            localStorage.removeItem(key)
          }
        }
      }
    }

    // Override logger to include plugin ID
    const originalLogger = scopedContext.logger
    scopedContext.logger = {
      info: (message: string, category?: string, data?: any) => {
        originalLogger.info(message, category, { ...data, pluginId })
      },
      warn: (message: string, category?: string, data?: any) => {
        originalLogger.warn(message, category, { ...data, pluginId })
      },
      error: (message: string, category?: string, data?: any) => {
        originalLogger.error(message, category, { ...data, pluginId })
      },
      debug: (message: string, category?: string, data?: any) => {
        originalLogger.debug(message, category, { ...data, pluginId })
      }
    }

    // Override events to be plugin-scoped
    const originalEvents = scopedContext.events
    scopedContext.events = {
      emit: (event: string, data?: any) => {
        originalEvents.emit(`plugin:${pluginId}:${event}`, data)
      },
      on: (event: string, handler: (data?: any) => void) => {
        originalEvents.on(`plugin:${pluginId}:${event}`, handler)
      },
      off: (event: string, handler: (data?: any) => void) => {
        originalEvents.off(`plugin:${pluginId}:${event}`, handler)
      }
    }

    return scopedContext
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.eventEmitter.removeAllListeners()
  }
}

// Server-side Plugin Context for Node.js environments
export class ServerPluginContext implements PluginContext {
  public logger: PluginContext['logger']
  public api: PluginContext['api']
  public storage: PluginContext['storage']
  public events: PluginContext['events']
  public ui: PluginContext['ui']

  private eventEmitter: EventEmitter
  private baseUrl: string
  private storagePath: string

  constructor(baseUrl: string = '', storagePath: string = './plugin-storage') {
    this.baseUrl = baseUrl
    this.storagePath = storagePath
    this.eventEmitter = new EventEmitter()

    // Initialize logger
    this.logger = {
      info: (message: string, category?: string, data?: any) => {
        logger.info(message, category || 'plugin', data)
      },
      warn: (message: string, category?: string, data?: any) => {
        logger.warn(message, category || 'plugin', data)
      },
      error: (message: string, category?: string, data?: any) => {
        logger.error(message, category || 'plugin', data)
      },
      debug: (message: string, category?: string, data?: any) => {
        logger.debug(message, category || 'plugin', data)
      }
    }

    // Initialize API client
    this.api = {
      request: async (endpoint: string, options?: RequestInit) => {
        const url = this.baseUrl + endpoint
        return fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers
          },
          ...options
        })
      },
      get: async (endpoint: string) => {
        const response = await this.api.request(endpoint, { method: 'GET' })
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        return response.json()
      },
      post: async (endpoint: string, data?: any) => {
        const response = await this.api.request(endpoint, {
          method: 'POST',
          body: data ? JSON.stringify(data) : undefined
        })
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        return response.json()
      },
      put: async (endpoint: string, data?: any) => {
        const response = await this.api.request(endpoint, {
          method: 'PUT',
          body: data ? JSON.stringify(data) : undefined
        })
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        return response.json()
      },
      delete: async (endpoint: string) => {
        const response = await this.api.request(endpoint, { method: 'DELETE' })
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }
        return response.json()
      }
    }

    // Initialize file-based storage
    this.storage = {
      get: async (key: string) => {
        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          const filePath = path.join(this.storagePath, `${key}.json`)
          const data = await fs.readFile(filePath, 'utf-8')
          return JSON.parse(data)
        } catch (error) {
          this.logger.error('Failed to get storage item', 'plugin-context', { key, error })
          return null
        }
      },
      set: async (key: string, value: any) => {
        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          await fs.mkdir(this.storagePath, { recursive: true })
          const filePath = path.join(this.storagePath, `${key}.json`)
          await fs.writeFile(filePath, JSON.stringify(value, null, 2))
        } catch (error) {
          this.logger.error('Failed to set storage item', 'plugin-context', { key, error })
          throw error
        }
      },
      delete: async (key: string) => {
        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          const filePath = path.join(this.storagePath, `${key}.json`)
          await fs.unlink(filePath)
        } catch (error) {
          this.logger.error('Failed to delete storage item', 'plugin-context', { key, error })
          throw error
        }
      },
      clear: async () => {
        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          const files = await fs.readdir(this.storagePath)
          for (const file of files) {
            if (file.endsWith('.json')) {
              await fs.unlink(path.join(this.storagePath, file))
            }
          }
        } catch (error) {
          this.logger.error('Failed to clear storage', 'plugin-context', { error })
          throw error
        }
      }
    }

    // Initialize events
    this.events = {
      emit: (event: string, data?: any) => {
        this.eventEmitter.emit(event, data)
      },
      on: (event: string, handler: (data?: any) => void) => {
        this.eventEmitter.on(event, handler)
      },
      off: (event: string, handler: (data?: any) => void) => {
        this.eventEmitter.off(event, handler)
      }
    }

    // Initialize UI utilities (server-side has limited UI capabilities)
    this.ui = {
      showNotification: (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
        this.logger.info(`Server Notification [${type}]: ${message}`, 'plugin-context')
      },
      showModal: (component: React.ComponentType, props?: any) => {
        this.logger.info('Server Modal requested (not supported)', 'plugin-context', { component: component.name, props })
      },
      hideModal: () => {
        this.logger.info('Server Modal hide requested (not supported)', 'plugin-context')
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.eventEmitter.removeAllListeners()
  }
}
