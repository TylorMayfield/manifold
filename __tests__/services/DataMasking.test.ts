/**
 * Data Masking Unit Tests
 */

import { DataMaskingService, PIIType, MaskingStrategy } from '../../lib/services/DataMasking';

describe('DataMaskingService', () => {
  let service: DataMaskingService;

  beforeEach(() => {
    service = DataMaskingService.getInstance();
    service.clearTokenMaps();
  });

  describe('PII Detection', () => {
    it('should detect email addresses', async () => {
      const data = [
        { id: 1, email: 'john@example.com' },
        { id: 2, email: 'jane@test.org' },
        { id: 3, email: 'bob@company.co.uk' },
      ];

      const results = await service.detectPII(data);

      const emailDetection = results.find(r => r.piiType === 'email');
      expect(emailDetection).toBeDefined();
      expect(emailDetection?.field).toBe('email');
      expect(emailDetection?.confidence).toBeGreaterThan(0.9);
      expect(emailDetection?.affectedRecords).toBe(3);
    });

    it('should detect phone numbers', async () => {
      const data = [
        { id: 1, phone: '555-123-4567' },
        { id: 2, phone: '(555) 234-5678' },
        { id: 3, phone: '555.345.6789' },
      ];

      const results = await service.detectPII(data);

      const phoneDetection = results.find(r => r.piiType === 'phone');
      expect(phoneDetection).toBeDefined();
      expect(phoneDetection?.confidence).toBeGreaterThan(0.5); // Some formats vary
    });

    it('should detect SSNs', async () => {
      const data = [
        { id: 1, ssn: '123-45-6789' },
        { id: 2, ssn: '987-65-4321' },
      ];

      const results = await service.detectPII(data);

      const ssnDetection = results.find(r => r.piiType === 'ssn');
      expect(ssnDetection).toBeDefined();
      expect(ssnDetection?.affectedRecords).toBe(2);
    });

    it('should detect credit cards', async () => {
      const data = [
        { id: 1, card: '4532-1234-5678-9010' },
        { id: 2, card: '5425 2334 3010 9903' },
      ];

      const results = await service.detectPII(data);

      const cardDetection = results.find(r => r.piiType === 'credit_card');
      expect(cardDetection).toBeDefined();
    });

    it('should provide recommendations', async () => {
      const data = [
        { email: 'test@example.com', ssn: '123-45-6789' },
      ];

      const results = await service.detectPII(data);

      results.forEach(result => {
        expect(result.recommendations).toBeDefined();
        expect(result.recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Masking Strategies', () => {
    it('should apply redact strategy', async () => {
      const data = [
        { id: 1, email: 'john@example.com' },
      ];

      const rules = [{
        id: 'rule-1',
        name: 'Redact Email',
        field: 'email',
        strategy: 'redact' as MaskingStrategy,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      const { maskedData } = await service.applyMasking(data, rules);

      expect(maskedData[0].email).toBe('********');
    });

    it('should apply hash strategy', async () => {
      const data = [
        { id: 1, email: 'john@example.com' },
      ];

      const rules = [{
        id: 'rule-1',
        name: 'Hash Email',
        field: 'email',
        strategy: 'hash' as MaskingStrategy,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      const { maskedData } = await service.applyMasking(data, rules);

      expect(maskedData[0].email).toMatch(/^[a-f0-9]{16}$/);
      expect(maskedData[0].email).not.toBe('john@example.com');
    });

    it('should apply tokenize strategy', async () => {
      const data = [
        { id: 1, ssn: '123-45-6789' },
        { id: 2, ssn: '123-45-6789' }, // Same SSN
      ];

      const rules = [{
        id: 'rule-1',
        name: 'Tokenize SSN',
        field: 'ssn',
        strategy: 'tokenize' as MaskingStrategy,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      const { maskedData } = await service.applyMasking(data, rules);

      // Same input should produce same token
      expect(maskedData[0].ssn).toBe(maskedData[1].ssn);
      expect(maskedData[0].ssn).toMatch(/^TKN-/);
    });

    it('should apply partial masking', async () => {
      const data = [
        { id: 1, card: '4532123456789010' },
      ];

      const rules = [{
        id: 'rule-1',
        name: 'Partial Card',
        field: 'card',
        strategy: 'partial' as MaskingStrategy,
        config: {
          visibleStart: 0,
          visibleEnd: 4,
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      const { maskedData } = await service.applyMasking(data, rules);

      expect(maskedData[0].card).toMatch(/^\*+9010$/);
    });

    it('should apply nullify strategy', async () => {
      const data = [
        { id: 1, ssn: '123-45-6789' },
      ];

      const rules = [{
        id: 'rule-1',
        name: 'Nullify SSN',
        field: 'ssn',
        strategy: 'nullify' as MaskingStrategy,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      const { maskedData } = await service.applyMasking(data, rules);

      expect(maskedData[0].ssn).toBeNull();
    });
  });

  describe('Masking Policies', () => {
    it('should create a policy', () => {
      const policy = service.createPolicy({
        name: 'PII Protection',
        description: 'Standard PII masking',
        rules: [
          {
            name: 'Mask Email',
            field: 'email',
            strategy: 'hash',
            enabled: true,
          },
        ],
      });

      expect(policy.id).toBeDefined();
      expect(policy.name).toBe('PII Protection');
      expect(policy.rules).toHaveLength(1);
    });

    it('should get policy by ID', () => {
      const policy = service.createPolicy({
        name: 'Test Policy',
        rules: [],
      });

      const retrieved = service.getPolicy(policy.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(policy.id);
    });

    it('should get all policies', () => {
      service.createPolicy({ name: 'Policy 1', rules: [] });
      service.createPolicy({ name: 'Policy 2', rules: [] });

      const policies = service.getAllPolicies();
      expect(policies.length).toBeGreaterThanOrEqual(2);
    });

    it('should apply policy to data', async () => {
      const policy = service.createPolicy({
        name: 'Email Masking',
        rules: [
          {
            name: 'Hash Email',
            field: 'email',
            strategy: 'hash',
            enabled: true,
          },
        ],
      });

      const data = [
        { id: 1, email: 'john@example.com' },
      ];

      const { maskedData, result } = await service.applyPolicy(policy.id, data);

      expect(maskedData[0].email).not.toBe('john@example.com');
      expect(result.maskedRecords).toBe(1);
      expect(result.fieldsProcessed).toBe(1);
    });
  });

  describe('Tokenization', () => {
    it('should allow detokenization', () => {
      const original = 'sensitive-value';
      
      const policy = service.createPolicy({
        name: 'Tokenize',
        rules: [
          {
            name: 'Tokenize Field',
            field: 'data',
            strategy: 'tokenize',
            enabled: true,
          },
        ],
      });

      const data = [{ data: original }];
      
      service.applyPolicy(policy.id, data).then(({ maskedData }) => {
        const token = maskedData[0].data;
        const detokenized = service.detokenize(token);
        
        expect(detokenized).toBe(original);
      });
    });
  });

  describe('Multiple Rules', () => {
    it('should apply multiple rules', async () => {
      const data = [
        { id: 1, email: 'john@example.com', phone: '555-1234', ssn: '123-45-6789' },
      ];

      const rules = [
        {
          id: 'rule-1',
          name: 'Hash Email',
          field: 'email',
          strategy: 'hash' as MaskingStrategy,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rule-2',
          name: 'Partial Phone',
          field: 'phone',
          strategy: 'partial' as MaskingStrategy,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rule-3',
          name: 'Redact SSN',
          field: 'ssn',
          strategy: 'redact' as MaskingStrategy,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { maskedData, result } = await service.applyMasking(data, rules);

      expect(maskedData[0].email).not.toBe('john@example.com');
      expect(maskedData[0].phone).not.toBe('555-1234');
      expect(maskedData[0].ssn).toBe('********');
      expect(result.fieldsProcessed).toBe(3);
      expect(result.ruleApplications).toBe(3);
    });

    it('should skip disabled rules', async () => {
      const data = [
        { id: 1, email: 'john@example.com' },
      ];

      const rules = [
        {
          id: 'rule-1',
          name: 'Hash Email',
          field: 'email',
          strategy: 'hash' as MaskingStrategy,
          enabled: false, // Disabled
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const { maskedData, result } = await service.applyMasking(data, rules);

      expect(maskedData[0].email).toBe('john@example.com');
      expect(result.ruleApplications).toBe(0);
    });
  });
});

