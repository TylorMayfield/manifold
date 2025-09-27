"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Play,
  Plus,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Bell,
  BellOff,
} from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import {
  DataQualityMonitor,
  QualityRule,
  DataQualityReport,
  QualityAlert,
} from "../../lib/server/services/DataQualityMonitor";
import { clientLogger } from "../../lib/utils/ClientLogger";

interface DataQualityDashboardProps {
  dataset?: string;
  onQualityCheck?: (report: DataQualityReport) => void;
}

export const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({
  dataset = "default",
  onQualityCheck,
}) => {
  const [monitor] = useState(() => new DataQualityMonitor());
  const [rules, setRules] = useState<QualityRule[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [latestReport, setLatestReport] = useState<DataQualityReport | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "rules" | "alerts" | "history"
  >("overview");
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [showRuleDetails, setShowRuleDetails] = useState<string | null>(null);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [sampleData] = useState([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      age: 30,
      phone: "123-456-7890",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      age: 25,
      phone: "987-654-3210",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "invalid-email",
      age: 35,
      phone: "555-123-4567",
    },
    {
      id: "4",
      name: "",
      email: "bob@example.com",
      age: 40,
      phone: "111-222-3333",
    },
    {
      id: "5",
      name: "Alice Brown",
      email: "alice@example.com",
      age: 200,
      phone: "444-555-6666",
    },
  ]);

  useEffect(() => {
    loadRules();
    loadAlerts();
    runInitialCheck();
  }, []);

  const loadRules = () => {
    const allRules = monitor.getAllRules();
    setRules(allRules);
  };

  const loadAlerts = () => {
    const allAlerts = monitor.getAlerts(dataset);
    setAlerts(allAlerts);
  };

  const runInitialCheck = async () => {
    try {
      const report = await monitor.checkDataQuality(dataset, sampleData);
      setLatestReport(report);
      loadAlerts();

      if (onQualityCheck) {
        onQualityCheck(report);
      }
    } catch (error) {
      clientLogger.error("Initial quality check failed", "data-quality", {
        error: (error as Error).message,
      });
    }
  };

  const handleRunQualityCheck = async () => {
    setIsRunningCheck(true);
    try {
      const report = await monitor.checkDataQuality(dataset, sampleData);
      setLatestReport(report);
      loadAlerts();

      clientLogger.info("Quality check completed", "data-quality", {
        dataset,
        overallScore: report.overallScore,
      });

      if (onQualityCheck) {
        onQualityCheck(report);
      }
    } catch (error) {
      clientLogger.error("Quality check failed", "data-quality", {
        error: (error as Error).message,
      });
    } finally {
      setIsRunningCheck(false);
    }
  };

  const handleCreateRule = (ruleData: any) => {
    const newRule = monitor.createRule(ruleData);
    loadRules();
    setShowCreateRule(false);

    clientLogger.info("Quality rule created", "data-quality", {
      ruleId: newRule.id,
      ruleName: newRule.name,
    });
  };

  const handleToggleRule = (ruleId: string) => {
    const rule = monitor.getRule(ruleId);
    if (rule) {
      monitor.updateRule(ruleId, { enabled: !rule.enabled });
      loadRules();
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    monitor.deleteRule(ruleId);
    loadRules();
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    monitor.acknowledgeAlert(alertId);
    loadAlerts();
  };

  const handleResolveAlert = (alertId: string) => {
    monitor.resolveAlert(alertId);
    loadAlerts();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-apricot-400";
    if (score >= 70) return "text-tangerine-400";
    if (score >= 50) return "text-tangerine-500";
    return "text-jasper-400";
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 90) return "bg-apricot-500";
    if (score >= 70) return "bg-tangerine-500";
    if (score >= 50) return "bg-tangerine-600";
    return "bg-jasper-500";
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case "critical":
        return "text-jasper-400 bg-jasper-500/20";
      case "high":
        return "text-jasper-500 bg-jasper-600/20";
      case "medium":
        return "text-tangerine-400 bg-tangerine-500/20";
      case "low":
        return "text-dark_cyan-400 bg-dark_cyan-500/20";
      default:
        return "text-dark_cyan-300 bg-dark_cyan-400/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-4 h-4 text-apricot-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-jasper-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-tangerine-400" />;
      default:
        return <Clock className="w-4 h-4 text-dark_cyan-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col glass-card">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Data Quality Dashboard
            </h3>
            <p className="text-sm text-gray-400">
              Monitor and improve data quality
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateRule(true)}
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleRunQualityCheck}
              disabled={isRunningCheck}
            >
              {isRunningCheck ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run Check
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "rules", label: "Rules", icon: Settings },
            { id: "alerts", label: "Alerts", icon: Bell },
            { id: "history", label: "History", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="p-4 space-y-6">
            {/* Quality Score */}
            {latestReport && (
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">
                    Overall Quality Score
                  </h4>
                  <div className="flex items-center gap-2">
                    {latestReport.overallScore >= 90 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <span
                      className={`text-2xl font-bold ${getScoreColor(
                        latestReport.overallScore
                      )}`}
                    >
                      {latestReport.overallScore}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-white/10 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getScoreBgColor(
                      latestReport.overallScore
                    )}`}
                    style={{ width: `${latestReport.overallScore}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-400">
                      {latestReport.summary.passedRules}
                    </div>
                    <div className="text-gray-400">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-400">
                      {latestReport.summary.warningRules}
                    </div>
                    <div className="text-gray-400">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-400">
                      {latestReport.summary.failedRules}
                    </div>
                    <div className="text-gray-400">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-400">
                      {latestReport.summary.criticalIssues}
                    </div>
                    <div className="text-gray-400">Critical</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Checks */}
            {latestReport && (
              <div className="glass-card p-6">
                <h4 className="text-lg font-semibold mb-4">
                  Recent Quality Checks
                </h4>

                <div className="space-y-3">
                  {latestReport.checks.slice(0, 5).map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <h5 className="font-medium">{check.ruleName}</h5>
                          <p className="text-sm text-gray-400">
                            {check.details.summary}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold ${getScoreColor(
                            check.score
                          )}`}
                        >
                          {check.score}%
                        </div>
                        <div className="text-xs text-gray-400">
                          {check.details.totalRecords} records
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {latestReport && latestReport.recommendations.length > 0 && (
              <div className="glass-card p-6">
                <h4 className="text-lg font-semibold mb-4">Recommendations</h4>

                <div className="space-y-2">
                  {latestReport.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10"
                    >
                      <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "rules" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Quality Rules</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateRule(true)}
              >
                <Plus className="w-4 h-4" />
                Add Rule
              </Button>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${getSeverityColor(
                          rule.severity
                        )} flex items-center justify-center`}
                      >
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-medium">{rule.name}</h5>
                        <p className="text-sm text-gray-400">
                          {rule.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${getSeverityColor(
                          rule.severity
                        )}`}
                      >
                        {rule.severity}
                      </span>

                      <Button
                        variant={rule.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleRule(rule.id)}
                      >
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRuleDetails(rule.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>Type: {rule.type}</span>
                    {rule.field && <span>Field: {rule.field}</span>}
                    <span>Created: {rule.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="p-4 space-y-4">
            <h4 className="text-lg font-semibold">Quality Alerts</h4>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No quality alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="glass-card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg ${getSeverityColor(
                            alert.severity
                          )} flex items-center justify-center`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-medium">{alert.message}</h5>
                          <p className="text-sm text-gray-400">
                            {alert.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            <Bell className="w-4 h-4" />
                            Acknowledge
                          </Button>
                        )}

                        {!alert.resolved && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-gray-400">
                        Dataset: {alert.dataset}
                      </span>
                      {alert.acknowledged && (
                        <span className="text-blue-400">Acknowledged</span>
                      )}
                      {alert.resolved && (
                        <span className="text-green-400">Resolved</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-4 space-y-4">
            <h4 className="text-lg font-semibold">Quality Check History</h4>

            <div className="text-center py-8 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Quality check history will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      <Modal
        isOpen={showCreateRule}
        onClose={() => setShowCreateRule(false)}
        title="Create Quality Rule"
      >
        <CreateRuleForm
          onSubmit={handleCreateRule}
          onCancel={() => setShowCreateRule(false)}
        />
      </Modal>

      {/* Rule Details Modal */}
      <Modal
        isOpen={showRuleDetails !== null}
        onClose={() => setShowRuleDetails(null)}
        title="Rule Details"
      >
        {showRuleDetails && (
          <RuleDetailsView ruleId={showRuleDetails} monitor={monitor} />
        )}
      </Modal>
    </div>
  );
};

// Create Rule Form Component
interface CreateRuleFormProps {
  onSubmit: (ruleData: any) => void;
  onCancel: () => void;
}

const CreateRuleForm: React.FC<CreateRuleFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<QualityRule["type"]>("completeness");
  const [field, setField] = useState("");
  const [severity, setSeverity] = useState<QualityRule["severity"]>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({
        name: name.trim(),
        description: description.trim(),
        type,
        field: field.trim(),
        condition: getDefaultCondition(type),
        severity,
        enabled: true,
      });
    }
  };

  const getDefaultCondition = (type: QualityRule["type"]): any => {
    switch (type) {
      case "completeness":
        return { requiredFields: [field] };
      case "accuracy":
        return { format: "email" };
      case "validity":
        return { minValue: 0, maxValue: 100 };
      case "uniqueness":
        return {};
      case "consistency":
        return { referenceField: "", relation: "equal" };
      case "custom":
        return { script: "// Custom validation script" };
      default:
        return {};
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rule Name</label>
        <Input
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          placeholder="Enter rule name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          placeholder="Describe what this rule checks"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as QualityRule["type"])}
          className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
        >
          <option value="completeness">Completeness</option>
          <option value="accuracy">Accuracy</option>
          <option value="validity">Validity</option>
          <option value="uniqueness">Uniqueness</option>
          <option value="consistency">Consistency</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Field</label>
        <Input
          value={field}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setField(e.target.value)
          }
          placeholder="Enter field name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Severity</label>
        <select
          value={severity}
          onChange={(e) =>
            setSeverity(e.target.value as QualityRule["severity"])
          }
          className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          Create Rule
        </Button>
      </div>
    </form>
  );
};

// Rule Details View Component
interface RuleDetailsViewProps {
  ruleId: string;
  monitor: DataQualityMonitor;
}

const RuleDetailsView: React.FC<RuleDetailsViewProps> = ({
  ruleId,
  monitor,
}) => {
  const [rule, setRule] = useState<QualityRule | null>(null);

  useEffect(() => {
    const ruleData = monitor.getRule(ruleId);
    setRule(ruleData);
  }, [ruleId, monitor]);

  if (!rule) {
    return <div className="p-4">Rule not found</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">{rule.name}</h4>
        <p className="text-gray-400">{rule.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Type:</span>
          <span className="ml-2">{rule.type}</span>
        </div>
        <div>
          <span className="text-gray-400">Field:</span>
          <span className="ml-2">{rule.field || "N/A"}</span>
        </div>
        <div>
          <span className="text-gray-400">Severity:</span>
          <span className="ml-2">{rule.severity}</span>
        </div>
        <div>
          <span className="text-gray-400">Status:</span>
          <span className="ml-2">{rule.enabled ? "Enabled" : "Disabled"}</span>
        </div>
        <div>
          <span className="text-gray-400">Created:</span>
          <span className="ml-2">{rule.createdAt.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-400">Updated:</span>
          <span className="ml-2">{rule.updatedAt.toLocaleString()}</span>
        </div>
      </div>

      <div>
        <span className="text-gray-400">Configuration:</span>
        <pre className="mt-2 p-3 bg-white/10 rounded-lg text-sm overflow-x-auto">
          {JSON.stringify(rule.condition, null, 2)}
        </pre>
      </div>
    </div>
  );
};
