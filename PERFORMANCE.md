# Performance Optimization Guide

This document outlines the performance optimizations implemented in the restaurant ordering application.

## Table of Contents

1. [Overview](#overview)
2. [React Performance Optimizations](#react-performance-optimizations)
3. [Image Optimization](#image-optimization)
4. [Database Query Optimization](#database-query-optimization)
5. [Caching Strategies](#caching-strategies)
6. [Bundle Size Optimization](#bundle-size-optimization)
7. [Code Splitting](#code-splitting)
8. [Rate Limiting](#rate-limiting)
9. [Performance Monitoring](#performance-monitoring)
10. [SEO Optimizations](#seo-optimizations)

## Overview

The application has been optimized for performance with the following key improvements:

- TypeScript strict mode enabled for better type safety
- React components memoized to prevent unnecessary re-renders
- Images optimized with Next.js Image component
- Database queries optimized with proper indexing
- Caching implemented at multiple levels
- Bundle size reduced through code splitting
- Rate limiting added to protect API routes
- Performance monitoring with Vercel Analytics
- SEO improvements with sitemap and robots.txt

## React Performance Optimizations

### Memoization

We use React's memoization features to optimize rendering performance:

#### Components

- **MemoizedMenuItem** (`lib/components/optimized/MemoizedMenuItem.tsx`)
  - Memoized menu item cards with custom comparison
  - Prevents re-renders when props haven't changed
  - Uses `useCallback` for event handlers

- **MemoizedOrderCard** (`lib/components/optimized/MemoizedOrderCard.tsx`)
  - Optimized order card rendering
  - Custom equality check for order status and total

#### Hooks

Use `useMemo` for expensive calculations:

```typescript
const filteredItems = useMemo(() => {
  return items.filter(item => item.available && item.categoryId === selectedCategory)
}, [items, selectedCategory])

const cartTotal = useMemo(() => {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
}, [cart])
```

Use `useCallback` for event handlers passed as props:

```typescript
const handleAddToCart = useCallback((item: MenuItem) => {
  addItem(item)
  toast.success(`${item.name} added to cart`)
}, [addItem])
```

### Virtualization

For lists with 100+ items, use the virtualized list:

```typescript
import { VirtualizedMenuList } from '@/lib/components/optimized/VirtualizedMenuList'

<VirtualizedMenuList
  items={menuItems}
  categories={categories}
  onAddToCart={handleAddToCart}
  containerRef={containerRef}
/>
```

## Image Optimization

### Next.js Image Component

All images use the optimized `OptimizedImage` component:

```typescript
import { OptimizedImage } from '@/lib/components/optimized/OptimizedImage'

<OptimizedImage
  src={item.image}
  alt={item.name}
  width={400}
  height={300}
  priority={false}
  loading="lazy"
/>
```

### Features

- Automatic image optimization (WebP, AVIF)
- Responsive image sizes
- Lazy loading for below-fold images
- Blur placeholders for loading states
- Fallback images for broken links
- Skeleton loading states

### Configuration

Images are configured in `next.config.js`:

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

## Database Query Optimization

### Optimized Queries

All database queries use the optimized functions in `lib/db/queries.ts`:

```typescript
import { getActiveMenuItems, getOrdersPaginated } from '@/lib/db/queries'

// Optimized query with field selection
const menuItems = await getActiveMenuItems()

// Paginated queries
const { orders, pagination } = await getOrdersPaginated({
  page: 1,
  limit: 20,
  status: 'pending',
})
```

### Indexing

Database indexes are defined in `prisma/schema.prisma`:

```prisma
model MenuItem {
  // ...
  @@index([categoryId])
  @@index([available])
}

model Order {
  // ...
  @@index([customerId])
  @@index([status])
  @@index([createdAt])
}

model Category {
  // ...
  @@index([displayOrder])
}
```

### Query Best Practices

1. **Use `select` to fetch only needed fields**
   ```typescript
   await prisma.menuItem.findMany({
     select: { id: true, name: true, price: true },
   })
   ```

2. **Implement pagination for large datasets**
   ```typescript
   await prisma.order.findMany({
     skip: (page - 1) * limit,
     take: limit,
   })
   ```

3. **Use database-level sorting**
   ```typescript
   await prisma.category.findMany({
     orderBy: { displayOrder: 'asc' },
   })
   ```

## Caching Strategies

### TanStack Query Configuration

Caching is configured in `lib/cache/config.ts`:

```typescript
export const CACHE_DURATION = {
  MENU: 5 * 60 * 1000,        // 5 minutes
  CATEGORIES: 10 * 60 * 1000,  // 10 minutes
  ORDERS: 60 * 1000,           // 1 minute
  SETTINGS: 15 * 60 * 1000,    // 15 minutes
}

export const STALE_TIME = {
  MENU: 2 * 60 * 1000,         // 2 minutes
  CATEGORIES: 5 * 60 * 1000,   // 5 minutes
  ORDERS: 30 * 1000,           // 30 seconds
  SETTINGS: 10 * 60 * 1000,    // 10 minutes
}
```

### Usage

Use the configured query keys and cache times:

```typescript
import { QUERY_KEYS, STALE_TIME, CACHE_DURATION } from '@/lib/cache/config'

export function useMenu() {
  return useQuery({
    queryKey: QUERY_KEYS.menu,
    queryFn: fetchMenu,
    staleTime: STALE_TIME.MENU,
    gcTime: CACHE_DURATION.MENU,
  })
}
```

### API Route Caching

API routes have cache headers configured:

```typescript
headers: {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
}
```

### ISR (Incremental Static Regeneration)

For static pages, use revalidation:

```typescript
export const revalidate = 60 // revalidate every 60 seconds
```

## Bundle Size Optimization

### Bundle Analyzer

Analyze bundle size:

```bash
ANALYZE=true npm run build
```

This will open a visualization of your bundle in the browser.

### Optimizations

1. **Package Import Optimization**
   ```javascript
   experimental: {
     optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
   }
   ```

2. **Tree Shaking**
   - Use named imports instead of default imports
   - Import only what you need

3. **Remove Console Logs in Production**
   ```javascript
   compiler: {
     removeConsole: process.env.NODE_ENV === 'production' ? {
       exclude: ['error', 'warn'],
     } : false,
   }
   ```

## Code Splitting

### Dynamic Imports

Admin components are lazy-loaded:

```typescript
import { LazyAdminDashboard } from '@/lib/components/lazy'

// Component will be loaded only when rendered
<LazyAdminDashboard />
```

### Route-Based Splitting

Next.js automatically splits code by route. Heavy components are in separate chunks.

### Modal Lazy Loading

```typescript
import { LazyModal } from '@/lib/components/lazy'

<LazyModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Order Details"
>
  <OrderDetailsContent />
</LazyModal>
```

## Rate Limiting

### Implementation

Rate limiting is implemented in `lib/middleware/rate-limit.ts`:

```typescript
import { publicRateLimiter, authRateLimiter } from '@/lib/middleware/rate-limit'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await authRateLimiter(request)
  if (rateLimitResult) {
    return rateLimitResult // Returns 429 if rate limit exceeded
  }

  // Process request...
}
```

### Rate Limits

- **Auth endpoints**: 5 requests per 15 minutes
- **Public API**: 60 requests per minute
- **Admin API**: 120 requests per minute
- **Order creation**: 10 requests per minute

### Production Setup

For production, use Redis-based rate limiting:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
})
```

## Performance Monitoring

### Vercel Analytics

Install and configure:

```bash
npm install @vercel/analytics
```

Add to your root layout:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Custom Event Tracking

Track user interactions:

```typescript
import { trackOrderPlaced, trackItemAddedToCart } from '@/lib/analytics/events'

// Track order placement
trackOrderPlaced(orderId, total, itemCount)

// Track cart additions
trackItemAddedToCart(itemId, itemName, price)
```

### Performance Metrics

Track Core Web Vitals:

```typescript
import { trackPageLoad } from '@/lib/analytics/events'

useEffect(() => {
  const startTime = performance.now()

  return () => {
    const loadTime = performance.now() - startTime
    trackPageLoad(window.location.pathname, loadTime)
  }
}, [])
```

## SEO Optimizations

### Sitemap

Dynamic sitemap at `app/sitemap.ts`:

- Includes all public pages
- Updated automatically when content changes
- Accessible at `/sitemap.xml`

### Robots.txt

Configured at `app/robots.ts`:

- Allows indexing of public pages
- Blocks admin and API routes
- Points to sitemap

### Meta Tags

Add proper meta tags to pages:

```typescript
export const metadata: Metadata = {
  title: 'Restaurant Menu - Order Online',
  description: 'Order delicious food for delivery or pickup',
  openGraph: {
    title: 'Restaurant Menu',
    description: 'Order delicious food online',
    images: ['/og-image.jpg'],
  },
}
```

### Structured Data

Add JSON-LD for rich snippets:

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Restaurant Name',
  menu: menuItems.map(item => ({
    '@type': 'MenuItem',
    name: item.name,
    description: item.description,
    offers: {
      '@type': 'Offer',
      price: item.price,
    },
  })),
}
```

## Performance Targets

### Lighthouse Scores

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

### Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Bundle Size

- Total JS: < 300KB (gzipped)
- First Load JS: < 150KB (gzipped)

### Database

- Query time: < 100ms (p95)
- Proper connection pooling configured

## Running Performance Audits

### Lighthouse

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view
```

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true npm run build
```

### Performance Profiling

1. Open Chrome DevTools
2. Go to Performance tab
3. Record page load or interaction
4. Analyze flame graph for bottlenecks

## Best Practices

1. **Always use memoization for expensive operations**
2. **Implement virtualization for long lists**
3. **Use Next.js Image for all images**
4. **Cache query results appropriately**
5. **Lazy load non-critical components**
6. **Monitor performance metrics in production**
7. **Run performance audits before deployment**
8. **Keep bundle size under target limits**
9. **Use rate limiting to protect API routes**
10. **Implement proper error boundaries**

## Troubleshooting

### Slow Page Load

1. Check bundle size with analyzer
2. Review network waterfall in DevTools
3. Verify image optimization is working
4. Check for unnecessary re-renders

### High Memory Usage

1. Check for memory leaks in React components
2. Verify proper cleanup in useEffect
3. Review virtualization implementation
4. Monitor query cache size

### Poor Lighthouse Score

1. Optimize images (size, format, lazy loading)
2. Remove render-blocking resources
3. Implement code splitting
4. Add proper meta tags
5. Ensure accessibility standards are met

## Additional Resources

- [Next.js Performance Documentation](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [TanStack Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
