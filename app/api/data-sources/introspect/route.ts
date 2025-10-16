import { NextRequest, NextResponse } from 'next/server';
import { ProviderFactory } from '../../../../lib/providers/BaseProvider';
import { BaseDatabaseProvider } from '../../../../lib/providers/BaseDatabaseProvider';

export const dynamic = 'force-dynamic';

/**
 * POST /api/data-sources/introspect
 * Get schema information (tables, columns) from a database
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

    // Only works for database types
    if (!['mysql', 'mssql', 'odbc', 'postgres', 'sqlite'].includes(type)) {
      return NextResponse.json(
        { error: 'Schema introspection only available for database sources' },
        { status: 400 }
      );
    }

    console.log('[Introspect API] Getting schema for type:', type);

    try {
      // Create provider instance
      const provider = ProviderFactory.createProvider({
        id: 'introspect',
        name: 'Introspect Schema',
        type,
        connection: config,
        options: {},
      });

      // Check if it's a database provider
      if (!(provider instanceof BaseDatabaseProvider)) {
        return NextResponse.json(
          { error: 'Provider does not support schema introspection' },
          { status: 400 }
        );
      }

      // Get tables
      const tables = await provider.getTableList();

      console.log('[Introspect API] Found tables:', tables.length);

      return NextResponse.json({
        success: true,
        tables: tables.map(t => typeof t === 'string' ? t : t.name),
        count: tables.length,
      });
    } catch (providerError) {
      console.error('[Introspect API] Provider error:', providerError);
      return NextResponse.json({
        success: false,
        error: providerError instanceof Error ? providerError.message : 'Schema introspection failed',
        tables: [],
      });
    }
  } catch (error) {
    console.error('[Introspect API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to introspect schema',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

