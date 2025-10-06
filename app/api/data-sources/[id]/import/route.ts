import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../../lib/server/database/MongoDatabase';

// Singleton pattern for database initialization
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (!initPromise) {
    initPromise = (async () => {
      const instance = MongoDatabase.getInstance();
      await instance.initialize();
      return instance;
    })();
  }
  
  return initPromise;
}

/**
 * POST /api/data-sources/[id]/import
 * Import data for a data source with versioning
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const database = await ensureDb();
    const resolvedParams = await params;
    const dataSourceId = resolvedParams.id;

    // Get data source to verify it exists
    const dataSource: any = await database.getDataSource(dataSourceId);
    
    if (!dataSource) {
      return NextResponse.json(
        { error: 'Data source not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { data, schema, metadata } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of records.' },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data provided to import' },
        { status: 400 }
      );
    }

    // Import the data
    const result = await database.importData({
      projectId: dataSource.projectId || 'default',
      dataSourceId,
      data,
      schema,
      metadata: {
        ...metadata,
        dataSourceType: dataSource.type,
        importedAt: new Date().toISOString()
      }
    });

    // Update data source lastSyncAt
    await database.updateDataSource(dataSourceId, {
      lastSyncAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.recordCount} records`,
      snapshotId: result.snapshotId,
      version: result.version,
      recordCount: result.recordCount
    });

  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/data-sources/[id]/import
 * Get import history (versions) for a data source
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const database = await ensureDb();
    const resolvedParams = await params;
    const dataSourceId = resolvedParams.id;

    // Get data source to verify it exists
    const dataSource = await database.getDataSource(dataSourceId);
    
    if (!dataSource) {
      return NextResponse.json(
        { error: 'Data source not found' },
        { status: 404 }
      );
    }

    // Get all versions
    const versions = await database.getDataVersions(dataSourceId);

    return NextResponse.json({
      dataSourceId,
      versions
    });

  } catch (error) {
    console.error('Error fetching import history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch import history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

