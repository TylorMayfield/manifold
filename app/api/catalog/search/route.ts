import { NextRequest, NextResponse } from 'next/server';
import { dataCatalog, SearchOptions } from '../../../../lib/services/DataCatalog';

/**
 * POST /api/catalog/search
 * Search the data catalog
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const options: SearchOptions = {
      query: body.query || '',
      assetTypes: body.assetTypes,
      tags: body.tags,
      classifications: body.classifications,
      owners: body.owners,
      sensitivity: body.sensitivity,
      limit: body.limit || 100,
      offset: body.offset || 0,
    };

    console.log(`[Catalog Search] Query: "${options.query}"`);

    const result = dataCatalog.search(options);

    console.log(`[Catalog Search] Found ${result.total} results`);

    // Convert Maps to objects for JSON serialization
    const facets = {
      assetTypes: Object.fromEntries(result.facets.assetTypes),
      tags: Object.fromEntries(result.facets.tags),
      classifications: Object.fromEntries(result.facets.classifications),
      owners: Object.fromEntries(result.facets.owners),
    };

    return NextResponse.json({
      success: true,
      entries: result.entries,
      total: result.total,
      facets,
    });

  } catch (error) {
    console.error('[Catalog Search] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Catalog search failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

