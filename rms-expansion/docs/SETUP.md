# RMS Phase 1 - Setup & Migration Guide

## Overview

This guide walks you through setting up the expanded Restaurant Management System with:
- PostgreSQL database
- Redis for caching and real-time
- Socket.IO for live updates
- BullMQ for background jobs
- Twilio for SMS/WhatsApp

---

## Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- Git

---

## Quick Start

### 1. Clone and Install

```bash
# If starting fresh
git clone <your-repo>
cd rms

# Install dependencies
npm install

# Add new dependencies for Phase 1
npm install socket.io socket.io-client @socket.io/redis-adapter
npm install bullmq ioredis
npm install twilio
npm install @prisma/client
npm install -D prisma @types/node
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Key variables to set:
```env
DATABASE_URL="postgresql://rms_user:rms_password_123@localhost:5432/rms_db?schema=public"
REDIS_URL="redis://:redis_password_123@localhost:6379"
NEXTAUTH_SECRET="generate-a-32-char-secret-here"
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Optional: Start dev tools (pgAdmin, Redis Commander)
docker-compose --profile dev-tools up -d

# Verify containers are running
docker-compose ps
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Or run migrations (production)
npx prisma migrate dev --name init

# Seed initial data
npx prisma db seed
```

### 5. Start Development Server

```bash
# Standard Next.js dev (without Socket.IO)
npm run dev

# OR with Socket.IO (custom server)
npx tsx server.ts
```

---

## Migration from SQLite

If you have existing data in SQLite:

### Option A: Fresh Start (Recommended for Development)

```bash
# Backup old database
cp prisma/dev.db prisma/dev.db.backup

# Update schema datasource
# Change: provider = "sqlite" 
# To:     provider = "postgresql"

# Push new schema
npx prisma db push

# Re-seed data
npx prisma db seed
```

### Option B: Data Migration

```bash
# 1. Export from SQLite
sqlite3 prisma/dev.db ".dump" > backup.sql

# 2. Convert SQL syntax (SQLite → PostgreSQL)
# This requires manual adjustments or use a tool like pgloader

# 3. Import to PostgreSQL
psql -h localhost -U rms_user -d rms_db < converted_backup.sql
```

### Option C: Using Prisma (Cleanest)

```typescript
// scripts/migrate-data.ts
import { PrismaClient as SQLiteClient } from './prisma-sqlite/client'
import { PrismaClient as PostgresClient } from '@prisma/client'

async function migrateData() {
  const sqlite = new SQLiteClient()
  const postgres = new PostgresClient()

  // Migrate categories
  const categories = await sqlite.category.findMany()
  for (const cat of categories) {
    await postgres.category.create({ data: cat })
  }

  // Migrate menu items
  const menuItems = await sqlite.menuItem.findMany()
  for (const item of menuItems) {
    await postgres.menuItem.create({ data: item })
  }

  // ... continue for other tables

  console.log('Migration complete!')
}

migrateData()
```

---

## Service Configurations

### PostgreSQL Access

```
Host: localhost
Port: 5432
Database: rms_db
Username: rms_user
Password: rms_password_123

# pgAdmin (if running)
URL: http://localhost:5050
Email: admin@rms.local
Password: admin123
```

### Redis Access

```
Host: localhost
Port: 6379
Password: redis_password_123

# Connection string
redis://:redis_password_123@localhost:6379

# Redis Commander (if running)
URL: http://localhost:8081
```

### MinIO (File Storage)

```bash
# Start MinIO
docker-compose --profile storage up -d minio

# Access console
URL: http://localhost:9001
Username: minio_admin
Password: minio_password_123

# Create bucket
mc alias set local http://localhost:9000 minio_admin minio_password_123
mc mb local/rms-uploads
mc policy set public local/rms-uploads
```

---

## Running Background Workers

Workers process background jobs (emails, SMS, inventory updates).

### Development (Same Process)

```typescript
// In server.ts, add:
import { startWorkers } from './lib/jobs/workers'
import { setupScheduledJobs, setupQueueMonitoring } from './lib/jobs/queues'

// After server starts:
await startWorkers()
await setupScheduledJobs()
setupQueueMonitoring()
```

### Production (Separate Process)

```bash
# Terminal 1: Next.js server
npm run start

# Terminal 2: Workers
npx tsx lib/jobs/workers.ts
```

### Using PM2 (Recommended for Production)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'rms-web',
      script: 'server.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'rms-workers',
      script: 'lib/jobs/workers.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
```

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Socket.IO Testing

### Browser Console Test

```javascript
// Connect to Socket.IO
const socket = io('http://localhost:3000')

socket.on('connect', () => {
  console.log('Connected:', socket.id)
  
  // Join a location room
  socket.emit('join:location', 'location-id-here')
})

// Listen for events
socket.on('order:created', (data) => {
  console.log('New order:', data)
})

socket.on('kitchen:new-order', (data) => {
  console.log('Kitchen order:', data)
})
```

### Using wscat

```bash
npm install -g wscat
wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```

---

## Twilio Setup

### 1. Create Twilio Account

1. Sign up at https://www.twilio.com/try-twilio
2. Verify your phone number
3. Get your Account SID and Auth Token from Console

### 2. Get Phone Number

1. Go to Phone Numbers → Manage → Buy a number
2. Select a number with SMS capabilities
3. For Pakistan, you may need to use a US/UK number

### 3. WhatsApp Setup (Optional)

1. Go to Messaging → Try it Out → Send a WhatsApp message
2. Join the sandbox by sending the code to the WhatsApp number
3. For production, apply for WhatsApp Business API

### 4. Configure Environment

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+14155238886
TWILIO_WHATSAPP_ENABLED=true
```

### 5. Test SMS

```typescript
import { sendSMS } from './lib/notifications/twilio'

await sendSMS('+923001234567', 'Test message from RMS!')
```

---

## Payment Gateway Setup

### Stripe

```bash
# Install Stripe CLI for webhooks
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### JazzCash

1. Register at https://sandbox.jazzcash.com.pk/
2. Get Merchant ID, Password, and Integrity Salt
3. Configure in `.env.local`

### Easypaisa

1. Register at https://easypaisa.com.pk/business/
2. Get Store ID and Hash Key
3. Configure in `.env.local`

---

## Development Workflow

### Daily Development

```bash
# 1. Start infrastructure
docker-compose up -d postgres redis

# 2. Start dev server with Socket.IO
npx tsx server.ts

# 3. In another terminal, watch for Prisma changes
npx prisma studio
```

### After Schema Changes

```bash
# Update Prisma client
npx prisma generate

# Push changes to database
npx prisma db push

# Or create migration
npx prisma migrate dev --name describe_your_change
```

### Testing Real-time Features

1. Open multiple browser tabs
2. Connect to same location room
3. Create order in one tab
4. See real-time update in others

---

## Production Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  workers:
    build: .
    command: ["node", "dist/lib/jobs/workers.js"]
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U rms_user -d rms_db -c "SELECT 1"

# Check logs
docker-compose logs postgres
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli -a redis_password_123 ping

# Check logs
docker-compose logs redis
```

### Socket.IO Not Connecting

1. Check CORS settings in socket server
2. Verify `NEXT_PUBLIC_SOCKET_URL` is correct
3. Check browser console for errors
4. Try polling transport: `transports: ['polling', 'websocket']`

### Workers Not Processing Jobs

```bash
# Check Redis connection
# Check worker logs
npx tsx lib/jobs/workers.ts

# View queues in Bull Board
# http://localhost:3001 (if running)
```

---

## Next Steps

After setup is complete:

1. **Test the foundation** - Verify all services are running
2. **Implement POS module** - Start with `app/admin/pos/page.tsx`
3. **Build Kitchen Display** - Create `app/kitchen/page.tsx`
4. **Add Inventory CRUD** - API routes and admin UI
5. **Table Management** - Floor plan editor and reservations

See `rms-phase1-specification.md` for detailed implementation plans.
