import { NextRequest, NextResponse } from 'next/server';
import { SeparatedDatabaseManager } from '../../../lib/database/SeparatedDatabaseManager';
import { MongoDatabase } from '../../../lib/server/database/MongoDatabase';
import { integrationHub } from '../../../lib/services/IntegrationHub';

export const dynamic = 'force-dynamic';

let mongoDb: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureMongoDb() {
  if (mongoDb) return mongoDb;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[Snapshots API] Initializing MongoDB...');
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    mongoDb = instance;
    console.log('[Snapshots API] MongoDB initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    const dataSourceId = searchParams.get('dataSourceId');
    
    const separatedDb = SeparatedDatabaseManager.getInstance();
    
    // Get all data sources for the project
    const dataSources = await separatedDb.getDataSources(projectId);
    
    // Filter to specific data source if requested
    const sourcesToCheck = dataSourceId 
      ? dataSources.filter(ds => ds.id === dataSourceId)
      : dataSources;
    
    // Fetch versions for each data source and format as snapshots
    const snapshots = [];
    
    for (const ds of sourcesToCheck) {
      try {
        const versions = await separatedDb.getDataVersions(projectId, ds.id || ds.name);
        
        // Convert each version to snapshot format
        for (const version of versions) {
          const versionData = version as any; // Type assertion for flexibility
          snapshots.push({
            id: versionData.id || versionData.version_id,
            dataSourceId: ds.id || ds.name,
            version: versionData.version || 1,
            recordCount: versionData.recordCount || versionData.record_count || 0,
            schema: versionData.schema ? (typeof versionData.schema === 'string' ? JSON.parse(versionData.schema) : versionData.schema) : null,
            createdAt: versionData.createdAt || versionData.created_at || new Date(),
            metadata: {
              importType: versionData.importType || versionData.import_type || 'manual',
              status: versionData.status || 'completed',
            }
          });
        }
      } catch (error) {
        console.warn(`Failed to load versions for data source ${ds.id || ds.name}:`, error);
      }
    }
    
    // Sort by creation date (newest first)
    snapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId = 'default', dataSourceId, data, schema, metadata } = body;
    
    console.log('[Snapshots API POST] Received request:', { projectId, dataSourceId, dataLength: data?.length });
    
    if (!dataSourceId) {
      return NextResponse.json(
        { error: 'dataSourceId is required' },
        { status: 400 }
      );
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'data must be a non-empty array' },
        { status: 400 }
      );
    }
    
    const database = await ensureMongoDb();
    
    console.log('[Snapshots API POST] About to call importData with:', {
      projectId,
      dataSourceId,
      dataLength: data.length,
      schemaColumns: schema?.columns?.length
    });
    
    // Import data creates a new snapshot/version and stores the data
    const result = await database.importData({
      projectId,
      dataSourceId,
      data,
      schema,
      metadata: {
        ...metadata,
        importedAt: new Date().toISOString()
      }
    });
    
    console.log('[Snapshots API POST] Data imported successfully:', {
      snapshotId: result.snapshotId,
      version: result.version,
      recordCount: result.recordCount
    });

    // Integration Hub: Onboard data source with auto-cataloging, PII detection, etc.
    try {
      const dataSource = await database.getDataSource(dataSourceId);
      if (dataSource && data.length > 0) {
        console.log('[Snapshots API] Triggering Integration Hub onboarding...');
        await integrationHub.onboardDataSource(dataSource, data);
        console.log('[Snapshots API] Integration Hub onboarding complete');
      }
    } catch (hubError) {
      // Don't fail the snapshot creation if Integration Hub fails
      console.warn('[Snapshots API] Integration Hub onboarding failed (non-critical):', hubError);
    }
    
    return NextResponse.json({ 
      id: result.snapshotId,
      version: result.version,
      recordCount: result.recordCount,
      message: `Successfully imported ${result.recordCount} records`
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create snapshot',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const snapshotId = searchParams.get('snapshotId');
    
    if (!snapshotId) {
      return NextResponse.json(
        { error: 'snapshotId is required' },
        { status: 400 }
      );
    }
    
    const { MongoDatabase } = await import('../../../lib/server/database/MongoDatabase');
    const db = MongoDatabase.getInstance();
    await db.initialize();
    
    // Delete the snapshot from MongoDB
    const success = await db.deleteSnapshot(snapshotId);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to delete snapshot' },
      { status: 500 }
    );
  }
}
