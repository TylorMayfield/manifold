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
 * POST /api/ai/auto-map-columns
 * Auto-map columns between source and target datasets
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { 
      sourceDataSourceId, 
      targetSchema,
      projectId = 'default' 
    } = body;

    console.log(`[AI] Auto-mapping columns from: ${sourceDataSourceId}`);

    if (!sourceDataSourceId || !targetSchema) {
      return NextResponse.json(
        { error: 'sourceDataSourceId and targetSchema are required' },
        { status: 400 }
      );
    }

    const database = await ensureDb();

    // Load source data
    const dataSource: any = await database.getDataSource(sourceDataSourceId);
    if (!dataSource) {
      return NextResponse.json(
        { error: 'Source data source not found' },
        { status: 404 }
      );
    }

    const snapshots = await database.getSnapshots(sourceDataSourceId);
    if (snapshots.length === 0) {
      return NextResponse.json(
        { error: 'No data available for source' },
        { status: 404 }
      );
    }

    const latestSnapshot = snapshots[0]; // Already sorted by version descending

    // Get imported data for the snapshot
    const importedDataResult = await database.getImportedData({
      dataSourceId: sourceDataSourceId,
      snapshotId: latestSnapshot.id as string,
      limit: 100, // Sample size for auto-mapping
    });

    const sourceData = importedDataResult.data.map(d => d.data);

    if (sourceData.length === 0) {
      return NextResponse.json(
        { error: 'No data in source' },
        { status: 404 }
      );
    }

    const sourceColumns = Object.keys(sourceData[0]);
    const targetColumns = Array.isArray(targetSchema) ? targetSchema : Object.keys(targetSchema);

    console.log(`[AI] Mapping ${sourceColumns.length} source columns to ${targetColumns.length} target columns`);

    // Prepare column data
    const sourceColumnsWithData = sourceColumns.map(col => ({
      name: col,
      data: sourceData.map(r => r[col]),
    }));

    // Auto-map columns
    const mappings = await aiAssistant.autoMapColumns(sourceColumnsWithData, targetColumns);

    // Calculate mapping stats
    const highConfidence = mappings.filter(m => m.confidence > 0.8).length;
    const mediumConfidence = mappings.filter(m => m.confidence >= 0.6 && m.confidence <= 0.8).length;
    const lowConfidence = mappings.filter(m => m.confidence < 0.6).length;

    console.log(`[AI] Generated ${mappings.length} column mappings`);

    return NextResponse.json({
      success: true,
      mappings,
      statistics: {
        totalMappings: mappings.length,
        highConfidence,
        mediumConfidence,
        lowConfidence,
        unmappedSource: sourceColumns.length - mappings.length,
        unmappedTarget: targetColumns.length - mappings.length,
      },
    });

  } catch (error) {
    console.error('[AI] Column mapping error:', error);
    
    return NextResponse.json(
      {
        error: 'Column mapping failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

