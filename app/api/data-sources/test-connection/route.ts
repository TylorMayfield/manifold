import { NextRequest, NextResponse } from 'next/server';
import { ProviderFactory } from '../../../../lib/providers/BaseProvider';

export const dynamic = 'force-dynamic';

/**
 * POST /api/data-sources/test-connection
 * Test connection to a data source before creation
 */
export async function POST(request: NextRequest) {
  try {
    const { type, config } = await request.json();

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Data source type is required' },
        { status: 400 }
      );
    }

    console.log('[TestConnection API] Testing connection for type:', type);

    try {
      // Create provider instance
      const provider = ProviderFactory.createProvider({
        id: 'test',
        name: 'Test Connection',
        type,
        connection: config,
        options: {},
      });

      // Test connection
      const result = await provider.testConnection();

      console.log('[TestConnection API] Test result:', result);

      return NextResponse.json({
        success: result.success,
        message: result.message || (result.success ? 'Connection successful' : 'Connection failed'),
        latency: result.latency,
        version: result.version,
      });
    } catch (providerError) {
      console.error('[TestConnection API] Provider error:', providerError);
      return NextResponse.json({
        success: false,
        message: providerError instanceof Error ? providerError.message : 'Connection test failed',
      });
    }
  } catch (error) {
    console.error('[TestConnection API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test connection',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

