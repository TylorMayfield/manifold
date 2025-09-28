"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "../../../components/layout/PageLayout";
import CellButton from "../../../components/ui/CellButton";
import CellCard from "../../../components/ui/CellCard";
import CellModal from "../../../components/ui/CellModal";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import { useApi } from "../../../hooks/useApi";
import {
  MessageSquare,
  ArrowLeft,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  ExternalLink,
  Download,
} from "lucide-react";

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
  payload: string;
  responseBody?: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  type: 'slack' | 'discord' | 'webhook';
  url: string;
}

export default function WebhookDeliveriesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    webhookId: '',
    limit: 50,
    offset: 0
  });
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    count: 0,
    hasMore: false
  });

  const { get } = useApi();

  useEffect(() => {
    loadWebhooks();
    loadDeliveries();
  }, [filter]);

  const loadWebhooks = async () => {
    try {
      const response = await get('/api/webhooks');
      if (response.success) {
        setWebhooks(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    }
  };

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.webhookId) params.append('webhookId', filter.webhookId);
      params.append('limit', filter.limit.toString());
      params.append('offset', filter.offset.toString());

      const response = await get(`/api/webhooks/deliveries?${params.toString()}`);
      if (response.success) {
        setDeliveries(response.data || []);
        setPagination(response.pagination || { total: 0, count: 0, hasMore: false });
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (delivery: WebhookDelivery) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleLoadMore = () => {
    setFilter(prev => ({ ...prev, offset: prev.offset + prev.limit }));
  };

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return '-';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end.getTime() - start.getTime();
    if (diff < 1000) return `${diff}ms`;
    if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
    return `${(diff / 60000).toFixed(1)}m`;
  };

  if (loading && deliveries.length === 0) {
    return (
      <PageLayout
        title="Webhook Deliveries"
        subtitle="View webhook delivery history and logs"
        icon={MessageSquare}
        showBackButton={true}
        backButtonHref="/webhooks"
      >
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Webhook Deliveries"
      subtitle="View webhook delivery history and logs"
      icon={MessageSquare}
      showBackButton={true}
      backButtonHref="/webhooks"
      headerActions={
        <CellButton
          variant="ghost"
          onClick={() => loadDeliveries()}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </CellButton>
      }
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold">Total Deliveries</p>
              <p className="text-heading font-mono">{pagination.total}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-gray-400" />
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
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold">Failed</p>
              <p className="text-heading font-mono text-red-600">
                {deliveries.filter(d => d.status === 'failed').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </CellCard>
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold">Retrying</p>
              <p className="text-heading font-mono text-orange-600">
                {deliveries.filter(d => d.status === 'retry' || d.status === 'pending').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
        </CellCard>
      </div>

      {/* Filters */}
      <CellCard className="p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-bold">Filters:</span>
          </div>
          
          <div>
            <select
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="retry">Retry</option>
            </select>
          </div>

          <div>
            <select
              value={filter.webhookId}
              onChange={(e) => handleFilterChange('webhookId', e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value="">All Webhooks</option>
              {webhooks.map((webhook) => (
                <option key={webhook.id} value={webhook.id}>
                  {webhook.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filter.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </CellCard>

      {/* Deliveries Table */}
      <CellCard className="p-0">
        {deliveries.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-mono text-lg mb-2">No deliveries found</p>
            <p className="text-caption text-gray-600">
              Webhook deliveries will appear here when webhooks are triggered.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Webhook</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Event</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">HTTP Status</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Attempts</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Duration</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deliveries.map((delivery) => {
                  const webhook = webhooks.find(w => w.id === delivery.webhookConfigId);
                  return (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(delivery.status)}
                          <span className={`px-2 py-1 text-xs font-mono ${getStatusColor(delivery.status)}`}>
                            {delivery.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-mono text-sm font-bold">
                            {webhook?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-600 capitalize">
                            {webhook?.type || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{delivery.eventType}</span>
                      </td>
                      <td className="px-4 py-3">
                        {delivery.httpStatus ? (
                          <span className={`font-mono text-sm ${
                            delivery.httpStatus >= 200 && delivery.httpStatus < 300 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {delivery.httpStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{delivery.attemptCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-600">
                          {formatDuration(delivery.createdAt, delivery.deliveredAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {new Date(delivery.createdAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <CellButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(delivery)}
                        >
                          <Eye className="w-4 h-4" />
                        </CellButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More */}
        {pagination.hasMore && (
          <div className="p-4 border-t border-gray-200 text-center">
            <CellButton
              variant="ghost"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </CellButton>
          </div>
        )}
      </CellCard>

      {/* Delivery Details Modal */}
      <DeliveryDetailsModal
        delivery={selectedDelivery}
        webhook={selectedDelivery ? (webhooks.find(w => w.id === selectedDelivery.webhookConfigId) || null) : null}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDelivery(null);
        }}
      />
    </PageLayout>
  );
}

// Delivery Details Modal Component
function DeliveryDetailsModal({ delivery, webhook, isOpen, onClose }: {
  delivery: WebhookDelivery | null;
  webhook: WebhookConfig | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!delivery || !webhook) return null;

  const payload = delivery.payload ? JSON.parse(delivery.payload) : null;

  return (
    <CellModal isOpen={isOpen} onClose={onClose} title="Delivery Details">
      <div className="space-y-6 max-w-4xl">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">Status</p>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-mono ${
                delivery.status === 'success' ? 'bg-green-100 text-green-800' :
                delivery.status === 'failed' ? 'bg-red-100 text-red-800' :
                delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {delivery.status}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">HTTP Status</p>
            <p className="text-sm text-gray-600">
              {delivery.httpStatus || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">Attempts</p>
            <p className="text-sm text-gray-600">{delivery.attemptCount}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">Event Type</p>
            <p className="text-sm text-gray-600">{delivery.eventType}</p>
          </div>
        </div>

        {/* Webhook Info */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Webhook Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Name</p>
              <p className="text-sm text-gray-600">{webhook.name}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Type</p>
              <p className="text-sm text-gray-600 capitalize">{webhook.type}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-bold text-gray-900 mb-1">URL</p>
              <p className="text-sm text-gray-600 font-mono break-all">{webhook.url}</p>
            </div>
          </div>
        </div>

        {/* Payload */}
        {payload && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Payload</h3>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 max-h-64 overflow-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Response */}
        {delivery.responseBody && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Response</h3>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 max-h-64 overflow-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                {delivery.responseBody}
              </pre>
            </div>
          </div>
        )}

        {/* Error */}
        {delivery.errorMessage && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Error Message</h3>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">{delivery.errorMessage}</p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Timestamps</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">Created</p>
              <p className="text-sm text-gray-600 font-mono">
                {new Date(delivery.createdAt).toLocaleString()}
              </p>
            </div>
            {delivery.deliveredAt && (
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Delivered</p>
                <p className="text-sm text-gray-600 font-mono">
                  {new Date(delivery.deliveredAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <CellButton variant="ghost" onClick={onClose}>
            Close
          </CellButton>
        </div>
      </div>
    </CellModal>
  );
}