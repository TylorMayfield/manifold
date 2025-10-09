import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../lib/server/database/MongoDatabase';
import { integrationHub } from '../../../lib/services/IntegrationHub';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[DataSources API] Initializing MongoDB...');
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    console.log('[DataSources API] MongoDB initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    
    const database = await ensureDb();
    const dataSources = await database.getDataSources(projectId);
    
    return NextResponse.json(dataSources);
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data sources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[DataSources API POST] Received body:', body);
    const { projectId = 'default', ...dataSourceData } = body;
    console.log('[DataSources API POST] projectId:', projectId);
    console.log('[DataSources API POST] dataSourceData:', dataSourceData);
    
    const database = await ensureDb();
    
    // Create data source
    const dataSource = await database.createDataSource(projectId, dataSourceData);
    console.log('[DataSources API POST] Created data source:', dataSource);

    // Integration Hub: Register in catalog, setup for monitoring
    // Note: Full onboarding (with PII detection) happens when first snapshot is created
    try {
      console.log('[DataSources API] Registering data source with Integration Hub...');
      // For now, just log - full onboarding happens when data is imported
      console.log('[DataSources API] Data source will be fully onboarded when first snapshot is created');
    } catch (hubError) {
      console.warn('[DataSources API] Integration Hub registration failed (non-critical):', hubError);
    }
    
    return NextResponse.json(dataSource, { status: 201 });
  } catch (error) {
    console.error('Error creating data source:', error);
    return NextResponse.json(
      { error: 'Failed to create data source' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataSourceId, ...updates } = body;
    
    const database = await ensureDb();
    const result = await database.updateDataSource(dataSourceId, updates);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating data source:', error);
    return NextResponse.json(
      { error: 'Failed to update data source' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataSourceId = searchParams.get('dataSourceId');
    
    if (!dataSourceId) {
      return NextResponse.json(
        { error: 'dataSourceId is required' },
        { status: 400 }
      );
    }
    
    const database = await ensureDb();
    const success = await database.deleteDataSource(dataSourceId);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting data source:', error);
    return NextResponse.json(
      { error: 'Failed to delete data source' },
      { status: 500 }
    );
  }
}
