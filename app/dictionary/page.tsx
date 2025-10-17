"use client";

import React, { useState, useEffect } from "react";
import { useDataDictionary } from "../../contexts/DataDictionaryContext";
import { useDataSources } from "../../contexts/DataSourceContext";
import { DataDictionaryCard } from "../../components/data-dictionary/DataDictionaryCard";
import { FieldDefinitionTable } from "../../components/data-dictionary/FieldDefinitionTable";
import { RelationshipViewer } from "../../components/data-dictionary/RelationshipViewer";
import { RelationshipSuggestions } from "../../components/data-dictionary/RelationshipSuggestions";
import CellButton from "../../components/ui/CellButton";
import CellInput from "../../components/ui/CellInput";
import CellBadge from "../../components/ui/CellBadge";
import CellCard from "../../components/ui/CellCard";
import CellModal from "../../components/ui/CellModal";
import CellSelect from "../../components/ui/CellSelect";
import LoadingState from "../../components/ui/LoadingState";
import PageLayout from "../../components/layout/PageLayout";
import {
  Search,
  Plus,
  Download,
  BookOpen,
  Sparkles,
  X,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { DataDictionaryEntry } from "../../types/dataDictionary";
import { RelationshipSuggestion } from "../../lib/services/RelationshipDetectionService";

function DataDictionaryPageContent() {
  const {
    entries,
    loading,
    deleteEntry,
    generateFromDataSource,
    refreshEntries,
    deleteField,
    deleteRelationship,
    detectRelationships,
    acceptSuggestions,
  } = useDataDictionary();

  const { dataSources } = useDataSources();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<DataDictionaryEntry | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"fields" | "relationships">("fields");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<RelationshipSuggestion[]>([]);
  const [detectingRelationships, setDetectingRelationships] = useState(false);

  // Load statistics
  useEffect(() => {
    loadStatistics();
  }, [entries]);

  const loadStatistics = async () => {
    try {
      const response = await fetch("/api/data-dictionary/statistics?projectId=default");
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.technicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || entry.category === selectedCategory;

    const matchesDomain = selectedDomain === "all" || entry.domain === selectedDomain;

    return matchesSearch && matchesCategory && matchesDomain;
  });

  // Get unique categories and domains
  const categories = Array.from(new Set(entries.map((e) => e.category).filter(Boolean)));
  const domains = Array.from(new Set(entries.map((e) => e.domain).filter(Boolean)));

  // Handle generate from data source
  const handleGenerate = async () => {
    if (!selectedDataSource) return;

    try {
      setGenerating(true);
      await generateFromDataSource(selectedDataSource, "default");
      setShowGenerateDialog(false);
      setSelectedDataSource("");
    } catch (error) {
      console.error("Failed to generate dictionary entry:", error);
      alert("Failed to generate dictionary entry");
    } finally {
      setGenerating(false);
    }
  };

  // Get data sources without dictionary entries
  const availableDataSources = dataSources.filter(
    (ds) => !entries.some((e) => e.dataSourceId === ds.id)
  );

  // Handle view entry
  const handleViewEntry = (entry: DataDictionaryEntry) => {
    setSelectedEntry(entry);
    setViewMode("detail");
    setActiveTab("fields");
  };

  // Handle delete entry
  const handleDeleteEntry = async (entry: DataDictionaryEntry) => {
    if (confirm(`Are you sure you want to delete "${entry.businessName}"?`)) {
      try {
        await deleteEntry(entry.id);
        if (selectedEntry?.id === entry.id) {
          setViewMode("list");
          setSelectedEntry(null);
        }
      } catch (error) {
        console.error("Failed to delete entry:", error);
        alert("Failed to delete entry");
      }
    }
  };

  // Handle detect relationships
  const handleDetectRelationships = async () => {
    if (!selectedEntry) return;

    try {
      setDetectingRelationships(true);
      const result = await detectRelationships(selectedEntry.id);
      
      const entrySuggestions = result.suggestions[selectedEntry.id] || [];
      setSuggestions(entrySuggestions);
      setShowSuggestions(true);

      if (entrySuggestions.length === 0) {
        alert("No relationship suggestions found for this entry.");
      }
    } catch (error) {
      console.error("Failed to detect relationships:", error);
      alert("Failed to detect relationships");
    } finally {
      setDetectingRelationships(false);
    }
  };

  // Handle accept suggestions
  const handleAcceptSuggestions = async (suggestionIds: string[]) => {
    if (!selectedEntry) return;

    try {
      await acceptSuggestions(selectedEntry.id, suggestionIds);
      setShowSuggestions(false);
      setSuggestions([]);
      
      // Refresh the selected entry
      const updatedEntry = entries.find((e) => e.id === selectedEntry.id);
      if (updatedEntry) {
        setSelectedEntry(updatedEntry);
      }
    } catch (error) {
      console.error("Failed to accept suggestions:", error);
      alert("Failed to accept suggestions");
    }
  };

  // Export dictionary
  const handleExport = async () => {
    try {
      const response = await fetch("/api/data-dictionary/export?projectId=default");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `data-dictionary-${Date.now()}.json`;
        a.click();
      }
    } catch (error) {
      console.error("Failed to export dictionary:", error);
      alert("Failed to export dictionary");
    }
  };

  if (loading) {
    return <LoadingState message="Loading data dictionary..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Data Dictionary</h1>
            <p className="text-gray-600">
              Document and manage your data sources, fields, and relationships
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <CellButton variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </CellButton>
          <CellButton onClick={() => setShowGenerateDialog(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate from Data Source
          </CellButton>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CellCard className="text-center">
            <div className="text-sm text-gray-600 mb-1">Total Entries</div>
            <div className="text-3xl font-bold">{statistics.totalEntries}</div>
          </CellCard>
          <CellCard className="text-center">
            <div className="text-sm text-gray-600 mb-1">Total Fields</div>
            <div className="text-3xl font-bold">{statistics.totalFields}</div>
          </CellCard>
          <CellCard className="text-center">
            <div className="text-sm text-gray-600 mb-1">Relationships</div>
            <div className="text-3xl font-bold">{statistics.totalRelationships}</div>
          </CellCard>
          <CellCard className="text-center">
            <div className="text-sm text-gray-600 mb-1">Avg Quality Score</div>
            <div className="text-3xl font-bold">
              {statistics.avgQualityScore.toFixed(0)}%
            </div>
          </CellCard>
        </div>
      )}

      {viewMode === "list" ? (
        <>
          {/* Filters and Search */}
          <CellCard>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <CellInput
                    placeholder="Search by name, description, or fields..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <CellSelect
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-48"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat!}>
                    {cat}
                  </option>
                ))}
              </CellSelect>
              <CellSelect
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full md:w-48"
              >
                <option value="all">All Domains</option>
                {domains.map((domain) => (
                  <option key={domain} value={domain!}>
                    {domain}
                  </option>
                ))}
              </CellSelect>
            </div>

            {(searchQuery || selectedCategory !== "all" || selectedDomain !== "all") && (
              <div className="flex gap-2 mt-4">
                {searchQuery && (
                  <CellBadge variant="info" className="flex items-center gap-1">
                    Search: {searchQuery}
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </CellBadge>
                )}
                {selectedCategory !== "all" && (
                  <CellBadge variant="info" className="flex items-center gap-1">
                    Category: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </CellBadge>
                )}
                {selectedDomain !== "all" && (
                  <CellBadge variant="info" className="flex items-center gap-1">
                    Domain: {selectedDomain}
                    <button
                      onClick={() => setSelectedDomain("all")}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </CellBadge>
                )}
              </div>
            )}
          </CellCard>

          {/* Entries Grid */}
          {filteredEntries.length === 0 ? (
            <CellCard className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Dictionary Entries</h3>
              <p className="text-gray-600 mb-4">
                Get started by generating entries from your data sources
              </p>
              <CellButton onClick={() => setShowGenerateDialog(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate from Data Source
              </CellButton>
            </CellCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry) => (
                <DataDictionaryCard
                  key={entry.id}
                  entry={entry}
                  onView={handleViewEntry}
                  onEdit={handleViewEntry}
                  onDelete={handleDeleteEntry}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        selectedEntry && (
          <div className="space-y-6">
            {/* Back Button */}
            <CellButton
              variant="secondary"
              onClick={() => {
                setViewMode("list");
                setSelectedEntry(null);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </CellButton>

            {/* Entry Details */}
            <CellCard>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedEntry.businessName}</h2>
                  <p className="text-gray-600 text-base mt-1">
                    {selectedEntry.technicalName}
                  </p>
                </div>
                <CellButton
                  variant="danger"
                  onClick={() => handleDeleteEntry(selectedEntry)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Delete Entry
                </CellButton>
              </div>

              <p className="text-gray-700 mb-4">{selectedEntry.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedEntry.category && (
                  <CellBadge variant="info">{selectedEntry.category}</CellBadge>
                )}
                {selectedEntry.domain && (
                  <CellBadge variant="default">{selectedEntry.domain}</CellBadge>
                )}
                {selectedEntry.tags.map((tag) => (
                  <CellBadge key={tag} variant="success">{tag}</CellBadge>
                ))}
              </div>

              {selectedEntry.owner && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Owner:</span> {selectedEntry.owner}
                </div>
              )}
            </CellCard>

            {/* Tabs for Fields and Relationships */}
            <CellCard>
              <div className="border-b border-gray-300 mb-6">
                <div className="flex gap-4">
                  <button
                    className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
                      activeTab === "fields"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("fields")}
                  >
                    Fields ({selectedEntry.fields.length})
                  </button>
                  <button
                    className={`pb-3 px-2 font-semibold transition-colors border-b-2 ${
                      activeTab === "relationships"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("relationships")}
                  >
                    Relationships ({selectedEntry.relationships.length})
                  </button>
                </div>
              </div>

              {activeTab === "fields" && (
                <FieldDefinitionTable
                  fields={selectedEntry.fields}
                  onAdd={() => alert("Add field dialog not implemented yet")}
                  onEdit={(field) => alert("Edit field dialog not implemented yet")}
                  onDelete={async (fieldId) => {
                    if (confirm("Are you sure you want to delete this field?")) {
                      try {
                        await deleteField(selectedEntry.id, fieldId);
                        await refreshEntries();
                      } catch (error) {
                        console.error("Failed to delete field:", error);
                        alert("Failed to delete field");
                      }
                    }
                  }}
                />
              )}

              {activeTab === "relationships" && (
                showSuggestions ? (
                  <div className="space-y-4">
                    <RelationshipSuggestions
                      suggestions={suggestions}
                      entryName={selectedEntry.businessName}
                      onAccept={handleAcceptSuggestions}
                      onReject={() => {
                        setShowSuggestions(false);
                        setSuggestions([]);
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Detect Relationships Button */}
                    <div className="flex justify-end">
                      <CellButton
                        variant="accent"
                        onClick={handleDetectRelationships}
                        disabled={detectingRelationships || entries.length < 2}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {detectingRelationships
                          ? "Detecting..."
                          : "Detect Relationships"}
                      </CellButton>
                    </div>

                    <RelationshipViewer
                      relationships={selectedEntry.relationships}
                      onAdd={() => alert("Add relationship dialog not implemented yet")}
                      onDelete={async (relationshipId) => {
                        if (confirm("Are you sure you want to delete this relationship?")) {
                          try {
                            await deleteRelationship(selectedEntry.id, relationshipId);
                            await refreshEntries();
                          } catch (error) {
                            console.error("Failed to delete relationship:", error);
                            alert("Failed to delete relationship");
                          }
                        }
                      }}
                    />
                  </div>
                )
              )}
            </CellCard>
          </div>
        )
      )}

      {/* Generate from Data Source Dialog */}
      <CellModal
        isOpen={showGenerateDialog}
        onClose={() => {
          setShowGenerateDialog(false);
          setSelectedDataSource("");
        }}
        title="Generate Dictionary Entry"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Select a data source to automatically generate a dictionary entry with fields
            and metadata
          </p>

          <CellSelect
            value={selectedDataSource}
            onChange={(e) => setSelectedDataSource(e.target.value)}
            placeholder="Select a data source"
          >
            <option value="">Select a data source</option>
            {availableDataSources.length === 0 ? (
              <option disabled>
                No available data sources. All data sources already have dictionary
                entries.
              </option>
            ) : (
              availableDataSources.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.type})
                </option>
              ))
            )}
          </CellSelect>

          {selectedDataSource && (
            <CellCard variant="accent" className="text-sm">
              <p className="font-semibold mb-2">
                This will analyze the data source and create a dictionary entry with:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Field definitions and data types</li>
                <li>Basic statistics and metadata</li>
                <li>Data quality assessment</li>
              </ul>
            </CellCard>
          )}

          <div className="flex gap-2 justify-end mt-6">
            <CellButton
              variant="secondary"
              onClick={() => {
                setShowGenerateDialog(false);
                setSelectedDataSource("");
              }}
            >
              Cancel
            </CellButton>
            <CellButton
              onClick={handleGenerate}
              disabled={!selectedDataSource || generating}
            >
              {generating ? "Generating..." : "Generate"}
            </CellButton>
          </div>
        </div>
      </CellModal>
    </div>
  );
}

export default function DataDictionaryPage() {
  return (
    <PageLayout
      title="Data Dictionary"
      subtitle="Document and manage your data catalog"
      icon={BookOpen}
      showNavigation={true}
    >
      <DataDictionaryPageContent />
    </PageLayout>
  );
}
