"use client";

import { useState, useEffect } from "react";
import { Database, Check, X, Loader2, TestTube } from "lucide-react";
import CellCard from "../ui/CellCard";
import CellButton from "../ui/CellButton";
import CellInput from "../ui/CellInput";

export default function SettingsDatabase() {
  const [connectionString, setConnectionString] = useState('mongodb://127.0.0.1:27017/manifold');
  const [type, setType] = useState<'local' | 'remote'>('local');
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadCurrentConfig();
    // Auto-refresh shortly after mount to reflect latest server connection
    const t = setTimeout(() => {
      loadCurrentConfig();
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/database/connection');
      if (response.ok) {
        const data = await response.json();
        setConnectionString(data.connectionString);
        setType(data.type);
        setIsConnected(data.isConnected);
      }
    } catch (error) {
      console.error('Error loading database config:', error);
    }
  };

  const refreshStatus = async () => {
    try {
      setIsRefreshing(true);
      await loadCurrentConfig();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/database/connection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString })
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/database/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString, type })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isConnected);
        setTestResult({
          success: true,
          message: 'Connection updated and saved successfully'
        });
      } else {
        const error = await response.json();
        setTestResult({
          success: false,
          message: error.message || 'Failed to save connection'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save connection'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const presets = {
    local: 'mongodb://127.0.0.1:27017/manifold',
    localAuth: 'mongodb://username:password@127.0.0.1:27017/manifold',
    mongoAtlas: 'mongodb+srv://username:password@cluster.mongodb.net/manifold',
    dockerLocal: 'mongodb://host.docker.internal:27017/manifold'
  };

  return (
    <div className="space-y-6">
      <CellCard>
          <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Database Connection</h2>
                <p className="text-sm text-gray-600">
                  Configure MongoDB connection for Manifold
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <span className="flex items-center text-green-600 text-sm font-medium">
                  <Check className="w-4 h-4 mr-1" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center text-red-600 text-sm font-medium">
                  <X className="w-4 h-4 mr-1" />
                  Disconnected
                </span>
              )}
              <CellButton
                variant="secondary"
                size="sm"
                onClick={refreshStatus}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing
                  </>
                ) : (
                  'Refresh'
                )}
              </CellButton>
            </div>
          </div>

          {/* Connection Type */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Connection Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center text-gray-900">
                <input
                  type="radio"
                  value="local"
                  checked={type === 'local'}
                  onChange={(e) => setType('local')}
                  className="mr-2"
                />
                Local MongoDB
              </label>
              <label className="flex items-center text-gray-900">
                <input
                  type="radio"
                  value="remote"
                  checked={type === 'remote'}
                  onChange={(e) => setType('remote')}
                  className="mr-2"
                />
                Remote MongoDB (Atlas/Cloud)
              </label>
            </div>
          </div>

          {/* Connection String */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Connection String
            </label>
            <CellInput
              type="text"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="mongodb://localhost:27017/manifold"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              Format: mongodb://[username:password@]host:port/database
            </p>
          </div>

          {/* Quick Presets */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <CellButton
                variant="secondary"
                size="sm"
                onClick={() => setConnectionString(presets.local)}
              >
                Local (Default)
              </CellButton>
              <CellButton
                variant="secondary"
                size="sm"
                onClick={() => setConnectionString(presets.localAuth)}
              >
                Local with Auth
              </CellButton>
              <CellButton
                variant="secondary"
                size="sm"
                onClick={() => setConnectionString(presets.mongoAtlas)}
              >
                MongoDB Atlas
              </CellButton>
              <CellButton
                variant="secondary"
                size="sm"
                onClick={() => setConnectionString(presets.dockerLocal)}
              >
                Docker Local
              </CellButton>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`mb-4 p-4 rounded border-2 ${
              testResult.success 
                ? 'bg-green-900/20 border-green-600 text-green-400' 
                : 'bg-red-900/20 border-red-600 text-red-400'
            }`}>
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span className="text-sm font-mono">{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <CellButton
              variant="secondary"
              onClick={handleTestConnection}
              disabled={isTesting || !connectionString}
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </CellButton>
            <CellButton
              variant="primary"
              onClick={handleSaveConnection}
              disabled={isSaving || !connectionString}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save & Connect
                </>
              )}
            </CellButton>
          </div>
        </div>
      </CellCard>

      {/* Information Card */}
      <CellCard>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">MongoDB Setup Guide</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong className="text-gray-900">Local MongoDB:</strong>
              <p className="text-gray-600 ml-4">
                Make sure MongoDB is installed and running on your machine.<br />
                Default connection: <code className="text-blue-400">mongodb://127.0.0.1:27017/manifold</code><br />
                <span className="text-xs text-gray-500">Using 127.0.0.1 instead of localhost to avoid IPv6 issues on Windows</span>
              </p>
            </div>
            <div>
              <strong className="text-gray-900">MongoDB Atlas (Cloud):</strong>
              <p className="text-gray-600 ml-4">
                1. Create a free cluster at <a href="https://www.mongodb.com/cloud/atlas" target="_blank" className="text-blue-400 underline">mongodb.com/cloud/atlas</a><br />
                2. Get your connection string from the "Connect" button<br />
                3. Replace &lt;password&gt; with your actual password
              </p>
            </div>
            <div>
              <strong className="text-gray-900">Docker:</strong>
              <p className="text-gray-600 ml-4">
                Use <code className="text-blue-600 bg-blue-50 px-1 rounded">host.docker.internal</code> instead of localhost
              </p>
            </div>
          </div>
        </div>
      </CellCard>
    </div>
  );
}
