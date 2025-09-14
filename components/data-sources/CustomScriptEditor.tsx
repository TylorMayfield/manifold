"use client";

import React, { useState, useEffect } from "react";
import {
  Code,
  Play,
  Save,
  FileText,
  Globe,
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  customScriptProvider,
  ScriptTemplate,
} from "../../lib/services/CustomScriptProvider";
import { logger } from "../../lib/utils/logger";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import UndoRedoToolbar from "../ui/UndoRedoToolbar";
import { useTextUndoRedo } from "../../hooks/useUndoRedo";

interface CustomScriptEditorProps {
  projectId: string;
  onScriptCreated: (provider: any) => void;
}

export default function CustomScriptEditor({
  projectId,
  onScriptCreated,
}: CustomScriptEditorProps) {
  const [providerName, setProviderName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<
    "javascript" | "python" | "bash"
  >("javascript");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [schedule, setSchedule] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors?: string[];
  } | null>(null);

  // Undo/Redo functionality for script code
  const scriptUndoRedo = useTextUndoRedo("", {
    maxHistorySize: 50,
    debounceMs: 500,
    autoSave: false,
  });

  const scriptCode = scriptUndoRedo.value;

  const templates = customScriptProvider.getScriptTemplates();

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate);
      if (template) {
        scriptUndoRedo.setValue(template.code, false); // Don't add to history when loading template
        setSelectedLanguage(template.language);
      }
    }
  }, [selectedTemplate, templates]);

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddVariable = () => {
    const key = prompt("Enter variable name:");
    if (key && key.trim()) {
      setVariables((prev) => ({ ...prev, [key.trim()]: "" }));
    }
  };

  const handleRemoveVariable = (key: string) => {
    setVariables((prev) => {
      const newVars = { ...prev };
      delete newVars[key];
      return newVars;
    });
  };

  const validateScript = async () => {
    if (!scriptCode.trim()) {
      setValidationResult({
        isValid: false,
        errors: ["Script code cannot be empty"],
      });
      return;
    }

    try {
      const result = await customScriptProvider.validateScript(
        scriptCode,
        selectedLanguage
      );
      setValidationResult(result);

      if (result.isValid) {
        logger.info(
          "Script validation successful",
          "data-processing",
          { language: selectedLanguage },
          "CustomScriptEditor"
        );
      } else {
        logger.warn(
          "Script validation failed",
          "data-processing",
          { errors: result.errors },
          "CustomScriptEditor"
        );
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [`Validation error: ${error}`],
      });
    }
  };

  const handleCreateProvider = async () => {
    if (!providerName.trim()) {
      setError("Please enter a provider name");
      return;
    }

    if (!scriptCode.trim()) {
      setError("Please enter script code");
      return;
    }

    if (validationResult && !validationResult.isValid) {
      setError("Please fix script validation errors first");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const provider = await customScriptProvider.createCustomScriptProvider(
        projectId,
        providerName,
        {
          language: selectedLanguage,
          code: scriptCode,
          variables,
          schedule: schedule || undefined,
        }
      );

      onScriptCreated(provider);

      logger.success(
        "Custom script provider created",
        "data-processing",
        { providerId: provider.id, providerName },
        "CustomScriptEditor"
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create provider";
      setError(errorMessage);
      logger.error(
        "Failed to create custom script provider",
        "data-processing",
        { error },
        "CustomScriptEditor"
      );
    } finally {
      setLoading(false);
    }
  };

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case "javascript":
        return <Code className="h-4 w-4" />;
      case "python":
        return <FileText className="h-4 w-4" />;
      case "bash":
        return <Zap className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Name */}
      <Input
        label="Provider Name"
        value={providerName}
        onChange={(e) => setProviderName(e.target.value)}
        placeholder="e.g., API Data Fetcher, CSV Parser"
      />

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-3">
          Choose Template (Optional)
        </label>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setSelectedTemplate("")}
            className={`p-3 rounded-xl text-left transition-all ${
              selectedTemplate === ""
                ? "glass-button-primary"
                : "glass-button hover:scale-105"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg glass-button-primary">
                <Code className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Blank Script</p>
                <p className="text-white/60 text-sm">Start from scratch</p>
              </div>
            </div>
          </button>

          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-3 rounded-xl text-left transition-all ${
                selectedTemplate === template.id
                  ? "glass-button-primary"
                  : "glass-button hover:scale-105"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg glass-button-primary">
                  {getLanguageIcon(template.language)}
                </div>
                <div>
                  <p className="text-white font-medium">{template.name}</p>
                  <p className="text-white/60 text-sm">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-3">
          Script Language
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(["javascript", "python", "bash"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`p-3 rounded-xl text-center transition-all ${
                selectedLanguage === lang
                  ? "glass-button-primary"
                  : "glass-button hover:scale-105"
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 rounded-lg glass-button-primary">
                  {getLanguageIcon(lang)}
                </div>
                <span className="text-white font-medium capitalize">
                  {lang}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Script Code Editor */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-white/70">
            Script Code
          </label>
          <div className="flex items-center space-x-2">
            <UndoRedoToolbar
              undoRedo={scriptUndoRedo}
              size="sm"
              variant="minimal"
            />
            <Button
              onClick={validateScript}
              size="sm"
              variant="outline"
              icon={<CheckCircle className="h-4 w-4" />}
              disabled={!scriptCode.trim()}
            >
              Validate
            </Button>
          </div>
        </div>

        {validationResult && (
          <div
            className={`mb-3 p-3 rounded-lg ${
              validationResult.isValid
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}
          >
            <div className="flex items-center space-x-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              <span
                className={`text-sm ${
                  validationResult.isValid ? "text-green-300" : "text-red-300"
                }`}
              >
                {validationResult.isValid
                  ? "Script validation passed"
                  : validationResult.errors?.join(", ") || "Validation failed"}
              </span>
            </div>
          </div>
        )}

        <Textarea
          value={scriptCode}
          onChange={(e) => scriptUndoRedo.setValue(e.target.value)}
          placeholder={`// Enter your ${selectedLanguage} code here...`}
          rows={15}
          className="font-mono text-sm"
        />
      </div>

      {/* Variables */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-white/70">
            Variables
          </label>
          <Button
            onClick={handleAddVariable}
            size="sm"
            variant="outline"
            icon={<Code className="h-4 w-4" />}
          >
            Add Variable
          </Button>
        </div>

        {Object.keys(variables).length === 0 ? (
          <div className="p-4 glass-button rounded-xl text-center">
            <p className="text-white/60 text-sm">No variables defined</p>
            <p className="text-white/40 text-xs mt-1">
              Click "Add Variable" to define script variables
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(variables).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-3">
                <Input
                  value={key}
                  onChange={(e) => {
                    const newKey = e.target.value;
                    const newVars = { ...variables };
                    delete newVars[key];
                    newVars[newKey] = value;
                    setVariables(newVars);
                  }}
                  placeholder="Variable name"
                  className="flex-1"
                />
                <Input
                  value={value}
                  onChange={(e) => handleVariableChange(key, e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                />
                <Button
                  onClick={() => handleRemoveVariable(key)}
                  size="sm"
                  variant="ghost"
                  icon={<AlertCircle className="h-4 w-4" />}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule */}
      <Input
        label="Schedule (Optional)"
        value={schedule}
        onChange={(e) => setSchedule(e.target.value)}
        placeholder="e.g., 0 9 * * * (daily at 9 AM)"
        helperText="Cron-like schedule expression for automatic execution"
      />

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Create Button */}
      <Button
        onClick={handleCreateProvider}
        disabled={loading || !providerName.trim() || !scriptCode.trim()}
        loading={loading}
        icon={
          loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )
        }
        className="w-full"
      >
        {loading ? "Creating Provider..." : "Create Custom Script Provider"}
      </Button>
    </div>
  );
}
