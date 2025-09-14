import { logger } from "../utils/logger";

export interface QualityRule {
  id: string;
  name: string;
  description: string;
  type:
    | "completeness"
    | "accuracy"
    | "consistency"
    | "validity"
    | "uniqueness"
    | "custom";
  field?: string;
  condition: any;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualityCheck {
  id: string;
  ruleId: string;
  ruleName: string;
  dataset: string;
  timestamp: Date;
  status: "passed" | "failed" | "warning";
  score: number; // 0-100
  details: {
    totalRecords: number;
    passedRecords: number;
    failedRecords: number;
    warningRecords: number;
    violations: QualityViolation[];
    summary: string;
  };
}

export interface QualityViolation {
  recordId: string;
  field?: string;
  value?: any;
  expectedValue?: any;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface QualityAlert {
  id: string;
  ruleId: string;
  dataset: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  metadata?: any;
}

export interface DataQualityReport {
  dataset: string;
  overallScore: number;
  timestamp: Date;
  summary: {
    totalRules: number;
    passedRules: number;
    failedRules: number;
    warningRules: number;
    criticalIssues: number;
  };
  checks: QualityCheck[];
  alerts: QualityAlert[];
  recommendations: string[];
}

export class DataQualityMonitor {
  private rules: Map<string, QualityRule> = new Map();
  private checks: Map<string, QualityCheck[]> = new Map();
  private alerts: Map<string, QualityAlert[]> = new Map();
  private alertThresholds = {
    low: 80,
    medium: 70,
    high: 50,
    critical: 30,
  };

  constructor() {
    this.loadDefaultRules();
  }

  // Rule Management
  createRule(
    rule: Omit<QualityRule, "id" | "createdAt" | "updatedAt">
  ): QualityRule {
    const id = this.generateId();
    const newRule: QualityRule = {
      ...rule,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules.set(id, newRule);

    logger.info("Quality rule created", "data-quality", {
      ruleId: id,
      ruleName: rule.name,
      ruleType: rule.type,
    });

    return newRule;
  }

  updateRule(id: string, updates: Partial<QualityRule>): QualityRule | null {
    const rule = this.rules.get(id);
    if (!rule) {
      return null;
    }

    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date(),
    };

    this.rules.set(id, updatedRule);

    logger.info("Quality rule updated", "data-quality", {
      ruleId: id,
      updates,
    });

    return updatedRule;
  }

  deleteRule(id: string): boolean {
    const deleted = this.rules.delete(id);

    if (deleted) {
      logger.info("Quality rule deleted", "data-quality", {
        ruleId: id,
      });
    }

    return deleted;
  }

  getRule(id: string): QualityRule | null {
    return this.rules.get(id) || null;
  }

  getAllRules(): QualityRule[] {
    return Array.from(this.rules.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  // Quality Checking
  async checkDataQuality(
    dataset: string,
    data: any[]
  ): Promise<DataQualityReport> {
    const startTime = Date.now();
    const enabledRules = Array.from(this.rules.values()).filter(
      (rule) => rule.enabled
    );
    const checks: QualityCheck[] = [];
    const alerts: QualityAlert[] = [];

    logger.info("Starting data quality check", "data-quality", {
      dataset,
      recordCount: data.length,
      ruleCount: enabledRules.length,
    });

    // Execute all enabled rules
    for (const rule of enabledRules) {
      const check = await this.executeRule(rule, dataset, data);
      checks.push(check);

      // Generate alerts for failed rules
      if (check.status === "failed" || check.status === "warning") {
        const alert = this.createAlert(rule, check);
        alerts.push(alert);
      }
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore(checks);

    // Store results
    this.checks.set(dataset, checks);
    this.alerts.set(dataset, alerts);

    const report: DataQualityReport = {
      dataset,
      overallScore,
      timestamp: new Date(),
      summary: {
        totalRules: enabledRules.length,
        passedRules: checks.filter((c) => c.status === "passed").length,
        failedRules: checks.filter((c) => c.status === "failed").length,
        warningRules: checks.filter((c) => c.status === "warning").length,
        criticalIssues: checks.filter((c) =>
          c.details.violations.some((v) => v.severity === "critical")
        ).length,
      },
      checks,
      alerts,
      recommendations: this.generateRecommendations(checks, overallScore),
    };

    const processingTime = Date.now() - startTime;

    logger.info("Data quality check completed", "data-quality", {
      dataset,
      overallScore,
      processingTime,
      alertsGenerated: alerts.length,
    });

    return report;
  }

  private async executeRule(
    rule: QualityRule,
    dataset: string,
    data: any[]
  ): Promise<QualityCheck> {
    const violations: QualityViolation[] = [];
    let passedRecords = 0;
    let failedRecords = 0;
    let warningRecords = 0;

    try {
      switch (rule.type) {
        case "completeness":
          await this.checkCompleteness(
            rule,
            data,
            violations,
            passedRecords,
            failedRecords
          );
          break;
        case "accuracy":
          await this.checkAccuracy(
            rule,
            data,
            violations,
            passedRecords,
            failedRecords
          );
          break;
        case "consistency":
          await this.checkConsistency(
            rule,
            data,
            violations,
            passedRecords,
            failedRecords
          );
          break;
        case "validity":
          await this.checkValidity(
            rule,
            data,
            violations,
            passedRecords,
            failedRecords
          );
          break;
        case "uniqueness":
          await this.checkUniqueness(
            rule,
            data,
            violations,
            passedRecords,
            failedRecords
          );
          break;
        case "custom":
          await this.checkCustom(
            rule,
            data,
            violations,
            passedRecords,
            failedRecords
          );
          break;
      }

      const totalRecords = data.length;
      const score =
        totalRecords > 0
          ? Math.round((passedRecords / totalRecords) * 100)
          : 100;

      let status: QualityCheck["status"] = "passed";
      if (score < this.alertThresholds.critical) {
        status = "failed";
      } else if (score < this.alertThresholds.medium) {
        status = "warning";
      }

      return {
        id: this.generateId(),
        ruleId: rule.id,
        ruleName: rule.name,
        dataset,
        timestamp: new Date(),
        status,
        score,
        details: {
          totalRecords,
          passedRecords,
          failedRecords,
          warningRecords,
          violations,
          summary: this.generateCheckSummary(rule, score, violations.length),
        },
      };
    } catch (error) {
      logger.error("Rule execution failed", "data-quality", {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        id: this.generateId(),
        ruleId: rule.id,
        ruleName: rule.name,
        dataset,
        timestamp: new Date(),
        status: "failed",
        score: 0,
        details: {
          totalRecords: data.length,
          passedRecords: 0,
          failedRecords: data.length,
          warningRecords: 0,
          violations: [
            {
              recordId: "system",
              message: `Rule execution error: ${
                error instanceof Error ? error.message : String(error)
              }`,
              severity: "critical",
            },
          ],
          summary: "Rule execution failed due to system error",
        },
      };
    }
  }

  private async checkCompleteness(
    rule: QualityRule,
    data: any[],
    violations: QualityViolation[],
    passedRecords: number,
    failedRecords: number
  ): Promise<void> {
    const field = rule.field || rule.condition.field;
    const requiredFields = rule.condition.requiredFields || [field];

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const recordId = record.id || `record_${i}`;

      let isComplete = true;
      for (const fieldName of requiredFields) {
        if (
          record[fieldName] === null ||
          record[fieldName] === undefined ||
          record[fieldName] === ""
        ) {
          violations.push({
            recordId,
            field: fieldName,
            value: record[fieldName],
            message: `Required field '${fieldName}' is missing or empty`,
            severity: rule.severity,
          });
          isComplete = false;
        }
      }

      if (isComplete) {
        passedRecords++;
      } else {
        failedRecords++;
      }
    }
  }

  private async checkAccuracy(
    rule: QualityRule,
    data: any[],
    violations: QualityViolation[],
    passedRecords: number,
    failedRecords: number
  ): Promise<void> {
    const field = rule.field || rule.condition.field;
    const expectedPattern = rule.condition.pattern;
    const expectedFormat = rule.condition.format;

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const recordId = record.id || `record_${i}`;
      const value = record[field];

      if (value === null || value === undefined) {
        passedRecords++;
        continue;
      }

      let isAccurate = true;

      if (expectedPattern) {
        const regex = new RegExp(expectedPattern);
        if (!regex.test(String(value))) {
          violations.push({
            recordId,
            field,
            value,
            message: `Field '${field}' does not match expected pattern`,
            severity: rule.severity,
          });
          isAccurate = false;
        }
      }

      if (expectedFormat === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          violations.push({
            recordId,
            field,
            value,
            message: `Field '${field}' is not a valid email address`,
            severity: rule.severity,
          });
          isAccurate = false;
        }
      }

      if (expectedFormat === "phone") {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(String(value).replace(/[\s\-\(\)]/g, ""))) {
          violations.push({
            recordId,
            field,
            value,
            message: `Field '${field}' is not a valid phone number`,
            severity: rule.severity,
          });
          isAccurate = false;
        }
      }

      if (isAccurate) {
        passedRecords++;
      } else {
        failedRecords++;
      }
    }
  }

  private async checkConsistency(
    rule: QualityRule,
    data: any[],
    violations: QualityViolation[],
    passedRecords: number,
    failedRecords: number
  ): Promise<void> {
    const field = rule.field || rule.condition.field;
    const referenceField = rule.condition.referenceField;
    const expectedRelation = rule.condition.relation;

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const recordId = record.id || `record_${i}`;

      const value = record[field];
      const refValue = record[referenceField];

      if (
        value === null ||
        value === undefined ||
        refValue === null ||
        refValue === undefined
      ) {
        passedRecords++;
        continue;
      }

      let isConsistent = true;

      if (expectedRelation === "equal") {
        if (value !== refValue) {
          violations.push({
            recordId,
            field,
            value,
            expectedValue: refValue,
            message: `Field '${field}' should equal '${referenceField}'`,
            severity: rule.severity,
          });
          isConsistent = false;
        }
      } else if (expectedRelation === "greater_than") {
        if (Number(value) <= Number(refValue)) {
          violations.push({
            recordId,
            field,
            value,
            expectedValue: refValue,
            message: `Field '${field}' should be greater than '${referenceField}'`,
            severity: rule.severity,
          });
          isConsistent = false;
        }
      }

      if (isConsistent) {
        passedRecords++;
      } else {
        failedRecords++;
      }
    }
  }

  private async checkValidity(
    rule: QualityRule,
    data: any[],
    violations: QualityViolation[],
    passedRecords: number,
    failedRecords: number
  ): Promise<void> {
    const field = rule.field || rule.condition.field;
    const minValue = rule.condition.minValue;
    const maxValue = rule.condition.maxValue;
    const allowedValues = rule.condition.allowedValues;

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const recordId = record.id || `record_${i}`;
      const value = record[field];

      if (value === null || value === undefined) {
        passedRecords++;
        continue;
      }

      let isValid = true;

      if (minValue !== undefined && Number(value) < minValue) {
        violations.push({
          recordId,
          field,
          value,
          expectedValue: minValue,
          message: `Field '${field}' is below minimum value of ${minValue}`,
          severity: rule.severity,
        });
        isValid = false;
      }

      if (maxValue !== undefined && Number(value) > maxValue) {
        violations.push({
          recordId,
          field,
          value,
          expectedValue: maxValue,
          message: `Field '${field}' is above maximum value of ${maxValue}`,
          severity: rule.severity,
        });
        isValid = false;
      }

      if (allowedValues && !allowedValues.includes(value)) {
        violations.push({
          recordId,
          field,
          value,
          expectedValue: allowedValues,
          message: `Field '${field}' has invalid value. Allowed values: ${allowedValues.join(
            ", "
          )}`,
          severity: rule.severity,
        });
        isValid = false;
      }

      if (isValid) {
        passedRecords++;
      } else {
        failedRecords++;
      }
    }
  }

  private async checkUniqueness(
    rule: QualityRule,
    data: any[],
    violations: QualityViolation[],
    passedRecords: number,
    failedRecords: number
  ): Promise<void> {
    const field = rule.field || rule.condition.field;
    const valueCounts = new Map<any, number[]>();

    // Count occurrences of each value
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const value = record[field];

      if (value !== null && value !== undefined) {
        if (!valueCounts.has(value)) {
          valueCounts.set(value, []);
        }
        valueCounts.get(value)!.push(i);
      }
    }

    // Find duplicates
    for (const [value, indices] of valueCounts.entries()) {
      if (indices.length > 1) {
        for (const index of indices) {
          const record = data[index];
          const recordId = record.id || `record_${index}`;

          violations.push({
            recordId,
            field,
            value,
            message: `Duplicate value found in field '${field}'. ${indices.length} records have the same value`,
            severity: rule.severity,
          });
          failedRecords++;
        }
      } else {
        passedRecords++;
      }
    }
  }

  private async checkCustom(
    rule: QualityRule,
    data: any[],
    violations: QualityViolation[],
    passedRecords: number,
    failedRecords: number
  ): Promise<void> {
    try {
      // In a real implementation, this would execute user-defined JavaScript
      // For now, we'll just simulate a custom check
      const script = rule.condition.script;

      // Simulate custom validation
      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        const recordId = record.id || `record_${i}`;

        // Simple example: check if a field contains only letters
        const field = rule.condition.field;
        const value = record[field];

        if (
          value &&
          typeof value === "string" &&
          !/^[a-zA-Z\s]+$/.test(value)
        ) {
          violations.push({
            recordId,
            field,
            value,
            message: `Custom validation failed for field '${field}'`,
            severity: rule.severity,
          });
          failedRecords++;
        } else {
          passedRecords++;
        }
      }
    } catch (error) {
      logger.error("Custom rule execution failed", "data-quality", {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Mark all records as failed due to script error
      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        const recordId = record.id || `record_${i}`;

        violations.push({
          recordId,
          message: `Custom script error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          severity: "critical",
        });
        failedRecords++;
      }
    }
  }

  private createAlert(rule: QualityRule, check: QualityCheck): QualityAlert {
    return {
      id: this.generateId(),
      ruleId: rule.id,
      dataset: check.dataset,
      severity: rule.severity,
      message: `Quality rule '${rule.name}' failed: ${check.details.summary}`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      metadata: {
        checkId: check.id,
        score: check.score,
        violationCount: check.details.violations.length,
      },
    };
  }

  private calculateOverallScore(checks: QualityCheck[]): number {
    if (checks.length === 0) return 100;

    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    return Math.round(totalScore / checks.length);
  }

  private generateCheckSummary(
    rule: QualityRule,
    score: number,
    violationCount: number
  ): string {
    if (score === 100) {
      return `All records passed the ${rule.name} check`;
    } else if (violationCount === 1) {
      return `${violationCount} violation found (${score}% pass rate)`;
    } else {
      return `${violationCount} violations found (${score}% pass rate)`;
    }
  }

  private generateRecommendations(
    checks: QualityCheck[],
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore < 50) {
      recommendations.push(
        "Data quality is critically low. Immediate attention required."
      );
    } else if (overallScore < 70) {
      recommendations.push(
        "Data quality needs improvement. Review failed rules."
      );
    }

    const failedRules = checks.filter((c) => c.status === "failed");
    if (failedRules.length > 0) {
      recommendations.push(
        `Review and fix ${failedRules.length} failed quality rules`
      );
    }

    const criticalIssues = checks.filter((c) =>
      c.details.violations.some((v) => v.severity === "critical")
    );
    if (criticalIssues.length > 0) {
      recommendations.push(
        `Address ${criticalIssues.length} critical quality issues immediately`
      );
    }

    const completenessIssues = checks.filter((c) =>
      c.ruleId.includes("completeness")
    );
    if (completenessIssues.length > 0) {
      recommendations.push(
        "Consider implementing data validation at input to improve completeness"
      );
    }

    return recommendations;
  }

  // Alert Management
  getAlerts(dataset?: string): QualityAlert[] {
    if (dataset) {
      return this.alerts.get(dataset) || [];
    }

    const allAlerts: QualityAlert[] = [];
    for (const alerts of this.alerts.values()) {
      allAlerts.push(...alerts);
    }

    return allAlerts.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  acknowledgeAlert(alertId: string): boolean {
    for (const alerts of this.alerts.values()) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        logger.info("Alert acknowledged", "data-quality", {
          alertId,
        });
        return true;
      }
    }
    return false;
  }

  resolveAlert(alertId: string): boolean {
    for (const alerts of this.alerts.values()) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        logger.info("Alert resolved", "data-quality", {
          alertId,
        });
        return true;
      }
    }
    return false;
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private loadDefaultRules(): void {
    const defaultRules: Omit<QualityRule, "id" | "createdAt" | "updatedAt">[] =
      [
        {
          name: "Required Fields Check",
          description: "Ensures all required fields are present",
          type: "completeness",
          field: "id",
          condition: {
            requiredFields: ["id", "name", "email"],
          },
          severity: "high",
          enabled: true,
        },
        {
          name: "Email Format Validation",
          description: "Validates email address format",
          type: "accuracy",
          field: "email",
          condition: {
            format: "email",
          },
          severity: "medium",
          enabled: true,
        },
        {
          name: "Unique ID Check",
          description: "Ensures ID field values are unique",
          type: "uniqueness",
          field: "id",
          condition: {},
          severity: "critical",
          enabled: true,
        },
        {
          name: "Age Range Validation",
          description: "Validates age is within reasonable range",
          type: "validity",
          field: "age",
          condition: {
            minValue: 0,
            maxValue: 150,
          },
          severity: "medium",
          enabled: false,
        },
      ];

    for (const rule of defaultRules) {
      this.createRule(rule);
    }
  }
}
