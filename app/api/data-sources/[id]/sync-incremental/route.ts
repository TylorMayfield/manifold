import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../../lib/server/database/MongoDatabase';
import { cdcManager, CDCConfig, MergeStrategy } from '../../../../../lib/services/CDCManager';
import { v4 as uuidv4 } from 'uuid';

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

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/data-sources/[id]/sync-incremental
 * Perform incremental sync using CDC
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const dataSourceId = params.id;
    const body = await request.json();
    
    const {
      newData,
      cdcConfig,
      mergeStrategy,
    } = body;

    console.log(`[CDC] Starting incremental sync for data source: ${dataSourceId}`);

    if (!newData || !Array.isArray(newData)) {
      return NextResponse.json(
        { error: 'newData array is required' },
        { status: 400 }
      );
    }

    // Default CDC configuration
    const config: CDCConfig = {
      dataSourceId,
      trackingMode: cdcConfig?.trackingMode || 'hash',
      primaryKey: cdcConfig?.primaryKey || 'id',
      timestampColumn: cdcConfig?.timestampColumn,
      compareColumns: cdcConfig?.compareColumns,
      enableDeletes: cdcConfig?.enableDeletes ?? true,
      batchSize: cdcConfig?.batchSize || 1000,
    };

    // Default merge strategy
    const strategy: MergeStrategy = {
      onConflict: mergeStrategy?.onConflict || 'source-wins',
      softDelete: mergeStrategy?.softDelete ?? false,
      auditChanges: mergeStrategy?.auditChanges ?? true,
    };

    console.log(`[CDC] Config:`, config);
    console.log(`[CDC] Strategy:`, strategy);

    // Get database
    const database = await ensureDb();

    // Get existing data (latest snapshot)
    const snapshots = await database.getSnapshots(dataSourceId);
    
    let existingData: any[] = [];
    let previousVersion = 0;

    if (snapshots.length > 0) {
      const latestSnapshot: any = snapshots[0]; // Already sorted by version descending

      // Load existing data from snapshot
      const importedDataResult = await database.getImportedData({
        dataSourceId: dataSourceId,
        snapshotId: latestSnapshot.id as string,
        limit: 100000, // Large limit for CDC comparison
      });
      
      existingData = importedDataResult.data.map(d => d.data);
      previousVersion = latestSnapshot.version || 0;
      
      console.log(`[CDC] Loaded ${existingData.length} existing records from version ${previousVersion}`);
    } else {
      console.log(`[CDC] No existing data found, this will be a full import`);
    }

    // Perform incremental sync
    const syncResult = await cdcManager.incrementalSync(
      dataSourceId,
      newData,
      existingData,
      config
    );

    console.log(`[CDC] Change detection complete:`);
    console.log(`  - Inserts: ${syncResult.changeSet.inserts.length}`);
    console.log(`  - Updates: ${syncResult.changeSet.updates.length}`);
    console.log(`  - Deletes: ${syncResult.changeSet.deletes.length}`);
    console.log(`  - Unchanged: ${syncResult.changeSet.unchanged}`);

    // Merge changes
    const mergedData = await cdcManager.mergeChanges(
      existingData,
      syncResult.changeSet,
      config,
      strategy
    );

    console.log(`[CDC] Merged data: ${mergedData.length} total records`);

    // Create new snapshot with merged data
    const newVersion = previousVersion + 1;
    const snapshotId = uuidv4();

    await database.createSnapshot({
      id: snapshotId,
      projectId: 'default',
      dataSourceId,
      version: newVersion,
      data: mergedData,
      schema: null, // Would infer schema here
      metadata: {
        cdc: true,
        syncType: 'incremental',
        changeSet: {
          inserts: syncResult.changeSet.inserts.length,
          updates: syncResult.changeSet.updates.length,
          deletes: syncResult.changeSet.deletes.length,
          unchanged: syncResult.changeSet.unchanged,
        },
        watermark: syncResult.watermark,
        duration: syncResult.duration,
      },
      recordCount: mergedData.length,
      createdAt: new Date(),
    });

    console.log(`[CDC] Created snapshot version ${newVersion}`);

    // Calculate statistics
    const stats = cdcManager.calculateChangeStats(syncResult.changeSet);

    return NextResponse.json({
      success: true,
      syncResult: {
        dataSourceId,
        version: newVersion,
        previousVersion,
        timestamp: syncResult.syncTimestamp,
        duration: syncResult.duration,
        changeSet: {
          inserts: syncResult.changeSet.inserts.length,
          updates: syncResult.changeSet.updates.length,
          deletes: syncResult.changeSet.deletes.length,
          unchanged: syncResult.changeSet.unchanged,
          total: syncResult.changeSet.totalRecords,
        },
        statistics: stats,
        totalRecords: mergedData.length,
        watermark: syncResult.watermark,
      },
    });

  } catch (error) {
    console.error('[CDC] Incremental sync error:', error);
    
    return NextResponse.json(
      {
        error: 'Incremental sync failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/data-sources/[id]/sync-incremental
 * Get CDC watermark and sync status
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const dataSourceId = params.id;

    // Get watermark
    const watermark = cdcManager.getWatermark(dataSourceId);

    if (!watermark) {
      return NextResponse.json({
        dataSourceId,
        hasWatermark: false,
        message: 'No watermark found. Next sync will be a full load.',
      });
    }

    return NextResponse.json({
      dataSourceId,
      hasWatermark: true,
      watermark,
    });

  } catch (error) {
    console.error('[CDC] Get watermark error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get watermark',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/data-sources/[id]/sync-incremental
 * Reset CDC watermark (forces full reload on next sync)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const dataSourceId = params.id;

    cdcManager.resetWatermark(dataSourceId);

    return NextResponse.json({
      success: true,
      message: 'Watermark reset successfully. Next sync will be a full load.',
    });

  } catch (error) {
    console.error('[CDC] Reset watermark error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to reset watermark',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

