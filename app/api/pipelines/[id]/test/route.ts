import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../../lib/server/database/MongoDatabase';
import { pipelineTester, TestDataConfig, TestAssertion } from '../../../../../lib/services/PipelineTester';

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
 * POST /api/pipelines/[id]/test
 * Run a test for a pipeline
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const pipelineId = params.id;
    const body = await request.json();

    const {
      testName,
      testDescription,
      testDataConfig,
      assertions,
    } = body;

    console.log(`[Pipeline Test] Starting test for pipeline: ${pipelineId}`);

    // Get pipeline
    const database = await ensureDb();
    const pipeline: any = await database.getPipeline(pipelineId);

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Create test
    const test = pipelineTester.createTest({
      pipelineId,
      name: testName || `Test ${new Date().toISOString()}`,
      description: testDescription,
      testData: testDataConfig as TestDataConfig,
      assertions: assertions as TestAssertion[],
    });

    console.log(`[Pipeline Test] Test created: ${test.id}`);

    // Load production data if needed (for sample mode)
    let productionData: Record<string, any[]> | undefined;

    if (testDataConfig.mode === 'sample') {
      productionData = {};
      
      const sourcesToLoad = testDataConfig.sourceIds || pipeline.inputSourceIds || [];

      for (const sourceId of sourcesToLoad) {
        const snapshots = await database.getSnapshots(sourceId);
        
        if (snapshots.length > 0) {
          const latestSnapshot: any = snapshots[0]; // Already sorted by version descending

          // Load data
          const importedDataResult = await database.getImportedData({
            dataSourceId: sourceId,
            snapshotId: latestSnapshot.id as string,
            limit: 1000, // Sample for testing
          });
          
          productionData[sourceId] = importedDataResult.data;
          
          console.log(`[Pipeline Test] Loaded ${productionData[sourceId].length} records from ${sourceId}`);
        }
      }
    }

    // Run test
    const testResult = await pipelineTester.runTest(
      test.id,
      pipeline,
      productionData
    );

    console.log(`[Pipeline Test] Test completed: ${testResult.status}`);
    console.log(`[Pipeline Test] Assertions: ${testResult.assertionResults.filter(a => a.passed).length}/${testResult.assertionResults.length} passed`);

    return NextResponse.json({
      success: true,
      test,
      result: testResult,
    });

  } catch (error) {
    console.error('[Pipeline Test] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Pipeline test failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pipelines/[id]/test
 * Get all tests for a pipeline
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const pipelineId = params.id;

    const tests = pipelineTester.getPipelineTests(pipelineId);

    // Get latest result for each test
    const testsWithResults = tests.map(test => {
      const results = pipelineTester.getTestResults(test.id);
      return {
        ...test,
        lastResult: results[0] || null,
        totalRuns: results.length,
      };
    });

    return NextResponse.json({
      tests: testsWithResults,
    });

  } catch (error) {
    console.error('[Pipeline Test] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get pipeline tests',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

