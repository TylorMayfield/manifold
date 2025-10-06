"use client";

import React, { useState } from 'react';
import { Shield, Info } from 'lucide-react';
import RollbackManager from '../../components/rollback/RollbackManager';
import RollbackHistory from '../../components/rollback/RollbackHistory';
import CellCard from '../../components/ui/CellCard';
// import { CellTabs, CellTab } from '../../components/ui/CellTabs';

export default function RollbackPage() {
  const [activeTab, setActiveTab] = useState<string>('manager');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Rollback & Recovery
          </h1>
        </div>
        <p className="text-gray-600">
          Create rollback points and restore previous data states when needed
        </p>
      </div>

      {/* Info Banner */}
      <CellCard className="mb-6 bg-blue-50 border-blue-200">
        <div className="p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Rollback & Recovery</p>
            <p>
              Rollback points capture the current state of your data, allowing you to restore
              it later if needed. This is useful for recovering from failed pipeline executions,
              data corruption, or accidental modifications. Automatic rollback points are created
              before pipeline executions for added safety.
            </p>
          </div>
        </div>
      </CellCard>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'manager'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('manager')}
        >
          Rollback Manager
        </button>
        <button
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Rollback History
        </button>
      </div>

      {activeTab === 'manager' && (
        <div className="mt-6">
          <RollbackManager
            projectId="default"
            onRollbackComplete={() => {
              // Refresh or show success message
              alert('Rollback completed successfully!');
            }}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="mt-6">
          <RollbackHistory limit={50} />
        </div>
      )}
    </div>
  );
}

