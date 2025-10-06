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
 * POST /api/ai/detect-quality-issues
 * Detect data quality issues in a data source
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { dataSourceId, projectId = 'default' } = body;

    console.log(`[AI] Detecting quality issues for: ${dataSourceId}`);

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
      limit: 500, // Sample for quality analysis
    });

    const data = importedDataResult.data.map(d => d.data);

    console.log(`[AI] Loaded ${data.length} records for quality analysis`);

    // Detect quality issues
    const issues = await aiAssistant.detectQualityIssues(dataSource.name, data);

    // Calculate quality score
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    const qualityScore = Math.max(0, 100 - (criticalCount * 25) - (errorCount * 10) - (warningCount * 5));

    console.log(`[AI] Detected ${issues.length} quality issues (score: ${qualityScore})`);

    return NextResponse.json({
      success: true,
      dataSource: {
        id: dataSource.id,
        name: dataSource.name,
      },
      qualityScore,
      issues,
      summary: {
        total: issues.length,
        critical: criticalCount,
        errors: errorCount,
        warnings: warningCount,
        info: issues.filter(i => i.severity === 'info').length,
      },
    });

  } catch (error) {
    console.error('[AI] Quality detection error:', error);
    
    return NextResponse.json(
      {
        error: 'Quality detection failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

