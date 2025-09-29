"use client"

import React from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { CellInput, CellSelect, CellCheckbox, FormField, CellStack, CellGrid } from '../ui'

export default function SettingsGeneral() {
  const { settings, updateSetting } = useSettings()

  return (
    <CellStack spacing="lg">
      {/* Application Name */}
      <FormField 
        label="Application Name" 
        helper="This will be displayed in the browser title and throughout the application"
      >
        <CellInput
          type="text"
          value={settings.applicationName}
          onChange={(e) => updateSetting('applicationName', e.target.value)}
          placeholder="Enter application name"
        />
      </FormField>

      {/* Language and Region */}
      <CellGrid cols={2} gap="md">
        <FormField label="Language">
          <CellSelect
            value={settings.language || 'en'}
            onChange={(e) => updateSetting('language', e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </CellSelect>
        </FormField>

        <FormField label="Default Timezone">
          <CellSelect
            value={settings.defaultTimezone}
            onChange={(e) => updateSetting('defaultTimezone', e.target.value)}
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Asia/Shanghai">Shanghai (CST)</option>
          </CellSelect>
        </FormField>
      </CellGrid>

      {/* Date and Time Format */}
      <CellGrid cols={2} gap="md">
        <FormField label="Date Format">
          <CellSelect
            value={settings.dateFormat}
            onChange={(e) => updateSetting('dateFormat', e.target.value)}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
            <option value="MMM DD, YYYY">MMM DD, YYYY</option>
            <option value="DD MMM YYYY">DD MMM YYYY</option>
          </CellSelect>
        </FormField>

        <FormField label="Time Format">
          <CellSelect
            value={settings.timeFormat || '12h'}
            onChange={(e) => updateSetting('timeFormat', e.target.value)}
          >
            <option value="12h">12-hour (AM/PM)</option>
            <option value="24h">24-hour</option>
          </CellSelect>
        </FormField>
      </CellGrid>

      {/* Performance Settings */}
      <FormField 
        label="Max Concurrent Jobs"
        helper="Maximum number of jobs that can run simultaneously (1-20)"
      >
        <CellInput
          type="number"
          min="1"
          max="20"
          value={settings.maxConcurrentJobs}
          onChange={(e) => updateSetting('maxConcurrentJobs', parseInt(e.target.value))}
        />
      </FormField>

      {/* Auto-save Settings */}
      <CellStack spacing="md">
        <CellCheckbox
          label="Enable Auto-save"
          checked={settings.autoSave !== false}
          onChange={(e) => updateSetting('autoSave', e.target.checked)}
        />

        {settings.autoSave !== false && (
          <FormField 
            label="Auto-save Interval (seconds)"
            helper="Automatically save changes every N seconds (5-300)"
          >
            <CellInput
              type="number"
              min="5"
              max="300"
              value={settings.autoSaveInterval || 30}
              onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value))}
            />
          </FormField>
        )}
      </CellStack>

      {/* Startup Settings */}
      <CellStack spacing="md">
        <CellCheckbox
          label="Show Welcome Screen on Startup"
          checked={settings.showWelcomeScreen !== false}
          onChange={(e) => updateSetting('showWelcomeScreen', e.target.checked)}
        />

        <CellCheckbox
          label="Auto-connect Data Sources on Startup"
          checked={settings.autoConnectDataSources || false}
          onChange={(e) => updateSetting('autoConnectDataSources', e.target.checked)}
        />

        <CellCheckbox
          label="Check for Updates on Startup"
          checked={settings.checkForUpdates !== false}
          onChange={(e) => updateSetting('checkForUpdates', e.target.checked)}
        />
      </CellStack>
    </CellStack>
  )
}
