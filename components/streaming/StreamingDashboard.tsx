"use client";

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Play,
  Square,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Trash2,
  BarChart3,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import CellModal from '../ui/CellModal';
import CellInput from '../ui/CellInput';
import StatusBadge from '../ui/StatusBadge';

interface StreamConfig {
  id: string;
  name: string;
  type: 'kafka' | 'rabbitmq' | 'websocket';
  enabled: boolean;
  statistics?: {
    messagesReceived: number;
    messagesProcessed: number;
    messagesFailed: number;
    status: string;
    lastMessageAt?: Date;
  };
}

export default function StreamingDashboard() {
  const [streams, setStreams] = useState<StreamConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newStream, setNewStream] = useState({
    name: '',
    type: 'kafka' as 'kafka' | 'rabbitmq' | 'websocket',
    config: {},
  });

  useEffect(() => {
    loadStreams();
    
    // Refresh statistics every 5 seconds
    const interval = setInterval(loadStreams, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStreams = async () => {
    try {
      const response = await fetch('/api/streams');
      
      if (response.ok) {
        const data = await response.json();
        setStreams(data.streams);
      }
    } catch (error) {
      console.error('Failed to load streams:', error);
    }
  };

  const handleConnect = async (streamId: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/connect`, {
        method: 'POST',
      });

      if (response.ok) {
        loadStreams();
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async (streamId: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/connect`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadStreams();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'disconnected':
        return <Square className="w-5 h-5 text-gray-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'reconnecting':
        return <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'kafka':
        return '📨';
      case 'rabbitmq':
        return '🐰';
      case 'websocket':
        return '🔌';
      default:
        return '📡';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading font-bold mb-2">Streaming Data Sources</h2>
          <p className="text-body text-gray-600">
            Real-time data ingestion from Kafka, RabbitMQ, and WebSocket
          </p>
        </div>
        <CellButton
          variant="primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Stream
        </CellButton>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-gray-600">Active Streams</p>
              <p className="text-heading font-mono">
                {streams.filter(s => s.statistics?.status === 'connected').length}
              </p>
            </div>
            <Radio className="w-8 h-8 text-green-400" />
          </div>
        </CellCard>

        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-gray-600">Total Messages</p>
              <p className="text-heading font-mono">
                {streams.reduce((sum, s) => sum + (s.statistics?.messagesReceived || 0), 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </CellCard>

        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-gray-600">Processed</p>
              <p className="text-heading font-mono">
                {streams.reduce((sum, s) => sum + (s.statistics?.messagesProcessed || 0), 0).toLocaleString()}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </CellCard>

        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold text-gray-600">Failed</p>
              <p className="text-heading font-mono">
                {streams.reduce((sum, s) => sum + (s.statistics?.messagesFailed || 0), 0)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </CellCard>
      </div>

      {/* Streams List */}
      {streams.length === 0 ? (
        <CellCard className="p-12 text-center">
          <Radio className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-subheading font-bold mb-2">No Streaming Sources</h3>
          <p className="text-body text-gray-600 mb-6">
            Connect to Kafka, RabbitMQ, or WebSocket for real-time data ingestion
          </p>
          <CellButton
            variant="accent"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Stream
          </CellButton>
        </CellCard>
      ) : (
        <div className="space-y-4">
          {streams.map((stream) => (
            <CellCard key={stream.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{getTypeIcon(stream.type)}</div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{stream.name}</h3>
                    <p className="text-caption text-gray-600 uppercase">
                      {stream.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {stream.statistics && getStatusIcon(stream.statistics.status)}
                  <StatusBadge
                    status={
                      stream.statistics?.status === 'connected' ? 'active' :
                      stream.statistics?.status === 'error' ? 'failed' :
                      'paused'
                    }
                    label={stream.statistics?.status.toUpperCase() || 'UNKNOWN'}
                  />
                </div>
              </div>

              {/* Statistics */}
              {stream.statistics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600 mb-1">Messages Received</p>
                    <p className="text-xl font-mono font-bold">
                      {stream.statistics.messagesReceived.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-600 mb-1">Processed</p>
                    <p className="text-xl font-mono font-bold text-green-700">
                      {stream.statistics.messagesProcessed.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-xs text-gray-600 mb-1">Failed</p>
                    <p className="text-xl font-mono font-bold text-red-700">
                      {stream.statistics.messagesFailed}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-600 mb-1">Last Message</p>
                    <p className="text-sm font-mono">
                      {stream.statistics.lastMessageAt
                        ? new Date(stream.statistics.lastMessageAt).toLocaleTimeString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {stream.statistics?.status === 'connected' ? (
                  <CellButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDisconnect(stream.id)}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Disconnect
                  </CellButton>
                ) : (
                  <CellButton
                    variant="accent"
                    size="sm"
                    onClick={() => handleConnect(stream.id)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Connect
                  </CellButton>
                )}
                <CellButton variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </CellButton>
                <CellButton variant="ghost" size="sm">
                  <BarChart3 className="w-4 h-4" />
                </CellButton>
                <CellButton variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </CellButton>
              </div>
            </CellCard>
          ))}
        </div>
      )}

      {/* Add Stream Modal */}
      <CellModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Streaming Source"
        size="lg"
      >
        <div className="space-y-6">
          <CellInput
            label="Stream Name"
            placeholder="e.g., User Events Stream"
            value={newStream.name}
            onChange={(e) => setNewStream(prev => ({ ...prev, name: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-bold mb-3">Stream Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'kafka', label: 'Apache Kafka', icon: '📨' },
                { value: 'rabbitmq', label: 'RabbitMQ', icon: '🐰' },
                { value: 'websocket', label: 'WebSocket', icon: '🔌' },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setNewStream(prev => ({ ...prev, type: value as any }))}
                  className={`p-4 border rounded-lg transition-all ${
                    newStream.type === value
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'bg-white border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className="font-bold text-sm">{label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is a demo implementation. In production, actual Kafka/RabbitMQ connections would be established.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <CellButton
              variant="ghost"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </CellButton>
            <CellButton
              variant="primary"
              onClick={async () => {
                const response = await fetch('/api/streams', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newStream),
                });

                if (response.ok) {
                  setShowAddModal(false);
                  setNewStream({ name: '', type: 'kafka', config: {} });
                  loadStreams();
                }
              }}
              disabled={!newStream.name}
            >
              Add Stream
            </CellButton>
          </div>
        </div>
      </CellModal>
    </div>
  );
}

