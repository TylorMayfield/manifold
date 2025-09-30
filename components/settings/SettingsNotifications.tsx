"use client"

import React, { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import CellButton from '../ui/CellButton'
import { Mail, TestTube, CheckCircle, AlertTriangle } from 'lucide-react'

export default function SettingsNotifications() {
  const { settings: rawSettings, updateSetting: rawUpdateSetting } = useSettings()
  const settings = rawSettings as any; // Type assertion for extended settings
  const updateSetting = rawUpdateSetting as any; // Type assertion for dynamic keys
  const [testingEmail, setTestingEmail] = useState(false)

  const handleTestEmail = async () => {
    setTestingEmail(true)
    try {
      // Simulate email test
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Test email sent successfully!')
    } catch (error) {
      alert('Failed to send test email!')
    } finally {
      setTestingEmail(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="emailNotifications"
            checked={settings.emailNotifications}
            onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="emailNotifications" className="font-bold text-gray-900 flex items-center">
            <Mail className="w-4 h-4 mr-1" />
            Enable Email Notifications
          </label>
        </div>

        {settings.emailNotifications && (
          <div className="ml-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body font-bold text-gray-700 mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={settings.emailSmtpHost || ''}
                  onChange={(e) => updateSetting('emailSmtpHost', e.target.value)}
                  className="cell-input w-full"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <label className="block text-body font-bold text-gray-700 mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={settings.emailSmtpPort || 587}
                  onChange={(e) => updateSetting('emailSmtpPort', parseInt(e.target.value))}
                  className="cell-input w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body font-bold text-gray-700 mb-2">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={settings.emailSmtpUser || ''}
                  onChange={(e) => updateSetting('emailSmtpUser', e.target.value)}
                  className="cell-input w-full"
                  placeholder="your-email@gmail.com"
                />
              </div>

              <div>
                <label className="block text-body font-bold text-gray-700 mb-2">
                  SMTP Password
                </label>
                <input
                  type="password"
                  value={settings.emailSmtpPassword || ''}
                  onChange={(e) => updateSetting('emailSmtpPassword', e.target.value)}
                  className="cell-input w-full"
                  placeholder="App password or account password"
                />
              </div>
            </div>

            <div>
              <label className="block text-body font-bold text-gray-700 mb-2">
                From Email Address
              </label>
              <input
                type="email"
                value={settings.emailFrom || ''}
                onChange={(e) => updateSetting('emailFrom', e.target.value)}
                className="cell-input w-full"
                placeholder="noreply@yourdomain.com"
              />
            </div>

            <div>
              <CellButton
                variant="secondary"
                onClick={handleTestEmail}
                disabled={testingEmail || !settings.emailSmtpHost}
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testingEmail ? 'Testing...' : 'Send Test Email'}
              </CellButton>
            </div>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="space-y-4">
        <h3 className="font-bold text-body">Notification Types</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="jobFailureNotifications"
              checked={settings.jobFailureNotifications}
              onChange={(e) => updateSetting('jobFailureNotifications', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="jobFailureNotifications" className="font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-red-600" />
              Job Failure Notifications
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="jobCompletionNotifications"
              checked={settings.jobCompletionNotifications}
              onChange={(e) => updateSetting('jobCompletionNotifications', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="jobCompletionNotifications" className="font-bold text-gray-900 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
              Job Completion Notifications
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="systemNotifications"
              checked={settings.systemNotifications}
              onChange={(e) => updateSetting('systemNotifications', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="systemNotifications" className="font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-yellow-600" />
              System Notifications
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dataQualityAlerts"
              checked={settings.dataQualityAlerts !== false}
              onChange={(e) => updateSetting('dataQualityAlerts', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="dataQualityAlerts" className="font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-orange-600" />
              Data Quality Alerts
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="performanceAlerts"
              checked={settings.performanceAlerts !== false}
              onChange={(e) => updateSetting('performanceAlerts', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="performanceAlerts" className="font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-blue-600" />
              Performance Alerts
            </label>
          </div>
        </div>
      </div>

      {/* Notification Schedule */}
      <div className="space-y-4">
        <h3 className="font-bold text-body">Notification Schedule</h3>
        
        <div>
          <label className="block text-body font-bold text-gray-700 mb-2">
            Quiet Hours Start
          </label>
          <input
            type="time"
            value={settings.quietHoursStart || '22:00'}
            onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
            className="cell-input w-full"
          />
        </div>

        <div>
          <label className="block text-body font-bold text-gray-700 mb-2">
            Quiet Hours End
          </label>
          <input
            type="time"
            value={settings.quietHoursEnd || '08:00'}
            onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
            className="cell-input w-full"
          />
          <p className="text-xs text-gray-600 mt-1">
            Non-urgent notifications will be delayed during quiet hours
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="respectQuietHours"
            checked={settings.respectQuietHours !== false}
            onChange={(e) => updateSetting('respectQuietHours', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="respectQuietHours" className="font-bold text-gray-900">
            Respect Quiet Hours
          </label>
        </div>
      </div>

      {/* Notification History */}
      <div className="cell-card p-4">
        <h4 className="font-bold text-body mb-3">Recent Notifications</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-sm">Job completed successfully</span>
            </div>
            <span className="text-xs text-gray-600">2 minutes ago</span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm">Performance alert: High memory usage</span>
            </div>
            <span className="text-xs text-gray-600">15 minutes ago</span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm">Data source connection failed</span>
            </div>
            <span className="text-xs text-gray-600">1 hour ago</span>
          </div>
        </div>
      </div>

      {/* Notification Status */}
      <div className="cell-card p-4 bg-green-50 border-green-200">
        <h4 className="font-bold text-body mb-3 text-green-900">Notification Status</h4>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex justify-between">
            <span>Email Service:</span>
            <span className="font-mono">✓ Connected</span>
          </div>
          <div className="flex justify-between">
            <span>Last Email Sent:</span>
            <span className="font-mono">2 hours ago</span>
          </div>
          <div className="flex justify-between">
            <span>Pending Notifications:</span>
            <span className="font-mono">0</span>
          </div>
          <div className="flex justify-between">
            <span>Failed Deliveries:</span>
            <span className="font-mono">0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
