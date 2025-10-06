import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../lib/server/database/MongoDatabase';
import { aiAssistant } from '../../../../lib/services/AIAssistant';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    return instance;
  })();
  
  return initPromise;
}

/**
 * POST /api/ai/detect-relationships
 * Auto-detect relationships between data sources
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { dataSourceIds, projectId = 'default' } = body;

    console.log(`[AI] Detecting relationships for ${dataSourceIds.length} data sources`);

    if (!dataSourceIds || !Array.isArray(dataSourceIds) || dataSourceIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 data source IDs required' },
        { status: 400 }
      );
    }

    const database = await ensureDb();

    // Load data for each source
    const tables: Array<{ name: string; data: any[] }> = [];

    for (const sourceId of dataSourceIds) {
      const dataSource: any = await database.getDataSource(sourceId);
      if (!dataSource) {
        console.warn(`[AI] Data source not found: ${sourceId}`);
        continue;
      }

      // Get latest snapshot
      const snapshots = await database.getSnapshots(sourceId);
      if (snapshots.length === 0) {
        console.warn(`[AI] No snapshots found for: ${sourceId}`);
        continue;
      }

      const latestSnapshot = snapshots[0]; // Already sorted by version descending

      // Get imported data for the snapshot
      const importedDataResult = await database.getImportedData({
        dataSourceId: sourceId,
        snapshotId: latestSnapshot.id as string,
        limit: 1000, // Sample for performance
      });

      const data = importedDataResult.data.map(d => d.data);

      tables.push({
        name: dataSource.name,
        data: data,
      });

      console.log(`[AI] Loaded ${data.length} records from ${dataSource.name}`);
    }

    // Detect relationships
    const relationships = await aiAssistant.detectRelationships(tables);

    console.log(`[AI] Detected ${relationships.length} potential relationships`);

    return NextResponse.json({
      success: true,
      relationships,
      tablesAnalyzed: tables.length,
    });

  } catch (error) {
    console.error('[AI] Relationship detection error:', error);
    
    return NextResponse.json(
      {
        error: 'Relationship detection failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

