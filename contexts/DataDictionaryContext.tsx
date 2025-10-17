"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  DataDictionaryEntry,
  FieldDefinition,
  DataRelationship,
  DictionarySearchCriteria,
  DictionarySearchResult,
} from "../types/dataDictionary";

interface DataDictionaryContextType {
  entries: DataDictionaryEntry[];
  loading: boolean;
  
  // CRUD operations
  createEntry: (entry: Omit<DataDictionaryEntry, "id" | "createdAt" | "updatedAt">) => Promise<DataDictionaryEntry>;
  getEntry: (id: string) => DataDictionaryEntry | undefined;
  getEntryByDataSource: (dataSourceId: string) => DataDictionaryEntry | undefined;
  updateEntry: (id: string, updates: Partial<DataDictionaryEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  
  // Field operations
  addField: (entryId: string, field: Omit<FieldDefinition, "id">) => Promise<void>;
  updateField: (entryId: string, fieldId: string, updates: Partial<FieldDefinition>) => Promise<void>;
  deleteField: (entryId: string, fieldId: string) => Promise<void>;
  
  // Relationship operations
  addRelationship: (entryId: string, relationship: Omit<DataRelationship, "id" | "createdAt">) => Promise<void>;
  deleteRelationship: (entryId: string, relationshipId: string) => Promise<void>;
  
  // Search
  search: (criteria: DictionarySearchCriteria) => Promise<DictionarySearchResult>;
  
  // Generation
  generateFromDataSource: (dataSourceId: string, projectId: string) => Promise<DataDictionaryEntry>;
  
  // Refresh
  refreshEntries: () => Promise<void>;
}

const DataDictionaryContext = createContext<DataDictionaryContextType | undefined>(
  undefined
);

export function useDataDictionary() {
  const context = useContext(DataDictionaryContext);
  if (!context) {
    throw new Error("useDataDictionary must be used within a DataDictionaryProvider");
  }
  return context;
}

interface DataDictionaryProviderProps {
  children: React.ReactNode;
}

export function DataDictionaryProvider({ children }: DataDictionaryProviderProps) {
  const [entries, setEntries] = useState<DataDictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/data-dictionary?projectId=default");
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Failed to load data dictionary entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (
    entry: Omit<DataDictionaryEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<DataDictionaryEntry> => {
    const response = await fetch("/api/data-dictionary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error("Failed to create dictionary entry");
    }

    const newEntry = await response.json();
    setEntries((prev) => [...prev, newEntry]);
    return newEntry;
  };

  const getEntry = (id: string): DataDictionaryEntry | undefined => {
    return entries.find((entry) => entry.id === id);
  };

  const getEntryByDataSource = (dataSourceId: string): DataDictionaryEntry | undefined => {
    return entries.find((entry) => entry.dataSourceId === dataSourceId);
  };

  const updateEntry = async (
    id: string,
    updates: Partial<DataDictionaryEntry>
  ): Promise<void> => {
    const response = await fetch("/api/data-dictionary", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!response.ok) {
      throw new Error("Failed to update dictionary entry");
    }

    const updatedEntry = await response.json();
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? updatedEntry : entry))
    );
  };

  const deleteEntry = async (id: string): Promise<void> => {
    const response = await fetch(`/api/data-dictionary?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete dictionary entry");
    }

    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const addField = async (
    entryId: string,
    field: Omit<FieldDefinition, "id">
  ): Promise<void> => {
    const entry = getEntry(entryId);
    if (!entry) {
      throw new Error("Entry not found");
    }

    const newField: FieldDefinition = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedFields = [...entry.fields, newField];
    await updateEntry(entryId, { fields: updatedFields });
  };

  const updateField = async (
    entryId: string,
    fieldId: string,
    updates: Partial<FieldDefinition>
  ): Promise<void> => {
    const entry = getEntry(entryId);
    if (!entry) {
      throw new Error("Entry not found");
    }

    const updatedFields = entry.fields.map((field) =>
      field.id === fieldId ? { ...field, ...updates, updatedAt: new Date() } : field
    );

    await updateEntry(entryId, { fields: updatedFields });
  };

  const deleteField = async (entryId: string, fieldId: string): Promise<void> => {
    const entry = getEntry(entryId);
    if (!entry) {
      throw new Error("Entry not found");
    }

    const updatedFields = entry.fields.filter((field) => field.id !== fieldId);
    await updateEntry(entryId, { fields: updatedFields });
  };

  const addRelationship = async (
    entryId: string,
    relationship: Omit<DataRelationship, "id" | "createdAt">
  ): Promise<void> => {
    const entry = getEntry(entryId);
    if (!entry) {
      throw new Error("Entry not found");
    }

    const newRelationship: DataRelationship = {
      ...relationship,
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    const updatedRelationships = [...entry.relationships, newRelationship];
    await updateEntry(entryId, { relationships: updatedRelationships });
  };

  const deleteRelationship = async (
    entryId: string,
    relationshipId: string
  ): Promise<void> => {
    const entry = getEntry(entryId);
    if (!entry) {
      throw new Error("Entry not found");
    }

    const updatedRelationships = entry.relationships.filter(
      (rel) => rel.id !== relationshipId
    );
    await updateEntry(entryId, { relationships: updatedRelationships });
  };

  const search = async (
    criteria: DictionarySearchCriteria
  ): Promise<DictionarySearchResult> => {
    const params = new URLSearchParams();
    
    if (criteria.query) params.append("query", criteria.query);
    if (criteria.tags) params.append("tags", criteria.tags.join(","));
    if (criteria.categories) params.append("categories", criteria.categories.join(","));
    if (criteria.domains) params.append("domains", criteria.domains.join(","));
    if (criteria.owner) params.append("owner", criteria.owner);
    if (criteria.hasRelationships !== undefined) {
      params.append("hasRelationships", criteria.hasRelationships.toString());
    }
    if (criteria.qualityScoreMin !== undefined) {
      params.append("qualityScoreMin", criteria.qualityScoreMin.toString());
    }
    if (criteria.qualityScoreMax !== undefined) {
      params.append("qualityScoreMax", criteria.qualityScoreMax.toString());
    }

    const response = await fetch(`/api/data-dictionary?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error("Failed to search dictionary");
    }

    return response.json();
  };

  const generateFromDataSource = async (
    dataSourceId: string,
    projectId: string
  ): Promise<DataDictionaryEntry> => {
    const response = await fetch("/api/data-dictionary/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataSourceId, projectId }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate dictionary entry");
    }

    const newEntry = await response.json();
    setEntries((prev) => [...prev, newEntry]);
    return newEntry;
  };

  const refreshEntries = async (): Promise<void> => {
    await loadEntries();
  };

  return (
    <DataDictionaryContext.Provider
      value={{
        entries,
        loading,
        createEntry,
        getEntry,
        getEntryByDataSource,
        updateEntry,
        deleteEntry,
        addField,
        updateField,
        deleteField,
        addRelationship,
        deleteRelationship,
        search,
        generateFromDataSource,
        refreshEntries,
      }}
    >
      {children}
    </DataDictionaryContext.Provider>
  );
}

