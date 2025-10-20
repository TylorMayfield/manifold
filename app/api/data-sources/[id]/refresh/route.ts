import { NextRequest, NextResponse } from 'next/server';
import { DataSourceRefreshManager } from '../../../../../lib/services/DataSourceRefreshManager';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { createSnapshot = true, hasHeaders } = body;

    const refreshManager = DataSourceRefreshManager.getInstance();
    const result = await refreshManager.refreshDataSource(id, createSnapshot, {
      hasHeaders: hasHeaders ?? true
    });

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error || 'Refresh failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error refreshing data source:', error);
    return NextResponse.json(
      { error: 'Failed to refresh data source' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const refreshManager = DataSourceRefreshManager.getInstance();
    
    const [versions, freshness] = await Promise.all([
      refreshManager.getVersionHistory(id),
      refreshManager.getFreshnessStatus(id),
    ]);

    return NextResponse.json({
      versions,
      freshness,
    });
  } catch (error) {
    console.error('Error getting refresh info:', error);
    return NextResponse.json(
      { error: 'Failed to get refresh information' },
      { status: 500 }
    );
  }
}

