/**
 * AI Assistant Unit Tests
 */

import { AIAssistant } from '../../lib/services/AIAssistant';

describe('AIAssistant', () => {
  let aiAssistant: AIAssistant;

  beforeEach(() => {
    aiAssistant = AIAssistant.getInstance();
  });

  describe('Relationship Detection', () => {
    it('should detect foreign key relationships', async () => {
      const tables = [
        {
          name: 'customers',
          data: [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' },
          ],
        },
        {
          name: 'orders',
          data: [
            { order_id: 101, customer_id: 1, amount: 100 },
            { order_id: 102, customer_id: 2, amount: 200 },
          ],
        },
      ];

      const relationships = await aiAssistant.detectRelationships(tables);

      expect(relationships.length).toBeGreaterThan(0);
      
      const fkRelationship = relationships.find(
        r => r.sourceColumn === 'customer_id' && r.targetColumn === 'id'
      );

      expect(fkRelationship).toBeDefined();
      expect(fkRelationship?.confidence).toBeGreaterThan(0.5);
      expect(fkRelationship?.evidence.foreignKeyPattern).toBe(true);
    });

    it('should calculate value overlap correctly', async () => {
      const tables = [
        {
          name: 'table1',
          data: [
            { key: 'A', value: 1 },
            { key: 'B', value: 2 },
            { key: 'C', value: 3 },
          ],
        },
        {
          name: 'table2',
          data: [
            { key: 'B', data: 'x' },
            { key: 'C', data: 'y' },
            { key: 'D', data: 'z' },
          ],
        },
      ];

      const relationships = await aiAssistant.detectRelationships(tables);

      const keyRelationship = relationships.find(
        r => r.sourceColumn === 'key' && r.targetColumn === 'key'
      );

      expect(keyRelationship).toBeDefined();
      expect(keyRelationship?.evidence.valueOverlap).toBeGreaterThan(0.6);
    });
  });

  describe('Column Mapping', () => {
    it('should map exact name matches', async () => {
      const sourceColumns = [
        { name: 'email', data: ['john@example.com'] },
        { name: 'phone', data: ['123-456-7890'] },
      ];

      const targetColumns = ['email', 'phone', 'address'];

      const mappings = await aiAssistant.autoMapColumns(sourceColumns, targetColumns);

      const emailMapping = mappings.find(m => m.sourceColumn === 'email');
      expect(emailMapping?.targetColumn).toBe('email');
      expect(emailMapping?.confidence).toBe(1.0);
    });

    it('should handle abbreviations', async () => {
      const sourceColumns = [
        { name: 'fname', data: ['John'] },
        { name: 'lname', data: ['Doe'] },
      ];

      const targetColumns = ['first_name', 'last_name'];

      const mappings = await aiAssistant.autoMapColumns(sourceColumns, targetColumns);

      const fnameMapping = mappings.find(m => m.sourceColumn === 'fname');
      expect(fnameMapping?.targetColumn).toBe('first_name');
      expect(fnameMapping?.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Transformation Suggestions', () => {
    it('should suggest email cleaning', async () => {
      const data = [
        { email: ' JOHN@EXAMPLE.COM ' },
        { email: 'jane@example.com' },
      ];

      const suggestion = await aiAssistant.suggestTransformations('email', data);

      expect(suggestion.transformations.length).toBeGreaterThan(0);
      
      const cleanTransform = suggestion.transformations.find(t => t.type === 'clean');
      expect(cleanTransform).toBeDefined();
      expect(cleanTransform?.code).toContain('toLowerCase');
    });

    it('should suggest phone formatting', async () => {
      const data = [
        { phone: '1234567890' },
        { phone: '987-654-3210' },
      ];

      const suggestion = await aiAssistant.suggestTransformations('phone', data);

      const formatTransform = suggestion.transformations.find(t => t.type === 'format');
      expect(formatTransform).toBeDefined();
    });
  });

  describe('Data Quality Detection', () => {
    it('should detect missing values', async () => {
      const data = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: null, email: 'jane@example.com' },
        { id: 3, name: 'Bob', email: null },
      ];

      const issues = await aiAssistant.detectQualityIssues('test-table', data);

      const nameIssue = issues.find(i => i.column === 'name' && i.category === 'missing_values');
      const emailIssue = issues.find(i => i.column === 'email' && i.category === 'missing_values');

      expect(nameIssue).toBeDefined();
      expect(emailIssue).toBeDefined();
      expect(nameIssue?.affectedRecords).toBe(1);
      expect(emailIssue?.affectedRecords).toBe(1);
    });

    it('should detect duplicates', async () => {
      const data = [
        { id: 1, name: 'John' },
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];

      const issues = await aiAssistant.detectQualityIssues('test-table', data);

      const duplicateIssue = issues.find(i => i.category === 'duplicates');
      expect(duplicateIssue).toBeDefined();
      expect(duplicateIssue?.affectedRecords).toBe(1);
    });

    it('should detect invalid email formats', async () => {
      const data = [
        { id: 1, email: 'valid@example.com' },
        { id: 2, email: 'invalid-email' },
        { id: 3, email: 'another@example.com' },
      ];

      const issues = await aiAssistant.detectQualityIssues('test-table', data);

      const emailIssue = issues.find(i => i.column === 'email' && i.category === 'format');
      expect(emailIssue).toBeDefined();
      expect(emailIssue?.affectedRecords).toBe(1);
    });
  });
});

