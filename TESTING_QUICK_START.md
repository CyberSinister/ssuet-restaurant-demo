# Testing Quick Start Guide

## Quick Commands

```bash
# Unit Tests
npm test                    # Watch mode
npm run test:run           # Run once
npm run test:ui            # Visual UI
npm run test:coverage      # With coverage

# E2E Tests
npm run test:e2e           # All browsers
npm run test:e2e:ui        # Interactive mode
npm run test:e2e:debug     # Debug mode

# Specific Tests
npm test cart-calculations  # Run specific file
npx playwright test customer-flow.spec.ts  # Specific E2E test
```

## Test Coverage Summary

### Current Test Suite

- **88 Unit Tests** (100% passing)
  - 53 validation schema tests
  - 20 formatting utility tests
  - 15 cart calculation tests

- **40+ E2E Tests** across:
  - Customer order flow
  - Admin authentication
  - Menu management
  - Order management
  - Settings configuration

### Coverage Targets

| Area | Target | Priority |
|------|--------|----------|
| Validations | 100% | High |
| Cart Logic | 100% | High |
| API Routes | 90%+ | High |
| Utils | 90%+ | Medium |
| Components | 70%+ | Medium |

## Test Files Location

```
├── lib/validations/__tests__/     # Validation tests
├── src/lib/utils/__tests__/        # Utility tests
├── src/lib/test-utils/             # Test helpers
└── e2e/                            # E2E tests
```

## Writing Your First Test

### Unit Test Example

```typescript
// src/lib/utils/__tests__/my-util.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from '../my-util'

describe('myFunction', () => {
  it('should work correctly', () => {
    expect(myFunction(5)).toBe(10)
  })
})
```

### E2E Test Example

```typescript
// e2e/my-flow.spec.ts
import { test, expect } from '@playwright/test'

test('should complete flow', async ({ page }) => {
  await page.goto('/')
  await page.click('[data-testid="button"]')
  await expect(page.locator('text=Success')).toBeVisible()
})
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase timeout in config |
| Element not found | Use `waitFor()` for async |
| Mock not working | Define before import |
| Playwright fails | Run `npx playwright install --with-deps` |

## CI/CD

- Tests run on every PR
- Coverage must be ≥80%
- All E2E tests must pass
- Type checking enforced

## Need Help?

See [TESTING.md](./TESTING.md) for full documentation.
