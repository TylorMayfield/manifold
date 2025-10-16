/**
 * @jest-environment jsdom
 */

import { SettingsService } from '../../lib/services/SettingsService';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

// Mock app.getPath
const mockApp = {
  getPath: jest.fn()
};

// Mock electron
jest.mock('electron', () => ({
  app: mockApp
}));

describe('SettingsService', () => {
  let settingsService: SettingsService;
  const mockSettingsPath = '/mock/path/settings.json';
  const mockSettingsDir = '/mock/path';

  beforeEach(() => {
    settingsService = SettingsService.getInstance();
    jest.clearAllMocks();

    // Setup default mocks
    mockApp.getPath.mockReturnValue(mockSettingsDir);
    mockPath.join.mockReturnValue(mockSettingsPath);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({
      applicationName: 'Test App',
      defaultTimezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      maxConcurrentJobs: 5,
      language: 'en',
      autoSave: true,
      autoSaveInterval: 30
    }));
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.mkdirSync.mockImplementation(() => '');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SettingsService.getInstance();
      const instance2 = SettingsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('loadSettings', () => {
    it('should load settings from file', async () => {
      const result = await settingsService.loadSettings();

      expect(result.applicationName).toBe('Test App');
      expect(result.defaultTimezone).toBe('UTC');
      expect(result.dateFormat).toBe('YYYY-MM-DD');
      expect(result.maxConcurrentJobs).toBe(5);
      expect(result.language).toBe('en');
      expect(result.autoSave).toBe(true);
      expect(result.autoSaveInterval).toBe(30);

      expect(mockFs.readFileSync).toHaveBeenCalledWith(mockSettingsPath, 'utf8');
    });

    it('should return default settings if file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await settingsService.loadSettings();

      expect(result.applicationName).toBe('Manifold');
      expect(result.defaultTimezone).toBe('UTC');
      expect(result.dateFormat).toBe('YYYY-MM-DD');
      expect(result.maxConcurrentJobs).toBe(3);
      expect(result.language).toBe('en');
      expect(result.autoSave).toBe(true);
      expect(result.autoSaveInterval).toBe(60);
    });

    it('should return default settings if file read fails', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = await settingsService.loadSettings();

      expect(result.applicationName).toBe('Manifold');
      expect(result.defaultTimezone).toBe('UTC');
      expect(result.maxConcurrentJobs).toBe(3);
    });

    it('should return default settings if JSON parse fails', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      const result = await settingsService.loadSettings();

      expect(result.applicationName).toBe('Manifold');
      expect(result.defaultTimezone).toBe('UTC');
      expect(result.maxConcurrentJobs).toBe(3);
    });
  });

  describe('saveSettings', () => {
    it('should save settings to file', async () => {
      const settings = {
        applicationName: 'Updated App',
        defaultTimezone: 'EST',
        dateFormat: 'MM/DD/YYYY',
        maxConcurrentJobs: 10,
        language: 'es',
        autoSave: false,
        autoSaveInterval: 120
      };

      await settingsService.saveSettings(settings);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockSettingsPath,
        JSON.stringify(settings, null, 2),
        'utf8'
      );
    });

    it('should create directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const settings = { applicationName: 'Test App' };

      await settingsService.saveSettings(settings);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(mockSettingsDir, { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });

      const settings = { applicationName: 'Test App' };

      await expect(settingsService.saveSettings(settings)).rejects.toThrow('Write error');
    });
  });

  describe('updateSettings', () => {
    it('should update specific settings', async () => {
      const updates = {
        applicationName: 'Updated Name',
        maxConcurrentJobs: 8
      };

      await settingsService.updateSettings(updates);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockSettingsPath,
        expect.stringContaining('"applicationName": "Updated Name"'),
        'utf8'
      );
    });

    it('should merge with existing settings', async () => {
      const updates = { language: 'fr' };

      await settingsService.updateSettings(updates);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockSettingsPath,
        expect.stringContaining('"language": "fr"'),
        'utf8'
      );
    });

    it('should handle update errors', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Update error');
      });

      const updates = { applicationName: 'Updated' };

      await expect(settingsService.updateSettings(updates)).rejects.toThrow('Update error');
    });
  });

  describe('resetSettings', () => {
    it('should reset to default settings', async () => {
      await settingsService.resetSettings();

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockSettingsPath,
        expect.stringContaining('"applicationName": "Manifold"'),
        'utf8'
      );
    });

    it('should handle reset errors', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Reset error');
      });

      await expect(settingsService.resetSettings()).rejects.toThrow('Reset error');
    });
  });

  describe('getSetting', () => {
    it('should get specific setting value', async () => {
      const value = await settingsService.getSetting('applicationName');

      expect(value).toBe('Test App');
    });

    it('should return undefined for non-existent setting', async () => {
      const value = await settingsService.getSetting('nonExistentSetting');

      expect(value).toBeUndefined();
    });

    it('should handle get errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const value = await settingsService.getSetting('applicationName');

      expect(value).toBeUndefined();
    });
  });

  describe('setSetting', () => {
    it('should set specific setting value', async () => {
      await settingsService.setSetting('applicationName', 'New Name');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockSettingsPath,
        expect.stringContaining('"applicationName": "New Name"'),
        'utf8'
      );
    });

    it('should handle set errors', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Set error');
      });

      await expect(settingsService.setSetting('applicationName', 'New Name')).rejects.toThrow('Set error');
    });
  });

  describe('validateSettings', () => {
    it('should validate correct settings', async () => {
      const settings = {
        applicationName: 'Test App',
        defaultTimezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        maxConcurrentJobs: 5,
        language: 'en',
        autoSave: true,
        autoSaveInterval: 30
      };

      const result = settingsService.validateSettings(settings);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid settings', async () => {
      const settings = {
        applicationName: '', // Invalid: empty string
        defaultTimezone: 'INVALID', // Invalid: not a valid timezone
        dateFormat: 'INVALID', // Invalid: not a valid date format
        maxConcurrentJobs: -1, // Invalid: negative number
        language: 'invalid', // Invalid: not a valid language code
        autoSave: 'invalid', // Invalid: not a boolean
        autoSaveInterval: 0 // Invalid: zero or negative
      };

      const result = settingsService.validateSettings(settings);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate database settings', async () => {
      const settings = {
        databaseHost: 'localhost',
        databasePort: 5432,
        databaseName: 'testdb',
        databaseUser: 'testuser',
        databasePassword: 'testpass',
        databaseSSL: true
      };

      const result = settingsService.validateSettings(settings);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid database settings', async () => {
      const settings = {
        databaseHost: '', // Invalid: empty string
        databasePort: 0, // Invalid: zero port
        databaseName: '', // Invalid: empty string
        databaseUser: '', // Invalid: empty string
        databasePassword: '', // Invalid: empty string
        databaseSSL: 'invalid' // Invalid: not a boolean
      };

      const result = settingsService.validateSettings(settings);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate performance settings', async () => {
      const settings = {
        maxConcurrentJobs: 5,
        batchSize: 1000,
        cacheSize: 100,
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      };

      const result = settingsService.validateSettings(settings);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid performance settings', async () => {
      const settings = {
        maxConcurrentJobs: 0, // Invalid: zero
        batchSize: -1, // Invalid: negative
        cacheSize: 0, // Invalid: zero
        timeout: -1, // Invalid: negative
        retryAttempts: -1, // Invalid: negative
        retryDelay: 0 // Invalid: zero
      };

      const result = settingsService.validateSettings(settings);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('exportSettings', () => {
    it('should export settings to file', async () => {
      const exportPath = '/export/path/settings.json';

      await settingsService.exportSettings(exportPath);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        exportPath,
        expect.stringContaining('"applicationName": "Test App"'),
        'utf8'
      );
    });

    it('should handle export errors', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Export error');
      });

      await expect(settingsService.exportSettings('/invalid/path')).rejects.toThrow('Export error');
    });
  });

  describe('importSettings', () => {
    it('should import settings from file', async () => {
      const importPath = '/import/path/settings.json';
      const importedSettings = {
        applicationName: 'Imported App',
        defaultTimezone: 'PST',
        maxConcurrentJobs: 7
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(importedSettings));

      const result = await settingsService.importSettings(importPath);

      expect(result.success).toBe(true);
      expect(result.settings.applicationName).toBe('Imported App');
      expect(mockFs.readFileSync).toHaveBeenCalledWith(importPath, 'utf8');
    });

    it('should validate imported settings', async () => {
      const importPath = '/import/path/settings.json';
      const invalidSettings = {
        applicationName: '', // Invalid
        maxConcurrentJobs: -1 // Invalid
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidSettings));

      const result = await settingsService.importSettings(importPath);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle import file not found', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const result = await settingsService.importSettings('/nonexistent/path');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });

    it('should handle invalid JSON in import file', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      const result = await settingsService.importSettings('/import/path');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });
  });

  describe('getDefaultSettings', () => {
    it('should return default settings object', () => {
      const defaults = settingsService.getDefaultSettings();

      expect(defaults.applicationName).toBe('Manifold');
      expect(defaults.defaultTimezone).toBe('UTC');
      expect(defaults.dateFormat).toBe('YYYY-MM-DD');
      expect(defaults.maxConcurrentJobs).toBe(3);
      expect(defaults.language).toBe('en');
      expect(defaults.autoSave).toBe(true);
      expect(defaults.autoSaveInterval).toBe(60);
    });
  });

  describe('getSettingsPath', () => {
    it('should return settings file path', () => {
      const settingsPath = settingsService.getSettingsPath();

      expect(settingsPath).toBe(mockSettingsPath);
      expect(mockApp.getPath).toHaveBeenCalledWith('userData');
      expect(mockPath.join).toHaveBeenCalledWith(mockSettingsDir, 'settings.json');
    });
  });

  describe('backupSettings', () => {
    it('should create backup of current settings', async () => {
      const backupPath = await settingsService.backupSettings();

      expect(backupPath).toContain('settings-backup-');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        backupPath,
        expect.stringContaining('"applicationName": "Test App"'),
        'utf8'
      );
    });

    it('should handle backup errors', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Backup error');
      });

      await expect(settingsService.backupSettings()).rejects.toThrow('Backup error');
    });
  });

  describe('restoreSettings', () => {
    it('should restore settings from backup', async () => {
      const backupPath = '/backup/path/settings-backup.json';
      const backupSettings = {
        applicationName: 'Backup App',
        defaultTimezone: 'EST'
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(backupSettings));

      const result = await settingsService.restoreSettings(backupPath);

      expect(result.success).toBe(true);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(backupPath, 'utf8');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockSettingsPath,
        JSON.stringify(backupSettings, null, 2),
        'utf8'
      );
    });

    it('should handle restore errors', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Restore error');
      });

      const result = await settingsService.restoreSettings('/invalid/backup');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Restore error');
    });
  });
});
