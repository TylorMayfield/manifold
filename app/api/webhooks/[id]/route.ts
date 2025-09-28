import { NextRequest, NextResponse } from 'next/server';
import { 
  UpdateWebhookSchema,
  type UpdateWebhookRequest,
  type WebhookConfig 
} from '../../../../lib/validation/webhook';
import { webhookService } from '../../../../lib/webhooks';

// Mock database functions - replace with actual database calls
async function getWebhookById(id: string): Promise<WebhookConfig | null> {
  // This would query the webhook_configs table
  console.log('Getting webhook:', id);
  return null; // Mock: webhook not found
}

async function updateWebhook(id: string, data: UpdateWebhookRequest): Promise<WebhookConfig | null> {
  // This would update the webhook_configs table
  console.log('Updating webhook:', id, data);
  
  // Mock updated webhook
  const webhook: WebhookConfig = {
    id,
    name: data.name || 'Mock Webhook',
    type: data.type || 'webhook',
    url: data.url || 'https://example.com/webhook',
    headers: data.headers || {},
    templateConfig: data.templateConfig || {},
    events: data.events || ['start', 'success', 'failure', 'complete'],
    isEnabled: data.isEnabled ?? true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  };
  
  return webhook;
}

async function deleteWebhook(id: string): Promise<boolean> {
  // This would delete from webhook_configs table
  console.log('Deleting webhook:', id);
  return true; // Mock: deletion successful
}

// GET /api/webhooks/[id] - Get webhook by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const webhook = await getWebhookById(id);
    
    if (!webhook) {
      return NextResponse.json({
        success: false,
        error: 'Webhook not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: webhook
    });
    
  } catch (error) {
    console.error(`GET /api/webhooks/${id} error:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch webhook'
    }, { status: 500 });
  }
}

// PUT /api/webhooks/[id] - Update webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const validatedData = UpdateWebhookSchema.parse(body);
    
    // Check if webhook exists
    const existingWebhook = await getWebhookById(id);
    if (!existingWebhook) {
      return NextResponse.json({
        success: false,
        error: 'Webhook not found'
      }, { status: 404 });
    }
    
    // Validate webhook configuration if URL or type is being updated
    if (validatedData.url || validatedData.type) {
      const configToValidate = {
        name: validatedData.name || existingWebhook.name,
        type: validatedData.type || existingWebhook.type,
        url: validatedData.url || existingWebhook.url
      };
      const validation = await webhookService.validateConfig(configToValidate);
      if (!validation.valid) {
        return NextResponse.json({
          success: false,
          error: 'Invalid webhook configuration',
          details: validation.errors
        }, { status: 400 });
      }
    }
    
    const updatedWebhook = await updateWebhook(id, validatedData);
    
    if (!updatedWebhook) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update webhook'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: updatedWebhook
    });
    
  } catch (error) {
    console.error(`PUT /api/webhooks/${id} error:`, error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        details: error
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update webhook'
    }, { status: 500 });
  }
}

// DELETE /api/webhooks/[id] - Delete webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check if webhook exists
    const existingWebhook = await getWebhookById(id);
    if (!existingWebhook) {
      return NextResponse.json({
        success: false,
        error: 'Webhook not found'
      }, { status: 404 });
    }
    
    const deleted = await deleteWebhook(id);
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete webhook'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
    
  } catch (error) {
    console.error(`DELETE /api/webhooks/${id} error:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete webhook'
    }, { status: 500 });
  }
}