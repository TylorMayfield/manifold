import { NextRequest, NextResponse } from 'next/server';
import { SeparatedDatabaseManager } from '../../../lib/database/SeparatedDatabaseManager';

export const dynamic = 'force-dynamic';

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
    const { projectId = 'default', dataSourceId, data, schema } = body;
    
    const separatedDb = SeparatedDatabaseManager.getInstance();
    
    // Import data creates a new version/snapshot
    const result = await separatedDb.importData(projectId, dataSourceId, data, schema);
    
    if (result.success) {
      return NextResponse.json({ 
        id: result.versionId,
        message: result.message,
        recordsImported: result.recordsImported
      }, { status: 201 });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
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
