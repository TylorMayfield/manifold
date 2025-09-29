"use client"

import React from 'react'
import { useSettings } from '../../contexts/SettingsContext'

export default function SettingsPerformance() {
  const { settings, updateSetting } = useSettings()

  return (
    <div className="space-y-6">
      {/* Caching Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="cacheEnabled"
            checked={settings.cacheEnabled !== false}
            onChange={(e) => updateSetting('cacheEnabled', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="cacheEnabled" className="font-bold text-gray-900">
            Enable Query Caching
          </label>
        </div>

        {settings.cacheEnabled !== false && (
          <div className="ml-6">
            <label className="block text-body font-bold text-gray-700 mb-2">
              Cache Size (MB)
            </label>
            <input
              type="number"
              min="64"
              max="2048"
              value={settings.cacheSize || 256}
              onChange={(e) => updateSetting('cacheSize', parseInt(e.target.value))}
              className="cell-input w-full"
            />
            <p className="text-xs text-gray-600 mt-1">
              Maximum memory to use for caching query results (64-2048 MB)
            </p>
          </div>
        )}
      </div>

      {/* Query Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-body font-bold text-gray-700 mb-2">
            Query Timeout (seconds)
          </label>
          <input
            type="number"
            min="5"
            max="300"
            value={settings.queryTimeout || 30}
            onChange={(e) => updateSetting('queryTimeout', parseInt(e.target.value))}
            className="cell-input w-full"
          />
          <p className="text-xs text-gray-600 mt-1">
            Maximum time to wait for query execution (5-300 seconds)
          </p>
        </div>

        <div>
          <label className="block text-body font-bold text-gray-700 mb-2">
            Max Query Results
          </label>
          <input
            type="number"
            min="100"
            max="100000"
            value={settings.maxQueryResults || 10000}
            onChange={(e) => updateSetting('maxQueryResults', parseInt(e.target.value))}
            className="cell-input w-full"
          />
          <p className="text-xs text-gray-600 mt-1">
            Maximum number of rows to return per query (100-100,000)
          </p>
        </div>
      </div>

      {/* Memory Settings */}
      <div>
        <label className="block text-body font-bold text-gray-700 mb-2">
          Max Memory Usage (MB)
        </label>
        <input
          type="number"
          min="512"
          max="8192"
          value={settings.maxMemoryUsage || 2048}
          onChange={(e) => updateSetting('maxMemoryUsage', parseInt(e.target.value))}
          className="cell-input w-full"
        />
        <p className="text-xs text-gray-600 mt-1">
          Maximum memory the application can use (512-8192 MB)
        </p>
      </div>

      {/* Processing Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableQueryOptimization"
            checked={settings.enableQueryOptimization !== false}
            onChange={(e) => updateSetting('enableQueryOptimization', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="enableQueryOptimization" className="font-bold text-gray-900">
            Enable Query Optimization
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="parallelProcessing"
            checked={settings.parallelProcessing !== false}
            onChange={(e) => updateSetting('parallelProcessing', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="parallelProcessing" className="font-bold text-gray-900">
            Enable Parallel Processing
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableIndexing"
            checked={settings.enableIndexing !== false}
            onChange={(e) => updateSetting('enableIndexing', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="enableIndexing" className="font-bold text-gray-900">
            Enable Automatic Indexing
          </label>
        </div>
      </div>

      {/* Performance Monitoring */}
      <div className="cell-card p-4">
        <h4 className="font-bold text-body mb-3">Performance Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Memory Usage:</span>
              <span className="font-mono">1.2 GB / 2.0 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cache Hit Rate:</span>
              <span className="font-mono">87%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg Query Time:</span>
              <span className="font-mono">245ms</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Connections:</span>
              <span className="font-mono">3 / 5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="cell-card p-4 bg-blue-50 border-blue-200">
        <h4 className="font-bold text-body mb-3 text-blue-900">Performance Tips</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Enable caching for frequently accessed data</li>
          <li>• Use parallel processing for large datasets</li>
          <li>• Optimize queries to reduce execution time</li>
          <li>• Monitor memory usage to prevent slowdowns</li>
          <li>• Consider indexing frequently queried columns</li>
        </ul>
      </div>
    </div>
  )
}
