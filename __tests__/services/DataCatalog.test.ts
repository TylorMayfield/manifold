/**
 * Data Catalog Unit Tests
 */

import { DataCatalog, CatalogEntry } from '../../lib/services/DataCatalog';

describe('DataCatalog', () => {
  let catalog: DataCatalog;

  beforeEach(() => {
    catalog = DataCatalog.getInstance();
  });

  describe('Asset Registration', () => {
    it('should register a data asset', () => {
      const entry = catalog.registerAsset({
        assetType: 'data_source',
        assetId: 'customers-db',
        name: 'Customer Database',
        qualifiedName: 'prod.customers.main',
        description: 'Main customer data',
        tags: ['production', 'customer'],
        classifications: ['pii'],
        technicalMetadata: {
          dataType: 'mysql',
          recordCount: 10000,
        },
        businessMetadata: {},
      });

      expect(entry.id).toBeDefined();
      expect(entry.name).toBe('Customer Database');
      expect(entry.tags).toContain('production');
    });

    it('should update an asset', () => {
      const entry = catalog.registerAsset({
        assetType: 'data_source',
        assetId: 'test-db',
        name: 'Test DB',
        qualifiedName: 'test.db',
        tags: [],
        classifications: [],
        technicalMetadata: {},
        businessMetadata: {},
      });

      const updated = catalog.updateAsset(entry.id, {
        description: 'Updated description',
        tags: ['test'],
      });

      expect(updated?.description).toBe('Updated description');
      expect(updated?.tags).toContain('test');
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      // Register test assets
      catalog.registerAsset({
        assetType: 'data_source',
        assetId: 'customers',
        name: 'Customer Data',
        qualifiedName: 'customers',
        description: 'Customer information',
        tags: ['production', 'pii'],
        classifications: ['customer'],
        technicalMetadata: {},
        businessMetadata: {},
      });

      catalog.registerAsset({
        assetType: 'pipeline',
        assetId: 'transform',
        name: 'Customer Transform',
        qualifiedName: 'transform.customer',
        description: 'Transform customer data',
        tags: ['production'],
        classifications: [],
        technicalMetadata: {},
        businessMetadata: {},
      });
    });

    it('should search by query text', () => {
      const results = catalog.search({ query: 'customer' });

      expect(results.entries.length).toBeGreaterThan(0);
      expect(results.entries.every(e => 
        e.name.toLowerCase().includes('customer') ||
        e.description?.toLowerCase().includes('customer')
      )).toBe(true);
    });

    it('should filter by asset type', () => {
      const results = catalog.search({
        query: '',
        assetTypes: ['data_source'],
      });

      expect(results.entries.every(e => e.assetType === 'data_source')).toBe(true);
    });

    it('should filter by tags', () => {
      const results = catalog.search({
        query: '',
        tags: ['pii'],
      });

      expect(results.entries.every(e => e.tags.includes('pii'))).toBe(true);
    });

    it('should provide facets', () => {
      const results = catalog.search({ query: '' });

      expect(results.facets.assetTypes.size).toBeGreaterThan(0);
      expect(results.facets.tags.size).toBeGreaterThan(0);
    });
  });

  describe('Tagging', () => {
    it('should add tags to an asset', () => {
      const entry = catalog.registerAsset({
        assetType: 'data_source',
        assetId: 'test',
        name: 'Test',
        qualifiedName: 'test',
        tags: [],
        classifications: [],
        technicalMetadata: {},
        businessMetadata: {},
      });

      const success = catalog.addTags(entry.id, ['tag1', 'tag2']);
      expect(success).toBe(true);

      const updated = catalog.getAsset(entry.id);
      expect(updated?.tags).toContain('tag1');
      expect(updated?.tags).toContain('tag2');
    });

    it('should get all tags', () => {
      catalog.registerAsset({
        assetType: 'data_source',
        assetId: 'test',
        name: 'Test',
        qualifiedName: 'test',
        tags: ['tag1', 'tag2'],
        classifications: [],
        technicalMetadata: {},
        businessMetadata: {},
      });

      const allTags = catalog.getAllTags();
      expect(allTags.length).toBeGreaterThan(0);
      expect(allTags.every(t => t.tag && typeof t.count === 'number')).toBe(true);
    });
  });

  describe('Business Glossary', () => {
    it('should add glossary term', () => {
      const term = catalog.addGlossaryTerm({
        term: 'Customer',
        definition: 'A person who purchases products',
        synonyms: ['Client'],
        category: 'Sales',
        status: 'approved',
      });

      expect(term.id).toBeDefined();
      expect(term.term).toBe('Customer');
    });

    it('should search glossary', () => {
      catalog.addGlossaryTerm({
        term: 'Revenue',
        definition: 'Total income from sales',
        category: 'Finance',
        status: 'approved',
      });

      const results = catalog.searchGlossary('revenue');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].term).toBe('Revenue');
    });
  });
});

