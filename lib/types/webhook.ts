// Webhook Configuration Types
export interface WebhookConfig {
  id: string;
  projectId?: string;
  pipelineId?: string;
  name: string;
  type: 'slack' | 'discord' | 'webhook';
  url: string;
  secret?: string;
  headers: Record<string, string>;
  templateConfig: WebhookTemplateConfig;
  events: WebhookEvent[];
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WebhookEvent = 'start' | 'success' | 'failure' | 'complete' | 'progress' | 'cancelled';

export interface WebhookTemplateConfig {
  title?: string;
  color?: string;
  iconEmoji?: string;
  username?: string;
  avatarUrl?: string;
  customFields?: Record<string, string>;
}

// Event Payload Types
export interface BaseWebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  projectId?: string;
  pipelineId?: string;
  jobId?: string;
  executionId?: string;
  dataSourceId?: string;
}

export interface StartWebhookPayload extends BaseWebhookPayload {
  event: 'start';
  name: string;
  description?: string;
  estimatedDuration?: number;
}

export interface ProgressWebhookPayload extends BaseWebhookPayload {
  event: 'progress';
  name: string;
  progressPercent: number;
  currentStep?: string;
  message?: string;
}

export interface SuccessWebhookPayload extends BaseWebhookPayload {
  event: 'success';
  name: string;
  duration: number;
  recordsProcessed?: number;
  stats?: Record<string, any>;
}

export interface FailureWebhookPayload extends BaseWebhookPayload {
  event: 'failure';
  name: string;
  duration?: number;
  error: {
    code?: string;
    message: string;
    stack?: string;
  };
}

export interface CompleteWebhookPayload extends BaseWebhookPayload {
  event: 'complete';
  name: string;
  duration: number;
  status: 'success' | 'partial' | 'failed';
  summary: {
    recordsProcessed?: number;
    errors?: number;
    warnings?: number;
    stats?: Record<string, any>;
  };
}

export type WebhookPayload = 
  | StartWebhookPayload 
  | ProgressWebhookPayload 
  | SuccessWebhookPayload 
  | FailureWebhookPayload 
  | CompleteWebhookPayload;

// Delivery Tracking Types
export interface WebhookDelivery {
  id: string;
  webhookConfigId: string;
  eventType: WebhookEvent;
  payload: string; // JSON stringified WebhookPayload
  status: 'pending' | 'success' | 'failed' | 'retry';
  httpStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  attemptCount: number;
  deliveredAt?: string;
  createdAt: string;
}

// Adapter Interface
export interface WebhookAdapter {
  readonly type: string;
  send(config: WebhookConfig, payload: WebhookPayload): Promise<WebhookDeliveryResult>;
  validateConfig(config: Partial<WebhookConfig>): Promise<ValidationResult>;
}

export interface WebhookDeliveryResult {
  success: boolean;
  httpStatus?: number;
  responseBody?: string;
  error?: string;
  retryable?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Service Options
export interface WebhookServiceOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  enableSignatures?: boolean;
  defaultHeaders?: Record<string, string>;
}

// Template Context for rendering messages
export interface WebhookTemplateContext {
  event: WebhookEvent;
  timestamp: string;
  formattedTimestamp: string;
  projectName?: string;
  pipelineName?: string;
  jobName?: string;
  dataSourceName?: string;
  duration?: string;
  durationMs?: number;
  status?: string;
  error?: {
    message: string;
    code?: string;
  };
  stats?: Record<string, any>;
  progress?: {
    percent: number;
    currentStep?: string;
    message?: string;
  };
  recordsProcessed?: number;
  // Additional custom fields from templateConfig
  [key: string]: any;
}