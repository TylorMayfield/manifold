import { NextRequest, NextResponse } from 'next/server';
import { dataLineage } from '../../../../lib/services/DataLineage';

/**
 * POST /api/lineage/track
 * Track data flow between nodes
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const edge = dataLineage.trackDataFlow({
      sourceNodeId: body.sourceNodeId,
      targetNodeId: body.targetNodeId,
      transformationType: body.transformationType,
      recordCount: body.recordCount,
    });

    console.log(`[Lineage] Tracked data flow: ${body.sourceNodeId} → ${body.targetNodeId}`);

    return NextResponse.json({
      success: true,
      edge,
    });

  } catch (error) {
    console.error('[Lineage] Track flow error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to track data flow',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

