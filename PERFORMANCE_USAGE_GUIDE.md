# Performance Optimization Usage Guide

Quick reference guide for using the performance optimizations in the restaurant ordering application.

## Quick Start

### Running Performance Audits

```bash
# Check TypeScript types
npm run type-check

# Build and analyze bundle
npm run build:analyze

# Build and run production server
npm run perf:audit

# Run Lighthouse audit (after starting server)
lighthouse http://localhost:3000 --view
```

## Component Usage

### 1. Optimized Menu Items

Replace standard menu item cards with memoized version:

```typescript
import { MemoizedMenuItem } from '@/lib/components/optimized/MemoizedMenuItem'

// In your component
<div className="grid grid-cols-3 gap-6">
  {menuItems.map(item => (
    <MemoizedMenuItem
      key={item.id}
      item={item}
      categoryName={getCategoryName(item.categoryId)}
      onAddToCart={handleAddToCart}
    />
  ))}
</div>
```

### 2. Optimized Images

Use OptimizedImage instead of regular img tags:

```typescript
import { OptimizedImage } from '@/lib/components/optimized/OptimizedImage'

// Basic usage
<OptimizedImage
  src="/menu/pizza.jpg"
  alt="Delicious Pizza"
  width={400}
  height={300}
/>

// With priority (above the fold)
<OptimizedImage
  src="/hero-image.jpg"
  alt="Restaurant hero"
  width={1200}
  height={600}
  priority={true}
/>

// With custom fallback
<OptimizedImage
  src="/menu/item.jpg"
  alt="Menu item"
  width={400}
  height={300}
  fallbackSrc="/placeholder-food.jpg"
/>
```

### 3. Virtualized Lists

For lists with 100+ items, use virtualization:

```typescript
import { VirtualizedMenuList } from '@/lib/components/optimized/VirtualizedMenuList'
import { useRef } from 'react'

function MenuPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} style={{ height: '100vh', overflow: 'auto' }}>
      <VirtualizedMenuList
        items={menuItems}
        categories={categories}
        onAddToCart={handleAddToCart}
        containerRef={containerRef}
      />
    </div>
  )
}
```

### 4. Lazy-Loaded Components

Use lazy loading for admin components:

```typescript
import {
  LazyAdminDashboard,
  LazyCategoryManagement,
  LazyMenuManagement,
  LazyOrdersManagement,
  LazySettingsManagement,
} from '@/lib/components/lazy'

function AdminPage() {
  return (
    <div>
      <LazyAdminDashboard />
    </div>
  )
}
```

### 5. Lazy Modal

For modals with heavy content:

```typescript
import { LazyModal } from '@/lib/components/lazy'
import { useState } from 'react'

function OrdersPage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>View Details</button>

      <LazyModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Order Details"
        description="View complete order information"
      >
        <OrderDetailsForm orderId={selectedOrderId} />
      </LazyModal>
    </>
  )
}
```

## Database Queries

### Using Optimized Queries

```typescript
import {
  getActiveMenuItems,
  getMenuItemById,
  getOrdersPaginated,
  getActiveCategories,
  getOrCreateCustomer,
} from '@/lib/db/queries'

// Fetch menu items
const menuItems = await getActiveMenuItems()

// Fetch single item
const item = await getMenuItemById('item-id')

// Paginated orders
const { orders, pagination } = await getOrdersPaginated({
  page: 1,
  limit: 20,
  status: 'pending',
})

// Get or create customer
const customer = await getOrCreateCustomer({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
})
```

## Caching

### Using Cache Configuration

```typescript
import { QUERY_KEYS, STALE_TIME, CACHE_DURATION } from '@/lib/cache/config'
import { useQuery } from '@tanstack/react-query'

// Menu query with caching
export function useMenu() {
  return useQuery({
    queryKey: QUERY_KEYS.menu,
    queryFn: async () => {
      const response = await fetch('/api/menu')
      return response.json()
    },
    staleTime: STALE_TIME.MENU,
    gcTime: CACHE_DURATION.MENU,
  })
}

// Categories query
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: fetchCategories,
    staleTime: STALE_TIME.CATEGORIES,
    gcTime: CACHE_DURATION.CATEGORIES,
  })
}
```

### Manual Cache Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/cache/config'

function MenuManagement() {
  const queryClient = useQueryClient()

  const handleMenuUpdate = async () => {
    await updateMenu()
    // Invalidate menu cache
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menu })
  }
}
```

## Rate Limiting

### Applying Rate Limits to API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server'
import {
  publicRateLimiter,
  authRateLimiter,
  orderRateLimiter,
} from '@/lib/middleware/rate-limit'

// Public API route
export async function GET(request: NextRequest) {
  const rateLimitResult = await publicRateLimiter(request)
  if (rateLimitResult) {
    return rateLimitResult // Returns 429 if exceeded
  }

  // Process request
  return NextResponse.json({ data: 'success' })
}

// Auth route
export async function POST(request: NextRequest) {
  const rateLimitResult = await authRateLimiter(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  // Process authentication
  return NextResponse.json({ token: 'xxx' })
}

// Order creation route
export async function POST(request: NextRequest) {
  const rateLimitResult = await orderRateLimiter(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  // Create order
  return NextResponse.json({ orderId: 'xxx' })
}
```

## Analytics

### Tracking Events

```typescript
import {
  trackOrderPlaced,
  trackItemAddedToCart,
  trackCategorySelected,
  trackError,
} from '@/lib/analytics/events'

// Track order placement
function handleOrderSubmit(order: Order) {
  trackOrderPlaced(order.id, order.total, order.items.length)
}

// Track cart additions
function handleAddToCart(item: MenuItem) {
  trackItemAddedToCart(item.id, item.name, item.price)
}

// Track category selection
function handleCategoryChange(category: Category) {
  trackCategorySelected(category.id, category.name)
}

// Track errors
try {
  await riskyOperation()
} catch (error) {
  trackError(error as Error, 'order-submission')
}
```

## Performance Patterns

### 1. Memoization

Use `useMemo` for expensive calculations:

```typescript
import { useMemo } from 'react'

function CartSummary({ cart }: { cart: CartItem[] }) {
  // Memoize total calculation
  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  // Memoize filtered items
  const availableItems = useMemo(() => {
    return cart.filter(item => item.menuItem.available)
  }, [cart])

  return <div>Total: ${total.toFixed(2)}</div>
}
```

### 2. Callbacks

Use `useCallback` for event handlers:

```typescript
import { useCallback } from 'react'

function MenuList({ items }: { items: MenuItem[] }) {
  const handleAddToCart = useCallback((item: MenuItem) => {
    addToCart(item)
    toast.success(`${item.name} added to cart`)
  }, []) // Stable reference

  return (
    <div>
      {items.map(item => (
        <MemoizedMenuItem
          key={item.id}
          item={item}
          onAddToCart={handleAddToCart} // Won't cause re-renders
        />
      ))}
    </div>
  )
}
```

### 3. Component Memoization

Wrap expensive components in `React.memo()`:

```typescript
import { memo } from 'react'

interface Props {
  order: Order
  onStatusChange: (status: string) => void
}

const OrderCard = memo<Props>(
  ({ order, onStatusChange }) => {
    return (
      <div>
        {/* Render order */}
      </div>
    )
  },
  // Custom comparison
  (prevProps, nextProps) => {
    return (
      prevProps.order.id === nextProps.order.id &&
      prevProps.order.status === nextProps.order.status
    )
  }
)
```

### 4. ISR (Incremental Static Regeneration)

For static pages that update periodically:

```typescript
// app/menu/page.tsx
export const revalidate = 60 // Revalidate every 60 seconds

export default async function MenuPage() {
  const menuItems = await getActiveMenuItems()

  return (
    <div>
      {/* Render menu */}
    </div>
  )
}
```

## Testing Performance

### 1. Local Testing

```bash
# Build production
npm run build

# Start production server
npm run start

# In another terminal, run Lighthouse
lighthouse http://localhost:3000 --view
```

### 2. Network Throttling

Open Chrome DevTools:
1. Network tab
2. Select "Slow 3G" or "Fast 3G"
3. Test page load and interactions

### 3. React Profiler

1. Install React DevTools extension
2. Open DevTools → Profiler tab
3. Click Record
4. Perform actions
5. Stop recording
6. Analyze flame graph

### 4. Bundle Analysis

```bash
# Generate bundle analysis
npm run build:analyze

# Opens visualization in browser
```

## Common Pitfalls

### 1. Forgetting to Memoize Event Handlers

❌ **Bad:**
```typescript
{items.map(item => (
  <MemoizedItem
    item={item}
    onClick={() => handleClick(item)} // New function every render!
  />
))}
```

✅ **Good:**
```typescript
const handleClick = useCallback((item: MenuItem) => {
  // Handle click
}, [])

{items.map(item => (
  <MemoizedItem
    item={item}
    onClick={handleClick}
  />
))}
```

### 2. Over-Memoization

❌ **Bad:**
```typescript
// Memoizing simple calculation
const sum = useMemo(() => a + b, [a, b]) // Overhead not worth it
```

✅ **Good:**
```typescript
// Only memoize expensive operations
const filteredAndSorted = useMemo(() => {
  return items
    .filter(/* complex filter */)
    .sort(/* expensive sort */)
    .map(/* transformation */)
}, [items])
```

### 3. Not Using Proper Query Keys

❌ **Bad:**
```typescript
useQuery({
  queryKey: ['orders'], // Too generic
  queryFn: fetchOrders,
})
```

✅ **Good:**
```typescript
import { QUERY_KEYS } from '@/lib/cache/config'

useQuery({
  queryKey: QUERY_KEYS.orders({ status: 'pending', page: 1 }),
  queryFn: fetchOrders,
})
```

### 4. Not Handling Loading States

❌ **Bad:**
```typescript
const { data } = useMenu()
return <div>{data.map(...)}</div> // Crashes if data is undefined
```

✅ **Good:**
```typescript
const { data, isLoading } = useMenu()

if (isLoading) return <MenuSkeleton />
if (!data) return <div>Failed to load</div>

return <div>{data.map(...)}</div>
```

## Monitoring in Production

### Key Metrics to Watch

1. **Core Web Vitals**
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1

2. **API Performance**
   - Response time < 200ms
   - Error rate < 1%

3. **User Metrics**
   - Bounce rate
   - Session duration
   - Conversion rate

### Setting Up Alerts

Configure alerts in your monitoring tool:
- Error rate > 1%
- LCP > 3.5s
- API response time > 500ms

## Additional Resources

- [Performance Guide](./PERFORMANCE.md) - Complete optimization guide
- [Performance Checklist](./PERFORMANCE_CHECKLIST.md) - Pre-deployment checklist
- [TypeScript Migration](./TYPESCRIPT_STRICT_MIGRATION.md) - Strict mode guide
- [Next.js Docs](https://nextjs.org/docs) - Official documentation

## Getting Help

If you encounter performance issues:

1. Check the documentation first
2. Run performance profiling
3. Review the checklist
4. Analyze with bundle analyzer
5. Check error logs

## Summary

- ✅ Use optimized components for better performance
- ✅ Implement proper caching strategies
- ✅ Apply rate limiting to protect APIs
- ✅ Track analytics for insights
- ✅ Test performance regularly
- ✅ Monitor in production

---

**Last Updated:** December 2025
