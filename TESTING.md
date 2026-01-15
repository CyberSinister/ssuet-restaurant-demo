# Testing Guide

This document describes the testing infrastructure and best practices for the Restaurant Order Management System.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

Our testing strategy includes:

- **Unit Tests**: Testing individual functions and business logic (Vitest + React Testing Library)
- **Integration Tests**: Testing API routes and database operations (Vitest)
- **Component Tests**: Testing React components in isolation (Vitest + React Testing Library)
- **E2E Tests**: Testing complete user flows (Playwright)

### Tech Stack

- **Vitest**: Fast unit testing framework with native ES modules support
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing across multiple browsers
- **MSW (Mock Service Worker)**: API mocking for tests
- **Testing Library Jest DOM**: Custom matchers for DOM assertions

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/customer-flow.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

### Running All Tests

```bash
# Run unit tests and E2E tests sequentially
npm run test:run && npm run test:e2e
```

## Test Structure

```
restaurant-order-adm/
├── lib/validations/__tests__/
│   └── schemas.test.ts              # Zod schema validation tests
├── src/lib/
│   ├── test-utils.tsx               # Test utilities and providers
│   ├── test-utils/
│   │   ├── factories.ts             # Test data factories
│   │   └── mocks.ts                 # MSW handlers
│   └── utils/__tests__/
│       ├── cart-calculations.test.ts # Cart logic tests
│       └── format-helpers.test.ts    # Formatting utilities tests
├── e2e/
│   ├── customer-flow.spec.ts        # Customer journey tests
│   └── admin-flow.spec.ts           # Admin panel tests
├── vitest.config.ts                 # Vitest configuration
├── vitest.setup.ts                  # Global test setup
└── playwright.config.ts             # Playwright configuration
```

## Writing Tests

### Unit Tests

#### Testing Pure Functions

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../format-helpers'

describe('formatCurrency', () => {
  it('formats positive amounts correctly', () => {
    expect(formatCurrency(10.99)).toBe('$10.99')
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('handles edge cases', () => {
    expect(formatCurrency(0)).toBe('$0.00')
    expect(formatCurrency(-10.99)).toBe('-$10.99')
  })
})
```

#### Testing Business Logic

```typescript
import { describe, it, expect } from 'vitest'
import { calculateOrderTotal } from '../cart-calculations'
import { createMockCartItem, createMockRestaurantSettings } from '../../test-utils/factories'

describe('calculateOrderTotal', () => {
  it('calculates pickup order correctly', () => {
    const cart = [createMockCartItem({ quantity: 2 })]
    const settings = createMockRestaurantSettings({ taxRate: 0.08 })

    const result = calculateOrderTotal(cart, 'pickup', settings)

    expect(result.subtotal).toBe(19.98)
    expect(result.tax).toBeCloseTo(1.60, 2)
    expect(result.deliveryFee).toBe(0)
    expect(result.total).toBeCloseTo(21.58, 2)
  })
})
```

### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@/lib/test-utils'
import MenuView from '../MenuView'

describe('MenuView', () => {
  it('renders menu items', () => {
    render(<MenuView />)

    expect(screen.getByTestId('menu-view')).toBeInTheDocument()
  })

  it('filters items by category', async () => {
    render(<MenuView />)

    const categoryButton = screen.getByText('Appetizers')
    fireEvent.click(categoryButton)

    // Assertions for filtered results
  })
})
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test.describe('Customer Order Flow', () => {
  test('should complete full order', async ({ page }) => {
    await page.goto('/')

    // Add item to cart
    await page.locator('[data-testid="add-to-cart"]').first().click()

    // Open cart
    await page.locator('[data-testid="cart-button"]').click()

    // Checkout
    await page.locator('button', { hasText: 'Proceed to Checkout' }).click()

    // Fill form
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="phone"]', '555-123-4567')

    // Submit
    await page.locator('button', { hasText: 'Place Order' }).click()

    // Verify success
    await expect(page.locator('text=Order placed successfully')).toBeVisible()
  })
})
```

## Test Patterns and Best Practices

### Use Test Data Factories

Always use factory functions to create test data:

```typescript
import { createMockMenuItem, createMockOrder } from '@/lib/test-utils/factories'

const item = createMockMenuItem({ price: 15.99 })
const order = createMockOrder({ status: 'pending' })
```

### Mock External Dependencies

Use MSW for API mocking:

```typescript
import { setupServer } from 'msw/node'
import { handlers } from '@/lib/test-utils/mocks'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Test User Interactions

Prefer user-centric queries:

```typescript
// Good - how users find elements
screen.getByRole('button', { name: 'Add to Cart' })
screen.getByLabelText('Email')
screen.getByText('Order placed successfully')

// Avoid - implementation details
screen.getByTestId('submit-button')
screen.getByClassName('btn-primary')
```

### Async Operations

Always wait for async updates:

```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loading...')).not.toBeInTheDocument()
})
```

### Clean Up

Tests should be isolated and not affect each other:

```typescript
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
```

## Coverage Requirements

### Overall Targets

- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 80%+
- **Statements**: 80%+

### Priority Coverage

#### High Priority (100% coverage required)

- `lib/validations/schemas.ts` - Input validation
- `src/lib/utils/cart-calculations.ts` - Cart calculations
- All API route handlers - Business logic

#### Medium Priority (90%+ coverage)

- `src/lib/utils/format-helpers.ts` - Formatting utilities
- Business logic functions
- Data transformation utilities

#### Lower Priority (70%+ coverage)

- UI components
- Layout components
- Error boundaries

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- **Pull Requests**: All tests must pass
- **Push to main/develop**: Full test suite + coverage check
- **Nightly**: Full E2E suite across all browsers

### Pre-commit Hooks

Consider adding pre-commit hooks:

```bash
# Install husky
npm install -D husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test:run"
```

### Coverage Enforcement

CI will fail if coverage drops below 80% for:

- Lines
- Functions
- Branches
- Statements

## Debugging Tests

### Debug Unit Tests

```bash
# Use Vitest UI for interactive debugging
npm run test:ui

# Run specific test file
npm run test -- cart-calculations.test.ts

# Run tests matching pattern
npm run test -- --grep "calculates total"
```

### Debug E2E Tests

```bash
# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode with Playwright Inspector
npm run test:e2e:debug

# Run specific test
npx playwright test customer-flow.spec.ts:10

# Show trace viewer for failed tests
npx playwright show-trace trace.zip
```

### Common Debugging Tips

1. **Use `screen.debug()`** to see DOM state:
   ```typescript
   import { screen } from '@testing-library/react'
   screen.debug()  // Prints entire DOM
   screen.debug(screen.getByRole('button'))  // Prints specific element
   ```

2. **Use `page.pause()`** in Playwright:
   ```typescript
   await page.pause()  // Pauses execution and opens Playwright Inspector
   ```

3. **Check test output**:
   ```bash
   npm run test:run -- --reporter=verbose
   ```

## Troubleshooting

### Common Issues

#### Tests timing out

Increase timeout in vitest.config.ts:

```typescript
export default defineConfig({
  test: {
    testTimeout: 20000,  // Increase from default 5000
  },
})
```

#### Element not found

Ensure proper async handling:

```typescript
// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

#### Mock not working

Verify mock is defined before import:

```typescript
import { vi } from 'vitest'

// Mock BEFORE importing component
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

import MyComponent from './MyComponent'
```

#### Playwright browser not launching

```bash
# Reinstall browsers
npx playwright install --with-deps
```

#### Coverage not accurate

Clear coverage cache:

```bash
rm -rf coverage node_modules/.vitest
npm run test:coverage
```

## Test Data Management

### Using Factories

```typescript
// Create single item
const item = createMockMenuItem({ price: 12.99 })

// Create with relationships
const order = createMockOrder({
  items: [
    createMockCartItem({ quantity: 2 }),
    createMockCartItem({ quantity: 1 }),
  ],
})

// Use predefined fixtures
import { mockCategories, mockMenuItems } from '@/lib/test-utils/factories'
```

### Seeding Test Database

For integration tests requiring database:

```typescript
import { prisma } from '@/lib/db/prisma'

beforeEach(async () => {
  // Clear database
  await prisma.order.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.category.deleteMany()

  // Seed test data
  await prisma.category.create({
    data: { name: 'Test Category', displayOrder: 1 },
  })
})
```

## Performance Testing

### Test Execution Time

Monitor test performance:

```bash
# Run with timing
npm run test:run -- --reporter=verbose

# Identify slow tests (>1s)
npm run test:run -- --reporter=verbose | grep -E '\d{4,}ms'
```

### Best Practices

- Keep unit tests under 100ms
- Keep integration tests under 1s
- Keep E2E tests under 30s

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Getting Help

- Check existing tests for examples
- Review test output for detailed error messages
- Use `--reporter=verbose` for more details
- Check the troubleshooting section above

---

**Remember**: Good tests are:
- **Fast**: Run quickly to encourage frequent execution
- **Isolated**: Don't depend on other tests
- **Repeatable**: Same result every time
- **Self-validating**: Clear pass/fail without manual inspection
- **Timely**: Written alongside or before production code
