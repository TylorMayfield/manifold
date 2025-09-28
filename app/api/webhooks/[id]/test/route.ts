import { NextRequest, NextResponse } from 'next/server';
import { 
  TestWebhookSchema,
  type TestWebhookRequest,
  type WebhookConfig 
} from '../../../../../lib/validation/webhook';
import { webhookService, createTestPayload } from '../../../../../lib/webhooks';

// Mock database function - replace with actual database call
async function getWebhookById(id: string): Promise<WebhookConfig | null> {
  // This would query the webhook_configs table
  console.log('Getting webhook for test:', id);
  
  // Mock webhook for testing
  const webhook: WebhookConfig = {
    id,
    name: 'Test Webhook',
    type: 'webhook',
    url: 'https://httpbin.org/post', // Test endpoint
    headers: {},
    templateConfig: {},
    events: ['start', 'success', 'failure', 'complete'],
    isEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };
  
  return webhook;
}

// POST /api/webhooks/[id]/test - Test webhook configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const validatedData = TestWebhookSchema.parse(body);
    
    // Get webhook configuration
    const webhook = await getWebhookById(id);
    if (!webhook) {
      return NextResponse.json({
        success: false,
        error: 'Webhook not found'
      }, { status: 404 });
    }
    
    if (!webhook.isEnabled) {
      return NextResponse.json({
        success: false,
        error: 'Cannot test disabled webhook'
      }, { status: 400 });
    }
    
    // Create test payload
    const baseTestPayload = createTestPayload(validatedData.name);
    const testPayload = {
      ...baseTestPayload,
      description: validatedData.description || baseTestPayload.description,
      projectId: webhook.projectId || 'test-project',
      pipelineId: webhook.pipelineId || 'test-pipeline'
    };
    
    // Send test webhook
    const result = await webhookService.send(webhook as any, testPayload);
    
    return NextResponse.json({
      success: true,
      data: {
        webhookId: webhook.id,
        webhookName: webhook.name,
        webhookType: webhook.type,
        testPayload,
        deliveryResult: {
          success: result.success,
          httpStatus: result.httpStatus,
          error: result.error,
          responseBody: result.responseBody ? 
            (result.responseBody.length > 500 ? 
              result.responseBody.substring(0, 500) + '...' : 
              result.responseBody) : undefined
        }
      }
    });
    
  } catch (error) {
    console.error(`POST /api/webhooks/${id}/test error:`, error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid test request',
        details: error
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test webhook'
    }, { status: 500 });
  }
}