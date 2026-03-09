---
name: Testing Workflow
description: Run tests and write new test cases
---

# Testing Workflow

Guidelines for running and writing tests.

## Running Tests

### Unit Tests
// turbo
```bash
# JavaScript/TypeScript
npm run test

# Python
pytest

# Go
go test ./...

# Java
mvn test
```

### Watch Mode
```bash
npm run test -- --watch
# pytest-watch
# go test ./... -v
```

### With Coverage
```bash
npm run test:coverage
# pytest --cov
# go test -cover ./...
```

### E2E Tests
```bash
# Playwright
npm run test:e2e

# Cypress
npx cypress run

# Selenium
pytest tests/e2e/
```

## Writing Unit Tests

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/            # End-to-end tests
└── fixtures/       # Test data
```

### Test Template (JavaScript)
```javascript
describe('functionName', () => {
  beforeEach(() => {
    // Setup
  });

  it('should return expected result for valid input', () => {
    const result = myFunction('valid-input');
    expect(result).toBe('expected-output');
  });

  it('should throw error for invalid input', () => {
    expect(() => myFunction(null)).toThrow();
  });

  it('should handle edge case', () => {
    const result = myFunction('');
    expect(result).toBeNull();
  });
});
```

### Test Template (Python)
```python
import pytest

class TestFunctionName:
    def setup_method(self):
        # Setup
        pass

    def test_valid_input(self):
        result = my_function('valid-input')
        assert result == 'expected-output'

    def test_invalid_input(self):
        with pytest.raises(ValueError):
            my_function(None)

    def test_edge_case(self):
        result = my_function('')
        assert result is None
```

## Writing E2E Tests

### E2E Template
```javascript
test('user can complete checkout', async ({ page }) => {
  // Arrange
  await page.goto('/');
  
  // Act
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout"]');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('[data-testid="submit"]');
  
  // Assert
  await expect(page).toHaveURL('/confirmation');
  await expect(page.getByText('Order confirmed')).toBeVisible();
});
```

### Selector Best Practices
```javascript
// ✅ Good
await page.click('[data-testid="submit"]');
await page.getByRole('button', { name: 'Submit' });
await page.getByText('Add to Cart');

// ❌ Avoid
await page.click('.btn-primary');  // Fragile
```

## Test Coverage Goals

| Area | Target |
|------|--------|
| Business logic | 80%+ |
| Utilities | 90%+ |
| API routes | 70%+ |
| Critical paths | 100% |

## Test Checklist

- [ ] Test happy path
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Test loading states
- [ ] Mock external dependencies
- [ ] Clean up test data
