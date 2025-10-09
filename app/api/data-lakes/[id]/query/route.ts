import { NextRequest, NextResponse } from 'next/server';
import { DataLakeService } from '../../../../../lib/services/DataLakeService';

const dataLakeService = DataLakeService.getInstance();

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/data-lakes/[id]/query
 * Query data from a built data lake
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const lakeId = params.id;
    const body = await request.json();
    
    const {
      filters = [],
      sort,
      limit = 1000,
      offset = 0,
      fields,
    } = body;

    console.log('[Data Lake Query API] Querying lake:', {
      lakeId,
      filters: filters.length,
      limit,
      offset,
    });

    // Query the data lake
    const result = await dataLakeService.queryDataLake(lakeId, {
      filters,
      sort,
      limit,
      offset,
      fields,
    });

    console.log('[Data Lake Query API] Query completed:', {
      lakeId,
      rowsReturned: result.rows.length,
      totalCount: result.totalCount,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Data Lake Query API] Query failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to query data lake',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

