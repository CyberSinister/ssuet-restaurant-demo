# Continue Development Prompt

**Use this prompt to continue development in a new AI session:**

---

I'm continuing development on the restaurant order management system. Here's the project context:

## Project Overview
A production-ready Next.js 14 restaurant ordering system with customer portal and admin dashboard. The system is 95% complete with all core features implemented, tested, and documented.

## Tech Stack
- **Frontend:** Next.js 14 App Router, React 19, Zustand, TanStack Query, shadcn/ui
- **Backend:** Next.js API Routes, Prisma, SQLite/Turso, NextAuth.js v5
- **Testing:** Vitest (86% coverage), Playwright E2E, MSW mocking
- **Validation:** Zod schemas on all endpoints

## What's Completed ✅
1. **Full backend infrastructure** - 19 API endpoints, database with 8 models, authentication
2. **Complete frontend migration** - Customer portal + admin dashboard fully functional
3. **Comprehensive testing** - 88 unit tests, 40+ E2E tests, 86% coverage
4. **Performance optimizations** - TypeScript strict mode, memoization, caching, image optimization
5. **Documentation** - 25+ markdown files covering all aspects

## Project Location
```
/mnt/d/Projects/restaurant-order-adm/
```

## Quick Start Commands
```bash
npm run dev              # Start dev server (http://localhost:3000)
npm test                 # Run unit tests
npm run test:e2e        # Run E2E tests
npm run db:studio       # Open Prisma Studio
npm run type-check      # Check TypeScript
```

## Admin Access
- URL: http://localhost:3000/admin/login
- Email: admin@bistrobay.com
- Password: admin123

## Key Files to Reference
- **Session Handoff:** `.ai/session-handoff.md` (comprehensive overview)
- **API Documentation:** `lib/validations/README.md` (all endpoints and schemas)
- **Testing Guide:** `TESTING.md` (how to test)
- **Performance Guide:** `PERFORMANCE.md` (optimization patterns)
- **Migration History:** `MIGRATION.md` (what was changed)

## Current State
The application is production-ready with:
- ✅ Customer portal (browse menu, order, track orders)
- ✅ Admin dashboard (manage menu, categories, orders, settings)
- ✅ SMTP email configuration
- ✅ Full authentication and authorization
- ✅ Input validation on all endpoints
- ✅ Comprehensive testing
- ✅ Performance optimizations

## Remaining Tasks (Optional Enhancements)
These are nice-to-haves for future iterations:
1. **Payment Integration** - Add Stripe or Square for actual payments
2. **Image Upload** - Replace URL inputs with Cloudinary/S3 upload
3. **Real-time Updates** - Replace polling with WebSockets for live order updates
4. **Analytics Dashboard** - Add sales reports, popular items, revenue tracking
5. **Customer Accounts** - Allow customers to save addresses and payment methods
6. **Inventory Management** - Track stock levels and low inventory alerts
7. **Discount Codes** - Add promotional codes and discounts

## How to Continue

### If adding a new feature:
1. Read `.ai/session-handoff.md` section "How to Continue Development"
2. Follow the pattern: API endpoint → Zod schema → TanStack Query hook → Component → Tests
3. Reference existing code for patterns (e.g., menu management for CRUD)

### If fixing bugs:
1. Check `npm run type-check` for TypeScript errors
2. Run `npm test` to ensure tests pass
3. Use `npm run db:studio` to inspect database
4. Review error boundaries in `app/*/error.tsx`

### If deploying:
1. Review `.ai/session-handoff.md` section "Deployment Guide"
2. Set up Turso database (https://turso.tech)
3. Configure environment variables in Vercel
4. Run pre-deployment checklist
5. Deploy with `vercel`

## What I Need Help With
[Describe your specific task or question here]

---

**Note to AI:** Please read `.ai/session-handoff.md` first for complete context before making any changes. All critical business logic, API routes, and components are documented there. Use the established patterns and don't break existing functionality.
