"use client";

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Settings,
} from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellCard from '../ui/CellCard';
import CellInput from '../ui/CellInput';
import CellModal from '../ui/CellModal';

interface MaskingRule {
  id: string;
  field: string;
  strategy: string;
  enabled: boolean;
  config?: any;
}

interface MaskingRuleBuilderProps {
  onSave?: (rules: MaskingRule[]) => void;
}

export default function MaskingRuleBuilder({ onSave }: MaskingRuleBuilderProps) {
  const [rules, setRules] = useState<MaskingRule[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const strategies = [
    { value: 'redact', label: 'Redact', description: 'Replace with asterisks' },
    { value: 'hash', label: 'Hash', description: 'One-way hashing (irreversible)' },
    { value: 'tokenize', label: 'Tokenize', description: 'Reversible token replacement' },
    { value: 'partial', label: 'Partial Mask', description: 'Show some characters' },
    { value: 'encrypt', label: 'Encrypt', description: 'Encrypted storage' },
    { value: 'nullify', label: 'Nullify', description: 'Replace with NULL' },
    { value: 'fake', label: 'Fake Data', description: 'Replace with realistic fake data' },
    { value: 'generalize', label: 'Generalize', description: 'Reduce precision' },
  ];

  const addRule = () => {
    const newRule: MaskingRule = {
      id: `rule-${Date.now()}`,
      field: '',
      strategy: 'redact',
      enabled: true,
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<MaskingRule>) => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const handleSave = () => {
    onSave?.(rules);
  };

  return (
    <div className="space-y-4">
      <CellCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">Masking Rules</h3>
            <p className="text-sm text-gray-600">
              Define how sensitive fields should be masked
            </p>
          </div>
          <CellButton
            variant="accent"
            size="sm"
            onClick={addRule}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </CellButton>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded">
            <Settings className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-4">No masking rules defined</p>
            <CellButton variant="secondary" size="sm" onClick={addRule}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Rule
            </CellButton>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-gray-50 p-4 rounded border border-gray-200"
              >
                <div className="grid grid-cols-12 gap-3 items-start">
                  {/* Enabled Toggle */}
                  <div className="col-span-1 pt-2">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>

                  {/* Field */}
                  <div className="col-span-4">
                    <CellInput
                      placeholder="Field name"
                      value={rule.field}
                      onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                    />
                  </div>

                  {/* Strategy */}
                  <div className="col-span-5">
                    <select
                      value={rule.strategy}
                      onChange={(e) => updateRule(rule.id, { strategy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {strategies.map((strategy) => (
                        <option key={strategy.value} value={strategy.value}>
                          {strategy.label} - {strategy.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end">
                    <CellButton
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </CellButton>
                  </div>
                </div>

                {/* Strategy-specific Config */}
                {rule.strategy === 'partial' && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3">
                    <CellInput
                      label="Visible Start Characters"
                      type="number"
                      placeholder="0"
                      onChange={(e) => updateRule(rule.id, {
                        config: { ...rule.config, visibleStart: parseInt(e.target.value) }
                      })}
                    />
                    <CellInput
                      label="Visible End Characters"
                      type="number"
                      placeholder="4"
                      onChange={(e) => updateRule(rule.id, {
                        config: { ...rule.config, visibleEnd: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CellCard>

      {rules.length > 0 && (
        <div className="flex justify-end space-x-3">
          <CellButton
            variant="ghost"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </CellButton>
          <CellButton
            variant="primary"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Rules
          </CellButton>
        </div>
      )}

      {/* Preview Modal */}
      <CellModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Masking Preview"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This is a preview of how your data will be masked with the current rules.
          </p>
          
          <div className="bg-gray-50 p-4 rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Field</th>
                  <th className="text-left py-2">Original</th>
                  <th className="text-left py-2">Masked</th>
                </tr>
              </thead>
              <tbody>
                {rules.filter(r => r.enabled).map((rule) => (
                  <tr key={rule.id} className="border-b">
                    <td className="py-2 font-mono">{rule.field}</td>
                    <td className="py-2 font-mono text-gray-600">john@example.com</td>
                    <td className="py-2 font-mono text-green-600">
                      {rule.strategy === 'redact' && '********'}
                      {rule.strategy === 'hash' && 'a1b2c3d4e5f6g7h8'}
                      {rule.strategy === 'tokenize' && 'TKN-A1B2C3D4'}
                      {rule.strategy === 'partial' && '****@example.com'}
                      {rule.strategy === 'nullify' && 'NULL'}
                      {rule.strategy === 'fake' && 'user1234@example.com'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <CellButton variant="primary" onClick={() => setShowPreview(false)}>
              Close
            </CellButton>
          </div>
        </div>
      </CellModal>
    </div>
  );
}

