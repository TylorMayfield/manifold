/**
 * Data Catalog & Discovery Service
 * 
 * Enterprise data governance system with:
 * - Searchable catalog of all data assets
 * - Metadata management (technical & business)
 * - Tagging and classification
 * - Business glossary
 * - Data lineage tracking
 * - Access control metadata
 * - Usage analytics
 */

import { logger } from '../utils/logger';

// ==================== TYPES ====================

export interface CatalogEntry {
  id: string;
  assetType: 'data_source' | 'table' | 'column' | 'pipeline' | 'snapshot';
  assetId: string;
  name: string;
  qualifiedName: string; // e.g., "database.schema.table.column"
  
  // Descriptions
  displayName?: string;
  description?: string;
  businessDescription?: string;
  
  // Metadata
  technicalMetadata: TechnicalMetadata;
  businessMetadata: BusinessMetadata;
  
  // Taxonomy
  tags: string[];
  classifications: string[];
  
  // Governance
  owner?: string;
  steward?: string;
  sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted';
  pii?: boolean;
  
  // Lineage
  upstreamDependencies?: string[];
  downstreamDependents?: string[];
  
  // Usage
  usageStats?: UsageStats;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
}

export interface TechnicalMetadata {
  dataType?: string;
  format?: string;
  size?: number;
  recordCount?: number;
  schema?: any;
  location?: string;
  connectionString?: string;
  
  // For columns
  nullable?: boolean;
  primaryKey?: boolean;
  foreignKey?: boolean;
  unique?: boolean;
  indexed?: boolean;
  
  // Quality metrics
  nullPercentage?: number;
  uniquePercentage?: number;
  completenessScore?: number;
}

export interface BusinessMetadata {
  businessOwner?: string;
  department?: string;
  domain?: string;
  businessTerms?: string[];
  relatedGlossaryTerms?: string[];
  complianceRequirements?: string[];
  retentionPolicy?: string;
  accessPolicy?: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  synonyms?: string[];
  relatedTerms?: string[];
  category?: string;
  examples?: string[];
  owner?: string;
  status: 'draft' | 'approved' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageStats {
  queryCount: number;
  lastQueried?: Date;
  popularityScore: number;
  avgQueryTime?: number;
  topUsers?: string[];
}

export interface SearchOptions {
  query: string;
  assetTypes?: CatalogEntry['assetType'][];
  tags?: string[];
  classifications?: string[];
  owners?: string[];
  sensitivity?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  entries: CatalogEntry[];
  total: number;
  facets: {
    assetTypes: Map<string, number>;
    tags: Map<string, number>;
    classifications: Map<string, number>;
    owners: Map<string, number>;
  };
}

// ==================== DATA CATALOG ====================

export class DataCatalog {
  private static instance: DataCatalog;
  
  private catalog: Map<string, CatalogEntry> = new Map();
  private glossary: Map<string, GlossaryTerm> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> entry IDs
  private classificationIndex: Map<string, Set<string>> = new Map();
  private nameIndex: Map<string, Set<string>> = new Map(); // for search

  static getInstance(): DataCatalog {
    if (!DataCatalog.instance) {
      DataCatalog.instance = new DataCatalog();
    }
    return DataCatalog.instance;
  }

  // ==================== CATALOG MANAGEMENT ====================

  /**
   * Register a data asset in the catalog
   */
  registerAsset(entry: Omit<CatalogEntry, 'id' | 'createdAt' | 'updatedAt'>): CatalogEntry {
    const catalogEntry: CatalogEntry = {
      ...entry,
      id: `catalog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.catalog.set(catalogEntry.id, catalogEntry);
    
    // Update indices
    this.updateIndices(catalogEntry);

    logger.info(`Asset registered in catalog: ${catalogEntry.name}`, 'data-catalog', {
      assetId: catalogEntry.id,
      assetType: catalogEntry.assetType,
    });

    return catalogEntry;
  }

  /**
   * Update catalog entry
   */
  updateAsset(id: string, updates: Partial<CatalogEntry>): CatalogEntry | null {
    const entry = this.catalog.get(id);
    if (!entry) return null;

    // Remove old indices
    this.removeFromIndices(entry);

    // Update entry
    const updated = {
      ...entry,
      ...updates,
      updatedAt: new Date(),
    };

    this.catalog.set(id, updated);
    
    // Update indices with new data
    this.updateIndices(updated);

    logger.info(`Catalog entry updated: ${updated.name}`, 'data-catalog', { assetId: id });

    return updated;
  }

  /**
   * Delete catalog entry
   */
  deleteAsset(id: string): boolean {
    const entry = this.catalog.get(id);
    if (!entry) return false;

    this.removeFromIndices(entry);
    this.catalog.delete(id);

    logger.info(`Asset removed from catalog: ${entry.name}`, 'data-catalog', { assetId: id });

    return true;
  }

  /**
   * Get catalog entry
   */
  getAsset(id: string): CatalogEntry | null {
    return this.catalog.get(id) || null;
  }

  /**
   * Get all assets of a specific type
   */
  getAssetsByType(assetType: CatalogEntry['assetType']): CatalogEntry[] {
    return Array.from(this.catalog.values())
      .filter(entry => entry.assetType === assetType);
  }

  // ==================== SEARCH & DISCOVERY ====================

  /**
   * Search catalog with advanced filters
   */
  search(options: SearchOptions): SearchResult {
    const { query, assetTypes, tags, classifications, owners, sensitivity, limit = 100, offset = 0 } = options;

    let results = Array.from(this.catalog.values());

    // Filter by asset type
    if (assetTypes && assetTypes.length > 0) {
      results = results.filter(entry => assetTypes.includes(entry.assetType));
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      results = results.filter(entry => 
        tags.some(tag => entry.tags.includes(tag))
      );
    }

    // Filter by classifications
    if (classifications && classifications.length > 0) {
      results = results.filter(entry =>
        classifications.some(cls => entry.classifications.includes(cls))
      );
    }

    // Filter by owners
    if (owners && owners.length > 0) {
      results = results.filter(entry =>
        entry.owner && owners.includes(entry.owner)
      );
    }

    // Filter by sensitivity
    if (sensitivity && sensitivity.length > 0) {
      results = results.filter(entry =>
        entry.sensitivity && sensitivity.includes(entry.sensitivity)
      );
    }

    // Text search
    if (query && query.trim()) {
      const searchTerms = query.toLowerCase().split(/\s+/);
      results = results.filter(entry => {
        const searchableText = [
          entry.name,
          entry.displayName,
          entry.description,
          entry.businessDescription,
          entry.qualifiedName,
          ...entry.tags,
          ...entry.classifications,
        ].join(' ').toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Calculate facets before pagination
    const facets = this.calculateFacets(results);

    // Sort by relevance (for now, just by name)
    results.sort((a, b) => a.name.localeCompare(b.name));

    // Paginate
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      entries: paginatedResults,
      total,
      facets,
    };
  }

  /**
   * Calculate search facets
   */
  private calculateFacets(entries: CatalogEntry[]) {
    const assetTypes = new Map<string, number>();
    const tags = new Map<string, number>();
    const classifications = new Map<string, number>();
    const owners = new Map<string, number>();

    for (const entry of entries) {
      // Asset types
      assetTypes.set(entry.assetType, (assetTypes.get(entry.assetType) || 0) + 1);

      // Tags
      entry.tags.forEach(tag => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });

      // Classifications
      entry.classifications.forEach(cls => {
        classifications.set(cls, (classifications.get(cls) || 0) + 1);
      });

      // Owners
      if (entry.owner) {
        owners.set(entry.owner, (owners.get(entry.owner) || 0) + 1);
      }
    }

    return { assetTypes, tags, classifications, owners };
  }

  /**
   * Get related assets (by tags, classifications, or lineage)
   */
  getRelatedAssets(assetId: string, maxResults: number = 10): CatalogEntry[] {
    const entry = this.catalog.get(assetId);
    if (!entry) return [];

    const related: Array<{ entry: CatalogEntry; score: number }> = [];

    for (const candidate of this.catalog.values()) {
      if (candidate.id === assetId) continue;

      let score = 0;

      // Score by shared tags
      const sharedTags = entry.tags.filter(tag => candidate.tags.includes(tag));
      score += sharedTags.length * 3;

      // Score by shared classifications
      const sharedClassifications = entry.classifications.filter(cls => 
        candidate.classifications.includes(cls)
      );
      score += sharedClassifications.length * 2;

      // Score by lineage
      if (entry.upstreamDependencies?.includes(candidate.assetId) ||
          entry.downstreamDependents?.includes(candidate.assetId)) {
        score += 10;
      }

      // Score by same owner
      if (entry.owner && entry.owner === candidate.owner) {
        score += 1;
      }

      if (score > 0) {
        related.push({ entry: candidate, score });
      }
    }

    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(r => r.entry);
  }

  // ==================== BUSINESS GLOSSARY ====================

  /**
   * Add term to business glossary
   */
  addGlossaryTerm(term: Omit<GlossaryTerm, 'id' | 'createdAt' | 'updatedAt'>): GlossaryTerm {
    const glossaryTerm: GlossaryTerm = {
      ...term,
      id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.glossary.set(glossaryTerm.id, glossaryTerm);

    logger.info(`Glossary term added: ${glossaryTerm.term}`, 'data-catalog');

    return glossaryTerm;
  }

  /**
   * Update glossary term
   */
  updateGlossaryTerm(id: string, updates: Partial<GlossaryTerm>): GlossaryTerm | null {
    const term = this.glossary.get(id);
    if (!term) return null;

    const updated = {
      ...term,
      ...updates,
      updatedAt: new Date(),
    };

    this.glossary.set(id, updated);

    return updated;
  }

  /**
   * Search glossary
   */
  searchGlossary(query: string): GlossaryTerm[] {
    const searchLower = query.toLowerCase();

    return Array.from(this.glossary.values())
      .filter(term => {
        const searchableText = [
          term.term,
          term.definition,
          ...(term.synonyms || []),
          term.category,
        ].join(' ').toLowerCase();

        return searchableText.includes(searchLower);
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }

  /**
   * Get all glossary terms
   */
  getAllGlossaryTerms(): GlossaryTerm[] {
    return Array.from(this.glossary.values())
      .sort((a, b) => a.term.localeCompare(b.term));
  }

  /**
   * Get glossary term by ID
   */
  getGlossaryTerm(id: string): GlossaryTerm | null {
    return this.glossary.get(id) || null;
  }

  // ==================== TAGGING ====================

  /**
   * Add tags to an asset
   */
  addTags(assetId: string, tags: string[]): boolean {
    const entry = this.catalog.get(assetId);
    if (!entry) return false;

    const existingTags = new Set(entry.tags);
    tags.forEach(tag => existingTags.add(tag));

    entry.tags = Array.from(existingTags);
    entry.updatedAt = new Date();

    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(assetId);
    });

    return true;
  }

  /**
   * Remove tags from an asset
   */
  removeTags(assetId: string, tags: string[]): boolean {
    const entry = this.catalog.get(assetId);
    if (!entry) return false;

    entry.tags = entry.tags.filter(tag => !tags.includes(tag));
    entry.updatedAt = new Date();

    // Update tag index
    tags.forEach(tag => {
      const entries = this.tagIndex.get(tag);
      if (entries) {
        entries.delete(assetId);
      }
    });

    return true;
  }

  /**
   * Get all tags
   */
  getAllTags(): Array<{ tag: string; count: number }> {
    return Array.from(this.tagIndex.entries())
      .map(([tag, entries]) => ({ tag, count: entries.size }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get assets by tag
   */
  getAssetsByTag(tag: string): CatalogEntry[] {
    const assetIds = this.tagIndex.get(tag);
    if (!assetIds) return [];

    return Array.from(assetIds)
      .map(id => this.catalog.get(id))
      .filter((entry): entry is CatalogEntry => entry !== undefined);
  }

  // ==================== CLASSIFICATIONS ====================

  /**
   * Add classifications to an asset
   */
  addClassifications(assetId: string, classifications: string[]): boolean {
    const entry = this.catalog.get(assetId);
    if (!entry) return false;

    const existing = new Set(entry.classifications);
    classifications.forEach(cls => existing.add(cls));

    entry.classifications = Array.from(existing);
    entry.updatedAt = new Date();

    // Update classification index
    classifications.forEach(cls => {
      if (!this.classificationIndex.has(cls)) {
        this.classificationIndex.set(cls, new Set());
      }
      this.classificationIndex.get(cls)!.add(assetId);
    });

    return true;
  }

  /**
   * Get all classifications
   */
  getAllClassifications(): Array<{ classification: string; count: number }> {
    return Array.from(this.classificationIndex.entries())
      .map(([classification, entries]) => ({ classification, count: entries.size }))
      .sort((a, b) => b.count - a.count);
  }

  // ==================== ANALYTICS ====================

  /**
   * Get catalog statistics
   */
  getStatistics(): {
    totalAssets: number;
    assetsByType: Record<string, number>;
    totalTags: number;
    totalClassifications: number;
    totalGlossaryTerms: number;
    assetsWithPII: number;
    assetsBySensitivity: Record<string, number>;
  } {
    const assetsByType: Record<string, number> = {};
    const assetsBySensitivity: Record<string, number> = {};
    let assetsWithPII = 0;

    for (const entry of this.catalog.values()) {
      assetsByType[entry.assetType] = (assetsByType[entry.assetType] || 0) + 1;
      
      if (entry.pii) assetsWithPII++;
      
      if (entry.sensitivity) {
        assetsBySensitivity[entry.sensitivity] = (assetsBySensitivity[entry.sensitivity] || 0) + 1;
      }
    }

    return {
      totalAssets: this.catalog.size,
      assetsByType,
      totalTags: this.tagIndex.size,
      totalClassifications: this.classificationIndex.size,
      totalGlossaryTerms: this.glossary.size,
      assetsWithPII,
      assetsBySensitivity,
    };
  }

  /**
   * Get popular assets
   */
  getPopularAssets(limit: number = 10): CatalogEntry[] {
    return Array.from(this.catalog.values())
      .filter(entry => entry.usageStats)
      .sort((a, b) => 
        (b.usageStats?.popularityScore || 0) - (a.usageStats?.popularityScore || 0)
      )
      .slice(0, limit);
  }

  /**
   * Get recently accessed assets
   */
  getRecentlyAccessedAssets(limit: number = 10): CatalogEntry[] {
    return Array.from(this.catalog.values())
      .filter(entry => entry.lastAccessedAt)
      .sort((a, b) => 
        (b.lastAccessedAt?.getTime() || 0) - (a.lastAccessedAt?.getTime() || 0)
      )
      .slice(0, limit);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Update search indices
   */
  private updateIndices(entry: CatalogEntry): void {
    // Tag index
    entry.tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(entry.id);
    });

    // Classification index
    entry.classifications.forEach(cls => {
      if (!this.classificationIndex.has(cls)) {
        this.classificationIndex.set(cls, new Set());
      }
      this.classificationIndex.get(cls)!.add(entry.id);
    });

    // Name index (for search)
    const words = entry.name.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (!this.nameIndex.has(word)) {
        this.nameIndex.set(word, new Set());
      }
      this.nameIndex.get(word)!.add(entry.id);
    });
  }

  /**
   * Remove from indices
   */
  private removeFromIndices(entry: CatalogEntry): void {
    // Remove from tag index
    entry.tags.forEach(tag => {
      const entries = this.tagIndex.get(tag);
      if (entries) {
        entries.delete(entry.id);
        if (entries.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    // Remove from classification index
    entry.classifications.forEach(cls => {
      const entries = this.classificationIndex.get(cls);
      if (entries) {
        entries.delete(entry.id);
        if (entries.size === 0) {
          this.classificationIndex.delete(cls);
        }
      }
    });

    // Remove from name index
    const words = entry.name.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const entries = this.nameIndex.get(word);
      if (entries) {
        entries.delete(entry.id);
        if (entries.size === 0) {
          this.nameIndex.delete(word);
        }
      }
    });
  }

  /**
   * Export catalog to JSON
   */
  exportCatalog(): any {
    return {
      entries: Array.from(this.catalog.values()),
      glossary: Array.from(this.glossary.values()),
      exportedAt: new Date(),
    };
  }

  /**
   * Import catalog from JSON
   */
  importCatalog(data: any): void {
    if (data.entries) {
      for (const entry of data.entries) {
        this.catalog.set(entry.id, entry);
        this.updateIndices(entry);
      }
    }

    if (data.glossary) {
      for (const term of data.glossary) {
        this.glossary.set(term.id, term);
      }
    }

    logger.info('Catalog imported', 'data-catalog', {
      entries: data.entries?.length || 0,
      glossaryTerms: data.glossary?.length || 0,
    });
  }
}

// Export singleton instance
export const dataCatalog = DataCatalog.getInstance();

