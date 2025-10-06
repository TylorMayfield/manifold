/**
 * Data Masking and Anonymization Service
 * 
 * Protects sensitive data through:
 * - PII Detection (emails, SSNs, credit cards, phone numbers, addresses, etc.)
 * - Multiple masking strategies (redact, hash, tokenize, partial, shuffle, etc.)
 * - Column-level masking rules
 * - Reversible and irreversible masking
 * - Compliance with GDPR, HIPAA, PCI-DSS
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';

// ==================== TYPES ====================

export type PIIType = 
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'address'
  | 'name'
  | 'date_of_birth'
  | 'ip_address'
  | 'passport'
  | 'driver_license'
  | 'custom';

export type MaskingStrategy = 
  | 'redact'
  | 'hash'
  | 'tokenize'
  | 'partial'
  | 'shuffle'
  | 'encrypt'
  | 'nullify'
  | 'fake'
  | 'generalize';

export interface PIIDetectionResult {
  field: string;
  piiType: PIIType;
  confidence: number; // 0-1
  sampleValues: string[];
  affectedRecords: number;
  pattern?: string;
  recommendations: string[];
}

export interface MaskingRule {
  id: string;
  name: string;
  field: string;
  piiType?: PIIType;
  strategy: MaskingStrategy;
  config?: MaskingConfig;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaskingConfig {
  // Partial masking
  visibleStart?: number;
  visibleEnd?: number;
  maskChar?: string;
  
  // Encryption
  algorithm?: string;
  key?: string;
  
  // Tokenization
  tokenFormat?: string;
  preserveLength?: boolean;
  
  // Generalization
  precision?: number;
  
  // Fake data
  locale?: string;
  format?: string;
}

export interface MaskingPolicy {
  id: string;
  name: string;
  description?: string;
  rules: MaskingRule[];
  applyToAll?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MaskingResult {
  originalRecords: number;
  maskedRecords: number;
  fieldsProcessed: number;
  ruleApplications: number;
  duration: number;
  errors: string[];
}

// ==================== PII PATTERNS ====================

const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  phone: /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  credit_card: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
  ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  date_of_birth: /\b(0?[1-9]|1[0-2])[/-](0?[1-9]|[12]\d|3[01])[/-](19|20)\d{2}\b/,
  passport: /\b[A-Z]{1,2}\d{6,9}\b/,
  driver_license: /\b[A-Z]{1,2}\d{6,8}\b/,
};

// ==================== DATA MASKING SERVICE ====================

export class DataMaskingService {
  private static instance: DataMaskingService;
  
  private policies: Map<string, MaskingPolicy> = new Map();
  private tokenMap: Map<string, string> = new Map();
  private reverseTokenMap: Map<string, string> = new Map();

  static getInstance(): DataMaskingService {
    if (!DataMaskingService.instance) {
      DataMaskingService.instance = new DataMaskingService();
    }
    return DataMaskingService.instance;
  }

  constructor() {}

  // ==================== PII DETECTION ====================

  /**
   * Detect PII in a dataset
   */
  async detectPII(data: any[], options?: {
    sampleSize?: number;
    minConfidence?: number;
  }): Promise<PIIDetectionResult[]> {
    const startTime = Date.now();
    const sampleSize = options?.sampleSize || Math.min(100, data.length);
    const minConfidence = options?.minConfidence || 0.5;
    
    logger.info('Starting PII detection', 'data-masking', {
      totalRecords: data.length,
      sampleSize,
    });

    const results: PIIDetectionResult[] = [];

    if (data.length === 0) {
      return results;
    }

    // Get all fields from first record
    const fields = Object.keys(data[0]);
    const sample = data.slice(0, sampleSize);

    for (const field of fields) {
      const values = sample.map(row => row[field]).filter(v => v != null);
      
      if (values.length === 0) continue;

      // Test against all PII patterns
      for (const [piiType, pattern] of Object.entries(PII_PATTERNS)) {
        const matches = values.filter(v => 
          typeof v === 'string' && pattern.test(v)
        );

        const confidence = matches.length / values.length;

        if (confidence >= minConfidence) {
          const affectedRecords = data.filter(row => 
            typeof row[field] === 'string' && pattern.test(row[field])
          ).length;

          results.push({
            field,
            piiType: piiType as PIIType,
            confidence,
            sampleValues: matches.slice(0, 3).map(v => this.partialMask(v)),
            affectedRecords,
            pattern: pattern.source,
            recommendations: this.getRecommendations(piiType as PIIType),
          });
        }
      }

      // Name detection (heuristic)
      if (field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('first') || 
          field.toLowerCase().includes('last')) {
        
        const affectedRecords = data.filter(row => row[field] != null).length;
        
        results.push({
          field,
          piiType: 'name',
          confidence: 0.8,
          sampleValues: values.slice(0, 3).map(v => this.partialMask(String(v))),
          affectedRecords,
          recommendations: this.getRecommendations('name'),
        });
      }

      // Address detection (heuristic)
      if (field.toLowerCase().includes('address') || 
          field.toLowerCase().includes('street')) {
        
        const affectedRecords = data.filter(row => row[field] != null).length;
        
        results.push({
          field,
          piiType: 'address',
          confidence: 0.7,
          sampleValues: values.slice(0, 3).map(v => this.partialMask(String(v))),
          affectedRecords,
          recommendations: this.getRecommendations('address'),
        });
      }
    }

    logger.success('PII detection completed', 'data-masking', {
      duration: Date.now() - startTime,
      fieldsScanned: fields.length,
      piiFieldsFound: results.length,
    });

    return results;
  }

  /**
   * Get recommendations for a PII type
   */
  private getRecommendations(piiType: PIIType): string[] {
    const recommendations: Record<PIIType, string[]> = {
      email: ['Use hash or tokenize strategy', 'Consider partial masking (show domain)'],
      phone: ['Use partial masking (show last 4 digits)', 'Consider tokenization for analytics'],
      ssn: ['Always use full redaction or encryption', 'Never store in plain text'],
      credit_card: ['Use PCI-DSS compliant tokenization', 'Show only last 4 digits'],
      address: ['Generalize to zip code or city level', 'Use hash for exact matching'],
      name: ['Use fake data generation', 'Consider tokenization'],
      date_of_birth: ['Generalize to year or age range', 'Use partial masking'],
      ip_address: ['Mask last octet', 'Use hash for exact matching'],
      passport: ['Always use full redaction', 'Use tokenization if needed for matching'],
      driver_license: ['Always use full redaction', 'Use tokenization if needed'],
      custom: ['Define custom masking strategy', 'Test with sample data'],
    };

    return recommendations[piiType] || ['Review and apply appropriate masking strategy'];
  }

  // ==================== MASKING STRATEGIES ====================

  /**
   * Apply masking rules to data
   */
  async applyMasking(
    data: any[],
    rules: MaskingRule[]
  ): Promise<{ maskedData: any[]; result: MaskingResult }> {
    const startTime = Date.now();
    
    logger.info('Applying data masking', 'data-masking', {
      records: data.length,
      rules: rules.length,
    });

    const errors: string[] = [];
    let ruleApplications = 0;
    const fieldsProcessed = new Set<string>();

    const maskedData = data.map((record, index) => {
      const maskedRecord = { ...record };

      for (const rule of rules) {
        if (!rule.enabled) continue;

        try {
          if (record[rule.field] != null) {
            maskedRecord[rule.field] = this.applyStrategy(
              record[rule.field],
              rule.strategy,
              rule.config
            );
            ruleApplications++;
            fieldsProcessed.add(rule.field);
          }
        } catch (error) {
          errors.push(`Record ${index}, Field ${rule.field}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return maskedRecord;
    });

    const result: MaskingResult = {
      originalRecords: data.length,
      maskedRecords: maskedData.length,
      fieldsProcessed: fieldsProcessed.size,
      ruleApplications,
      duration: Date.now() - startTime,
      errors,
    };

    logger.success('Data masking completed', 'data-masking', result);

    return { maskedData, result };
  }

  /**
   * Apply a masking strategy to a value
   */
  private applyStrategy(value: any, strategy: MaskingStrategy, config?: MaskingConfig): any {
    const strValue = String(value);

    switch (strategy) {
      case 'redact':
        return this.redact(strValue, config);
      
      case 'hash':
        return this.hash(strValue);
      
      case 'tokenize':
        return this.tokenize(strValue, config);
      
      case 'partial':
        return this.partialMask(strValue, config);
      
      case 'shuffle':
        return this.shuffle(strValue);
      
      case 'encrypt':
        return this.encrypt(strValue, config);
      
      case 'nullify':
        return null;
      
      case 'fake':
        return this.generateFake(strValue, config);
      
      case 'generalize':
        return this.generalize(value, config);
      
      default:
        return value;
    }
  }

  /**
   * Redact value completely
   */
  private redact(value: string, config?: MaskingConfig): string {
    const maskChar = config?.maskChar || '*';
    const length = config?.preserveLength ? value.length : 8;
    return maskChar.repeat(length);
  }

  /**
   * Hash value (irreversible)
   */
  private hash(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Tokenize value (reversible with token map)
   */
  private tokenize(value: string, config?: MaskingConfig): string {
    // Check if already tokenized
    if (this.tokenMap.has(value)) {
      return this.tokenMap.get(value)!;
    }

    // Generate token
    const token = config?.tokenFormat 
      ? this.generateFormattedToken(value, config.tokenFormat)
      : `TKN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Store mapping
    this.tokenMap.set(value, token);
    this.reverseTokenMap.set(token, value);

    return token;
  }

  /**
   * Generate formatted token
   */
  private generateFormattedToken(value: string, format: string): string {
    let token = format;
    
    // Replace placeholders
    token = token.replace(/X/g, () => Math.floor(Math.random() * 10).toString());
    token = token.replace(/A/g, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    
    return token;
  }

  /**
   * Partial masking (show some characters)
   */
  private partialMask(value: string, config?: MaskingConfig): string {
    const visibleStart = config?.visibleStart || 0;
    const visibleEnd = config?.visibleEnd || 4;
    const maskChar = config?.maskChar || '*';

    if (value.length <= visibleStart + visibleEnd) {
      return maskChar.repeat(value.length);
    }

    const start = value.substring(0, visibleStart);
    const end = value.substring(value.length - visibleEnd);
    const masked = maskChar.repeat(value.length - visibleStart - visibleEnd);

    return start + masked + end;
  }

  /**
   * Shuffle characters
   */
  private shuffle(value: string): string {
    const arr = value.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  /**
   * Encrypt value (reversible with key)
   */
  private encrypt(value: string, config?: MaskingConfig): string {
    const algorithm = config?.algorithm || 'aes-256-cbc';
    const key = config?.key || crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
      algorithm,
      Buffer.from(key),
      iv
    );

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Generate fake data
   */
  private generateFake(value: string, config?: MaskingConfig): string {
    // Simple fake data generation
    // In production, would use a library like faker.js
    
    const format = config?.format || 'generic';
    
    switch (format) {
      case 'email':
        return `user${Math.floor(Math.random() * 10000)}@example.com`;
      
      case 'phone':
        return `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
      
      case 'name':
        const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      
      case 'address':
        return `${Math.floor(Math.random() * 9999 + 1)} Main St, City, ST 12345`;
      
      default:
        return `FAKE_${crypto.randomBytes(4).toString('hex')}`;
    }
  }

  /**
   * Generalize value (reduce precision)
   */
  private generalize(value: any, config?: MaskingConfig): any {
    const precision = config?.precision || 1;

    // Numeric generalization
    if (typeof value === 'number') {
      const factor = Math.pow(10, precision);
      return Math.floor(value / factor) * factor;
    }

    // Date generalization
    if (value instanceof Date) {
      const date = new Date(value);
      if (precision === 1) {
        // Year only
        return date.getFullYear();
      } else if (precision === 2) {
        // Year and month
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    // String generalization (truncate)
    if (typeof value === 'string') {
      return value.substring(0, Math.max(1, Math.floor(value.length / precision)));
    }

    return value;
  }

  /**
   * Detokenize value (reverse tokenization)
   */
  detokenize(token: string): string | null {
    return this.reverseTokenMap.get(token) || null;
  }

  // ==================== POLICY MANAGEMENT ====================

  /**
   * Create a masking policy
   */
  createPolicy(params: {
    name: string;
    description?: string;
    rules: Omit<MaskingRule, 'id' | 'createdAt' | 'updatedAt'>[];
    tags?: string[];
  }): MaskingPolicy {
    const policy: MaskingPolicy = {
      id: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: params.name,
      description: params.description,
      rules: params.rules.map(rule => ({
        ...rule,
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      tags: params.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policies.set(policy.id, policy);

    logger.info(`Masking policy created: ${policy.name}`, 'data-masking', {
      policyId: policy.id,
      rules: policy.rules.length,
    });

    return policy;
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId: string): MaskingPolicy | null {
    return this.policies.get(policyId) || null;
  }

  /**
   * Get all policies
   */
  getAllPolicies(): MaskingPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Update policy
   */
  updatePolicy(policyId: string, updates: Partial<MaskingPolicy>): MaskingPolicy | null {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    const updated = {
      ...policy,
      ...updates,
      updatedAt: new Date(),
    };

    this.policies.set(policyId, updated);

    logger.info(`Masking policy updated: ${updated.name}`, 'data-masking', { policyId });

    return updated;
  }

  /**
   * Delete policy
   */
  deletePolicy(policyId: string): boolean {
    const deleted = this.policies.delete(policyId);
    
    if (deleted) {
      logger.info('Masking policy deleted', 'data-masking', { policyId });
    }

    return deleted;
  }

  /**
   * Apply policy to data
   */
  async applyPolicy(policyId: string, data: any[]): Promise<{ maskedData: any[]; result: MaskingResult }> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    return this.applyMasking(data, policy.rules);
  }

  /**
   * Clear token maps
   */
  clearTokenMaps(): void {
    this.tokenMap.clear();
    this.reverseTokenMap.clear();
    logger.info('Token maps cleared', 'data-masking');
  }
}

// Export singleton instance
export const dataMasking = DataMaskingService.getInstance();

