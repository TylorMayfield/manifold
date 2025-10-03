import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../lib/server/database/MongoDatabase';
import fs from 'fs';
import path from 'path';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'database-config.json');

interface DatabaseConfig {
  connectionString: string;
  type: 'local' | 'remote';
}

function loadConfig(): DatabaseConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database config:', error);
  }
  
  // Default to local MongoDB using IPv4
  return {
    connectionString: 'mongodb://127.0.0.1:27017/manifold',
    type: 'local'
  };
}

function saveConfig(config: DatabaseConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// GET current connection info
export async function GET() {
  try {
    const config = loadConfig();
    const db = MongoDatabase.getInstance();
    
    return NextResponse.json({
      connectionString: config.connectionString.replace(/\/\/.*@/, '//***@'), // Hide credentials
      type: config.type,
      isConnected: db.isHealthy(),
      displayString: config.connectionString.replace(/\/\/.*@/, '//***@')
    });
  } catch (error) {
    console.error('Error getting database connection:', error);
    return NextResponse.json(
      { error: 'Failed to get connection info' },
      { status: 500 }
    );
  }
}

// POST update connection string
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, type } = body;
    
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }
    
    // Validate connection string format
    if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
      return NextResponse.json(
        { error: 'Invalid MongoDB connection string' },
        { status: 400 }
      );
    }
    
    // Test the connection
    const db = MongoDatabase.getInstance();
    
    try {
      await db.updateConnectionString(connectionString);
      
      // Save configuration
      saveConfig({
        connectionString,
        type: type || 'remote'
      });
      
      return NextResponse.json({
        success: true,
        message: 'Database connection updated successfully',
        isConnected: db.isHealthy()
      });
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Failed to connect to database',
          message: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating database connection:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

// PUT test connection
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString } = body;
    
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }
    
    // Test connection without saving
    const mongoose = require('mongoose');
    
    try {
      await mongoose.connect(connectionString, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        family: 4, // Force IPv4
      });
      
      await mongoose.disconnect();
      
      return NextResponse.json({
        success: true,
        message: 'Connection test successful'
      });
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Connection test failed',
          message: error instanceof Error ? error.message : String(error)
        },
        { status: 200 } // Return 200 even on test failure
      );
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}

