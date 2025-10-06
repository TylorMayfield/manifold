import { NextRequest, NextResponse } from 'next/server';
import { dataLineage } from '../../../lib/services/DataLineage';

/**
 * GET /api/lineage
 * Get lineage for a specific node
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    const direction = searchParams.get('direction') as 'upstream' | 'downstream' | 'both';
    const depth = searchParams.get('depth');

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[Lineage] Getting lineage for node: ${nodeId}`);

    const lineage = dataLineage.getLineage({
      nodeId,
      direction: direction || 'both',
      depth: depth ? parseInt(depth) : 10,
    });

    return NextResponse.json({
      success: true,
      lineage,
    });

  } catch (error) {
    console.error('[Lineage] Get lineage error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get lineage',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lineage
 * Register a lineage node
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    dataLineage.registerNode({
      id: body.id,
      type: body.type,
      name: body.name,
      displayName: body.displayName,
      metadata: body.metadata,
    });

    console.log(`[Lineage] Registered node: ${body.name}`);

    return NextResponse.json({
      success: true,
      message: 'Node registered',
    });

  } catch (error) {
    console.error('[Lineage] Register node error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to register node',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

