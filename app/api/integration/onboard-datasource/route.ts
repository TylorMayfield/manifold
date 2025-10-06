import { NextRequest, NextResponse } from 'next/server';
import { crossFeatureWorkflows } from '../../../../lib/services/CrossFeatureWorkflows';

/**
 * POST /api/integration/onboard-datasource
 * Complete data source onboarding with all integrated features
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const { dataSource, data, enableMasking, enableCDC, enableCatalog } = body;

    if (!dataSource || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: dataSource and data' },
        { status: 400 }
      );
    }

    console.log(`[Integration] Onboarding data source: ${dataSource.name}`);

    const result = await crossFeatureWorkflows.onboardNewDataSource({
      dataSource,
      data,
      enableMasking: enableMasking ?? true,
      enableCDC: enableCDC ?? true,
      enableCatalog: enableCatalog ?? true,
    });

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('[Integration] Onboard data source error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to onboard data source',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

