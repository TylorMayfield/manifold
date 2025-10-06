import { NextRequest, NextResponse } from 'next/server';
import { dataCatalog, CatalogEntry } from '../../../../lib/services/DataCatalog';

/**
 * POST /api/catalog/assets
 * Register a new asset in the catalog
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const entry = dataCatalog.registerAsset(body);

    return NextResponse.json({
      success: true,
      entry,
    });

  } catch (error) {
    console.error('[Catalog] Asset registration error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to register asset',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/catalog/assets
 * Get all assets or filter by type
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('assetType') as any;

    let entries: CatalogEntry[];

    if (assetType) {
      entries = dataCatalog.getAssetsByType(assetType);
    } else {
      entries = dataCatalog.search({ query: '', limit: 1000 }).entries;
    }

    return NextResponse.json({
      success: true,
      entries,
      total: entries.length,
    });

  } catch (error) {
    console.error('[Catalog] Get assets error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get assets',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

