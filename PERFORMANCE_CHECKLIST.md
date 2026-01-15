# Performance Checklist

Use this checklist before deploying to production to ensure optimal performance.

## Pre-Deployment Checklist

### TypeScript Configuration

- [x] TypeScript strict mode enabled
- [x] No TypeScript errors in codebase
- [x] All implicit `any` types resolved
- [x] Proper return types on all functions
- [x] Unused variables removed

### React Performance

- [x] Heavy components wrapped in `React.memo()`
- [x] Expensive calculations use `useMemo()`
- [x] Event handlers use `useCallback()` when passed as props
- [x] Virtualization implemented for long lists (100+ items)
- [x] No unnecessary re-renders (verified with React DevTools)

### Image Optimization

- [x] All images use Next.js Image component
- [x] Proper width and height specified
- [x] Lazy loading enabled for below-fold images
- [x] Priority images marked appropriately
- [x] Image formats include WebP/AVIF
- [x] Fallback images configured
- [x] Loading skeletons implemented

### Database Optimization

- [x] Indexes added to frequently queried fields
- [x] Queries use `select` to limit fields
- [x] Pagination implemented for large datasets
- [x] Database-level sorting used
- [x] Connection pooling configured
- [x] Query timeouts set

### Caching Strategy

- [x] TanStack Query cache times configured
- [x] API route cache headers set
- [x] ISR revalidation configured
- [x] Stale-while-revalidate implemented
- [x] Query keys properly organized
- [x] Cache invalidation strategy defined

### Bundle Size

- [ ] Bundle analyzer run and reviewed
- [x] Code splitting implemented
- [x] Lazy loading for admin components
- [x] Tree shaking enabled
- [x] Package imports optimized
- [x] Console logs removed in production
- [ ] Bundle size under 300KB (gzipped)

### API Protection

- [x] Rate limiting implemented
- [x] Auth endpoints have strict limits
- [x] Public endpoints protected
- [x] Error responses properly formatted
- [x] Rate limit headers included

### Performance Monitoring

- [ ] Vercel Analytics installed
- [x] Custom event tracking implemented
- [x] Error tracking configured
- [x] Performance metrics tracked
- [ ] Core Web Vitals monitored

### SEO & Accessibility

- [x] Sitemap.xml generated
- [x] Robots.txt configured
- [ ] Meta tags added to all pages
- [ ] Open Graph tags configured
- [ ] Structured data (JSON-LD) added
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Focus indicators visible

### Security

- [ ] Environment variables properly configured
- [ ] API routes authenticated where needed
- [ ] CORS configured correctly
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using Prisma)
- [ ] XSS prevention implemented

### Testing

- [ ] Performance audit run (Lighthouse)
- [ ] Mobile performance tested
- [ ] Slow 3G connection tested
- [ ] Large dataset tested (100+ items)
- [ ] Memory leaks checked
- [ ] Error boundaries tested

## Performance Targets

### Lighthouse Scores (Minimum)

- [ ] Performance: 90+
- [ ] Accessibility: 95+
- [ ] Best Practices: 95+
- [ ] SEO: 100

### Core Web Vitals (Target)

- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

### Bundle Size (Target)

- [ ] Total JavaScript: < 300KB (gzipped)
- [ ] First Load JS: < 150KB (gzipped)
- [ ] Largest chunk: < 100KB (gzipped)

### Database Performance (Target)

- [ ] Query time (p95): < 100ms
- [ ] Query time (p99): < 200ms
- [ ] Connection pool properly sized

### API Response Times (Target)

- [ ] Menu API: < 200ms
- [ ] Categories API: < 100ms
- [ ] Orders API: < 300ms
- [ ] Create Order API: < 500ms

## How to Run Performance Audits

### 1. Lighthouse Audit

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit on local build
npm run build
npm run start
lighthouse http://localhost:3000 --view

# Run mobile audit
lighthouse http://localhost:3000 --preset=mobile --view
```

### 2. Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true npm run build
```

### 3. React Profiler

1. Install React DevTools extension
2. Open DevTools > Profiler tab
3. Click Record
4. Perform actions in app
5. Stop recording and analyze flame graph

### 4. Network Performance

1. Open Chrome DevTools > Network tab
2. Select "Slow 3G" throttling
3. Reload page
4. Review waterfall chart
5. Check total load time and number of requests

### 5. Memory Profiling

1. Open Chrome DevTools > Memory tab
2. Take heap snapshot
3. Perform actions
4. Take another snapshot
5. Compare to check for memory leaks

## Common Performance Issues

### Issue: Large Bundle Size

**Solutions:**
- Run bundle analyzer to identify large dependencies
- Implement code splitting for large components
- Use dynamic imports for non-critical code
- Remove unused dependencies
- Optimize package imports

### Issue: Slow Initial Load

**Solutions:**
- Reduce JavaScript bundle size
- Optimize images (format, size, lazy loading)
- Implement ISR for static content
- Use CDN for static assets
- Enable compression (gzip/brotli)

### Issue: Poor Rendering Performance

**Solutions:**
- Add React.memo() to prevent unnecessary re-renders
- Use useMemo() for expensive calculations
- Implement virtualization for long lists
- Optimize CSS (remove unused styles)
- Use CSS-in-JS efficiently

### Issue: Slow API Responses

**Solutions:**
- Optimize database queries
- Add proper indexes
- Implement caching
- Use database connection pooling
- Optimize data serialization

### Issue: High CLS (Cumulative Layout Shift)

**Solutions:**
- Specify image dimensions
- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use CSS aspect ratio boxes
- Preload fonts

## Deployment Steps

1. **Run all audits**
   ```bash
   npm run lint
   npm run build
   ANALYZE=true npm run build
   lighthouse http://localhost:3000 --view
   ```

2. **Verify environment variables**
   - Check `.env.production` file
   - Verify database URL
   - Confirm API keys

3. **Test production build locally**
   ```bash
   npm run build
   npm run start
   ```

4. **Review performance metrics**
   - Lighthouse scores meet targets
   - Bundle size under limits
   - Core Web Vitals pass

5. **Deploy to staging**
   - Test all functionality
   - Run performance audit on staging
   - Check monitoring dashboards

6. **Deploy to production**
   - Monitor error rates
   - Watch performance metrics
   - Check server logs

## Monitoring in Production

### Key Metrics to Monitor

1. **Performance Metrics**
   - Page load time (p50, p95, p99)
   - Time to First Byte (TTFB)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)

2. **User Metrics**
   - Active users
   - Session duration
   - Bounce rate
   - Conversion rate

3. **Error Metrics**
   - Error rate
   - Error types
   - Failed requests
   - Timeout errors

4. **Business Metrics**
   - Orders placed
   - Average order value
   - Cart abandonment rate
   - Popular menu items

### Alerts to Set Up

- [ ] Error rate > 1%
- [ ] Average response time > 500ms
- [ ] Failed requests > 5%
- [ ] LCP > 3.5s
- [ ] API rate limit exceeded

## Continuous Optimization

### Weekly Tasks

- [ ] Review performance metrics
- [ ] Check error logs
- [ ] Monitor bundle size trends
- [ ] Review slow database queries

### Monthly Tasks

- [ ] Run full Lighthouse audit
- [ ] Update dependencies
- [ ] Review and optimize caching strategy
- [ ] Analyze user behavior patterns

### Quarterly Tasks

- [ ] Comprehensive performance review
- [ ] Update performance targets
- [ ] Review and update this checklist
- [ ] Team performance training

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [Next.js Performance Documentation](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Core Web Vitals](https://web.dev/vitals/)

---

**Last Updated:** December 2025
**Next Review:** March 2026
