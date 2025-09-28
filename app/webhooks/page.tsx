"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "../../components/layout/PageLayout";
import CellButton from "../../components/ui/CellButton";
import CellCard from "../../components/ui/CellCard";
import CellModal from "../../components/ui/CellModal";
import CellInput from "../../components/ui/CellInput";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { useApi } from "../../hooks/useApi";
import {
  Webhook,
  MessageSquare,
  Plus,
  Settings,
  TestTube,
  Power,
  PowerOff,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface WebhookConfig {
  id: string;
  name: string;
  type: 'slack' | 'discord' | 'webhook';
  url: string;
  events: string[];
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  pipelineId?: string;
}

interface WebhookDelivery {
  id: string;
  webhookConfigId: string;
  eventType: string;
  status: 'pending' | 'success' | 'failed' | 'retry';
  httpStatus?: number;
  errorMessage?: string;
  attemptCount: number;
  createdAt: string;
  deliveredAt?: string;
}

export default function WebhooksPage() {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const { get, post, put, delete: del } = useApi();

  useEffect(() => {
    loadWebhooks();
    loadRecentDeliveries();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await get('/api/webhooks');
      if (response.success) {
        setWebhooks(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentDeliveries = async () => {
    try {
      const response = await get('/api/webhooks/deliveries?limit=10');
      if (response.success) {
        setDeliveries(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    }
  };

  const handleToggleWebhook = async (webhook: WebhookConfig) => {
    try {
      const response = await put(`/api/webhooks/${webhook.id}`, {
        isEnabled: !webhook.isEnabled
      });
      if (response.success) {
        await loadWebhooks();
      }
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await del(`/api/webhooks/${webhookId}`);
      if (response.success) {
        await loadWebhooks();
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleTestWebhook = async (webhook: WebhookConfig) => {
    setSelectedWebhook(webhook);
    setShowTestModal(true);
  };

  const runWebhookTest = async (testData: { name: string; description: string }) => {
    if (!selectedWebhook) return;

    try {
      const response = await post(`/api/webhooks/${selectedWebhook.id}/test`, testData);
      setTestResults(response.data);
      await loadRecentDeliveries(); // Refresh deliveries
    } catch (error) {
      console.error('Failed to test webhook:', error);
      setTestResults({ error: 'Test failed' });
    }
  };

  const getWebhookTypeIcon = (type: string) => {
    switch (type) {
      case 'slack':
        return '💬';
      case 'discord':
        return '🎮';
      case 'webhook':
        return '🔗';
      default:
        return '📡';
    }
  };

  const getWebhookTypeColor = (type: string) => {
    switch (type) {
      case 'slack':
        return 'bg-purple-100 text-purple-800';
      case 'discord':
        return 'bg-indigo-100 text-indigo-800';
      case 'webhook':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'retry':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'retry':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <PageLayout
        title="Webhooks"
        subtitle="Manage notification webhooks"
        icon={Webhook}
      >
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Webhooks"
      subtitle="Manage notifications and integrations"
      icon={Webhook}
      showBackButton={true}
      headerActions={
        <CellButton
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Webhook
        </CellButton>
      }
    >
      {webhooks.length === 0 ? (
        <CellCard className="p-12 text-center">
          <Webhook className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-heading mb-4">No Webhooks Configured</h2>
          <p className="text-body text-gray-600 mb-8 max-w-2xl mx-auto">
            Webhooks allow you to receive notifications in Slack or Discord when your 
            pipelines complete, fail, or encounter issues.
          </p>
          <CellButton
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Webhook
          </CellButton>
        </CellCard>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <CellCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-bold">Total Webhooks</p>
                  <p className="text-heading font-mono">{webhooks.length}</p>
                </div>
                <Webhook className="w-8 h-8 text-gray-400" />
              </div>
            </CellCard>
            <CellCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-bold">Active</p>
                  <p className="text-heading font-mono text-green-600">
                    {webhooks.filter(w => w.isEnabled).length}
                  </p>
                </div>
                <Power className="w-8 h-8 text-green-400" />
              </div>
            </CellCard>
            <CellCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-bold">Recent Deliveries</p>
                  <p className="text-heading font-mono">{deliveries.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-400" />
              </div>
            </CellCard>
            <CellCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-bold">Success Rate</p>
                  <p className="text-heading font-mono text-green-600">
                    {deliveries.length > 0 
                      ? `${Math.round((deliveries.filter(d => d.status === 'success').length / deliveries.length) * 100)}%`
                      : 'N/A'
                    }
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CellCard>
          </div>

          {/* Webhooks List */}
          <CellCard className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-subheading font-bold">Configured Webhooks</h2>
            </div>

            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-4 border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getWebhookTypeIcon(webhook.type)}</span>
                      <div>
                        <h3 className="font-mono font-bold">{webhook.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-mono ${getWebhookTypeColor(webhook.type)}`}>
                            {webhook.type.toUpperCase()}
                          </span>
                          <span className="text-caption text-gray-600">
                            {webhook.events.length} event{webhook.events.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 text-xs font-mono ${
                      webhook.isEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {webhook.isEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                    
                    <CellButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestWebhook(webhook)}
                    >
                      <TestTube className="w-4 h-4" />
                    </CellButton>

                    <CellButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleWebhook(webhook)}
                    >
                      {webhook.isEnabled ? 
                        <PowerOff className="w-4 h-4" /> : 
                        <Power className="w-4 h-4" />
                      }
                    </CellButton>

                    <CellButton
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/webhooks/${webhook.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </CellButton>

                    <CellButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </CellButton>
                  </div>
                </div>
              ))}
            </div>
          </CellCard>

          {/* Recent Deliveries */}
          {deliveries.length > 0 && (
            <CellCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-subheading font-bold">Recent Deliveries</h2>
                <CellButton
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/webhooks/deliveries')}
                >
                  View All
                  <ExternalLink className="w-4 h-4 ml-2" />
                </CellButton>
              </div>

              <div className="space-y-3">
                {deliveries.slice(0, 5).map((delivery) => {
                  const webhook = webhooks.find(w => w.id === delivery.webhookConfigId);
                  return (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        {getDeliveryStatusIcon(delivery.status)}
                        <div>
                          <p className="font-mono text-sm font-bold">
                            {webhook?.name || 'Unknown Webhook'}
                          </p>
                          <p className="text-caption text-gray-600">
                            {delivery.eventType} • {new Date(delivery.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-mono ${getDeliveryStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                        {delivery.httpStatus && (
                          <span className="text-caption text-gray-600">
                            HTTP {delivery.httpStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CellCard>
          )}
        </>
      )}

      {/* Create Webhook Modal */}
      <WebhookCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadWebhooks();
        }}
      />

      {/* Test Webhook Modal */}
      <WebhookTestModal
        isOpen={showTestModal}
        webhook={selectedWebhook}
        onClose={() => {
          setShowTestModal(false);
          setSelectedWebhook(null);
          setTestResults(null);
        }}
        onTest={runWebhookTest}
        testResults={testResults}
      />
    </PageLayout>
  );
}

// Create Webhook Modal Component
function WebhookCreateModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'webhook' as 'slack' | 'discord' | 'webhook',
    url: '',
    events: ['start', 'success', 'failure', 'complete'],
    isEnabled: true
  });
  const [creating, setCreating] = useState(false);
  const { post } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCreating(true);
      const response = await post('/api/webhooks', formData);
      if (response.success) {
        onSuccess();
        setFormData({
          name: '',
          type: 'webhook',
          url: '',
          events: ['start', 'success', 'failure', 'complete'],
          isEnabled: true
        });
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
    } finally {
      setCreating(false);
    }
  };

  const eventOptions = [
    { value: 'start', label: 'Pipeline Started' },
    { value: 'progress', label: 'Progress Updates' },
    { value: 'success', label: 'Pipeline Succeeded' },
    { value: 'failure', label: 'Pipeline Failed' },
    { value: 'complete', label: 'Pipeline Completed' },
    { value: 'cancelled', label: 'Pipeline Cancelled' }
  ];

  return (
    <CellModal isOpen={isOpen} onClose={onClose} title="Add New Webhook">
      <form onSubmit={handleSubmit} className="space-y-4">
        <CellInput
          label="Webhook Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Team Notifications"
          required
        />

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Webhook Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-dark_cyan-500 focus:border-dark_cyan-500"
            required
          >
            <option value="webhook">Generic Webhook</option>
            <option value="slack">Slack</option>
            <option value="discord">Discord</option>
          </select>
        </div>

        <CellInput
          label="Webhook URL"
          value={formData.url}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          placeholder="https://hooks.slack.com/services/..."
          required
          type="url"
        />

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Events to Subscribe
          </label>
          <div className="space-y-2">
            {eventOptions.map((event) => (
              <label key={event.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.events.includes(event.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        events: [...prev.events, event.value]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        events: prev.events.filter(ev => ev !== event.value)
                      }));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{event.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isEnabled}
            onChange={(e) => setFormData(prev => ({ ...prev, isEnabled: e.target.checked }))}
            className="mr-2"
          />
          <label className="text-sm font-bold text-gray-900">
            Enable webhook immediately
          </label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <CellButton
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </CellButton>
          <CellButton
            type="submit"
            variant="primary"
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create Webhook'}
          </CellButton>
        </div>
      </form>
    </CellModal>
  );
}

// Test Webhook Modal Component
function WebhookTestModal({ isOpen, webhook, onClose, onTest, testResults }: {
  isOpen: boolean;
  webhook: WebhookConfig | null;
  onClose: () => void;
  onTest: (data: { name: string; description: string }) => void;
  testResults: any;
}) {
  const [testData, setTestData] = useState({
    name: 'Test Pipeline',
    description: 'This is a test notification from Manifold ETL'
  });

  const handleTest = () => {
    onTest(testData);
  };

  if (!webhook) return null;

  return (
    <CellModal isOpen={isOpen} onClose={onClose} title={`Test ${webhook.name}`}>
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 border border-gray-200">
          <p className="text-sm font-bold">Webhook Details</p>
          <p className="text-caption">{webhook.type.toUpperCase()} • {webhook.url}</p>
        </div>

        <CellInput
          label="Test Pipeline Name"
          value={testData.name}
          onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
        />

        <CellInput
          label="Test Description"
          value={testData.description}
          onChange={(e) => setTestData(prev => ({ ...prev, description: e.target.value }))}
        />

        {testResults && (
          <div className={`p-3 border ${
            testResults.deliveryResult?.success 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <p className="text-sm font-bold mb-2">Test Results</p>
            {testResults.deliveryResult?.success ? (
              <p className="text-green-800">✅ Test successful!</p>
            ) : (
              <p className="text-red-800">❌ Test failed: {testResults.deliveryResult?.error}</p>
            )}
            {testResults.deliveryResult?.httpStatus && (
              <p className="text-caption mt-1">HTTP {testResults.deliveryResult.httpStatus}</p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <CellButton variant="ghost" onClick={onClose}>
            Close
          </CellButton>
          <CellButton variant="primary" onClick={handleTest}>
            <TestTube className="w-4 h-4 mr-2" />
            Send Test
          </CellButton>
        </div>
      </div>
    </CellModal>
  );
}
