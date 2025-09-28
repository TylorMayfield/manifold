import { z } from 'zod';

export const WebhookEventSchema = z.enum([
  'start', 'success', 'failure', 'complete', 'progress', 'cancelled'
]);

export const WebhookTypeSchema = z.enum(['slack', 'discord', 'webhook']);

export const WebhookTemplateConfigSchema = z.object({
  title: z.string().optional(),
  color: z.string().optional(),
  iconEmoji: z.string().optional(),
  username: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  customFields: z.record(z.string(), z.string()).optional()
});

export const CreateWebhookSchema = z.object({
  name: z.string().min(1, 'Webhook name is required').max(100),
  type: WebhookTypeSchema,
  url: z.string().url('Must be a valid URL'),
  secret: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional().default({}),
  templateConfig: WebhookTemplateConfigSchema.optional().default({}),
  events: z.array(WebhookEventSchema).min(1, 'At least one event must be selected').default(['start', 'success', 'failure', 'complete']),
  projectId: z.string().optional(),
  pipelineId: z.string().optional(),
  isEnabled: z.boolean().optional().default(true)
});

export const UpdateWebhookSchema = CreateWebhookSchema.partial();

export const WebhookConfigSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  pipelineId: z.string().optional(),
  name: z.string(),
  type: WebhookTypeSchema,
  url: z.string().url(),
  secret: z.string().optional(),
  headers: z.record(z.string(), z.string()),
  templateConfig: WebhookTemplateConfigSchema,
  events: z.array(WebhookEventSchema),
  isEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const WebhookDeliverySchema = z.object({
  id: z.string(),
  webhookConfigId: z.string(),
  eventType: WebhookEventSchema,
  payload: z.string(), // JSON stringified
  status: z.enum(['pending', 'success', 'failed', 'retry']),
  httpStatus: z.number().optional(),
  responseBody: z.string().optional(),
  errorMessage: z.string().optional(),
  attemptCount: z.number().min(1),
  deliveredAt: z.string().optional(),
  createdAt: z.string()
});

// Query parameter schemas
export const GetWebhooksQuerySchema = z.object({
  projectId: z.string().optional(),
  pipelineId: z.string().optional(),
  type: WebhookTypeSchema.optional(),
  isEnabled: z.boolean().optional()
});

export const GetDeliveriesQuerySchema = z.object({
  webhookId: z.string().optional(),
  status: z.enum(['pending', 'success', 'failed', 'retry']).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0)
});

// Test webhook payload schema
export const TestWebhookSchema = z.object({
  name: z.string().optional().default('Test Webhook'),
  description: z.string().optional().default('This is a test message from Manifold ETL')
});

// Export types inferred from schemas
export type CreateWebhookRequest = z.infer<typeof CreateWebhookSchema>;
export type UpdateWebhookRequest = z.infer<typeof UpdateWebhookSchema>;
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;
export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;
export type GetWebhooksQuery = z.infer<typeof GetWebhooksQuerySchema>;
export type GetDeliveriesQuery = z.infer<typeof GetDeliveriesQuerySchema>;
export type TestWebhookRequest = z.infer<typeof TestWebhookSchema>;