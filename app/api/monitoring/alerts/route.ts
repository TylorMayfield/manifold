import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '../../../../lib/services/MonitoringService';

/**
 * GET /api/monitoring/alerts
 * Get all alerts
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const alerts = active === 'true'
      ? monitoring.getActiveAlerts()
      : monitoring.getAlertHistory();

    return NextResponse.json({
      success: true,
      alerts,
      total: alerts.length,
    });

  } catch (error) {
    console.error('[Monitoring] Get alerts error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get alerts',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/alerts
 * Create an alert rule
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const rule = monitoring.createAlertRule({
      name: body.name,
      description: body.description,
      metric: body.metric,
      operator: body.operator,
      threshold: body.threshold,
      duration: body.duration,
      severity: body.severity,
      channels: body.channels,
    });

    console.log(`[Monitoring] Created alert rule: ${rule.name}`);

    return NextResponse.json({
      success: true,
      rule,
    });

  } catch (error) {
    console.error('[Monitoring] Create alert rule error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create alert rule',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

