import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../lib/server/database/MongoDatabase';
import { snapshotDiffer, DiffOptions } from '../../../../lib/services/SnapshotDiffer';

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
 * POST /api/snapshots/compare
 * Compare two snapshots and return detailed diff
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      fromSnapshotId,
      toSnapshotId,
      comparisonKey = 'id',
      options = {},
    } = body;

    console.log(`[Snapshot Compare] Comparing snapshots: ${fromSnapshotId} vs ${toSnapshotId}`);

    if (!fromSnapshotId || !toSnapshotId) {
      return NextResponse.json(
        { error: 'Both fromSnapshotId and toSnapshotId are required' },
        { status: 400 }
      );
    }

    // Get database
    const database = await ensureDb();

    // We need to get dataSourceId from one of the snapshots
    // For now, we'll get all data sources and find the one that has these snapshots
    const dataSources = await database.getDataSources();
    let dataSourceId: string | null = null;
    
    for (const ds of dataSources) {
      const dsId = (ds as any).id as string;
      const snapshots = await database.getSnapshots(dsId);
      if (snapshots.some((s: any) => s.id === fromSnapshotId || s.id === toSnapshotId)) {
        dataSourceId = dsId;
        break;
      }
    }

    if (!dataSourceId) {
      return NextResponse.json(
        { error: 'Could not find data source for the specified snapshots' },
        { status: 404 }
      );
    }

    // Load both snapshots
    const allSnapshots = await database.getSnapshots(dataSourceId);
    
    const fromSnapshot = allSnapshots.find((s: any) => s.id === fromSnapshotId);
    const toSnapshot = allSnapshots.find((s: any) => s.id === toSnapshotId);

    if (!fromSnapshot) {
      return NextResponse.json(
        { error: `From snapshot not found: ${fromSnapshotId}` },
        { status: 404 }
      );
    }

    if (!toSnapshot) {
      return NextResponse.json(
        { error: `To snapshot not found: ${toSnapshotId}` },
        { status: 404 }
      );
    }

    // Load data for both snapshots
    const [fromDataResult, toDataResult] = await Promise.all([
      database.getImportedData({
        dataSourceId: dataSourceId,
        snapshotId: fromSnapshotId,
        limit: 100000,
      }),
      database.getImportedData({
        dataSourceId: dataSourceId,
        snapshotId: toSnapshotId,
        limit: 100000,
      }),
    ]);

    const fromData = fromDataResult.data;
    const toData = toDataResult.data;

    console.log(`[Snapshot Compare] Loaded data: ${fromData.length} vs ${toData.length} records`);

    // Perform comparison
    const diffOptions: DiffOptions = {
      ignoreFields: options.ignoreFields || ['_id', '_created_at', '_updated_at'],
      caseSensitive: options.caseSensitive ?? true,
      trimStrings: options.trimStrings ?? true,
      deepCompare: options.deepCompare ?? false,
      includeUnchanged: options.includeUnchanged ?? false,
      maxRecords: options.maxRecords || 1000,
    };

    const comparison = await snapshotDiffer.compareSnapshots(
      { id: fromSnapshotId, version: (fromSnapshot as any).version || 1, data: fromData },
      { id: toSnapshotId, version: (toSnapshot as any).version || 2, data: toData },
      comparisonKey,
      diffOptions
    );

    console.log(`[Snapshot Compare] Comparison complete:`, {
      added: comparison.summary.added,
      removed: comparison.summary.removed,
      modified: comparison.summary.modified,
      unchanged: comparison.summary.unchanged,
    });

    // Convert Map to object for JSON serialization
    const result = {
      ...comparison,
      statistics: {
        ...comparison.statistics,
        fieldsChanged: Object.fromEntries(comparison.statistics.fieldsChanged),
      },
    };

    return NextResponse.json({
      success: true,
      comparison: result,
    });

  } catch (error) {
    console.error('[Snapshot Compare] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Snapshot comparison failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

