"use client";

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Folder,
  FileText,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  Loader2,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import CellInput from '../ui/CellInput';

interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

interface S3BrowserProps {
  config: any;
  onFileSelected?: (key: string) => void;
  onImport?: (key: string) => void;
}

export default function S3Browser({
  config,
  onFileSelected,
  onImport,
}: S3BrowserProps) {
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedObject, setSelectedObject] = useState<S3Object | null>(null);

  useEffect(() => {
    loadObjects();
  }, [prefix]);

  const loadObjects = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/storage/s3/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          prefix,
          maxKeys: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setObjects(data.objects);
      }
    } catch (error) {
      console.error('Failed to load objects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = async (key: string) => {
    if (onImport) {
      onImport(key);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (key: string) => {
    if (key.endsWith('.json')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (key.endsWith('.csv')) return <FileText className="w-5 h-5 text-green-600" />;
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  const filteredObjects = searchTerm
    ? objects.filter(obj => obj.key.toLowerCase().includes(searchTerm.toLowerCase()))
    : objects;

  return (
    <div className="space-y-4">
      {/* Browser Header */}
      <CellCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Cloud className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-bold text-lg">S3 Browser</h3>
              <p className="text-caption text-gray-600">
                Bucket: {config.bucket}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CellButton
              variant="ghost"
              size="sm"
              onClick={loadObjects}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </CellButton>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-3">
          <Search className="w-4 h-4 text-gray-500" />
          <CellInput
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      </CellCard>

      {/* Objects List */}
      <CellCard className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredObjects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-body text-gray-600">
              {searchTerm ? 'No files match your search' : 'No files found in bucket'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredObjects.map((obj) => (
              <div
                key={obj.key}
                className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                  selectedObject?.key === obj.key
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-gray-300 hover:border-blue-300'
                }`}
              >
                <div
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => setSelectedObject(obj)}
                >
                  {getFileIcon(obj.key)}
                  <div>
                    <p className="font-mono text-sm font-bold">{obj.key}</p>
                    <p className="text-xs text-gray-600">
                      {formatFileSize(obj.size)} • {new Date(obj.lastModified).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <CellButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleImportFile(obj.key)}
                    title="Import to Manifold"
                  >
                    <Download className="w-4 h-4" />
                  </CellButton>
                  <CellButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (onFileSelected) {
                        onFileSelected(obj.key);
                      }
                    }}
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </CellButton>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredObjects.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredObjects.length} file{filteredObjects.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}
      </CellCard>
    </div>
  );
}

