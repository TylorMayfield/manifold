"use client"

import React, { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import CellButton from '../ui/CellButton'
import { FolderOpen, RefreshCw, Shield } from 'lucide-react'

export default function SettingsDatabase() {
  const { settings, updateSetting } = useSettings()
  const [testingConnection, setTestingConnection] = useState(false)

  const handleBrowsePath = () => {
    // In a real Electron app, this would open a directory picker
    const path = window.prompt('Enter database path:', settings.databasePath)
    if (path) {
      updateSetting('databasePath', path)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Database connection successful!')
    } catch (error) {
      alert('Database connection failed!')
    } finally {
      setTestingConnection(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Database Path */}
      <div>
        <label className="block text-body font-bold text-gray-700 mb-2">
          Database Path
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={settings.databasePath}
            onChange={(e) => updateSetting('databasePath', e.target.value)}
            className="cell-input flex-1"
            placeholder="Enter database path"
          />
          <CellButton
            variant="secondary"
            onClick={handleBrowsePath}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Browse
          </CellButton>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Directory where database files are stored
        </p>
      </div>

      {/* Connection Test */}
      <div>
        <CellButton
          variant="secondary"
          onClick={handleTestConnection}
          disabled={testingConnection}
        >
          {testingConnection ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {testingConnection ? 'Testing...' : 'Test Connection'}
        </CellButton>
      </div>

      {/* Backup Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="backupEnabled"
            checked={settings.backupEnabled}
            onChange={(e) => updateSetting('backupEnabled', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="backupEnabled" className="font-bold text-gray-900">
            Enable Automatic Backups
          </label>
        </div>

        {settings.backupEnabled && (
          <div className="ml-6 space-y-4">
            <div>
              <label className="block text-body font-bold text-gray-700 mb-2">
                Backup Frequency
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => updateSetting('backupFrequency', e.target.value)}
                className="cell-input w-full"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-body font-bold text-gray-700 mb-2">
                Backup Location
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={settings.backupLocation || ''}
                  onChange={(e) => updateSetting('backupLocation', e.target.value)}
                  className="cell-input flex-1"
                  placeholder="Enter backup location"
                />
                <CellButton
                  variant="secondary"
                  onClick={() => {
                    const path = window.prompt('Enter backup location:', settings.backupLocation)
                    if (path) updateSetting('backupLocation', path)
                  }}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Browse
                </CellButton>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body font-bold text-gray-700 mb-2">
                  Retention Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.retentionDays}
                  onChange={(e) => updateSetting('retentionDays', parseInt(e.target.value))}
                  className="cell-input w-full"
                />
                <p className="text-xs text-gray-600 mt-1">
                  How long to keep backup files (1-365 days)
                </p>
              </div>

              <div>
                <label className="block text-body font-bold text-gray-700 mb-2">
                  Max Backup Size (MB)
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={settings.maxBackupSize || 1024}
                  onChange={(e) => updateSetting('maxBackupSize', parseInt(e.target.value))}
                  className="cell-input w-full"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Maximum size for individual backup files
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="compressionEnabled"
                  checked={settings.compressionEnabled}
                  onChange={(e) => updateSetting('compressionEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="compressionEnabled" className="text-gray-900">
                  Enable Backup Compression
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="encryptionEnabled"
                  checked={settings.encryptionEnabled || false}
                  onChange={(e) => updateSetting('encryptionEnabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="encryptionEnabled" className="text-gray-900 flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  Enable Backup Encryption
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Database Statistics */}
      <div className="cell-card p-4">
        <h4 className="font-bold text-body mb-3">Database Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Size:</span>
              <span className="font-mono">156 MB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tables:</span>
              <span className="font-mono">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Records:</span>
              <span className="font-mono">45,678</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Backup:</span>
              <span className="font-mono">2 hours ago</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Backup Size:</span>
              <span className="font-mono">142 MB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Integrity:</span>
              <span className="font-mono text-green-600">✓ Good</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
