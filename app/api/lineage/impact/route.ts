import { NextRequest, NextResponse } from 'next/server';
import { dataLineage } from '../../../../lib/services/DataLineage';

/**
 * GET /api/lineage/impact
 * Analyze impact of changes to a node
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');

    if (!nodeId) {
      return NextResponse.json(
        { error: 'nodeId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[Lineage] Analyzing impact for node: ${nodeId}`);

    const impact = dataLineage.analyzeImpact(nodeId);

    return NextResponse.json({
      success: true,
      impact,
    });

  } catch (error) {
    console.error('[Lineage] Impact analysis error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to analyze impact',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

