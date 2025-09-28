// This file is for server-side use only (Electron main process)
// Client-side components should use server actions or API calls instead

export interface DatabaseManager {
  // Interface definition for type checking
  createProject(project: any): void;
  getProjects(): any[];
  getProject(id: string): any | null;
  updateProject(id: string, updates: any): void;
  deleteProject(id: string): void;
  createDataSource(dataSource: any): void;
  getDataSources(projectId: string): any[];
  getDataSource(id: string): any | null;
  updateDataSource(id: string, updates: any): void;
  deleteDataSource(id: string): void;
  createSnapshot(snapshot: any): void;
  getSnapshots(dataSourceId: string): any[];
  getLatestSnapshot(dataSourceId: string): any | null;
  createRelationship(relationship: any): void;
  getRelationships(projectId: string): any[];
  deleteRelationship(id: string): void;
  createConsolidatedModel(model: any): void;
  getConsolidatedModels(projectId: string): any[];
  getAppDataPath(): string;
  close(): void;
}

// Mock implementation for client-side
export class DatabaseManager {
  private static instance: DatabaseManager;

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Mock methods that throw errors to indicate server-side only usage
  createProject(project: any): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  getProjects(): any[] {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  getProject(id: string): any | null {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  updateProject(id: string, updates: any): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  deleteProject(id: string): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  createDataSource(dataSource: any): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  getDataSources(projectId: string): any[] {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  getDataSource(id: string): any | null {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  updateDataSource(id: string, updates: any): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  deleteDataSource(id: string): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  createSnapshot(snapshot: any): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  getSnapshots(dataSourceId: string): any[] {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  getLatestSnapshot(dataSourceId: string): any | null {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  createRelationship(relationship: any): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  getRelationships(projectId: string): any[] {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  deleteRelationship(id: string): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  createConsolidatedModel(model: any): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  getConsolidatedModels(projectId: string): any[] {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  getAppDataPath(): string {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }

  close(): void {
    throw new Error(
      "DatabaseManager should only be used server-side. Use server actions instead."
    );
  }
}

// Export new separated database architecture
export { CoreDatabase } from "./CoreDatabase";
export { ProjectDatabase } from "./ProjectDatabase";
export { SimpleSQLiteDB } from "./SimpleSQLiteDB";
export { DataSourceDatabase } from "./DataSourceDatabase";
export { SeparatedDatabaseManager } from "./SeparatedDatabaseManager";
export type { DataVersion, DataSourceStats } from "./DataSourceDatabase";
export type { DataSourceConfig, ImportResult } from "./SeparatedDatabaseManager";