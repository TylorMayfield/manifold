import { NextRequest, NextResponse } from 'next/server';
import { crossFeatureWorkflows } from '../../../../lib/services/CrossFeatureWorkflows';

/**
 * POST /api/integration/compliance-scan
 * Run compliance scan across all data sources
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const { projectId, dataSourceIds } = body;

    if (!projectId || !dataSourceIds || !Array.isArray(dataSourceIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId and dataSourceIds' },
        { status: 400 }
      );
    }

    console.log(`[Integration] Running compliance scan for project: ${projectId}`);

    const report = await crossFeatureWorkflows.runComplianceScan(projectId, dataSourceIds);

    return NextResponse.json({
      success: true,
      report,
    });

  } catch (error) {
    console.error('[Integration] Compliance scan error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to run compliance scan',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

