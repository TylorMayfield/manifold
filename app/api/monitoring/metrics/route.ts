import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '../../../../lib/services/MonitoringService';

/**
 * GET /api/monitoring/metrics
 * Get all metrics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('name');
    const limit = searchParams.get('limit');

    if (metricName) {
      // Get specific metric
      const metrics = monitoring.getMetrics(
        metricName,
        limit ? parseInt(limit) : undefined
      );

      return NextResponse.json({
        success: true,
        metrics,
        total: metrics.length,
      });
    } else {
      // Get all metric names
      const names = monitoring.getMetricNames();

      return NextResponse.json({
        success: true,
        metricNames: names,
        total: names.length,
      });
    }

  } catch (error) {
    console.error('[Monitoring] Get metrics error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get metrics',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/metrics
 * Record a custom metric
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    monitoring.recordMetric({
      name: body.name,
      type: body.type || 'gauge',
      value: body.value,
      labels: body.labels,
      unit: body.unit,
    });

    return NextResponse.json({
      success: true,
      message: 'Metric recorded',
    });

  } catch (error) {
    console.error('[Monitoring] Record metric error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to record metric',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

