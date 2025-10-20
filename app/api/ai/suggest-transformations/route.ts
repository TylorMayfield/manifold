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
 * POST /api/ai/suggest-transformations
 * Suggest transformations for a data source
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { dataSourceId, projectId = 'default' } = body;

    console.log(`[AI] Suggesting transformations for: ${dataSourceId}`);

    if (!dataSourceId) {
      return NextResponse.json(
        { error: 'dataSourceId is required' },
        { status: 400 }
      );
    }

    const database = await ensureDb();

    // Load data source
    const dataSource: any = await database.getDataSource(dataSourceId);
    if (!dataSource) {
      return NextResponse.json(
        { error: 'Data source not found' },
        { status: 404 }
      );
    }

    // Get latest snapshot
    const snapshots = await database.getSnapshots(dataSourceId);
    if (snapshots.length === 0) {
      return NextResponse.json(
        { error: 'No data available for analysis' },
        { status: 404 }
      );
    }

    const latestSnapshot = snapshots[0]; // Already sorted by version descending

    // Get imported data for the snapshot
    const importedDataResult = await database.getImportedData({
      dataSourceId: dataSourceId,
      snapshotId: latestSnapshot.id as string,
      limit: 200, // Sample for transformation analysis
    });

    const data = importedDataResult.data;

    console.log(`[AI] Loaded ${data.length} records for analysis`);

    if (data.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'No data to analyze',
      });
    }

    // Analyze each column
    const columns = Object.keys(data[0]);
    const suggestions = [];

    for (const column of columns) {
      const suggestion = await aiAssistant.suggestTransformations(column, data);
      
      if (suggestion.transformations.length > 0) {
        suggestions.push(suggestion);
      }
    }

    console.log(`[AI] Generated ${suggestions.length} transformation suggestions`);

    return NextResponse.json({
      success: true,
      dataSource: {
        id: dataSource.id,
        name: dataSource.name,
      },
      suggestions,
      totalColumns: columns.length,
    });

  } catch (error) {
    console.error('[AI] Transformation suggestion error:', error);
    
    return NextResponse.json(
      {
        error: 'Transformation suggestion failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

