import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

interface AppSettings {
  applicationName: string;
  defaultTimezone: string;
  dateFormat: string;
  maxConcurrentJobs: number;
  databasePath: string;
  backupEnabled: boolean;
  backupFrequency: string;
  retentionDays: number;
  compressionEnabled: boolean;
  emailNotifications: boolean;
  jobFailureNotifications: boolean;
  successNotifications: boolean;
  apiKey: string;
  encryptionEnabled: boolean;
  dataRetentionDays: number;
  theme: string;
  compactMode: boolean;
  showLineNumbers: boolean;
  fontSize: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  applicationName: 'Manifold ETL',
  defaultTimezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  maxConcurrentJobs: 5,
  databasePath: './data',
  backupEnabled: true,
  backupFrequency: 'daily',
  retentionDays: 30,
  compressionEnabled: true,
  emailNotifications: false,
  jobFailureNotifications: true,
  successNotifications: false,
  apiKey: '',
  encryptionEnabled: false,
  dataRetentionDays: 365,
  theme: 'light',
  compactMode: false,
  showLineNumbers: true,
  fontSize: 'medium'
};

function ensureDataDirectory() {
  const dataDir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadSettings(): AppSettings {
  try {
    ensureDataDirectory();
    
    if (fs.existsSync(SETTINGS_FILE)) {
      const settingsData = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const loadedSettings = JSON.parse(settingsData);
      
      // Merge with defaults in case new settings were added
      return { ...DEFAULT_SETTINGS, ...loadedSettings };
    }
    
    // Return default settings if file doesn't exist
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings): void {
  try {
    ensureDataDirectory();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
}

export async function GET() {
  try {
    const settings = loadSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newSettings = await request.json();
    
    // Validate the settings object has required fields
    const mergedSettings = { ...DEFAULT_SETTINGS, ...newSettings };
    
    saveSettings(mergedSettings);
    
    return NextResponse.json({ 
      success: true, 
      settings: mergedSettings 
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    const currentSettings = loadSettings();
    
    // Merge current settings with updates
    const updatedSettings = { ...currentSettings, ...updates };
    
    saveSettings(updatedSettings);
    
    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}