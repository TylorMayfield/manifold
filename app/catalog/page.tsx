"use client";

import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import CellButton from '../../components/ui/CellButton';
import CellCard from '../../components/ui/CellCard';
import CellInput from '../../components/ui/CellInput';
import CellModal from '../../components/ui/CellModal';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  BookOpen,
  Search,
  Tag,
  Shield,
  Database,
  FileText,
  Zap,
  Camera,
  Plus,
  Filter,
  TrendingUp,
  Eye,
  Edit,
  BarChart3,
} from 'lucide-react';

interface CatalogEntry {
  id: string;
  assetType: string;
  name: string;
  description?: string;
  tags: string[];
  classifications: string[];
  sensitivity?: string;
  owner?: string;
  pii?: boolean;
  technicalMetadata: any;
  usageStats?: any;
}

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  synonyms?: string[];
  category?: string;
  status: string;
}

export default function DataCatalogPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'glossary' | 'analytics'>('catalog');
  
  // Catalog state
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{
    assetTypes: string[];
    tags: string[];
    sensitivity: string[];
  }>({
    assetTypes: [],
    tags: [],
    sensitivity: [],
  });
  const [facets, setFacets] = useState<any>(null);

  // Glossary state
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [showAddTerm, setShowAddTerm] = useState(false);
  const [newTerm, setNewTerm] = useState({
    term: '',
    definition: '',
    category: '',
  });

  // Statistics state
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadCatalog();
    loadGlossary();
    loadStatistics();
  }, []);

  const loadCatalog = async () => {
    try {
      const response = await fetch('/api/catalog/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          assetTypes: selectedFilters.assetTypes.length > 0 ? selectedFilters.assetTypes : undefined,
          tags: selectedFilters.tags.length > 0 ? selectedFilters.tags : undefined,
          sensitivity: selectedFilters.sensitivity.length > 0 ? selectedFilters.sensitivity : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCatalogEntries(data.entries);
        setFacets(data.facets);
      }
    } catch (error) {
      console.error('Failed to load catalog:', error);
    }
  };

  const loadGlossary = async () => {
    try {
      const response = await fetch('/api/catalog/glossary');
      
      if (response.ok) {
        const data = await response.json();
        setGlossaryTerms(data.terms);
      }
    } catch (error) {
      console.error('Failed to load glossary:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/catalog/statistics');
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleSearch = () => {
    loadCatalog();
  };

  const handleAddGlossaryTerm = async () => {
    try {
      const response = await fetch('/api/catalog/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTerm,
          status: 'approved',
        }),
      });

      if (response.ok) {
        setShowAddTerm(false);
        setNewTerm({ term: '', definition: '', category: '' });
        loadGlossary();
      }
    } catch (error) {
      console.error('Failed to add term:', error);
    }
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'data_source': return <Database className="w-5 h-5 text-blue-600" />;
      case 'table': return <FileText className="w-5 h-5 text-green-600" />;
      case 'column': return <FileText className="w-5 h-5 text-purple-600" />;
      case 'pipeline': return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'snapshot': return <Camera className="w-5 h-5 text-cyan-600" />;
      default: return <Database className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSensitivityColor = (sensitivity?: string) => {
    switch (sensitivity) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'internal': return 'bg-blue-100 text-blue-800';
      case 'confidential': return 'bg-yellow-100 text-yellow-800';
      case 'restricted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageLayout
      title="Data Catalog"
      subtitle="Discover and govern your data assets"
      icon={BookOpen}
      showBackButton={true}
      showNavigation={true}
    >
      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'catalog'
              ? 'border-blue-600 text-blue-600'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Data Catalog</span>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('glossary')}
          className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'glossary'
              ? 'border-blue-600 text-blue-600'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Business Glossary</span>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </div>
        </button>
      </div>

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <CellCard className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Search className="w-5 h-5 text-gray-500" />
              <CellInput
                placeholder="Search data assets, descriptions, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <CellButton onClick={handleSearch}>
                Search
              </CellButton>
            </div>

            {/* Quick Filters */}
            {facets && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(facets.assetTypes || {}).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedFilters(prev => ({
                        ...prev,
                        assetTypes: prev.assetTypes.includes(type)
                          ? prev.assetTypes.filter(t => t !== type)
                          : [...prev.assetTypes, type]
                      }));
                    }}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      selectedFilters.assetTypes.includes(type)
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {String(type).replace('_', ' ')} ({String(count)})
                  </button>
                ))}
              </div>
            )}
          </CellCard>

          {/* Results */}
          <div className="space-y-3">
            {catalogEntries.length === 0 ? (
              <CellCard className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-subheading font-bold mb-2">No Assets Found</h3>
                <p className="text-body text-gray-600">
                  {searchQuery 
                    ? 'Try adjusting your search query or filters'
                    : 'Data assets will appear here as you add data sources and pipelines'}
                </p>
              </CellCard>
            ) : (
              catalogEntries.map((entry) => (
                <CellCard key={entry.id} className="p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      {getAssetIcon(entry.assetType)}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{entry.name}</h3>
                        {entry.description && (
                          <p className="text-sm text-gray-700 mb-2">{entry.description}</p>
                        )}
                        
                        {/* Metadata Pills */}
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded">
                            {entry.assetType.replace('_', ' ')}
                          </span>
                          
                          {entry.sensitivity && (
                            <span className={`px-2 py-1 text-xs font-bold rounded ${getSensitivityColor(entry.sensitivity)}`}>
                              <Shield className="w-3 h-3 inline mr-1" />
                              {entry.sensitivity}
                            </span>
                          )}
                          
                          {entry.pii && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                              PII
                            </span>
                          )}
                          
                          {entry.owner && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                              Owner: {entry.owner}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <CellButton variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </CellButton>
                      <CellButton variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </CellButton>
                    </div>
                  </div>

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {entry.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
                        >
                          <Tag className="w-3 h-3 inline mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Technical Metadata */}
                  {entry.technicalMetadata && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {entry.technicalMetadata.recordCount && (
                        <div>
                          <span className="text-gray-600">Records:</span>{' '}
                          <span className="font-mono font-bold">{entry.technicalMetadata.recordCount.toLocaleString()}</span>
                        </div>
                      )}
                      {entry.technicalMetadata.dataType && (
                        <div>
                          <span className="text-gray-600">Type:</span>{' '}
                          <span className="font-mono">{entry.technicalMetadata.dataType}</span>
                        </div>
                      )}
                      {entry.technicalMetadata.size && (
                        <div>
                          <span className="text-gray-600">Size:</span>{' '}
                          <span className="font-mono">{(entry.technicalMetadata.size / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                      )}
                      {entry.usageStats && (
                        <div>
                          <span className="text-gray-600">Queries:</span>{' '}
                          <span className="font-mono font-bold">{entry.usageStats.queryCount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CellCard>
              ))
            )}
          </div>
        </div>
      )}

      {/* Glossary Tab */}
      {activeTab === 'glossary' && (
        <div className="space-y-6">
          <CellCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-heading font-bold mb-2">Business Glossary</h3>
                <p className="text-body text-gray-600">
                  Define business terms and concepts for better data understanding
                </p>
              </div>
              <CellButton
                variant="primary"
                onClick={() => setShowAddTerm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Term
              </CellButton>
            </div>

            {glossaryTerms.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-body text-gray-600 mb-6">
                  No glossary terms defined yet
                </p>
                <CellButton
                  variant="accent"
                  onClick={() => setShowAddTerm(true)}
                >
                  Add Your First Term
                </CellButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {glossaryTerms.map((term) => (
                  <div
                    key={term.id}
                    className="p-4 border border-gray-300 rounded-lg hover:border-blue-400 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-lg">{term.term}</h4>
                      {term.category && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {term.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{term.definition}</p>
                    
                    {term.synonyms && term.synonyms.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <strong>Synonyms:</strong> {term.synonyms.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CellCard>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && statistics && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CellCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-bold text-gray-600">Total Assets</p>
                  <p className="text-heading font-mono">{statistics.statistics.totalAssets}</p>
                </div>
                <Database className="w-8 h-8 text-blue-400" />
              </div>
            </CellCard>

            <CellCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-bold text-gray-600">Tags</p>
                  <p className="text-heading font-mono">{statistics.statistics.totalTags}</p>
                </div>
                <Tag className="w-8 h-8 text-green-400" />
              </div>
            </CellCard>

            <CellCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-bold text-gray-600">Glossary Terms</p>
                  <p className="text-heading font-mono">{statistics.statistics.totalGlossaryTerms}</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-400" />
              </div>
            </CellCard>

            <CellCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption font-bold text-gray-600">PII Assets</p>
                  <p className="text-heading font-mono">{statistics.statistics.assetsWithPII}</p>
                </div>
                <Shield className="w-8 h-8 text-red-400" />
              </div>
            </CellCard>
          </div>

          {/* Top Tags */}
          {statistics.topTags && statistics.topTags.length > 0 && (
            <CellCard className="p-6">
              <h3 className="font-bold text-lg mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {statistics.topTags.slice(0, 20).map((item: any) => (
                  <span
                    key={item.tag}
                    className="px-3 py-2 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 font-mono text-sm"
                  >
                    {item.tag} <span className="text-blue-600 font-bold">({item.count})</span>
                  </span>
                ))}
              </div>
            </CellCard>
          )}

          {/* Popular Assets */}
          {statistics.popularAssets && statistics.popularAssets.length > 0 && (
            <CellCard className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Most Popular Assets
              </h3>
              <div className="space-y-2">
                {statistics.popularAssets.map((asset: any, index: number) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-gray-600">#{index + 1}</span>
                      {getAssetIcon(asset.assetType)}
                      <div>
                        <p className="font-bold">{asset.name}</p>
                        <p className="text-xs text-gray-600">{asset.assetType.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {asset.usageStats?.queryCount} queries
                    </div>
                  </div>
                ))}
              </div>
            </CellCard>
          )}
        </div>
      )}

      {/* Add Glossary Term Modal */}
      <CellModal
        isOpen={showAddTerm}
        onClose={() => setShowAddTerm(false)}
        title="Add Glossary Term"
        size="md"
      >
        <div className="space-y-4">
          <CellInput
            label="Term"
            placeholder="e.g., Customer Lifetime Value"
            value={newTerm.term}
            onChange={(e) => setNewTerm(prev => ({ ...prev, term: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-bold mb-2">Definition</label>
            <textarea
              placeholder="Enter a clear definition of this business term..."
              value={newTerm.definition}
              onChange={(e) => setNewTerm(prev => ({ ...prev, definition: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
            />
          </div>

          <CellInput
            label="Category (Optional)"
            placeholder="e.g., Finance, Marketing, Operations"
            value={newTerm.category}
            onChange={(e) => setNewTerm(prev => ({ ...prev, category: e.target.value }))}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <CellButton
              variant="ghost"
              onClick={() => setShowAddTerm(false)}
            >
              Cancel
            </CellButton>
            <CellButton
              variant="primary"
              onClick={handleAddGlossaryTerm}
              disabled={!newTerm.term || !newTerm.definition}
            >
              Add Term
            </CellButton>
          </div>
        </div>
      </CellModal>
    </PageLayout>
  );
}

