import { clientLogger } from "../utils/ClientLogger";

export interface SchemaVersion {
  id: string;
  dataSourceId: string;
  version: string;
  schema: DataSchema;
  changes: SchemaChange[];
  createdAt: Date;
  createdBy: string;
  description?: string;
  isActive: boolean;
  migrationScript?: string;
}

export interface DataSchema {
  columns: SchemaColumn[];
  primaryKeys: string[];
  foreignKeys: ForeignKey[];
  indexes: Index[];
  constraints: Constraint[];
  metadata: SchemaMetadata;
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  description?: string;
  position: number;
  attributes: ColumnAttributes;
}

export interface ColumnAttributes {
  autoIncrement?: boolean;
  unique?: boolean;
  generated?: boolean;
  collation?: string;
  charset?: string;
  precision?: number;
  scale?: number;
  length?: number;
}

export interface ForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete: "CASCADE" | "SET_NULL" | "RESTRICT" | "NO_ACTION";
  onUpdate: "CASCADE" | "SET_NULL" | "RESTRICT" | "NO_ACTION";
}

export interface Index {
  name: string;
  columns: string[];
  type: "PRIMARY" | "UNIQUE" | "INDEX" | "FULLTEXT";
  algorithm?: "BTREE" | "HASH";
  comment?: string;
}

export interface Constraint {
  name: string;
  type: "CHECK" | "NOT_NULL" | "UNIQUE" | "FOREIGN_KEY";
  expression?: string;
  columns: string[];
  enabled: boolean;
}

export interface SchemaMetadata {
  tableName: string;
  engine?: string;
  charset?: string;
  collation?: string;
  comment?: string;
  rowFormat?: string;
  autoIncrement?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchemaChange {
  id: string;
  type:
    | "ADD_COLUMN"
    | "DROP_COLUMN"
    | "MODIFY_COLUMN"
    | "RENAME_COLUMN"
    | "ADD_INDEX"
    | "DROP_INDEX"
    | "ADD_CONSTRAINT"
    | "DROP_CONSTRAINT"
    | "ADD_FOREIGN_KEY"
    | "DROP_FOREIGN_KEY";
  description: string;
  before?: any;
  after?: any;
  impact: "breaking" | "non_breaking" | "additive";
  migrationRequired: boolean;
  rollbackScript?: string;
}

export interface SchemaComparison {
  sourceVersion: string;
  targetVersion: string;
  changes: SchemaChange[];
  breakingChanges: SchemaChange[];
  nonBreakingChanges: SchemaChange[];
  additiveChanges: SchemaChange[];
  compatibility: "compatible" | "incompatible" | "requires_migration";
  migrationComplexity: "low" | "medium" | "high" | "critical";
}

export interface SchemaMigration {
  id: string;
  fromVersion: string;
  toVersion: string;
  script: string;
  rollbackScript: string;
  status: "pending" | "running" | "completed" | "failed" | "rolled_back";
  executedAt?: Date;
  executedBy?: string;
  duration?: number;
  errors: MigrationError[];
  affectedRecords: number;
}

export interface MigrationError {
  id: string;
  type: "validation" | "execution" | "rollback";
  message: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
}

export interface SchemaValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  id: string;
  type: "syntax" | "semantic" | "constraint" | "reference";
  message: string;
  location: string;
  severity: "error" | "critical";
}

export interface ValidationWarning {
  id: string;
  type: "performance" | "best_practice" | "deprecation";
  message: string;
  location: string;
  suggestion?: string;
}

export interface ValidationSuggestion {
  id: string;
  type: "optimization" | "normalization" | "indexing";
  message: string;
  location: string;
  impact: "low" | "medium" | "high";
}

export class SchemaEvolutionManager {
  private static instance: SchemaEvolutionManager;
  private schemas: Map<string, SchemaVersion[]> = new Map();
  private migrations: Map<string, SchemaMigration> = new Map();

  static getInstance(): SchemaEvolutionManager {
    if (!SchemaEvolutionManager.instance) {
      SchemaEvolutionManager.instance = new SchemaEvolutionManager();
    }
    return SchemaEvolutionManager.instance;
  }

  // Schema Version Management
  async createSchemaVersion(
    dataSourceId: string,
    schema: DataSchema,
    description?: string,
    createdBy: string = "system"
  ): Promise<string> {
    const versions = this.schemas.get(dataSourceId) || [];
    const versionNumber = this.generateVersionNumber(versions);

    const version: SchemaVersion = {
      id: `schema_${dataSourceId}_${versionNumber}`,
      dataSourceId,
      version: versionNumber,
      schema,
      changes: [],
      createdAt: new Date(),
      createdBy,
      description,
      isActive: versions.length === 0, // First version is active by default
    };

    versions.push(version);
    this.schemas.set(dataSourceId, versions);

    clientLogger.info("Schema version created", "database", {
      dataSourceId,
      version: versionNumber,
      createdBy,
    });

    return version.id;
  }

  async updateSchemaVersion(
    versionId: string,
    updates: Partial<SchemaVersion>
  ): Promise<boolean> {
    for (const [dataSourceId, versions] of this.schemas) {
      const versionIndex = versions.findIndex((v) => v.id === versionId);
      if (versionIndex !== -1) {
        versions[versionIndex] = { ...versions[versionIndex], ...updates };
        this.schemas.set(dataSourceId, versions);
        return true;
      }
    }
    return false;
  }

  async activateSchemaVersion(versionId: string): Promise<boolean> {
    for (const [dataSourceId, versions] of this.schemas) {
      const versionIndex = versions.findIndex((v) => v.id === versionId);
      if (versionIndex !== -1) {
        // Deactivate all other versions
        versions.forEach((v) => (v.isActive = false));
        // Activate the specified version
        versions[versionIndex].isActive = true;
        this.schemas.set(dataSourceId, versions);
        return true;
      }
    }
    return false;
  }

  // Schema Comparison
  async compareSchemas(
    dataSourceId: string,
    sourceVersion: string,
    targetVersion: string
  ): Promise<SchemaComparison> {
    const versions = this.schemas.get(dataSourceId);
    if (!versions) {
      throw new Error(
        `No schema versions found for data source ${dataSourceId}`
      );
    }

    const source = versions.find((v) => v.version === sourceVersion);
    const target = versions.find((v) => v.version === targetVersion);

    if (!source || !target) {
      throw new Error("Source or target version not found");
    }

    const changes = this.detectSchemaChanges(source.schema, target.schema);
    const breakingChanges = changes.filter((c) => c.impact === "breaking");
    const nonBreakingChanges = changes.filter(
      (c) => c.impact === "non_breaking"
    );
    const additiveChanges = changes.filter((c) => c.impact === "additive");

    const compatibility =
      breakingChanges.length > 0
        ? "incompatible"
        : changes.some((c) => c.migrationRequired)
        ? "requires_migration"
        : "compatible";

    const migrationComplexity = this.assessMigrationComplexity(changes);

    return {
      sourceVersion,
      targetVersion,
      changes,
      breakingChanges,
      nonBreakingChanges,
      additiveChanges,
      compatibility,
      migrationComplexity,
    };
  }

  private detectSchemaChanges(
    source: DataSchema,
    target: DataSchema
  ): SchemaChange[] {
    const changes: SchemaChange[] = [];

    // Compare columns
    const sourceColumns = new Map(source.columns.map((c) => [c.name, c]));
    const targetColumns = new Map(target.columns.map((c) => [c.name, c]));

    // Find added columns
    for (const [name, column] of targetColumns) {
      if (!sourceColumns.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "ADD_COLUMN",
          description: `Added column: ${name}`,
          after: column,
          impact: "additive",
          migrationRequired: false,
        });
      }
    }

    // Find removed columns
    for (const [name, column] of sourceColumns) {
      if (!targetColumns.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "DROP_COLUMN",
          description: `Removed column: ${name}`,
          before: column,
          impact: "breaking",
          migrationRequired: true,
        });
      }
    }

    // Find modified columns
    for (const [name, sourceColumn] of sourceColumns) {
      const targetColumn = targetColumns.get(name);
      if (targetColumn && !this.columnsEqual(sourceColumn, targetColumn)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "MODIFY_COLUMN",
          description: `Modified column: ${name}`,
          before: sourceColumn,
          after: targetColumn,
          impact: this.assessColumnChangeImpact(sourceColumn, targetColumn),
          migrationRequired:
            this.assessColumnChangeImpact(sourceColumn, targetColumn) ===
            "breaking",
        });
      }
    }

    // Compare indexes
    const sourceIndexes = new Map(source.indexes.map((i) => [i.name, i]));
    const targetIndexes = new Map(target.indexes.map((i) => [i.name, i]));

    for (const [name, index] of targetIndexes) {
      if (!sourceIndexes.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "ADD_INDEX",
          description: `Added index: ${name}`,
          after: index,
          impact: "additive",
          migrationRequired: false,
        });
      }
    }

    for (const [name, index] of sourceIndexes) {
      if (!targetIndexes.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "DROP_INDEX",
          description: `Removed index: ${name}`,
          before: index,
          impact: "non_breaking",
          migrationRequired: true,
        });
      }
    }

    // Compare constraints
    const sourceConstraints = new Map(
      source.constraints.map((c) => [c.name, c])
    );
    const targetConstraints = new Map(
      target.constraints.map((c) => [c.name, c])
    );

    for (const [name, constraint] of targetConstraints) {
      if (!sourceConstraints.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "ADD_CONSTRAINT",
          description: `Added constraint: ${name}`,
          after: constraint,
          impact: "non_breaking",
          migrationRequired: true,
        });
      }
    }

    for (const [name, constraint] of sourceConstraints) {
      if (!targetConstraints.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "DROP_CONSTRAINT",
          description: `Removed constraint: ${name}`,
          before: constraint,
          impact: "non_breaking",
          migrationRequired: true,
        });
      }
    }

    return changes;
  }

  private columnsEqual(source: SchemaColumn, target: SchemaColumn): boolean {
    return (
      source.name === target.name &&
      source.type === target.type &&
      source.nullable === target.nullable &&
      source.defaultValue === target.defaultValue &&
      source.position === target.position
    );
  }

  private assessColumnChangeImpact(
    source: SchemaColumn,
    target: SchemaColumn
  ): "breaking" | "non_breaking" | "additive" {
    // Type changes are breaking
    if (source.type !== target.type) {
      return "breaking";
    }

    // Nullable to non-nullable is breaking
    if (source.nullable && !target.nullable) {
      return "breaking";
    }

    // Position changes are non-breaking
    if (source.position !== target.position) {
      return "non_breaking";
    }

    // Default value changes are non-breaking
    if (source.defaultValue !== target.defaultValue) {
      return "non_breaking";
    }

    return "non_breaking";
  }

  private assessMigrationComplexity(
    changes: SchemaChange[]
  ): "low" | "medium" | "high" | "critical" {
    const breakingChanges = changes.filter((c) => c.impact === "breaking");
    const migrationRequired = changes.filter((c) => c.migrationRequired);

    if (breakingChanges.length === 0 && migrationRequired.length === 0) {
      return "low";
    }

    if (breakingChanges.length === 0 && migrationRequired.length <= 3) {
      return "medium";
    }

    if (breakingChanges.length <= 2 && migrationRequired.length <= 10) {
      return "high";
    }

    return "critical";
  }

  // Schema Validation
  async validateSchema(schema: DataSchema): Promise<SchemaValidation> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Validate column names
    const columnNames = new Set<string>();
    for (const column of schema.columns) {
      if (columnNames.has(column.name)) {
        errors.push({
          id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "semantic",
          message: `Duplicate column name: ${column.name}`,
          location: `column:${column.name}`,
          severity: "error",
        });
      }
      columnNames.add(column.name);

      // Validate column name format
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.name)) {
        warnings.push({
          id: `warning_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          type: "best_practice",
          message: `Column name '${column.name}' should follow naming conventions`,
          location: `column:${column.name}`,
          suggestion: "Use snake_case or camelCase naming",
        });
      }
    }

    // Validate primary keys
    for (const pk of schema.primaryKeys) {
      if (!columnNames.has(pk)) {
        errors.push({
          id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "reference",
          message: `Primary key column '${pk}' does not exist`,
          location: `primary_key:${pk}`,
          severity: "error",
        });
      }
    }

    // Validate foreign keys
    for (const fk of schema.foreignKeys) {
      for (const column of fk.columns) {
        if (!columnNames.has(column)) {
          errors.push({
            id: `error_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            type: "reference",
            message: `Foreign key column '${column}' does not exist`,
            location: `foreign_key:${fk.name}`,
            severity: "error",
          });
        }
      }
    }

    // Validate indexes
    for (const index of schema.indexes) {
      for (const column of index.columns) {
        if (!columnNames.has(column)) {
          errors.push({
            id: `error_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            type: "reference",
            message: `Index column '${column}' does not exist`,
            location: `index:${index.name}`,
            severity: "error",
          });
        }
      }
    }

    // Validate constraints
    for (const constraint of schema.constraints) {
      for (const column of constraint.columns) {
        if (!columnNames.has(column)) {
          errors.push({
            id: `error_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            type: "reference",
            message: `Constraint column '${column}' does not exist`,
            location: `constraint:${constraint.name}`,
            severity: "error",
          });
        }
      }
    }

    // Performance suggestions
    if (schema.columns.length > 50) {
      suggestions.push({
        id: `suggestion_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        type: "normalization",
        message: "Consider normalizing the table - it has many columns",
        location: "table",
        impact: "medium",
      });
    }

    if (schema.indexes.length === 0 && schema.columns.length > 10) {
      suggestions.push({
        id: `suggestion_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        type: "indexing",
        message: "Consider adding indexes for better query performance",
        location: "table",
        impact: "high",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  // Migration Management
  async createMigration(
    fromVersion: string,
    toVersion: string,
    script: string,
    rollbackScript: string
  ): Promise<string> {
    const migrationId = `migration_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const migration: SchemaMigration = {
      id: migrationId,
      fromVersion,
      toVersion,
      script,
      rollbackScript,
      status: "pending",
      errors: [],
      affectedRecords: 0,
    };

    this.migrations.set(migrationId, migration);

    clientLogger.info("Schema migration created", "database", {
      migrationId,
      fromVersion,
      toVersion,
    });

    return migrationId;
  }

  async executeMigration(
    migrationId: string,
    executedBy: string = "system"
  ): Promise<boolean> {
    const migration = this.migrations.get(migrationId);
    if (!migration) return false;

    const startTime = Date.now();
    migration.status = "running";
    migration.executedBy = executedBy;

    try {
      // In a real implementation, this would execute the actual migration script
      // For now, we'll simulate the migration
      await this.simulateMigrationExecution(migration);

      migration.status = "completed";
      migration.executedAt = new Date();
      migration.duration = Date.now() - startTime;

      clientLogger.success("Schema migration completed", "database", {
        migrationId,
        duration: migration.duration,
        affectedRecords: migration.affectedRecords,
      });

      return true;
    } catch (error) {
      migration.status = "failed";
      migration.executedAt = new Date();
      migration.duration = Date.now() - startTime;
      migration.errors.push({
        id: `error_${Date.now()}`,
        type: "execution",
        message: error instanceof Error ? error.message : "Unknown error",
        details: { error },
        timestamp: new Date(),
        resolved: false,
      });

      clientLogger.error("Schema migration failed", "database", {
        migrationId,
        error,
      });

      return false;
    }
  }

  private async simulateMigrationExecution(
    migration: SchemaMigration
  ): Promise<void> {
    // Simulate migration execution time
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    // Simulate some records being affected
    migration.affectedRecords = Math.floor(Math.random() * 10000);

    // Simulate potential errors (10% chance)
    if (Math.random() < 0.1) {
      throw new Error("Simulated migration error");
    }
  }

  // Utility Methods
  private generateVersionNumber(versions: SchemaVersion[]): string {
    if (versions.length === 0) return "1.0.0";

    const latestVersion = versions[versions.length - 1];
    const [major, minor, patch] = latestVersion.version.split(".").map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  // Query Methods
  getSchemaVersions(dataSourceId: string): SchemaVersion[] {
    return this.schemas.get(dataSourceId) || [];
  }

  getActiveSchemaVersion(dataSourceId: string): SchemaVersion | undefined {
    const versions = this.schemas.get(dataSourceId);
    return versions?.find((v) => v.isActive);
  }

  getMigration(migrationId: string): SchemaMigration | undefined {
    return this.migrations.get(migrationId);
  }

  getAllMigrations(): SchemaMigration[] {
    return Array.from(this.migrations.values());
  }

  getMigrationsByStatus(status: SchemaMigration["status"]): SchemaMigration[] {
    return Array.from(this.migrations.values()).filter(
      (m) => m.status === status
    );
  }
}
