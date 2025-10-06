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
      console.log(`[Data API] Fetching data for dataSourceId: ${resolvedParams.id}, version: ${version}`);
      const result = await database.getImportedData({
        dataSourceId: resolvedParams.id,
        version,
        limit,
        offset
      });
      
      console.log(`[Data API] getImportedData returned ${result.data.length} records, totalCount: ${result.totalCount}`);

      // If we have imported data, return it
      if (result.data.length > 0) {
        console.log(`[Data API] Returning imported data`);
        return NextResponse.json({
          data: result.data,
          totalCount: result.totalCount,
          version: result.snapshot?.version,
          schema: result.snapshot?.schema,
          metadata: result.snapshot?.metadata,
          source: 'imported'
        });
      }
      
      console.log(`[Data API] No imported data found, checking for fallback...`);

      // Otherwise, return mock data as fallback
      let mockData: any[] = [];
      let totalCount = 0;
      
      switch (dataSource.type) {
        case 'csv':
          totalCount = 100;
          mockData = Array.from({ length: totalCount }, (_, i) => ({
            id: i + 1,
            name: `CSV Record ${i + 1}`,
            value: Math.floor(Math.random() * 1000),
            date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            category: ['A', 'B', 'C', 'D'][i % 4],
          }));
          break;
          
        case 'mysql':
          totalCount = 500;
          const usernames = ['john_doe', 'jane_smith', 'bob_wilson', 'alice_brown', 'charlie_davis', 'eve_miller', 'frank_moore', 'grace_taylor'];
          mockData = Array.from({ length: totalCount }, (_, i) => ({
            user_id: i + 1,
            username: `${usernames[i % usernames.length]}_${i}`,
            email: `${usernames[i % usernames.length]}${i}@example.com`,
            created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            is_active: i % 2 === 0,
          }));
          break;
          
        case 'json':
          totalCount = 200;
          const products = ['Laptop', 'Chair', 'Book', 'Desk', 'Monitor', 'Keyboard', 'Mouse', 'Tablet', 'Phone', 'Headphones'];
          const categories = ['Electronics', 'Furniture', 'Education', 'Office', 'Audio'];
          mockData = Array.from({ length: totalCount }, (_, i) => ({
            product_id: i + 1,
            product_name: `${products[i % products.length]} ${Math.floor(i / products.length) + 1}`,
            category: categories[i % categories.length],
            price: (Math.random() * 1000 + 10).toFixed(2),
            in_stock: i % 3 !== 0,
          }));
          break;
          
        case 'api_script':
          totalCount = 50;
          const endpoints = ['/users', '/orders', '/products', '/inventory', '/customers', '/analytics'];
          const methods = ['GET', 'POST', 'PUT', 'DELETE'];
          mockData = Array.from({ length: totalCount }, (_, i) => ({
            api_id: i + 1,
            endpoint: endpoints[i % endpoints.length],
            method: methods[i % methods.length],
            status_code: i % 10 === 0 ? 500 : i % 20 === 0 ? 404 : 200,
            response_time: Math.floor(Math.random() * 500) + 50,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          }));
          break;
          
        case 'mock':
          // Generate realistic mock data based on the requested limit
          totalCount = 1000;
          const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
          const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Laura', 'Michael', 'Nancy', 'Oliver', 'Patricia', 'Quinn', 'Rachel', 'Steve', 'Tina'];
          const lastNames = ['Johnson', 'Smith', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez'];
          
          mockData = Array.from({ length: totalCount }, (_, i) => ({
            customer_id: i + 1,
            first_name: firstNames[i % firstNames.length],
            last_name: lastNames[Math.floor(i / firstNames.length) % lastNames.length],
            city: cities[i % cities.length],
            email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[Math.floor(i / firstNames.length) % lastNames.length].toLowerCase()}@example.com`,
            registration_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'inactive' : 'pending',
          }));
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