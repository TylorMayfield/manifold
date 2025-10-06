"use client";

import React, { useState } from 'react';
import {
  TestTube,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Download,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import CellInput from '../ui/CellInput';
import CellModal from '../ui/CellModal';
import StatusBadge from '../ui/StatusBadge';

interface PipelineTestRunnerProps {
  pipelineId: string;
  pipelineName: string;
  inputSourceIds: string[];
}

interface TestAssertion {
  id: string;
  type: 'record_count' | 'field_exists' | 'no_nulls' | 'unique';
  description: string;
  config: any;
}

export default function PipelineTestRunner({
  pipelineId,
  pipelineName,
  inputSourceIds,
}: PipelineTestRunnerProps) {
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  const [testConfig, setTestConfig] = useState({
    name: '',
    description: '',
    mode: 'sample' as 'sample' | 'custom' | 'mock',
    sampleSize: 100,
    assertions: [] as TestAssertion[],
  });

  const handleRunTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch(`/api/pipelines/${pipelineId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName: testConfig.name || `Quick Test ${new Date().toLocaleString()}`,
          testDescription: testConfig.description,
          testDataConfig: {
            mode: testConfig.mode,
            sampleSize: testConfig.sampleSize,
            sourceIds: inputSourceIds,
          },
          assertions: testConfig.assertions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(data.result);
        setShowCreateTest(false);
      } else {
        const error = await response.json();
        alert(`Test failed: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      alert('Failed to run test');
    } finally {
      setTesting(false);
    }
  };

  const addAssertion = (type: string) => {
    const newAssertion: TestAssertion = {
      id: `assertion-${Date.now()}`,
      type: type as any,
      description: `Check ${type.replace('_', ' ')}`,
      config: {},
    };

    setTestConfig(prev => ({
      ...prev,
      assertions: [...prev.assertions, newAssertion],
    }));
  };

  const removeAssertion = (id: string) => {
    setTestConfig(prev => ({
      ...prev,
      assertions: prev.assertions.filter(a => a.id !== id),
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      default:
        return <TestTube className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Test Runner Card */}
      <CellCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <TestTube className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-bold text-lg">Pipeline Test Runner</h3>
              <p className="text-caption text-gray-600">
                Test {pipelineName} with sample data before production
              </p>
            </div>
          </div>
          <CellButton
            variant="primary"
            onClick={() => setShowCreateTest(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Test
          </CellButton>
        </div>

        {/* Quick Test Button */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm mb-1">Quick Test</p>
              <p className="text-caption text-gray-600">
                Run pipeline with first 100 records (no assertions)
              </p>
            </div>
            <CellButton
              variant="accent"
              onClick={async () => {
                setTestConfig({
                  name: `Quick Test ${new Date().toLocaleTimeString()}`,
                  description: '',
                  mode: 'sample',
                  sampleSize: 100,
                  assertions: [],
                });
                await handleRunTest();
              }}
              disabled={testing}
              isLoading={testing}
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Quick Test
                </>
              )}
            </CellButton>
          </div>
        </div>
      </CellCard>

      {/* Test Result */}
      {testResult && (
        <CellCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {getStatusIcon(testResult.status)}
              <div>
                <h3 className="font-bold text-lg">Test Result</h3>
                <p className="text-caption text-gray-600">
                  {new Date(testResult.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <StatusBadge
              status={
                testResult.status === 'passed' ? 'completed' :
                testResult.status === 'failed' ? 'failed' :
                'paused'
              }
              label={testResult.status.toUpperCase()}
            />
          </div>

          {/* Execution Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-caption font-bold text-gray-600">Input Records</p>
              <p className="text-heading font-mono">{testResult.executionResult.inputRecords}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-caption font-bold text-gray-600">Output Records</p>
              <p className="text-heading font-mono">{testResult.executionResult.outputRecords}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-caption font-bold text-gray-600">Duration</p>
              <p className="text-heading font-mono">{testResult.duration}ms</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-caption font-bold text-gray-600">Steps</p>
              <p className="text-heading font-mono">{testResult.executionResult.steps.length}</p>
            </div>
          </div>

          {/* Assertion Results */}
          {testResult.assertionResults.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-sm mb-3">
                Assertions ({testResult.assertionResults.filter((a: any) => a.passed).length}/{testResult.assertionResults.length} passed)
              </h4>
              <div className="space-y-2">
                {testResult.assertionResults.map((assertion: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      assertion.passed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {assertion.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-sm">{assertion.description}</p>
                      <p className="text-xs text-gray-600 mt-1">{assertion.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step Results */}
          <div>
            <h4 className="font-bold text-sm mb-3">Step Execution</h4>
            <div className="space-y-2">
              {testResult.executionResult.steps.map((step: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-mono font-bold text-sm">{step.stepName}</p>
                      <p className="text-xs text-gray-600">
                        {step.stepType} • {step.inputRecords} → {step.outputRecords} records
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {step.inputRecords !== step.outputRecords && (
                      <span className="text-xs text-gray-600">
                        {step.outputRecords > step.inputRecords ? (
                          <span className="text-green-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +{step.outputRecords - step.inputRecords}
                          </span>
                        ) : (
                          <span className="text-blue-600 flex items-center">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {step.outputRecords - step.inputRecords}
                          </span>
                        )}
                      </span>
                    )}
                    <span className="text-xs font-mono text-gray-600">
                      {step.duration}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CellCard>
      )}

      {/* Create Test Modal */}
      <CellModal
        isOpen={showCreateTest}
        onClose={() => setShowCreateTest(false)}
        title="Create Pipeline Test"
        size="lg"
      >
        <div className="space-y-6">
          <CellInput
            label="Test Name"
            placeholder="e.g., Customer Data Validation Test"
            value={testConfig.name}
            onChange={(e) => setTestConfig(prev => ({ ...prev, name: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-bold mb-2">Test Data Mode</label>
            <select
              value={testConfig.mode}
              onChange={(e) => setTestConfig(prev => ({ ...prev, mode: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="sample">Sample (first N records)</option>
              <option value="custom">Custom Test Data</option>
              <option value="mock">Mock Data</option>
            </select>
          </div>

          {testConfig.mode === 'sample' && (
            <CellInput
              label="Sample Size"
              type="number"
              value={testConfig.sampleSize}
              onChange={(e) => setTestConfig(prev => ({ ...prev, sampleSize: parseInt(e.target.value) }))}
            />
          )}

          {/* Assertions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold">Assertions (Optional)</label>
              <div className="flex space-x-1">
                <button
                  onClick={() => addAssertion('record_count')}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  + Count
                </button>
                <button
                  onClick={() => addAssertion('field_exists')}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  + Field
                </button>
                <button
                  onClick={() => addAssertion('no_nulls')}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  + No Nulls
                </button>
              </div>
            </div>

            {testConfig.assertions.length === 0 ? (
              <p className="text-sm text-gray-600 italic">
                No assertions defined. Test will run without validation.
              </p>
            ) : (
              <div className="space-y-2">
                {testConfig.assertions.map((assertion) => (
                  <div
                    key={assertion.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded"
                  >
                    <div>
                      <p className="font-mono text-sm font-bold">{assertion.type}</p>
                      <p className="text-xs text-gray-600">{assertion.description}</p>
                    </div>
                    <button
                      onClick={() => removeAssertion(assertion.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <CellButton
              variant="ghost"
              onClick={() => setShowCreateTest(false)}
            >
              Cancel
            </CellButton>
            <CellButton
              variant="primary"
              onClick={handleRunTest}
              disabled={testing || !testConfig.name}
              isLoading={testing}
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Test
                </>
              )}
            </CellButton>
          </div>
        </div>
      </CellModal>
    </div>
  );
}

