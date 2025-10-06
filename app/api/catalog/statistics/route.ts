import { NextRequest, NextResponse } from 'next/server';
import { dataCatalog } from '../../../../lib/services/DataCatalog';

/**
 * GET /api/catalog/statistics
 * Get catalog statistics and analytics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const stats = dataCatalog.getStatistics();
    const popularAssets = dataCatalog.getPopularAssets(10);
    const recentlyAccessed = dataCatalog.getRecentlyAccessedAssets(10);
    const allTags = dataCatalog.getAllTags();
    const allClassifications = dataCatalog.getAllClassifications();

    return NextResponse.json({
      success: true,
      statistics: stats,
      popularAssets,
      recentlyAccessed,
      topTags: allTags.slice(0, 20),
      topClassifications: allClassifications.slice(0, 20),
    });

  } catch (error) {
    console.error('[Catalog] Statistics error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get catalog statistics',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

