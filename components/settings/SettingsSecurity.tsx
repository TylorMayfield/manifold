"use client"

import React, { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import CellButton from '../ui/CellButton'
import { Eye, EyeOff, RefreshCw, Shield, Key } from 'lucide-react'

export default function SettingsSecurity() {
  const { settings, updateSetting } = useSettings()
  const [showApiKey, setShowApiKey] = useState(false)

  const generateNewApiKey = () => {
    if (confirm('Generate a new API key? The current key will be invalidated.')) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let newKey = 'mk_'
      for (let i = 0; i < 32; i++) {
        newKey += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      updateSetting('apiKey', newKey)
    }
  }

  return (
    <div className="space-y-6">
      {/* Authentication Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requireAuthentication"
            checked={settings.requireAuthentication || false}
            onChange={(e) => updateSetting('requireAuthentication', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="requireAuthentication" className="font-bold text-gray-900">
            Require Authentication
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="twoFactorEnabled"
            checked={settings.twoFactorEnabled || false}
            onChange={(e) => updateSetting('twoFactorEnabled', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="twoFactorEnabled" className="font-bold text-gray-900 flex items-center">
            <Shield className="w-4 h-4 mr-1" />
            Enable Two-Factor Authentication
          </label>
        </div>
      </div>

      {/* Session Settings */}
      <div>
        <label className="block text-body font-bold text-gray-700 mb-2">
          Session Timeout (minutes)
        </label>
        <input
          type="number"
          min="5"
          max="480"
          value={settings.sessionTimeout}
          onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
          className="cell-input w-full"
        />
        <p className="text-xs text-gray-600 mt-1">
          Automatically log out after inactivity (5-480 minutes)
        </p>
      </div>

      {/* API Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="apiKeyEnabled"
            checked={settings.apiKeyEnabled}
            onChange={(e) => updateSetting('apiKeyEnabled', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="apiKeyEnabled" className="font-bold text-gray-900">
            Enable API Access
          </label>
        </div>

        {settings.apiKeyEnabled && (
          <div className="ml-6 space-y-4">
            <div>
              <label className="block text-body font-bold text-gray-700 mb-2">
                API Key
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={settings.apiKey}
                    readOnly
                    className="cell-input w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-2 p-1 hover:bg-gray-200 rounded"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <CellButton
                  variant="secondary"
                  onClick={generateNewApiKey}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </CellButton>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Use this key to authenticate API requests
              </p>
            </div>

            <div>
              <label className="block text-body font-bold text-gray-700 mb-2">
                Allowed Origins
              </label>
              <textarea
                value={settings.allowedOrigins?.join('\n') || ''}
                onChange={(e) => updateSetting('allowedOrigins', e.target.value.split('\n').filter(Boolean))}
                className="cell-input w-full h-20"
                placeholder="localhost&#10;127.0.0.1&#10;yourdomain.com"
              />
              <p className="text-xs text-gray-600 mt-1">
                One domain per line. Leave empty to allow all origins.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Password Policy */}
      <div className="cell-card p-4">
        <h4 className="font-bold text-body mb-3 flex items-center">
          <Key className="w-4 h-4 mr-2" />
          Password Policy
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-body font-bold text-gray-700 mb-2">
              Minimum Length
            </label>
            <input
              type="number"
              min="6"
              max="32"
              value={settings.passwordPolicy?.minLength || 8}
              onChange={(e) => updateSetting('passwordPolicy', {
                ...settings.passwordPolicy,
                minLength: parseInt(e.target.value)
              })}
              className="cell-input w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireUppercase"
                checked={settings.passwordPolicy?.requireUppercase || false}
                onChange={(e) => updateSetting('passwordPolicy', {
                  ...settings.passwordPolicy,
                  requireUppercase: e.target.checked
                })}
                className="w-4 h-4"
              />
              <label htmlFor="requireUppercase" className="text-gray-900">
                Require uppercase letters
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireLowercase"
                checked={settings.passwordPolicy?.requireLowercase || false}
                onChange={(e) => updateSetting('passwordPolicy', {
                  ...settings.passwordPolicy,
                  requireLowercase: e.target.checked
                })}
                className="w-4 h-4"
              />
              <label htmlFor="requireLowercase" className="text-gray-900">
                Require lowercase letters
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireNumbers"
                checked={settings.passwordPolicy?.requireNumbers || false}
                onChange={(e) => updateSetting('passwordPolicy', {
                  ...settings.passwordPolicy,
                  requireNumbers: e.target.checked
                })}
                className="w-4 h-4"
              />
              <label htmlFor="requireNumbers" className="text-gray-900">
                Require numbers
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireSpecialChars"
                checked={settings.passwordPolicy?.requireSpecialChars || false}
                onChange={(e) => updateSetting('passwordPolicy', {
                  ...settings.passwordPolicy,
                  requireSpecialChars: e.target.checked
                })}
                className="w-4 h-4"
              />
              <label htmlFor="requireSpecialChars" className="text-gray-900">
                Require special characters
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Logging Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-body font-bold text-gray-700 mb-2">
            Log Level
          </label>
          <select
            value={settings.logLevel}
            onChange={(e) => updateSetting('logLevel', e.target.value)}
            className="cell-input w-full"
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
          <p className="text-xs text-gray-600 mt-1">
            Minimum level for logged messages
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="auditLogging"
            checked={settings.auditLogging !== false}
            onChange={(e) => updateSetting('auditLogging', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="auditLogging" className="font-bold text-gray-900">
            Enable Audit Logging
          </label>
        </div>
      </div>

      {/* Security Status */}
      <div className="cell-card p-4 bg-green-50 border-green-200">
        <h4 className="font-bold text-body mb-3 text-green-900 flex items-center">
          <Shield className="w-4 h-4 mr-2" />
          Security Status
        </h4>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex justify-between">
            <span>API Security:</span>
            <span className="font-mono">✓ Enabled</span>
          </div>
          <div className="flex justify-between">
            <span>Session Management:</span>
            <span className="font-mono">✓ Active</span>
          </div>
          <div className="flex justify-between">
            <span>Audit Logging:</span>
            <span className="font-mono">✓ Enabled</span>
          </div>
          <div className="flex justify-between">
            <span>Last Security Check:</span>
            <span className="font-mono">2 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
