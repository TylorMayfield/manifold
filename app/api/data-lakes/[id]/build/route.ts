import { NextRequest, NextResponse } from 'next/server';
import { DataLakeService } from '../../../../../lib/services/DataLakeService';

const dataLakeService = DataLakeService.getInstance();

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/data-lakes/[id]/build
 * Build/rebuild a data lake by consolidating data from sources
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const lakeId = params.id;
    const body = await request.json();
    const { force = false } = body;

    console.log('[Data Lake Build API] Starting build for lake:', lakeId);

    // Build the data lake (this will load data from all sources and consolidate)
    const buildResult = await dataLakeService.buildDataLake(lakeId, { force });

    console.log('[Data Lake Build API] Build completed:', {
      lakeId,
      recordsProcessed: buildResult.recordsProcessed,
      status: buildResult.status,
    });

    return NextResponse.json(buildResult);
  } catch (error) {
    console.error('[Data Lake Build API] Build failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to build data lake',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

