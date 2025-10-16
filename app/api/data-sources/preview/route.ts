import { NextRequest, NextResponse } from 'next/server';
import { ProviderFactory } from '../../../../lib/providers/BaseProvider';

export const dynamic = 'force-dynamic';

/**
 * POST /api/data-sources/preview
 * Get preview data (first N rows) from a data source
 */
export async function POST(request: NextRequest) {
  try {
    const { type, config } = await request.json();

    if (!type) {
      return NextResponse.json(
        { error: 'Data source type is required' },
        { status: 400 }
      );
    }

    console.log('[Preview API] Getting preview for type:', type);

    try {
      // Create provider instance
      const provider = ProviderFactory.createProvider({
        id: 'preview',
        name: 'Preview Data',
        type,
        connection: config,
        options: {},
      });

      // Execute with limit
      const context = {
        executionId: 'preview',
        projectId: 'preview',
        dataSourceId: 'preview',
      };

      const result = await provider.run(context);

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error?.message || 'Preview failed',
          data: [],
        });
      }

      // Limit data to first 10 rows for preview
      const previewData = result.metadata?.data && Array.isArray(result.metadata.data) 
        ? result.metadata.data.slice(0, 10)
        : [];

      console.log('[Preview API] Preview data rows:', previewData.length);

      return NextResponse.json({
        success: true,
        data: previewData,
        totalRows: result.recordsProcessed || previewData.length,
        columns: previewData.length > 0 ? Object.keys(previewData[0]) : [],
      });
    } catch (providerError) {
      console.error('[Preview API] Provider error:', providerError);
      return NextResponse.json({
        success: false,
        error: providerError instanceof Error ? providerError.message : 'Preview failed',
        data: [],
      });
    }
  } catch (error) {
    console.error('[Preview API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to preview data',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

