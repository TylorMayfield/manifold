# Comprehensive Testing Guide for Manifold ETL

## Overview

This guide covers the complete testing strategy for the Manifold ETL application, including unit tests, integration tests, performance tests, accessibility tests, and end-to-end workflow tests.

## Test Architecture

### Test Categories

1. **Unit Tests** - Individual component and function testing
2. **Integration Tests** - API and service integration testing
3. **Performance Tests** - Load testing and performance validation
4. **Accessibility Tests** - WCAG compliance and screen reader support
5. **End-to-End Tests** - Complete user workflow testing
6. **Database Tests** - Database operation and data integrity testing
7. **Service Tests** - Business logic and service layer testing

### Test Structure

```
__tests__/
├── components/          # UI component tests
├── integration/         # Integration test suites
├── performance/         # Performance and load tests
├── accessibility/       # Accessibility compliance tests
├── workflows/           # End-to-end workflow tests
├── lib/database/        # Database operation tests
├── services/            # Service layer tests
├── api/                 # API endpoint tests
├── hooks/               # Custom hook tests
├── contexts/            # Context provider tests
├── utils/               # Test utilities and helpers
└── config/              # Test configuration and setup
```

## Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Suite Commands

```bash
# Unit tests (components, hooks, utilities)
npm run test:unit

# Integration tests (APIs, services)
npm run test:integration

# Performance tests (load, memory, render performance)
npm run test:performance

# Accessibility tests (WCAG compliance, keyboard navigation)
npm run test:accessibility

# End-to-end tests (complete workflows)
npm run test:e2e

# Database tests (CRUD operations, data integrity)
npm run test:database

# Service tests (business logic, data processing)
npm run test:services
```

### Advanced Test Commands

```bash
# Run quick test suite (unit + services)
npm run test:quick

# Run full test suite (all tests)
npm run test:full

# Run production validation tests
npm run test:prod

# Run all tests with advanced configuration
npm run test:all

# Run tests with production settings
npm run test:production

# Generate test analysis report
npm run test:analyze
```

### Custom Test Runner

```bash
# Use the custom test runner
node scripts/test-runner.js [command]

# Available commands:
node scripts/test-runner.js quick       # Quick test suite
node scripts/test-runner.js full        # Full test suite
node scripts/test-runner.js production  # Production tests
node scripts/test-runner.js unit        # Unit tests only
node scripts/test-runner.js integration # Integration tests only
```

## Test Utilities

### Advanced Test Utils

The `__tests__/utils/advanced-test-utils.tsx` provides:

- **Custom Render Function**: With all providers and context
- **Mock Data Generators**: For consistent test data
- **Test Helpers**: Form testing, navigation, API mocking
- **Performance Helpers**: Render time measurement, memory tracking
- **Accessibility Helpers**: ARIA checking, keyboard navigation
- **Snapshot Helpers**: Consistent snapshot testing

### Usage Example

```typescript
import { render, mockDataGenerators, testHelpers } from '../utils/advanced-test-utils'

test('should render component with mock data', () => {
  const mockDataSource = mockDataGenerators.dataSource({
    name: 'Test Data Source',
    type: 'csv'
  })
  
  render(<DataSourceComponent data={mockDataSource} />)
  
  expect(screen.getByText('Test Data Source')).toBeInTheDocument()
})
```

## Test Configuration

### Environment-Specific Configurations

The test suite supports different configurations for different environments:

- **Development**: Watch mode, relaxed timeouts
- **CI**: Strict coverage requirements, parallel execution
- **Production**: Performance validation, security testing

### Coverage Requirements

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: 70%+ coverage
- **Services**: 85%+ coverage
- **Database**: 90%+ coverage

### Performance Benchmarks

- **Component Rendering**: < 100ms
- **API Responses**: < 500ms
- **Large Data Sets**: < 2s processing time
- **Memory Usage**: < 50MB increase per operation

## Writing Tests

### Component Testing

```typescript
import { render, screen, fireEvent } from '../utils/advanced-test-utils'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should render with default props', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const mockOnClick = jest.fn()
    render(<MyComponent onClick={mockOnClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockOnClick).toHaveBeenCalled()
  })
})
```

### API Testing

```typescript
import { GET, POST } from '../../../app/api/data-sources/route'

describe('/api/data-sources', () => {
  it('should return data sources on GET', async () => {
    const request = new Request('http://localhost:3000/api/data-sources')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })
})
```

### Performance Testing

```typescript
import { performanceHelpers } from '../utils/advanced-test-utils'

describe('Performance Tests', () => {
  it('should render within performance budget', async () => {
    const renderTime = await performanceHelpers.measureRender(() => {
      render(<LargeComponent />)
    })
    
    expect(renderTime).toBeLessThan(100)
  })
})
```

### Accessibility Testing

```typescript
import { a11yHelpers } from '../utils/advanced-test-utils'

describe('Accessibility Tests', () => {
  it('should support keyboard navigation', async () => {
    render(<NavigationComponent />)
    
    const focusableElements = screen.getAllByRole('button')
    const results = await a11yHelpers.testKeyboardNavigation(focusableElements)
    
    expect(results.every(result => result.focused)).toBe(true)
  })
})
```

## Test Data Management

### Mock Data Generators

```typescript
// Generate consistent test data
const dataSource = mockDataGenerators.dataSource({
  name: 'Custom Name',
  type: 'javascript'
})

const project = mockDataGenerators.project({
  name: 'Test Project'
})

const job = mockDataGenerators.job({
  type: 'backup',
  status: 'active'
})
```

### API Mocking

```typescript
// Mock successful API responses
const mockFetch = testHelpers.mockFetch.success({ data: [] })

// Mock API errors
const mockFetchError = testHelpers.mockFetch.error(500, 'Server Error')

// Mock network errors
const mockFetchNetworkError = testHelpers.mockFetch.networkError()
```

## Continuous Integration

### CI Configuration

The test suite is designed to work with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm run test:ci
    npm run test:analyze
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Test Reporting

Tests generate multiple types of reports:

- **Coverage Reports**: HTML, LCOV, JSON formats
- **JUnit Reports**: For CI integration
- **Performance Reports**: Render times, memory usage
- **Accessibility Reports**: WCAG compliance scores
- **Custom Analysis**: Comprehensive test analysis

## Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the behavior
3. **Arrange, Act, Assert** pattern for test structure
4. **Mock external dependencies** for isolated testing
5. **Clean up after tests** to prevent side effects

### Performance Considerations

1. **Run tests in parallel** when possible
2. **Use appropriate timeouts** for different test types
3. **Mock heavy operations** to speed up tests
4. **Profile slow tests** and optimize them
5. **Use test data factories** for consistent performance

### Accessibility Testing

1. **Test keyboard navigation** for all interactive elements
2. **Verify ARIA attributes** are properly set
3. **Check color contrast** ratios
4. **Test with screen readers** when possible
5. **Validate form labels** and descriptions

### Error Handling

1. **Test error scenarios** as well as success cases
2. **Mock network failures** and API errors
3. **Test loading states** and timeouts
4. **Verify error messages** are accessible
5. **Test recovery mechanisms** after errors

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout values or optimize slow operations
2. **Memory leaks**: Check for proper cleanup in tests
3. **Flaky tests**: Identify race conditions and add proper waits
4. **Coverage gaps**: Add tests for uncovered code paths
5. **Performance regressions**: Monitor test execution times

### Debug Commands

```bash
# Run specific test with verbose output
npm test -- --verbose MyComponent.test.tsx

# Run tests with debugging
npm test -- --detectOpenHandles --forceExit

# Run tests with coverage for specific files
npm test -- --coverage --collectCoverageFrom="components/MyComponent.tsx"
```

## Test Maintenance

### Regular Tasks

1. **Update tests** when components change
2. **Add tests** for new features
3. **Remove obsolete tests** for removed features
4. **Refactor tests** for better maintainability
5. **Update mocks** when APIs change

### Monitoring

1. **Track test execution times** for performance regressions
2. **Monitor coverage trends** to ensure quality
3. **Review test failures** to identify patterns
4. **Analyze flaky tests** and fix root causes
5. **Update test documentation** as needed

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Accessibility Testing Guide](https://web.dev/accessibility-testing/)
- [Performance Testing Best Practices](https://web.dev/performance-testing/)

### Tools

- **Jest**: Test framework and runner
- **React Testing Library**: Component testing utilities
- **MSW**: API mocking
- **axe-core**: Accessibility testing
- **Lighthouse CI**: Performance testing

This comprehensive testing guide ensures that the Manifold ETL application maintains high quality, performance, and accessibility standards across all components and features.
