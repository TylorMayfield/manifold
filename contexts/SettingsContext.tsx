"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppSettings {
  // General Settings
  applicationName: string;
  defaultTimezone: string;
  dateFormat: string;
  maxConcurrentJobs: number;

  // Database Settings
  databasePath: string;
  backupEnabled: boolean;
  backupFrequency: string;
  retentionDays: number;
  compressionEnabled: boolean;

  // Notification Settings
  emailNotifications: boolean;
  jobFailureNotifications: boolean;
  jobCompletionNotifications: boolean;
  systemNotifications: boolean;

  // Security Settings
  sessionTimeout: number;
  apiKeyEnabled: boolean;
  apiKey: string;
  logLevel: string;

  // Storage Settings
  maxSnapshotSize: number;
  autoCleanupEnabled: boolean;
  cleanupThreshold: number;

  // Appearance Settings
  theme: string;
  compactMode: boolean;
  showLineNumbers: boolean;
  fontSize: string;
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
  maxConcurrentJobs: 5,

  // Database Settings
  databasePath: "/Users/tylormayfield/manifold/data",
  backupEnabled: true,
  backupFrequency: "daily",
  retentionDays: 30,
  compressionEnabled: true,

  // Notification Settings
  emailNotifications: true,
  jobFailureNotifications: true,
  jobCompletionNotifications: false,
  systemNotifications: true,

  // Security Settings
  sessionTimeout: 60,
  apiKeyEnabled: true,
  apiKey: "mk_1234567890abcdef...",
  logLevel: "info",

  // Storage Settings
  maxSnapshotSize: 100,
  autoCleanupEnabled: true,
  cleanupThreshold: 80,

  // Appearance Settings
  theme: "light",
  compactMode: false,
  showLineNumbers: true,
  fontSize: "medium",
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
