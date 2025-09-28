const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔧 Fixing database schema issues...');

// Path to the database
const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'manifold.db');

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.log('📁 Database does not exist, it will be created automatically on next run');
  process.exit(0);
}

try {
  // Open database
  const db = new Database(dbPath);
  
  console.log('📋 Checking current schema...');
  
  // Get current table info
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📊 Current tables:', tables.map(t => t.name));
  
  // Check snapshots table schema
  try {
    const snapshotColumns = db.prepare("PRAGMA table_info(snapshots)").all();
    console.log('🔍 Snapshots table columns:', snapshotColumns.map(c => `${c.name} (${c.type})`));
    
    // Check if data column exists
    const hasDataColumn = snapshotColumns.some(col => col.name === 'data');
    
    if (!hasDataColumn) {
      console.log('⚠️  Missing data column in snapshots table, adding it...');
      db.exec('ALTER TABLE snapshots ADD COLUMN data TEXT');
      console.log('✅ Added data column to snapshots table');
    } else {
      console.log('✅ Data column exists in snapshots table');
    }
    
    // Check if schema column exists
    const hasSchemaColumn = snapshotColumns.some(col => col.name === 'schema');
    
    if (!hasSchemaColumn) {
      console.log('⚠️  Missing schema column in snapshots table, adding it...');
      db.exec('ALTER TABLE snapshots ADD COLUMN schema TEXT');
      console.log('✅ Added schema column to snapshots table');
    } else {
      console.log('✅ Schema column exists in snapshots table');
    }
    
    // Check if metadata column exists
    const hasMetadataColumn = snapshotColumns.some(col => col.name === 'metadata');
    
    if (!hasMetadataColumn) {
      console.log('⚠️  Missing metadata column in snapshots table, adding it...');
      db.exec('ALTER TABLE snapshots ADD COLUMN metadata TEXT');
      console.log('✅ Added metadata column to snapshots table');
    } else {
      console.log('✅ Metadata column exists in snapshots table');
    }
    
  } catch (error) {
    if (error.message.includes('no such table: snapshots')) {
      console.log('⚠️  Snapshots table does not exist, it will be created automatically');
    } else {
      throw error;
    }
  }
  
  // Test a simple query to ensure everything works
  try {
    const testQuery = db.prepare("SELECT COUNT(*) as count FROM snapshots").get();
    console.log(`✅ Database is working. Current snapshots count: ${testQuery.count}`);
  } catch (error) {
    console.log('⚠️  Cannot query snapshots table yet, but this is expected if no data exists');
  }
  
  db.close();
  
  console.log('🎉 Database schema check/fix completed successfully!');
  
} catch (error) {
  console.error('❌ Error fixing database:', error.message);
  console.log('\n💡 You might need to delete the database file and let it recreate:');
  console.log(`   rm "${dbPath}"`);
  process.exit(1);
}