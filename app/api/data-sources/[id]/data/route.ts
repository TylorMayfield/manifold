import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../../lib/server/database/MongoDatabase';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[Data API] Initializing MongoDB...');
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    console.log('[Data API] MongoDB initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const version = searchParams.get('version') ? parseInt(searchParams.get('version')!) : undefined;
    
    const database = await ensureDb();
    const resolvedParams = await params;
    const dataSource = await database.getDataSource(resolvedParams.id) as any;
    
    if (!dataSource) {
      return NextResponse.json(
        { error: 'Data source not found' },
        { status: 404 }
      );
    }

    try {
      // Try to get imported data from MongoDB
      const result = await database.getImportedData({
        dataSourceId: resolvedParams.id,
        version,
        limit,
        offset
      });

      // If we have imported data, return it
      if (result.data.length > 0) {
        return NextResponse.json({
          data: result.data,
          totalCount: result.totalCount,
          version: result.snapshot?.version,
          schema: result.snapshot?.schema,
          metadata: result.snapshot?.metadata,
          source: 'imported'
        });
      }

      // Otherwise, return mock data as fallback
      let mockData: any[] = [];
      let totalCount = 0;
      
      switch (dataSource.type) {
        case 'csv':
          mockData = [
            { id: 1, name: 'Sample CSV Data', value: 100, date: '2024-01-15' },
            { id: 2, name: 'Another CSV Row', value: 250, date: '2024-01-16' },
            { id: 3, name: 'Third CSV Entry', value: 75, date: '2024-01-17' },
          ];
          totalCount = 100;
          break;
          
        case 'mysql':
          mockData = [
            { user_id: 1, username: 'john_doe', email: 'john@example.com', created_at: '2024-01-10' },
            { user_id: 2, username: 'jane_smith', email: 'jane@example.com', created_at: '2024-01-11' },
            { user_id: 3, username: 'bob_wilson', email: 'bob@example.com', created_at: '2024-01-12' },
          ];
          totalCount = 500;
          break;
          
        case 'json':
          mockData = [
            { product_id: 1, product_name: 'Laptop', category: 'Electronics', price: 999.99 },
            { product_id: 2, product_name: 'Chair', category: 'Furniture', price: 199.99 },
            { product_id: 3, product_name: 'Book', category: 'Education', price: 29.99 },
          ];
          totalCount = 200;
          break;
          
        case 'api_script':
          mockData = [
            { api_id: 1, endpoint: '/users', method: 'GET', status_code: 200, response_time: 150 },
            { api_id: 2, endpoint: '/orders', method: 'POST', status_code: 201, response_time: 320 },
            { api_id: 3, endpoint: '/products', method: 'GET', status_code: 200, response_time: 85 },
          ];
          totalCount = 50;
          break;
          
        case 'mock':
          mockData = [
            { customer_id: 1, first_name: 'Alice', last_name: 'Johnson', city: 'New York' },
            { customer_id: 2, first_name: 'Bob', last_name: 'Smith', city: 'Los Angeles' },
            { customer_id: 3, first_name: 'Charlie', last_name: 'Brown', city: 'Chicago' },
          ];
          totalCount = 1000;
          break;
          
        default:
          mockData = [];
          totalCount = 0;
      }

      // Apply pagination
      const paginatedData = mockData.slice(offset, offset + limit);
      
      return NextResponse.json({
        data: paginatedData,
        totalCount,
        count: paginatedData.length,
        limit,
        offset
      });
      
    } catch (dataError) {
      console.error(`Error fetching data for source ${resolvedParams.id}:`, dataError);
      return NextResponse.json({
        data: [],
        totalCount: 0,
        count: 0,
        limit,
        offset,
        error: 'Failed to fetch data from source'
      });
    }
    
  } catch (error) {
    console.error('Error in data source data API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}