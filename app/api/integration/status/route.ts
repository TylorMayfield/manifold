import { NextRequest, NextResponse } from 'next/server';
import { integrationHub } from '../../../../lib/services/IntegrationHub';

/**
 * GET /api/integration/status
 * Get integration status across all features
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const status = integrationHub.getIntegrationStatus();

    return NextResponse.json({
      success: true,
      status,
      message: 'Integration Hub operational',
    });

  } catch (error) {
    console.error('[Integration] Status error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get integration status',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

