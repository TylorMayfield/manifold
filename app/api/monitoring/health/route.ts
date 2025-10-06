import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '../../../../lib/services/MonitoringService';

/**
 * GET /api/monitoring/health
 * Get system health status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const health = await monitoring.getSystemHealth();

    return NextResponse.json({
      success: true,
      health,
    });

  } catch (error) {
    console.error('[Monitoring] Health check error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get system health',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

