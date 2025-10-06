import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '../../../../../../lib/services/MonitoringService';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/monitoring/alerts/[id]/acknowledge
 * Acknowledge an alert
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const alertId = params.id;
    const body = await request.json();

    const alert = monitoring.acknowledgeAlert(alertId, body.userId);

    if (alert) {
      return NextResponse.json({
        success: true,
        alert,
      });
    } else {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('[Monitoring] Acknowledge alert error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to acknowledge alert',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

