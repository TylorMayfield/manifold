"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppSettings {
  // General Settings
  applicationName: string;
  defaultTimezone: string;
  dateFormat: string;
  timeFormat?: string;
  maxConcurrentJobs: number;
  language: string;
  autoSave: boolean;
  autoSaveInterval: number;
  showWelcomeScreen?: boolean;
  autoConnectDataSources?: boolean;
  checkForUpdates?: boolean;

  // Database Settings
  databasePath: string;
  backupEnabled: boolean;
  backupFrequency: string;
  retentionDays: number;
  compressionEnabled: boolean;
  backupLocation?: string;
  encryptionEnabled?: boolean;
  maxBackupSize?: number;

  // Performance Settings
  cacheEnabled?: boolean;
  cacheSize?: number;
  queryTimeout?: number;
  maxQueryResults?: number;
  enableQueryOptimization?: boolean;
  parallelProcessing?: boolean;
  maxMemoryUsage?: number;
  enableIndexing?: boolean;

  // Notification Settings
  emailNotifications: boolean;
  emailSmtpHost?: string;
  emailSmtpPort?: number;
  emailSmtpUser?: string;
  emailSmtpPassword?: string;
  emailFrom?: string;
  jobFailureNotifications: boolean;
  jobCompletionNotifications: boolean;
  systemNotifications: boolean;
  dataQualityAlerts?: boolean;
  performanceAlerts?: boolean;

  // Security Settings
  sessionTimeout: number;
  apiKeyEnabled: boolean;
  apiKey: string;
  logLevel: string;
  auditLogging?: boolean;
  requireAuthentication?: boolean;
  passwordPolicy?: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  twoFactorEnabled?: boolean;
  allowedOrigins?: string[];

  // Storage Settings
  maxSnapshotSize: number;
  autoCleanupEnabled: boolean;
  cleanupThreshold: number;
  cleanupSchedule?: string;
  dataRetentionDays?: number;
  archiveOldData?: boolean;
  compressionLevel?: number;

  // Appearance Settings
  theme: string;
  compactMode: boolean;
  showLineNumbers: boolean;
  fontSize: string;
  fontFamily?: string;
  accentColor?: string;
  showTooltips?: boolean;
  animationsEnabled?: boolean;
  sidebarCollapsed?: boolean;

  // Data Processing Settings
  defaultImportMethod?: string;
  autoDetectSchema?: boolean;
  validateDataTypes?: boolean;
  skipEmptyRows?: boolean;
  trimWhitespace?: boolean;
  handleDuplicates?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];

  // Advanced Settings
  debugMode?: boolean;
  experimentalFeatures?: boolean;
  telemetryEnabled?: boolean;
  crashReporting?: boolean;
  autoUpdates?: boolean;
  updateChannel?: string;
  proxySettings?: {
    enabled: boolean;
    host: string;
    port: number;
    username: string;
    password: string;
  };
}

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  updateSetting: (key: keyof AppSettings, value: any) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  saveSettings: () => Promise<boolean>;
  loadSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  // General Settings
  applicationName: "Manifold ETL",
  defaultTimezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  maxConcurrentJobs: 5,
  language: "en",
  autoSave: true,
  autoSaveInterval: 30,
  showWelcomeScreen: true,
  autoConnectDataSources: false,
  checkForUpdates: true,

  // Database Settings
  databasePath: "./data",
  backupEnabled: true,
  backupFrequency: "daily",
  retentionDays: 30,
  compressionEnabled: true,
  backupLocation: "./backups",
  encryptionEnabled: false,
  maxBackupSize: 1024,

  // Performance Settings
  cacheEnabled: true,
  cacheSize: 256,
  queryTimeout: 30,
  maxQueryResults: 10000,
  enableQueryOptimization: true,
  parallelProcessing: true,
  maxMemoryUsage: 2048,
  enableIndexing: true,

  // Notification Settings
  emailNotifications: false,
  emailSmtpHost: "",
  emailSmtpPort: 587,
  emailSmtpUser: "",
  emailSmtpPassword: "",
  emailFrom: "",
  jobFailureNotifications: true,
  jobCompletionNotifications: false,
  systemNotifications: true,
  dataQualityAlerts: true,
  performanceAlerts: true,

  // Security Settings
  sessionTimeout: 60,
  apiKeyEnabled: false,
  apiKey: "mk_" + Math.random().toString(36).substr(2, 32),
  logLevel: "info",
  auditLogging: true,
  requireAuthentication: false,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  twoFactorEnabled: false,
  allowedOrigins: ["localhost", "127.0.0.1"],

  // Storage Settings
  maxSnapshotSize: 100,
  autoCleanupEnabled: true,
  cleanupThreshold: 80,
  cleanupSchedule: "0 2 * * *",
  dataRetentionDays: 365,
  archiveOldData: true,
  compressionLevel: 6,

  // Appearance Settings
  theme: "light",
  compactMode: false,
  showLineNumbers: true,
  fontSize: "medium",
  fontFamily: "Inter, system-ui, sans-serif",
  accentColor: "#000000",
  showTooltips: true,
  animationsEnabled: true,
  sidebarCollapsed: false,

  // Data Processing Settings
  defaultImportMethod: "auto",
  autoDetectSchema: true,
  validateDataTypes: true,
  skipEmptyRows: true,
  trimWhitespace: true,
  handleDuplicates: "create_version",
  maxFileSize: 100,
  allowedFileTypes: ["csv", "json", "xlsx", "xml", "txt"],

  // Advanced Settings
  debugMode: false,
  experimentalFeatures: false,
  telemetryEnabled: true,
  crashReporting: true,
  autoUpdates: true,
  updateChannel: "stable",
  proxySettings: {
    enabled: false,
    host: "",
    port: 8080,
    username: "",
    password: "",
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Apply settings changes to the application
  useEffect(() => {
    if (isLoaded) {
      applySettings();
    }
  }, [settings, isLoaded]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data);
      setOriginalSettings({ ...data }); // Store original for change comparison
      setIsLoaded(true);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
      setIsLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      if (result.success) {
        setOriginalSettings({ ...settings }); // Update original after successful save
        console.log("Settings saved successfully:", settings);
        return true;
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const applySettings = () => {
    // Apply theme
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Apply font size
    document.documentElement.style.fontSize =
      settings.fontSize === "small"
        ? "14px"
        : settings.fontSize === "large"
        ? "18px"
        : "16px";

    // Apply compact mode
    if (settings.compactMode) {
      document.documentElement.classList.add("compact");
    } else {
      document.documentElement.classList.remove("compact");
    }

    // Set application title
    document.title = settings.applicationName;

    // Apply other settings as needed
    console.log("Settings applied:", {
      theme: settings.theme,
      fontSize: settings.fontSize,
      compactMode: settings.compactMode,
      applicationName: settings.applicationName,
    });
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        hasUnsavedChanges,
        updateSetting,
        updateSettings,
        resetSettings,
        saveSettings,
        loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
