# Performance Optimization Quick Reference

## 🚀 Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm run type-check            # Check TypeScript types

# Performance Testing
npm run build:analyze         # Build with bundle analyzer
npm run perf:audit           # Build and start production
lighthouse http://localhost:3000 --view  # Run Lighthouse

# Database
npm run db:push              # Push schema changes
npm run db:studio            # Open Prisma Studio
```

## 📦 Import Paths

```typescript
// Optimized Components
import { MemoizedMenuItem } from '@/lib/components/optimized/MemoizedMenuItem'
import { MemoizedOrderCard } from '@/lib/components/optimized/MemoizedOrderCard'
import { OptimizedImage } from '@/lib/components/optimized/OptimizedImage'
import { VirtualizedMenuList } from '@/lib/components/optimized/VirtualizedMenuList'

// Lazy Components
import {
  LazyAdminDashboard,
  LazyCategoryManagement,
  LazyMenuManagement,
} from '@/lib/components/lazy'

// Database
import {
  getActiveMenuItems,
  getOrdersPaginated,
  getActiveCategories,
} from '@/lib/db/queries'

// Caching
import { QUERY_KEYS, STALE_TIME, CACHE_DURATION } from '@/lib/cache/config'

// Rate Limiting
import {
  publicRateLimiter,
  authRateLimiter,
  orderRateLimiter,
} from '@/lib/middleware/rate-limit'

// Analytics
import {
  trackOrderPlaced,
  trackItemAddedToCart,
  trackCategorySelected,
} from '@/lib/analytics/events'
```

## 🎯 Common Patterns

### Optimized Menu Item
```typescript
<MemoizedMenuItem
  item={item}
  categoryName={categoryName}
  onAddToCart={handleAddToCart}
/>
```

### Optimized Image
```typescript
<OptimizedImage
  src={item.image}
  alt={item.name}
  width={400}
  height={300}
  priority={false}
/>
```

### Cached Query
```typescript
useQuery({
  queryKey: QUERY_KEYS.menu,
  queryFn: fetchMenu,
  staleTime: STALE_TIME.MENU,
  gcTime: CACHE_DURATION.MENU,
})
```

### Rate Limited API
```typescript
export async function POST(request: NextRequest) {
  const rateLimitResult = await publicRateLimiter(request)
  if (rateLimitResult) return rateLimitResult

  // Your code here
}
```

### Track Analytics
```typescript
trackOrderPlaced(orderId, total, itemCount)
trackItemAddedToCart(itemId, itemName, price)
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript strict mode |
| `next.config.js` | Bundle analyzer, image optimization |
| `lib/cache/config.ts` | Cache durations, query keys |
| `lib/middleware/rate-limit.ts` | Rate limit configurations |
| `app/sitemap.ts` | SEO sitemap |
| `app/robots.ts` | SEO robots.txt |

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| Performance | 90+ |
| Accessibility | 95+ |
| Best Practices | 95+ |
| SEO | 100 |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Total JS | < 300KB |
| Query Time | < 100ms |

## 📚 Documentation

- `PERFORMANCE.md` - Full performance guide
- `PERFORMANCE_CHECKLIST.md` - Deployment checklist
- `PERFORMANCE_USAGE_GUIDE.md` - Usage examples
- `TYPESCRIPT_STRICT_MIGRATION.md` - TypeScript guide
- `PERFORMANCE_OPTIMIZATION_SUMMARY.md` - Complete summary

## 🎨 File Structure

```
lib/
├── analytics/events.ts         # Event tracking
├── cache/config.ts             # Cache config
├── components/
│   ├── lazy/                   # Lazy-loaded components
│   └── optimized/              # Performance-optimized components
├── db/queries.ts               # Optimized queries
└── middleware/rate-limit.ts    # Rate limiting

app/
├── sitemap.ts                  # Dynamic sitemap
├── robots.ts                   # Robots.txt
└── layout.tsx                  # Analytics integration
```

## ⚡ Performance Checklist

Before deployment:

- [ ] Run `npm run type-check`
- [ ] Run `npm run build:analyze`
- [ ] Run Lighthouse audit
- [ ] Test on Slow 3G
- [ ] Verify Core Web Vitals
- [ ] Check bundle size < 300KB
- [ ] Test with 100+ items
- [ ] Verify analytics tracking

## 🐛 Common Issues

**Issue:** Images not optimizing
**Fix:** Ensure using OptimizedImage component with proper width/height

**Issue:** High re-render count
**Fix:** Wrap components in React.memo() and use useCallback for handlers

**Issue:** Slow API responses
**Fix:** Use optimized queries from lib/db/queries.ts

**Issue:** Bundle too large
**Fix:** Run build:analyze and identify large dependencies

## 🔗 Useful Links

- [Performance Guide](./PERFORMANCE.md)
- [Usage Guide](./PERFORMANCE_USAGE_GUIDE.md)
- [Checklist](./PERFORMANCE_CHECKLIST.md)
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)

---

**Quick Help:** See PERFORMANCE_USAGE_GUIDE.md for detailed examples
