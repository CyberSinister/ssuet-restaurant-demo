# Database Setup

## Local Development (SQLite)

The project is configured to use a local SQLite database for development:

```env
DATABASE_URL="file:./dev.db"
```

## Production (Turso)

For production deployments, use Turso for a serverless, edge-distributed SQLite database.

### Setup Turso

1. **Install Turso CLI**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

2. **Login to Turso**
```bash
turso auth login
```

3. **Create Database**
```bash
turso db create restaurant-order-adm
```

4. **Get Database URL**
```bash
turso db show restaurant-order-adm --url
# Example: libsql://restaurant-order-adm-[org].turso.io
```

5. **Create Auth Token**
```bash
turso db tokens create restaurant-order-adm
```

6. **Update Environment Variables**
```env
DATABASE_URL="libsql://restaurant-order-adm-[org].turso.io"
TURSO_AUTH_TOKEN="your-token-here"
```

### Using Turso with Prisma (Prisma 5)

Current setup uses Prisma 5 with standard SQLite. For Turso in production:

1. The `@libsql/client` package is already installed
2. The `lib/db/turso.ts` provides a direct Turso client if needed
3. Prisma will use the Turso URL directly

### Migrating to Turso

```bash
# Push schema to Turso
DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:push

# Seed Turso database
DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:seed
```

### Turso with @prisma/adapter-libsql (Future)

For Prisma 7+ with the adapter:

```typescript
import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const libsql = new PrismaLibSql({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const adapter = await libsql.connect()
const prisma = new PrismaClient({ adapter })
```

### Turso Features

- **Edge-distributed**: Deploy close to users
- **Built-in replication**: Multi-region support
- **SQLite compatible**: Use standard SQL
- **Generous free tier**: 500 DBs, 1GB storage

### Turso Dashboard

View and manage your databases:
```bash
turso db show restaurant-order-adm
```

Or visit: https://turso.tech/app

### Backup & Export

```bash
# Create database dump
turso db shell restaurant-order-adm .dump > backup.sql

# Import dump
turso db shell restaurant-order-adm < backup.sql
```

## Database Schema

See `prisma/schema.prisma` for the complete schema definition.

### Key Models

- **User**: Admin authentication
- **Category**: Menu categories
- **MenuItem**: Restaurant menu items
- **Order**: Customer orders
- **OrderItem**: Order line items
- **Customer**: Customer information
- **RestaurantSettings**: Restaurant configuration
- **SMTPConfig**: Email configuration

## Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Format schema
npx prisma format

# Validate schema
npx prisma validate
```

## Connection Pooling

For production, consider using Prisma Accelerate or connection pooling:

```env
# Prisma Accelerate
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
```

## Performance Tips

1. **Indexes**: Schema includes indexes on frequently queried fields
2. **Select specific fields**: Don't fetch all columns if not needed
3. **Use transactions**: For related operations
4. **Connection pooling**: Limit concurrent connections

## Troubleshooting

### "Database locked" error
SQLite can lock during concurrent writes. Solutions:
- Use Turso (handles concurrency better)
- Implement retry logic
- Use WAL mode (enabled by default)

### Migration conflicts
```bash
# Reset database (development only!)
rm dev.db dev.db-shm dev.db-wal
npm run db:push
npm run db:seed
```

### Prisma Client out of sync
```bash
npx prisma generate
```
