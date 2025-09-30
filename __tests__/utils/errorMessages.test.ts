import {
  enhanceError,
  getErrorIcon,
  getErrorColor,
  ERROR_PATTERNS,
  EnhancedError
} from '../../lib/utils/errorMessages';

describe('Error Messages Utility', () => {
  describe('enhanceError', () => {
    it('should enhance a connection error', () => {
      const error = new Error('Unable to connect to the database server');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('CONNECTION_REFUSED');
      expect(enhanced.severity).toBe('high');
      expect(enhanced.category).toBe('connection');
      expect(enhanced.suggestions).toHaveLength(3);
      expect(enhanced.timestamp).toBeInstanceOf(Date);
    });

    it('should enhance an access denied error', () => {
      const error = new Error('Authentication failed - access denied');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('ACCESS_DENIED');
      expect(enhanced.severity).toBe('high');
      expect(enhanced.category).toBe('permission');
      expect(enhanced.suggestions[0].title).toBe('Verify credentials');
    });

    it('should enhance a database not found error', () => {
      const error = new Error('The specified database does not exist');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('DATABASE_NOT_FOUND');
      expect(enhanced.severity).toBe('medium');
      expect(enhanced.category).toBe('connection');
    });

    it('should handle validation errors', () => {
      const error = new Error('The uploaded file format is not supported');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('INVALID_FILE_FORMAT');
      expect(enhanced.category).toBe('validation');
    });

    it('should handle API rate limit errors', () => {
      const error = new Error('API rate limit exceeded');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('API_RATE_LIMIT');
      expect(enhanced.severity).toBe('medium');
      expect(enhanced.category).toBe('network');
    });

    it('should handle network timeout errors', () => {
      const error = new Error('Request timed out');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('NETWORK_TIMEOUT');
      expect(enhanced.category).toBe('network');
    });

    it('should handle system errors', () => {
      const error = new Error('Not enough memory to process the request');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('INSUFFICIENT_MEMORY');
      expect(enhanced.severity).toBe('high');
      expect(enhanced.category).toBe('system');
    });

    it('should handle data corruption errors', () => {
      const error = new Error('Data appears to be corrupted');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('DATA_CORRUPTION');
      expect(enhanced.severity).toBe('critical');
      expect(enhanced.category).toBe('data');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Something weird happened');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('UNKNOWN');
      expect(enhanced.message).toBe('Something weird happened');
      expect(enhanced.severity).toBe('medium');
      expect(enhanced.category).toBe('system');
      expect(enhanced.suggestions).toHaveLength(3);
    });

    it('should handle string errors', () => {
      const enhanced = enhanceError('Connection failed');

      expect(enhanced.code).toBe('UNKNOWN');
      expect(enhanced.message).toBe('Connection failed');
    });

    it('should include technical details from Error stack', () => {
      const error = new Error('Test error');
      const enhanced = enhanceError(error);

      expect(enhanced.technicalDetails).toBeDefined();
      expect(typeof enhanced.technicalDetails).toBe('string');
    });

    it('should handle case-insensitive matching', () => {
      const error = new Error('UNABLE TO CONNECT TO THE DATABASE SERVER');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('CONNECTION_REFUSED');
    });

    it('should match partial error messages', () => {
      const error = new Error('Error: Unable to connect to the database server');
      const enhanced = enhanceError(error);

      expect(enhanced.code).toBe('CONNECTION_REFUSED');
    });
  });

  describe('getErrorIcon', () => {
    it('should return correct icon for low severity', () => {
      expect(getErrorIcon('low')).toBe('info');
    });

    it('should return correct icon for medium severity', () => {
      expect(getErrorIcon('medium')).toBe('warning');
    });

    it('should return correct icon for high severity', () => {
      expect(getErrorIcon('high')).toBe('error');
    });

    it('should return correct icon for critical severity', () => {
      expect(getErrorIcon('critical')).toBe('critical');
    });

    it('should return default icon for unknown severity', () => {
      expect(getErrorIcon('unknown' as any)).toBe('warning');
    });
  });

  describe('getErrorColor', () => {
    it('should return correct color for low severity', () => {
      expect(getErrorColor('low')).toBe('blue');
    });

    it('should return correct color for medium severity', () => {
      expect(getErrorColor('medium')).toBe('yellow');
    });

    it('should return correct color for high severity', () => {
      expect(getErrorColor('high')).toBe('red');
    });

    it('should return correct color for critical severity', () => {
      expect(getErrorColor('critical')).toBe('red');
    });

    it('should return default color for unknown severity', () => {
      expect(getErrorColor('unknown' as any)).toBe('yellow');
    });
  });

  describe('ERROR_PATTERNS', () => {
    it('should have all required properties for each pattern', () => {
      Object.values(ERROR_PATTERNS).forEach(pattern => {
        expect(pattern).toHaveProperty('code');
        expect(pattern).toHaveProperty('message');
        expect(pattern).toHaveProperty('severity');
        expect(pattern).toHaveProperty('category');
        expect(pattern).toHaveProperty('suggestions');
        expect(Array.isArray(pattern.suggestions)).toBe(true);
        expect(pattern.suggestions.length).toBeGreaterThan(0);
      });
    });

    it('should have valid severity levels', () => {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      
      Object.values(ERROR_PATTERNS).forEach(pattern => {
        expect(validSeverities).toContain(pattern.severity);
      });
    });

    it('should have valid categories', () => {
      const validCategories = ['connection', 'validation', 'permission', 'data', 'system', 'network'];
      
      Object.values(ERROR_PATTERNS).forEach(pattern => {
        expect(validCategories).toContain(pattern.category);
      });
    });

    it('should have suggestions with required fields', () => {
      Object.values(ERROR_PATTERNS).forEach(pattern => {
        pattern.suggestions.forEach(suggestion => {
          expect(suggestion).toHaveProperty('title');
          expect(suggestion).toHaveProperty('description');
          expect(typeof suggestion.title).toBe('string');
          expect(typeof suggestion.description).toBe('string');
          expect(suggestion.title.length).toBeGreaterThan(0);
          expect(suggestion.description.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('EnhancedError structure', () => {
    it('should create proper enhanced error structure', () => {
      const error = new Error('Test error');
      const enhanced = enhanceError(error);

      expect(enhanced).toHaveProperty('code');
      expect(enhanced).toHaveProperty('message');
      expect(enhanced).toHaveProperty('severity');
      expect(enhanced).toHaveProperty('category');
      expect(enhanced).toHaveProperty('suggestions');
      expect(enhanced).toHaveProperty('timestamp');
      expect(enhanced.timestamp).toBeInstanceOf(Date);
    });

    it('should include optional technicalDetails when Error object is provided', () => {
      const error = new Error('Test error with stack');
      const enhanced = enhanceError(error);

      expect(enhanced.technicalDetails).toBeDefined();
    });

    it('should not include technicalDetails for string errors', () => {
      const enhanced = enhanceError('Simple string error');

      expect(enhanced.technicalDetails).toBeUndefined();
    });
  });
});
