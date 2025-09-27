import { clientLogger } from "../utils/ClientLogger";

export interface DataQualityRule {
  id: string;
  name: string;
  description: string;
  type:
    | "completeness"
    | "accuracy"
    | "consistency"
    | "validity"
    | "uniqueness"
    | "timeliness";
  severity: "error" | "warning" | "info";
  config: any;
  enabled: boolean;
}

export interface DataQualityCheck {
  id: string;
  ruleId: string;
  dataSourceId: string;
  status: "pending" | "running" | "completed" | "failed";
  result: {
    passed: boolean;
    score: number; // 0-100
    issues: DataQualityIssue[];
    metrics: Record<string, any>;
  };
  executedAt: Date;
  executionTime: number; // milliseconds
}

export interface DataQualityIssue {
  id: string;
  type: string;
  severity: "error" | "warning" | "info";
  message: string;
  affectedRecords: number;
  details: any;
}

export interface DataQualityProfile {
  dataSourceId: string;
  totalRecords: number;
  qualityScore: number;
  lastChecked: Date;
  checks: DataQualityCheck[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export class DataQualityFramework {
  private static instance: DataQualityFramework;
  private rules: Map<string, DataQualityRule> = new Map();
  private profiles: Map<string, DataQualityProfile> = new Map();

  static getInstance(): DataQualityFramework {
    if (!DataQualityFramework.instance) {
      DataQualityFramework.instance = new DataQualityFramework();
    }
    return DataQualityFramework.instance;
  }

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaultRules: DataQualityRule[] = [
      {
        id: "completeness_null_check",
        name: "Null Value Check",
        description: "Check for null values in required fields",
        type: "completeness",
        severity: "error",
        config: { fields: [], threshold: 0 },
        enabled: true,
      },
      {
        id: "accuracy_format_check",
        name: "Format Validation",
        description: "Validate data format (email, phone, date, etc.)",
        type: "accuracy",
        severity: "warning",
        config: { patterns: {} },
        enabled: true,
      },
      {
        id: "uniqueness_duplicate_check",
        name: "Duplicate Detection",
        description: "Check for duplicate records",
        type: "uniqueness",
        severity: "warning",
        config: { keyFields: [] },
        enabled: true,
      },
      {
        id: "consistency_reference_check",
        name: "Referential Integrity",
        description: "Check foreign key relationships",
        type: "consistency",
        severity: "error",
        config: { relationships: [] },
        enabled: true,
      },
      {
        id: "validity_range_check",
        name: "Range Validation",
        description: "Validate numeric ranges and constraints",
        type: "validity",
        severity: "warning",
        config: { ranges: {} },
        enabled: true,
      },
      {
        id: "timeliness_freshness_check",
        name: "Data Freshness",
        description: "Check data recency and update frequency",
        type: "timeliness",
        severity: "info",
        config: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
        enabled: true,
      },
    ];

    defaultRules.forEach((rule) => {
      this.rules.set(rule.id, rule);
    });
  }

  async runQualityChecks(
    dataSourceId: string,
    data: any[]
  ): Promise<DataQualityProfile> {
    const startTime = Date.now();
    const checks: DataQualityCheck[] = [];
    let totalScore = 0;
    let totalChecks = 0;

    clientLogger.info("Starting data quality checks", "data-quality", {
      dataSourceId,
      recordCount: data.length,
    });

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      try {
        const check = await this.executeRule(rule, dataSourceId, data);
        checks.push(check);

        if (check.result.passed) {
          totalScore += 100;
        } else {
          totalScore += check.result.score;
        }
        totalChecks++;
      } catch (error) {
        clientLogger.error("Data quality check failed", "data-quality", {
          ruleId,
          dataSourceId,
          error,
        });

        checks.push({
          id: `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ruleId,
          dataSourceId,
          status: "failed",
          result: {
            passed: false,
            score: 0,
            issues: [
              {
                id: `issue_${Date.now()}`,
                type: "execution_error",
                severity: "error",
                message: `Check execution failed: ${
                  error instanceof Error ? error.message : error
                }`,
                affectedRecords: 0,
                details: { error },
              },
            ],
            metrics: {},
          },
          executedAt: new Date(),
          executionTime: 0,
        });
      }
    }

    const executionTime = Date.now() - startTime;
    const qualityScore =
      totalChecks > 0 ? Math.round(totalScore / totalChecks) : 100;

    const profile: DataQualityProfile = {
      dataSourceId,
      totalRecords: data.length,
      qualityScore,
      lastChecked: new Date(),
      checks,
      summary: {
        errors: checks.reduce(
          (sum, check) =>
            sum +
            check.result.issues.filter((issue) => issue.severity === "error")
              .length,
          0
        ),
        warnings: checks.reduce(
          (sum, check) =>
            sum +
            check.result.issues.filter((issue) => issue.severity === "warning")
              .length,
          0
        ),
        info: checks.reduce(
          (sum, check) =>
            sum +
            check.result.issues.filter((issue) => issue.severity === "info")
              .length,
          0
        ),
      },
    };

    this.profiles.set(dataSourceId, profile);

    clientLogger.success("Data quality checks completed", "data-quality", {
      dataSourceId,
      qualityScore,
      executionTime,
      totalIssues:
        profile.summary.errors +
        profile.summary.warnings +
        profile.summary.info,
    });

    return profile;
  }

  private async executeRule(
    rule: DataQualityRule,
    dataSourceId: string,
    data: any[]
  ): Promise<DataQualityCheck> {
    const startTime = Date.now();
    const checkId = `check_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    let result: DataQualityCheck["result"];

    switch (rule.type) {
      case "completeness":
        result = await this.checkCompleteness(rule, data);
        break;
      case "accuracy":
        result = await this.checkAccuracy(rule, data);
        break;
      case "consistency":
        result = await this.checkConsistency(rule, data);
        break;
      case "validity":
        result = await this.checkValidity(rule, data);
        break;
      case "uniqueness":
        result = await this.checkUniqueness(rule, data);
        break;
      case "timeliness":
        result = await this.checkTimeliness(rule, data);
        break;
      default:
        throw new Error(`Unknown rule type: ${rule.type}`);
    }

    return {
      id: checkId,
      ruleId: rule.id,
      dataSourceId,
      status: "completed",
      result,
      executedAt: new Date(),
      executionTime: Date.now() - startTime,
    };
  }

  private async checkCompleteness(
    rule: DataQualityRule,
    data: any[]
  ): Promise<DataQualityCheck["result"]> {
    const { fields, threshold } = rule.config;
    const issues: DataQualityIssue[] = [];
    let totalNulls = 0;

    if (fields.length === 0) {
      // Check all fields
      const sampleRecord = data[0];
      if (sampleRecord) {
        fields.push(...Object.keys(sampleRecord));
      }
    }

    for (const field of fields) {
      const nullCount = data.filter(
        (record) =>
          record[field] === null ||
          record[field] === undefined ||
          record[field] === ""
      ).length;

      if (nullCount > 0) {
        const nullPercentage = (nullCount / data.length) * 100;
        totalNulls += nullCount;

        if (nullPercentage > threshold) {
          issues.push({
            id: `issue_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            type: "completeness",
            severity: rule.severity,
            message: `Field '${field}' has ${nullPercentage.toFixed(
              2
            )}% null values (${nullCount}/${data.length})`,
            affectedRecords: nullCount,
            details: { field, nullPercentage, threshold },
          });
        }
      }
    }

    const score =
      data.length > 0
        ? Math.max(0, 100 - (totalNulls / data.length) * 100)
        : 100;

    return {
      passed: issues.length === 0,
      score: Math.round(score),
      issues,
      metrics: {
        totalRecords: data.length,
        totalNulls,
        nullPercentage: data.length > 0 ? (totalNulls / data.length) * 100 : 0,
      },
    };
  }

  private async checkAccuracy(
    rule: DataQualityRule,
    data: any[]
  ): Promise<DataQualityCheck["result"]> {
    const { patterns } = rule.config;
    const issues: DataQualityIssue[] = [];
    let totalInvalid = 0;

    for (const [field, pattern] of Object.entries(patterns)) {
      const regex = new RegExp(pattern as string);
      const invalidRecords = data.filter((record) => {
        const value = record[field];
        return (
          value !== null && value !== undefined && !regex.test(String(value))
        );
      });

      if (invalidRecords.length > 0) {
        totalInvalid += invalidRecords.length;
        issues.push({
          id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "accuracy",
          severity: rule.severity,
          message: `Field '${field}' has ${invalidRecords.length} records with invalid format`,
          affectedRecords: invalidRecords.length,
          details: {
            field,
            pattern,
            invalidRecords: invalidRecords.slice(0, 5),
          },
        });
      }
    }

    const score =
      data.length > 0
        ? Math.max(0, 100 - (totalInvalid / data.length) * 100)
        : 100;

    return {
      passed: issues.length === 0,
      score: Math.round(score),
      issues,
      metrics: {
        totalRecords: data.length,
        totalInvalid,
        invalidPercentage:
          data.length > 0 ? (totalInvalid / data.length) * 100 : 0,
      },
    };
  }

  private async checkUniqueness(
    rule: DataQualityRule,
    data: any[]
  ): Promise<DataQualityCheck["result"]> {
    const { keyFields } = rule.config;
    const issues: DataQualityIssue[] = [];
    let totalDuplicates = 0;

    if (keyFields.length === 0) {
      // Check all fields for uniqueness
      const sampleRecord = data[0];
      if (sampleRecord) {
        keyFields.push(...Object.keys(sampleRecord));
      }
    }

    for (const field of keyFields) {
      const values = data.map((record) => record[field]);
      const uniqueValues = new Set(values);
      const duplicates = data.length - uniqueValues.size;

      if (duplicates > 0) {
        totalDuplicates += duplicates;
        issues.push({
          id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "uniqueness",
          severity: rule.severity,
          message: `Field '${field}' has ${duplicates} duplicate values`,
          affectedRecords: duplicates,
          details: {
            field,
            uniqueCount: uniqueValues.size,
            totalCount: data.length,
          },
        });
      }
    }

    const score =
      data.length > 0
        ? Math.max(0, 100 - (totalDuplicates / data.length) * 100)
        : 100;

    return {
      passed: issues.length === 0,
      score: Math.round(score),
      issues,
      metrics: {
        totalRecords: data.length,
        totalDuplicates,
        duplicatePercentage:
          data.length > 0 ? (totalDuplicates / data.length) * 100 : 0,
      },
    };
  }

  private async checkConsistency(
    rule: DataQualityRule,
    data: any[]
  ): Promise<DataQualityCheck["result"]> {
    // Placeholder for referential integrity checks
    // This would need access to relationship definitions
    return {
      passed: true,
      score: 100,
      issues: [],
      metrics: { totalRecords: data.length },
    };
  }

  private async checkValidity(
    rule: DataQualityRule,
    data: any[]
  ): Promise<DataQualityCheck["result"]> {
    const { ranges } = rule.config;
    const issues: DataQualityIssue[] = [];
    let totalInvalid = 0;

    for (const [field, range] of Object.entries(ranges)) {
      const { min, max } = range as { min: number; max: number };
      const invalidRecords = data.filter((record) => {
        const value = Number(record[field]);
        return !isNaN(value) && (value < min || value > max);
      });

      if (invalidRecords.length > 0) {
        totalInvalid += invalidRecords.length;
        issues.push({
          id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "validity",
          severity: rule.severity,
          message: `Field '${field}' has ${invalidRecords.length} records outside valid range [${min}, ${max}]`,
          affectedRecords: invalidRecords.length,
          details: {
            field,
            min,
            max,
            invalidRecords: invalidRecords.slice(0, 5),
          },
        });
      }
    }

    const score =
      data.length > 0
        ? Math.max(0, 100 - (totalInvalid / data.length) * 100)
        : 100;

    return {
      passed: issues.length === 0,
      score: Math.round(score),
      issues,
      metrics: {
        totalRecords: data.length,
        totalInvalid,
        invalidPercentage:
          data.length > 0 ? (totalInvalid / data.length) * 100 : 0,
      },
    };
  }

  private async checkTimeliness(
    rule: DataQualityRule,
    data: any[]
  ): Promise<DataQualityCheck["result"]> {
    const { maxAge } = rule.config;
    const issues: DataQualityIssue[] = [];
    let totalStale = 0;

    // Check for timestamp fields
    const timestampFields = ["createdAt", "updatedAt", "timestamp", "date"];

    for (const field of timestampFields) {
      const staleRecords = data.filter((record) => {
        const timestamp = new Date(record[field]);
        if (isNaN(timestamp.getTime())) return false;

        const age = Date.now() - timestamp.getTime();
        return age > maxAge;
      });

      if (staleRecords.length > 0) {
        totalStale += staleRecords.length;
        issues.push({
          id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "timeliness",
          severity: rule.severity,
          message: `Field '${field}' has ${
            staleRecords.length
          } stale records (older than ${maxAge / (1000 * 60 * 60)} hours)`,
          affectedRecords: staleRecords.length,
          details: { field, maxAge, staleRecords: staleRecords.slice(0, 5) },
        });
      }
    }

    const score =
      data.length > 0
        ? Math.max(0, 100 - (totalStale / data.length) * 100)
        : 100;

    return {
      passed: issues.length === 0,
      score: Math.round(score),
      issues,
      metrics: {
        totalRecords: data.length,
        totalStale,
        stalePercentage: data.length > 0 ? (totalStale / data.length) * 100 : 0,
      },
    };
  }

  getProfile(dataSourceId: string): DataQualityProfile | undefined {
    return this.profiles.get(dataSourceId);
  }

  getAllProfiles(): DataQualityProfile[] {
    return Array.from(this.profiles.values());
  }

  addRule(rule: DataQualityRule): void {
    this.rules.set(rule.id, rule);
  }

  updateRule(ruleId: string, updates: Partial<DataQualityRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
    }
  }

  deleteRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  getRules(): DataQualityRule[] {
    return Array.from(this.rules.values());
  }
}
