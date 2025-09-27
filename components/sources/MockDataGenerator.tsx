"use client";

import React, { useState } from 'react';
import { Zap, Users, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import CellButton from '../ui/CellButton';
import CellInput from '../ui/CellInput';
import CellCard from '../ui/CellCard';
import { MockTemplate, getAllMockTemplates } from '../../lib/utils/mockDataGenerator';

interface MockDataTemplateDisplay extends MockTemplate {
  icon: React.ComponentType<any>;
}

const iconMap = {
  customers: Users,
  orders: ShoppingCart,
  products: Package,
  analytics: TrendingUp
};

interface MockDataGeneratorProps {
  onGenerate: (template: MockTemplate, recordCount: number) => void;
}

const MockDataGenerator: React.FC<MockDataGeneratorProps> = ({ onGenerate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<MockTemplate | null>(null);
  const [customRecordCount, setCustomRecordCount] = useState<string>('');
  
  const mockTemplates = getAllMockTemplates();

  const handleGenerate = () => {
    if (!selectedTemplate) return;
    
    const recordCount = customRecordCount ? 
      parseInt(customRecordCount, 10) : 
      selectedTemplate.recordCount;
    
    onGenerate(selectedTemplate, recordCount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-subheading mb-4">Choose a Data Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockTemplates.map((template) => {
            const Icon = iconMap[template.id as keyof typeof iconMap] || Package;
            const isSelected = selectedTemplate?.id === template.id;
            
            return (
              <CellCard 
                key={template.id}
                className={`p-4 cursor-pointer transition-colors duration-100 ${
                  isSelected ? 'bg-accent-50 border-accent' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 border-2 border-black ${
                    isSelected ? 'bg-accent text-white' : 'bg-white'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-mono font-bold mb-1">{template.name}</h4>
                    <p className="text-caption text-gray-600 mb-2">{template.description}</p>
                    <p className="text-caption">
                      <span className="font-mono">{template.recordCount} records</span> • 
                      <span className="font-mono ml-1">{template.fields.length} fields</span>
                    </p>
                  </div>
                </div>
              </CellCard>
            );
          })}
        </div>
      </div>

      {selectedTemplate && (
        <div className="space-y-4">
          <div>
            <h4 className="font-mono font-bold mb-2">Fields in {selectedTemplate.name}</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTemplate.fields.map((field) => (
                <span 
                  key={field.name}
                  className="status-info px-2 py-1 text-xs"
                >
                  {field.name} ({field.type})
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CellInput
                label="Number of Records (optional)"
                placeholder={`Default: ${selectedTemplate.recordCount}`}
                value={customRecordCount}
                onChange={(e) => setCustomRecordCount(e.target.value)}
                type="number"
                min="1"
                max="100000"
              />
            </div>
            <div className="flex items-end">
              <CellButton
                onClick={handleGenerate}
                variant="accent"
                className="w-full"
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate Mock Data
              </CellButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockDataGenerator;