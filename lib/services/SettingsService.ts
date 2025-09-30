import { logger } from '../utils/logger'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

// Conditional electron import for server-side only
let app: any = null
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  try {
    // Try to import electron if available
    if (process.versions?.electron) {
      const { app: electronApp } = require('electron')
      app = electronApp
    } else {
      // Not in electron environment, use mock for Next.js server
      app = {
        getPath: (name: string) => {
          switch (name) {
            case 'userData': return path.join(process.cwd(), 'data')
            default: return process.cwd()
          }
        }
      }
    }
  } catch (error) {
    // Electron not available, use mock for build process
    app = {
      getPath: (name: string) => {
        switch (name) {
          case 'userData': return path.join(process.cwd(), 'data')
          default: return process.cwd()
        }
      }
    }
  }
}

export interface AppSettings {
  [key: string]: any; // Allow additional dynamic properties
  
  // General Settings
  applicationName: string
  defaultTimezone: string
  dateFormat: string
  maxConcurrentJobs: number
  language: string
  autoSave: boolean
  autoSaveInterval: number // seconds

  // Database Settings
  databasePath: string
  backupEnabled: boolean
  backupFrequency: string
  retentionDays: number
  compressionEnabled: boolean
  backupLocation: string
  encryptionEnabled: boolean
  maxBackupSize: number // MB

  // Performance Settings
  cacheEnabled: boolean
  cacheSize: number // MB
  queryTimeout: number // seconds
  maxQueryResults: number
  enableQueryOptimization: boolean
  parallelProcessing: boolean
  maxMemoryUsage: number // MB

  // Notification Settings
  emailNotifications: boolean
  emailSmtpHost: string
  emailSmtpPort: number
  emailSmtpUser: string
  emailSmtpPassword: string
  emailFrom: string
  jobFailureNotifications: boolean
  jobCompletionNotifications: boolean
  systemNotifications: boolean
  dataQualityAlerts: boolean
  performanceAlerts: boolean

  // Security Settings
  sessionTimeout: number // minutes
  apiKeyEnabled: boolean
  apiKey: string
  logLevel: string
  auditLogging: boolean
  requireAuthentication: boolean
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }
  twoFactorEnabled: boolean
  allowedOrigins: string[]

  // Storage Settings
  maxSnapshotSize: number // MB
  autoCleanupEnabled: boolean
  cleanupThreshold: number // percentage
  cleanupSchedule: string // cron
  dataRetentionDays: number
  archiveOldData: boolean
  compressionLevel: number // 1-9

  // Appearance Settings
  theme: string
  compactMode: boolean
  showLineNumbers: boolean
  fontSize: string
  fontFamily: string
  accentColor: string
  showTooltips: boolean
  animationsEnabled: boolean
  sidebarCollapsed: boolean

  // Data Processing Settings
  defaultImportMethod: string
  autoDetectSchema: boolean
  validateDataTypes: boolean
  skipEmptyRows: boolean
  trimWhitespace: boolean
  handleDuplicates: 'skip' | 'overwrite' | 'create_version'
  maxFileSize: number // MB
  allowedFileTypes: string[]
  
  // Advanced Settings
  debugMode: boolean
  experimentalFeatures: boolean
  telemetryEnabled: boolean
  crashReporting: boolean
  autoUpdates: boolean
  updateChannel: 'stable' | 'beta' | 'alpha'
  proxySettings: {
    enabled: boolean
    host: string
    port: number
    username: string
    password: string
  }
}

export class SettingsService {
  private static instance: SettingsService
  private settings: AppSettings
  private settingsPath: string
  private watchers: Set<(settings: AppSettings) => void> = new Set()

  private constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json')
    this.settings = this.getDefaultSettings()
    // Load settings asynchronously - don't await in constructor
    this.loadSettings().catch(error => {
      logger.error('Failed to initialize settings', 'settings', { 
        error: error.message 
      }, 'SettingsService')
    })
  }

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  private getDefaultSettings(): AppSettings {
    return {
      // General Settings
      applicationName: 'Manifold ETL',
      defaultTimezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      maxConcurrentJobs: 5,
      language: 'en',
      autoSave: true,
      autoSaveInterval: 30,

      // Database Settings
      databasePath: path.join(app.getPath('userData'), 'data'),
      backupEnabled: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      compressionEnabled: true,
      backupLocation: path.join(app.getPath('userData'), 'backups'),
      encryptionEnabled: false,
      maxBackupSize: 1024, // 1GB

      // Performance Settings
      cacheEnabled: true,
      cacheSize: 256, // 256MB
      queryTimeout: 30,
      maxQueryResults: 10000,
      enableQueryOptimization: true,
      parallelProcessing: true,
      maxMemoryUsage: 2048, // 2GB

      // Notification Settings
      emailNotifications: false,
      emailSmtpHost: '',
      emailSmtpPort: 587,
      emailSmtpUser: '',
      emailSmtpPassword: '',
      emailFrom: '',
      jobFailureNotifications: true,
      jobCompletionNotifications: false,
      systemNotifications: true,
      dataQualityAlerts: true,
      performanceAlerts: true,

      // Security Settings
      sessionTimeout: 60,
      apiKeyEnabled: false,
      apiKey: this.generateApiKey(),
      logLevel: 'info',
      auditLogging: true,
      requireAuthentication: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      },
      twoFactorEnabled: false,
      allowedOrigins: ['localhost', '127.0.0.1'],

      // Storage Settings
      maxSnapshotSize: 100,
      autoCleanupEnabled: true,
      cleanupThreshold: 80,
      cleanupSchedule: '0 2 * * *', // Daily at 2 AM
      dataRetentionDays: 365,
      archiveOldData: true,
      compressionLevel: 6,

      // Appearance Settings
      theme: 'light',
      compactMode: false,
      showLineNumbers: true,
      fontSize: 'medium',
      fontFamily: 'Inter, system-ui, sans-serif',
      accentColor: '#000000',
      showTooltips: true,
      animationsEnabled: true,
      sidebarCollapsed: false,

      // Data Processing Settings
      defaultImportMethod: 'auto',
      autoDetectSchema: true,
      validateDataTypes: true,
      skipEmptyRows: true,
      trimWhitespace: true,
      handleDuplicates: 'create_version',
      maxFileSize: 100, // 100MB
      allowedFileTypes: ['csv', 'json', 'xlsx', 'xml', 'txt'],

      // Advanced Settings
      debugMode: false,
      experimentalFeatures: false,
      telemetryEnabled: true,
      crashReporting: true,
      autoUpdates: true,
      updateChannel: 'stable',
      proxySettings: {
        enabled: false,
        host: '',
        port: 8080,
        username: '',
        password: '',
      },
    }
  }

  private generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = 'mk_'
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  async loadSettings(): Promise<void> {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const settingsData = await fs.promises.readFile(this.settingsPath, 'utf8')
        const loadedSettings = JSON.parse(settingsData)
        
        // Merge with defaults to handle new settings
        this.settings = { ...this.getDefaultSettings(), ...loadedSettings }
        
        logger.success('Settings loaded successfully', 'settings', { 
          path: this.settingsPath 
        }, 'SettingsService')
      } else {
        // Create default settings file
        await this.saveSettings()
        logger.info('Created default settings file', 'settings', { 
          path: this.settingsPath 
        }, 'SettingsService')
      }
    } catch (error: any) {
      logger.error('Failed to load settings', 'settings', { 
        error: error.message, 
        path: this.settingsPath 
      }, 'SettingsService')
      this.settings = this.getDefaultSettings()
    }
  }

  async saveSettings(): Promise<void> {
    try {
      // Ensure directory exists
      const settingsDir = path.dirname(this.settingsPath)
      if (!fs.existsSync(settingsDir)) {
        await fs.promises.mkdir(settingsDir, { recursive: true })
      }

      await fs.promises.writeFile(
        this.settingsPath, 
        JSON.stringify(this.settings, null, 2),
        'utf8'
      )

      logger.success('Settings saved successfully', 'settings', { 
        path: this.settingsPath 
      }, 'SettingsService')

      // Notify watchers
      this.watchers.forEach(watcher => watcher(this.settings))
    } catch (error: any) {
      logger.error('Failed to save settings', 'settings', { 
        error: error.message, 
        path: this.settingsPath 
      }, 'SettingsService')
      throw error
    }
  }

  getSettings(): AppSettings {
    return { ...this.settings }
  }

  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key]
  }

  async updateSetting<K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): Promise<void> {
    this.settings[key] = value
    await this.saveSettings()
    
    logger.info(`Setting updated: ${key}`, 'settings', { 
      key, 
      value: typeof value === 'string' ? value : JSON.stringify(value) 
    }, 'SettingsService')
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates }
    await this.saveSettings()
    
    logger.info('Multiple settings updated', 'settings', { 
      keys: Object.keys(updates) 
    }, 'SettingsService')
  }

  async resetSettings(): Promise<void> {
    this.settings = this.getDefaultSettings()
    await this.saveSettings()
    
    logger.info('Settings reset to defaults', 'settings', {}, 'SettingsService')
  }

  async exportSettings(): Promise<string> {
    const exportData = {
      ...this.settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(settingsJson)
      
      // Validate and merge with current settings
      const validatedSettings = { ...this.getDefaultSettings(), ...importedSettings }
      
      // Remove metadata fields
      delete validatedSettings.exportedAt
      delete validatedSettings.version
      
      this.settings = validatedSettings
      await this.saveSettings()
      
      logger.success('Settings imported successfully', 'settings', {}, 'SettingsService')
    } catch (error: any) {
      logger.error('Failed to import settings', 'settings', { 
        error: error.message 
      }, 'SettingsService')
      throw new Error('Invalid settings file format')
    }
  }

  // Watch for settings changes
  onSettingsChange(callback: (settings: AppSettings) => void): () => void {
    this.watchers.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.watchers.delete(callback)
    }
  }

  // Validate settings
  validateSettings(settings: Partial<AppSettings>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate numeric ranges
    if (settings.maxConcurrentJobs && (settings.maxConcurrentJobs < 1 || settings.maxConcurrentJobs > 20)) {
      errors.push('Max concurrent jobs must be between 1 and 20')
    }

    if (settings.sessionTimeout && (settings.sessionTimeout < 5 || settings.sessionTimeout > 480)) {
      errors.push('Session timeout must be between 5 and 480 minutes')
    }

    if (settings.maxSnapshotSize && (settings.maxSnapshotSize < 1 || settings.maxSnapshotSize > 10000)) {
      errors.push('Max snapshot size must be between 1 and 10000 MB')
    }

    if (settings.cleanupThreshold && (settings.cleanupThreshold < 50 || settings.cleanupThreshold > 95)) {
      errors.push('Cleanup threshold must be between 50 and 95 percent')
    }

    // Validate email settings
    if (settings.emailNotifications && settings.emailSmtpHost) {
      if (!settings.emailSmtpHost.includes('.')) {
        errors.push('Invalid SMTP host format')
      }
      
      if (settings.emailSmtpPort && (settings.emailSmtpPort < 1 || settings.emailSmtpPort > 65535)) {
        errors.push('SMTP port must be between 1 and 65535')
      }
    }

    // Validate file paths
    if (settings.databasePath) {
      try {
        path.resolve(settings.databasePath)
      } catch {
        errors.push('Invalid database path')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Get system information for settings
  async getSystemInfo(): Promise<{
    platform: string
    version: string
    arch: string
    memory: number
    diskSpace: number
    uptime: number
  }> {
    try {
      const platform = process.platform
      const version = process.version
      const arch = process.arch
      
      // Get memory info
      const memUsage = process.memoryUsage()
      const totalMemory = Math.round(memUsage.heapTotal / 1024 / 1024) // MB
      
      // Get disk space (simplified)
      const userDataPath = app.getPath('userData')
      const stats = await fs.promises.stat(userDataPath)
      const diskSpace = 1000000 // Mock value - would need native module for real disk space
      
      // Get uptime
      const uptime = process.uptime()
      
      return {
        platform,
        version,
        arch,
        memory: totalMemory,
        diskSpace,
        uptime
      }
    } catch (error: any) {
      logger.error('Failed to get system info', 'settings', { 
        error: error.message 
      }, 'SettingsService')
      throw error
    }
  }

  // Backup settings
  async backupSettings(): Promise<string> {
    try {
      const backupPath = path.join(
        app.getPath('userData'), 
        'backups', 
        `settings-backup-${Date.now()}.json`
      )
      
      // Ensure backup directory exists
      const backupDir = path.dirname(backupPath)
      if (!fs.existsSync(backupDir)) {
        await fs.promises.mkdir(backupDir, { recursive: true })
      }
      
      await fs.promises.writeFile(backupPath, await this.exportSettings(), 'utf8')
      
      logger.success('Settings backup created', 'settings', { 
        backupPath 
      }, 'SettingsService')
      
      return backupPath
    } catch (error: any) {
      logger.error('Failed to backup settings', 'settings', { 
        error: error.message 
      }, 'SettingsService')
      throw error
    }
  }

  // Restore settings from backup
  async restoreSettings(backupPath: string): Promise<void> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found')
      }
      
      const backupData = await fs.promises.readFile(backupPath, 'utf8')
      await this.importSettings(backupData)
      
      logger.success('Settings restored from backup', 'settings', { 
        backupPath 
      }, 'SettingsService')
    } catch (error: any) {
      logger.error('Failed to restore settings', 'settings', { 
        error: error.message, 
        backupPath 
      }, 'SettingsService')
      throw error
    }
  }
}
