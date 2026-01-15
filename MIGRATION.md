# Next.js Migration Guide

## Overview

This document outlines the migration from Vite/React to Next.js 14 App Router with full backend capabilities.

## What's Been Done

### 1. Project Structure

The Next.js App Router structure has been created alongside the existing Vite structure:

```
/
├── app/                        # Next.js App Router
│   ├── (customer)/            # Customer portal route group
│   │   └── customer/
│   │       └── page.tsx       # Customer portal page (placeholder)
│   ├── admin/                 # Admin routes
│   │   ├── login/
│   │   │   └── page.tsx       # Admin login page (placeholder)
│   │   ├── layout.tsx         # Admin layout
│   │   └── page.tsx           # Admin dashboard (placeholder)
│   ├── api/                   # API routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/ # NextAuth handler
│   │   ├── menu/
│   │   │   └── route.ts       # Menu API
│   │   ├── orders/
│   │   │   └── route.ts       # Orders API
│   │   └── settings/
│   │       └── route.ts       # Settings API
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page (redirects to customer)
├── lib/                        # Shared utilities
│   ├── db/
│   │   ├── prisma.ts          # Prisma client
│   │   └── turso.ts           # Turso client (for production)
│   ├── auth/
│   │   └── config.ts          # NextAuth configuration
│   └── email/
│       └── service.ts         # Email service utilities
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seed script
├── src/                        # Existing Vite components (preserved)
│   └── components/
│       ├── admin/             # Admin components (to be migrated)
│       ├── customer/          # Customer components (to be migrated)
│       └── ui/                # shadcn/ui components
├── middleware.ts              # Authentication middleware
├── next.config.js             # Next.js configuration
└── tsconfig.json              # Updated for Next.js
```

### 2. Dependencies Installed

#### Core Dependencies
- `next@14` - Next.js 14 framework
- `react@^18.3.1` & `react-dom@^18.3.1` - React 18
- `next-auth@beta` - NextAuth v5 for authentication

#### Database & Backend
- `prisma@^5.22.0` & `@prisma/client@^5.22.0` - Prisma ORM
- `@libsql/client` - Turso/libSQL client
- `@prisma/adapter-libsql` - Prisma adapter for Turso
- `bcryptjs` - Password hashing
- `nodemailer` - Email service

#### Dev Dependencies
- `@types/node` - Node.js types
- `@types/bcryptjs` - bcryptjs types
- `@types/nodemailer` - nodemailer types
- `tsx` - TypeScript execution for seed scripts
- `eslint-config-next` - Next.js ESLint configuration

### 3. Database Schema (Prisma)

Complete database schema with the following models:

#### User Model
- Admin authentication
- Bcrypt password hashing
- Role-based access

#### Category Model
- Menu organization
- Display order
- Active/inactive status

#### MenuItem Model
- Menu items with pricing
- Category relationship
- Dietary tags (JSON)
- Availability status

#### Customer Model
- Customer information
- Email and phone tracking

#### Order Model
- Order management
- Order status tracking
- Customer relationship
- Order items relationship

#### OrderItem Model
- Line items for orders
- Price at time of order
- Special instructions

#### RestaurantSettings Model
- Restaurant configuration
- Hours (JSON)
- Delivery fee, minimum order
- Tax rate

#### SMTPConfig Model
- SMTP email configuration
- Encrypted credentials
- Enable/disable flag

### 4. Authentication

NextAuth v5 (beta) configured with:
- Credentials provider
- JWT strategy
- Bcrypt password validation
- Session management
- Protected routes via middleware

### 5. API Routes

Three main API route handlers created:

#### `/api/menu` (GET)
- Returns all active categories with available menu items
- Parses dietary tags from JSON

#### `/api/orders` (GET, POST)
- GET: Fetch orders with optional filtering
- POST: Create new orders with customer upsert
- Email confirmation integration

#### `/api/settings` (GET, PUT)
- GET: Fetch restaurant settings
- PUT: Update settings (admin only)
- JSON parsing for hours

### 6. Environment Configuration

#### `.env` (local development)
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="development-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_EMAIL="admin@bistrobay.com"
ADMIN_PASSWORD="admin123"
ENABLE_EMAIL_NOTIFICATIONS="false"
```

#### `.env.example` (template with all options)
Includes all required and optional environment variables with documentation.

#### `.env.local.template` (production template)
Template for production deployments.

### 7. Database Seeding

Seed script populates:
- Admin user (from env variables)
- 11 categories (Burgers, Salads, Pizza, etc.)
- 12 menu items with images
- Restaurant settings

## Migration Strategy

### Phase 1: Backend Infrastructure (COMPLETED)
- ✅ Next.js project setup
- ✅ Database schema design
- ✅ API routes implementation
- ✅ Authentication setup
- ✅ Email service utilities

### Phase 2: Frontend Migration (TODO - for frontend-developer)
The existing React components in `src/` need to be migrated to Next.js pages:

1. **Customer Portal** (`src/components/customer/*`)
   - Migrate to `app/(customer)/customer/page.tsx`
   - Convert to Server/Client Components as needed
   - Use API routes instead of localStorage

2. **Admin Dashboard** (`src/components/admin/*`)
   - Migrate to `app/admin/` pages
   - Implement authentication checks
   - Convert to Server/Client Components

3. **UI Components** (`src/components/ui/*`)
   - Keep as-is (already compatible)
   - May need 'use client' directives

### Phase 3: Testing & Deployment
- Test all functionality
- Deploy to Vercel or similar
- Configure Turso for production

## Running the Application

### Development (Vite - Current)
```bash
npm run dev:vite
# Runs on http://localhost:5173
```

### Development (Next.js - New)
```bash
npm run dev
# Runs on http://localhost:3000
```

### Database Commands
```bash
# Push schema changes
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Create migration
npm run db:migrate
```

### Build & Start
```bash
# Build Next.js
npm run build

# Start production server
npm start
```

## Turso Production Setup

For production with Turso:

1. Create Turso database:
```bash
turso db create restaurant-order-adm
```

2. Get database URL:
```bash
turso db show restaurant-order-adm --url
```

3. Get auth token:
```bash
turso db tokens create restaurant-order-adm
```

4. Update environment variables:
```env
DATABASE_URL="libsql://[your-database].turso.io"
TURSO_AUTH_TOKEN="your-auth-token"
```

5. Push schema:
```bash
npm run db:push
```

6. Seed database:
```bash
npm run db:seed
```

## Key Differences from Vite

### Data Persistence
- **Before**: localStorage via `@github/spark` useKV
- **After**: SQLite/Turso database via Prisma

### Routing
- **Before**: Client-side routing (implicit)
- **After**: Next.js App Router (file-based)

### API Layer
- **Before**: No backend, all client-side
- **After**: API routes in `app/api/*`

### Authentication
- **Before**: Simple localStorage check
- **After**: NextAuth with JWT, bcrypt, middleware

### State Management
- **Before**: React hooks + localStorage
- **After**: Server components + database + API routes

## Important Notes

### Coexistence
Both Vite and Next.js setups can coexist:
- Vite: `npm run dev:vite` (port 5173)
- Next.js: `npm run dev` (port 3000)

This allows for gradual migration.

### Component Compatibility
All existing shadcn/ui components are compatible with Next.js. They may need:
- `'use client'` directive for client-side interactivity
- Import path adjustments (already using `@/` alias)

### TypeScript
TypeScript configuration updated for Next.js but maintains compatibility with existing code.

### Styling
All existing Tailwind CSS classes work as-is. The Tailwind configuration is compatible with both Vite and Next.js.

## Next Steps for Frontend Developer

1. Start migrating customer portal components
2. Update components to use API routes instead of localStorage
3. Add 'use client' directives where needed
4. Test authentication flow
5. Migrate admin components
6. Remove Vite dependencies once migration complete

## Admin Credentials

Default admin credentials (from seed):
- Email: `admin@bistrobay.com`
- Password: `admin123`

**Change these in production!**

## Support Files

- `/mnt/d/Projects/restaurant-order-adm/.env.example` - All environment variables
- `/mnt/d/Projects/restaurant-order-adm/prisma/schema.prisma` - Database schema
- `/mnt/d/Projects/restaurant-order-adm/lib/db/prisma.ts` - Prisma client setup
- `/mnt/d/Projects/restaurant-order-adm/middleware.ts` - Auth middleware

## Troubleshooting

### Prisma Client Issues
```bash
npx prisma generate
```

### Database Out of Sync
```bash
npx prisma db push
```

### Reset Database
```bash
rm dev.db dev.db-shm dev.db-wal
npm run db:push
npm run db:seed
```

### Port Already in Use
```bash
npm run kill  # Kills process on port 3000
```
