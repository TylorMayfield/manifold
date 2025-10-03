/**
 * Prepare standalone Next.js build for Electron packaging
 * This script ensures all necessary files are in place for production builds
 */

const fs = require('fs');
const path = require('path');

console.log('Preparing standalone build for Electron...');

const standaloneDir = path.join(process.cwd(), '.next', 'standalone');
const staticDir = path.join(process.cwd(), '.next', 'static');
const publicDir = path.join(process.cwd(), 'public');

// Verify standalone build exists
if (!fs.existsSync(standaloneDir)) {
  console.error('Error: Standalone build not found at:', standaloneDir);
  console.log('Make sure Next.js is configured with output: "standalone"');
  process.exit(1);
}

// Verify static files exist
if (!fs.existsSync(staticDir)) {
  console.error('Error: Static files not found at:', staticDir);
  process.exit(1);
}

console.log('✓ Standalone build verified');
console.log('✓ Static files verified');

// Copy public files to standalone if needed
const standalonePublicDir = path.join(standaloneDir, 'public');
if (!fs.existsSync(standalonePublicDir)) {
  fs.mkdirSync(standalonePublicDir, { recursive: true });
}

// Check for critical files
const criticalFiles = [
  path.join(standaloneDir, 'server.js'),
  path.join(standaloneDir, 'package.json'),
];

for (const file of criticalFiles) {
  if (!fs.existsSync(file)) {
    console.error(`Error: Critical file missing: ${file}`);
    process.exit(1);
  }
}

console.log('✓ All critical files present');

// Copy static files to standalone directory
const standaloneStaticDir = path.join(standaloneDir, '.next', 'static');
if (!fs.existsSync(standaloneStaticDir)) {
  console.log('Copying static files to standalone...');
  const copyRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyRecursive(staticDir, standaloneStaticDir);
  console.log('✓ Copied static files to standalone');
} else {
  console.log('✓ Static files already in standalone');
}

// Copy public files to standalone
const standalonePublicDirFinal = path.join(standaloneDir, 'public');
if (!fs.existsSync(standalonePublicDirFinal)) {
  console.log('Copying public files to standalone...');
  const copyRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      // Skip electron.js and preload.js - they're handled separately
      if (entry.name === 'electron.js' || entry.name === 'preload.js') {
        continue;
      }
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyRecursive(publicDir, standalonePublicDirFinal);
  console.log('✓ Copied public files to standalone');
} else {
  console.log('✓ Public files already in standalone');
}

// Create .env file for production if it doesn't exist
const envPath = path.join(standaloneDir, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `NODE_ENV=production
DATABASE_URL=file:./data/core.db
PORT=3000
HOSTNAME=localhost
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✓ Created production .env file');
}

// Ensure data directories exist in standalone
const dataDir = path.join(standaloneDir, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ Created data directory');
}

const datasourcesDir = path.join(dataDir, 'datasources');
if (!fs.existsSync(datasourcesDir)) {
  fs.mkdirSync(datasourcesDir, { recursive: true });
  console.log('✓ Created datasources directory');
}

const projectsDir = path.join(dataDir, 'projects');
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
  console.log('✓ Created projects directory');
}

console.log('\n✅ Standalone build preparation complete!');
console.log('   Ready for Electron packaging.');

