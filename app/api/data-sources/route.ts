import { NextRequest, NextResponse } from 'next/server';
import { SimpleSQLiteDB } from '../../../lib/server/database/SimpleSQLiteDB';

let db: SimpleSQLiteDB;

async function ensureDb() {
  if (!db) {
    db = SimpleSQLiteDB.getInstance();
    await db.initialize();
  }
  return db;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    
    const database = await ensureDb();
    const dataSources = database.getDataSources(projectId);
    
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
    const { projectId = 'default', ...dataSourceData } = body;
    
    const database = await ensureDb();
    
    // Create data source
    const dataSource = database.createDataSource(projectId, dataSourceData);
    
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
    const result = database.updateDataSource(dataSourceId, updates);
    
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
    const success = database.deleteDataSource(dataSourceId);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting data source:', error);
    return NextResponse.json(
      { error: 'Failed to delete data source' },
      { status: 500 }
    );
  }
}
