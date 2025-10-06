"use client";

import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import CellInput from '../ui/CellInput';
import StatusBadge from '../ui/StatusBadge';

interface S3Config {
  provider: 's3' | 'minio' | 'digitalocean' | 'wasabi' | 'backblaze' | 'custom';
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle?: boolean;
}

interface S3ConfigFormProps {
  initialConfig?: Partial<S3Config>;
  onSave?: (config: S3Config) => void;
  onCancel?: () => void;
}

export default function S3ConfigForm({
  initialConfig,
  onSave,
  onCancel,
}: S3ConfigFormProps) {
  const [config, setConfig] = useState<S3Config>({
    provider: initialConfig?.provider || 's3',
    endpoint: initialConfig?.endpoint || '',
    region: initialConfig?.region || 'us-east-1',
    accessKeyId: initialConfig?.accessKeyId || '',
    secretAccessKey: initialConfig?.secretAccessKey || '',
    bucket: initialConfig?.bucket || '',
    forcePathStyle: initialConfig?.forcePathStyle || false,
  });

  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    bucketsAccessible?: string[];
  } | null>(null);

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch('/api/storage/s3/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();
      setTestResult(data);

    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 's3':
        return {
          name: 'Amazon S3',
          defaultRegion: 'us-east-1',
          requiresEndpoint: false,
          docs: 'https://aws.amazon.com/s3/',
        };
      case 'minio':
        return {
          name: 'MinIO',
          defaultRegion: 'us-east-1',
          requiresEndpoint: true,
          docs: 'https://min.io/',
          example: 'http://localhost:9000',
        };
      case 'digitalocean':
        return {
          name: 'DigitalOcean Spaces',
          defaultRegion: 'nyc3',
          requiresEndpoint: false,
          docs: 'https://www.digitalocean.com/products/spaces',
        };
      case 'wasabi':
        return {
          name: 'Wasabi',
          defaultRegion: 'us-east-1',
          requiresEndpoint: false,
          docs: 'https://wasabi.com/',
        };
      case 'backblaze':
        return {
          name: 'Backblaze B2',
          defaultRegion: 'us-west-001',
          requiresEndpoint: false,
          docs: 'https://www.backblaze.com/b2/',
        };
      default:
        return {
          name: 'Custom S3 Compatible',
          defaultRegion: 'us-east-1',
          requiresEndpoint: true,
          docs: '',
        };
    }
  };

  const providerInfo = getProviderInfo(config.provider);

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-bold mb-3">Storage Provider</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { value: 's3', label: 'Amazon S3', icon: '☁️' },
            { value: 'minio', label: 'MinIO', icon: '🗄️' },
            { value: 'digitalocean', label: 'DigitalOcean', icon: '🌊' },
            { value: 'wasabi', label: 'Wasabi', icon: '🌶️' },
            { value: 'backblaze', label: 'Backblaze', icon: '💾' },
            { value: 'custom', label: 'Custom', icon: '⚙️' },
          ].map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setConfig(prev => ({ ...prev, provider: value as any }))}
              className={`p-3 border rounded-lg text-left transition-all ${
                config.provider === value
                  ? 'bg-blue-50 border-blue-500 shadow-md'
                  : 'bg-white border-gray-300 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{icon}</span>
                <span className="font-bold text-sm">{label}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {providerInfo.name} {providerInfo.docs && (
            <a href={providerInfo.docs} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              (docs)
            </a>
          )}
        </p>
      </div>

      {/* Endpoint (for MinIO and Custom) */}
      {providerInfo.requiresEndpoint && (
        <CellInput
          label="Endpoint URL"
          placeholder={providerInfo.example || 'https://s3.example.com'}
          value={config.endpoint || ''}
          onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
          required
        />
      )}

      {/* Region */}
      <CellInput
        label="Region"
        placeholder={providerInfo.defaultRegion}
        value={config.region}
        onChange={(e) => setConfig(prev => ({ ...prev, region: e.target.value }))}
        required
      />

      {/* Access Key ID */}
      <CellInput
        label="Access Key ID"
        placeholder="AKIAIOSFODNN7EXAMPLE"
        value={config.accessKeyId}
        onChange={(e) => setConfig(prev => ({ ...prev, accessKeyId: e.target.value }))}
        required
      />

      {/* Secret Access Key */}
      <div>
        <label className="block text-sm font-bold mb-2">Secret Access Key</label>
        <div className="relative">
          <input
            type={showSecret ? 'text' : 'password'}
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            value={config.secretAccessKey}
            onChange={(e) => setConfig(prev => ({ ...prev, secretAccessKey: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded"
          >
            {showSecret ? (
              <EyeOff className="w-4 h-4 text-gray-600" />
            ) : (
              <Eye className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Bucket */}
      <CellInput
        label="Bucket Name"
        placeholder="my-data-bucket"
        value={config.bucket}
        onChange={(e) => setConfig(prev => ({ ...prev, bucket: e.target.value }))}
        required
      />

      {/* Advanced Options */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.forcePathStyle || false}
            onChange={(e) => setConfig(prev => ({ ...prev, forcePathStyle: e.target.checked }))}
            className="w-4 h-4"
          />
          <span className="text-sm">Force path-style URLs (required for MinIO)</span>
          <span className="inline-block" title="Use path-style URLs instead of virtual-hosted style">
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </span>
        </label>
      </div>

      {/* Test Connection */}
      <CellCard className="p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-sm mb-1">Test Connection</p>
            <p className="text-xs text-gray-600">
              Verify credentials and bucket access
            </p>
          </div>
          <CellButton
            variant="secondary"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing || !config.accessKeyId || !config.secretAccessKey || !config.bucket}
            isLoading={testing}
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 mr-2" />
                Test
              </>
            )}
          </CellButton>
        </div>

        {testResult && (
          <div className={`p-3 rounded-lg border ${
            testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start space-x-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-bold text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                </p>
                <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult.message}
                </p>
                {testResult.bucketsAccessible && testResult.bucketsAccessible.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-700 mb-1">Accessible Buckets:</p>
                    <div className="flex flex-wrap gap-1">
                      {testResult.bucketsAccessible.map(bucket => (
                        <span
                          key={bucket}
                          className="px-2 py-1 bg-white border border-green-300 rounded text-xs font-mono"
                        >
                          {bucket}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CellCard>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <CellButton variant="ghost" onClick={onCancel}>
            Cancel
          </CellButton>
        )}
        <CellButton
          variant="primary"
          onClick={handleSave}
          disabled={!testResult?.success}
        >
          Save Configuration
        </CellButton>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">S3-Compatible Storage</p>
            <p className="mb-2">
              This configuration works with any S3-compatible storage provider. Make sure you have:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Valid Access Key ID and Secret Access Key</li>
              <li>Bucket created and accessible</li>
              <li>Appropriate IAM permissions (s3:GetObject, s3:PutObject, s3:ListBucket)</li>
              <li>Correct region selected</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

