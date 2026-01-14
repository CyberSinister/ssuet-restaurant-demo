# Deployment Guide

Complete guide for deploying the restaurant order management system to production.

---

## 📋 Pre-Deployment Checklist

### Required Setup
- [ ] Vercel account created (https://vercel.com)
- [ ] Turso account created (https://turso.tech)
- [ ] Domain name (optional, Vercel provides free subdomain)
- [ ] SMTP email provider (Gmail, SendGrid, or custom)

### Code Preparation
- [ ] All tests passing (`npm run test:run`)
- [ ] TypeScript check passing (`npm run type-check`)
- [ ] Build successful locally (`npm run build`)
- [ ] Performance audit complete (Lighthouse 90+)
- [ ] Security review completed

---

## 🗄️ Step 1: Set Up Production Database (Turso)

### Install Turso CLI

**macOS/Linux:**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

**Windows:**
```powershell
powershell -c "irm get.tur.so/install.ps1 | iex"
```

### Create Production Database

```bash
# Login to Turso
turso auth login

# Create database
turso db create restaurant-order-adm --location closest

# Get database URL
turso db show restaurant-order-adm --url

# Create authentication token
turso db tokens create restaurant-order-adm
```

**Save these values - you'll need them:**
- `DATABASE_URL`: The URL from `turso db show`
- `DATABASE_AUTH_TOKEN`: The token from `turso db tokens create`

### Initialize Database Schema

```bash
# Set environment variables temporarily
export DATABASE_URL="libsql://[your-database].turso.io"
export DATABASE_AUTH_TOKEN="[your-auth-token]"

# Push schema to production database
npx prisma db push --skip-generate

# Seed database with initial data
npm run db:seed
```

### Verify Database

```bash
# Connect to database
turso db shell restaurant-order-adm

# Run SQL queries to verify
SELECT * FROM User;
SELECT COUNT(*) FROM MenuItem;
SELECT COUNT(*) FROM Category;

# Exit shell
.quit
```

---

## 🔐 Step 2: Generate Secrets

### NextAuth Secret

```bash
# Generate random 32-character secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Save this as `NEXTAUTH_SECRET`**

### Admin Password Hash (Optional)

If you want to change the default admin password:

```bash
# Install bcryptjs globally (if needed)
npm install -g bcryptjs-cli

# Generate hash for your password
npx bcryptjs-cli "your-secure-password"
```

Update the admin user in `prisma/seed.ts` before seeding.

---

## 🚀 Step 3: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? restaurant-order-adm
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

### Method 2: Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** Leave default
4. Click "Deploy"

---

## ⚙️ Step 4: Configure Environment Variables

### Required Variables

Add these in Vercel Dashboard (Settings → Environment Variables):

```bash
# Database (from Turso setup)
DATABASE_URL=libsql://[your-database].turso.io
DATABASE_AUTH_TOKEN=[your-auth-token]

# NextAuth (required for authentication)
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=[generated-secret-from-step-2]

# SMTP (Optional - can configure in admin UI later)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=Bistro Bay
SMTP_SECURE=false

# Node Environment
NODE_ENV=production
```

### Add Variables via Vercel CLI

```bash
# Set production environment variables
vercel env add DATABASE_URL production
vercel env add DATABASE_AUTH_TOKEN production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
```

Paste the values when prompted.

### Redeploy After Adding Variables

```bash
vercel --prod
```

Or trigger redeploy from Vercel dashboard (Deployments → Redeploy).

---

## 📧 Step 5: Configure Email (SMTP)

### Option A: Gmail (Easiest for Testing)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password:**
   - Go to https://myaccount.google.com/security
   - Select "2-Step Verification"
   - Scroll to "App passwords"
   - Generate password for "Mail"
3. **Use these settings:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=[app-password]
   SMTP_SECURE=false
   ```

### Option B: SendGrid (Recommended for Production)

1. Create SendGrid account (https://sendgrid.com)
2. Verify sender email
3. Create API key
4. **Use these settings:**
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=[your-api-key]
   SMTP_SECURE=false
   ```

### Option C: Configure in Admin UI

You can skip SMTP environment variables and configure email settings in the admin dashboard after deployment:
1. Login to `/admin`
2. Go to Settings tab
3. Scroll to Email Configuration
4. Enter SMTP details
5. Click "Test Email" to verify

---

## 🔍 Step 6: Verify Deployment

### Test Customer Portal

1. Visit your production URL (https://your-app.vercel.app)
2. **Browse Menu:**
   - Should see all categories and menu items
   - Category filtering should work
   - Images should load
3. **Test Ordering:**
   - Add items to cart
   - Proceed to checkout
   - Fill in customer information
   - Complete order
   - Verify order appears in list

### Test Admin Dashboard

1. Go to `/admin/login`
2. **Login with:**
   - Email: admin@bistrobay.com
   - Password: admin123 (or your custom password)
3. **Test Each Tab:**
   - **Orders:** View and update order status
   - **Categories:** Create, edit, reorder categories
   - **Menu:** Create, edit, delete menu items
   - **Settings:** Update restaurant info and SMTP config
4. **Test Email:**
   - Go to Settings → Email Configuration
   - Click "Test Email"
   - Enter your email
   - Verify test email is received

### Verify Database

```bash
# Connect to production database
turso db shell restaurant-order-adm

# Check data
SELECT COUNT(*) FROM "Order";
SELECT * FROM "User";
SELECT COUNT(*) FROM "MenuItem";

# Exit
.quit
```

---

## 🌐 Step 7: Custom Domain (Optional)

### Add Custom Domain in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Domains
4. Add domain: `yourdomain.com`
5. Follow DNS configuration instructions
6. Wait for DNS propagation (can take up to 48 hours)

### Update Environment Variables

```bash
# Update NEXTAUTH_URL
vercel env rm NEXTAUTH_URL production
vercel env add NEXTAUTH_URL production
# Enter: https://yourdomain.com
```

### Update SMTP From Email

If using custom domain, update SMTP settings to use your domain email for better deliverability.

---

## 📊 Step 8: Monitoring & Analytics

### Vercel Analytics (Included Free)

Already integrated! View analytics in Vercel Dashboard → Analytics

### Sentry Error Tracking (Optional)

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard@latest -i nextjs

# Add Sentry DSN to environment variables
vercel env add NEXT_PUBLIC_SENTRY_DSN production
```

### Uptime Monitoring (Optional)

Use these free services:
- **UptimeRobot:** https://uptimerobot.com (50 monitors free)
- **Pingdom:** https://www.pingdom.com (free tier)
- **StatusCake:** https://www.statuscake.com (free tier)

Monitor these endpoints:
- `https://your-app.vercel.app` (customer portal)
- `https://your-app.vercel.app/admin` (admin portal)
- `https://your-app.vercel.app/api/menu` (API health)

---

## 🔒 Step 9: Security Hardening

### Change Default Admin Password

```bash
# Generate new password hash
npx bcryptjs-cli "your-new-secure-password"

# Update in database
turso db shell restaurant-order-adm

# Run SQL
UPDATE "User" SET "hashedPassword" = '[new-hash]' WHERE "email" = 'admin@bistrobay.com';

# Verify
SELECT "email", "hashedPassword" FROM "User";

# Exit
.quit
```

### Enable Rate Limiting

Rate limiting is already implemented but uses in-memory storage. For production, use Upstash Redis:

```bash
# Sign up for Upstash (free tier)
# Visit: https://upstash.com

# Get Redis URL and Token
# Add to Vercel environment variables:
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
```

The rate limiting middleware will automatically use Upstash if configured.

### Security Headers

Already configured in `next.config.js`. Verify at:
https://securityheaders.com/?q=https://your-app.vercel.app

Should show A or A+ rating.

---

## 🚨 Step 10: Backup & Recovery

### Database Backups

Turso automatically backs up your database. To create manual backup:

```bash
# Export database to SQL file
turso db shell restaurant-order-adm .dump > backup-$(date +%Y%m%d).sql

# Or replicate to another database
turso db replicate restaurant-order-adm restaurant-order-adm-backup
```

### Restore from Backup

```bash
# Restore from SQL dump
turso db shell restaurant-order-adm < backup-20251211.sql

# Or use Turso's point-in-time recovery (contact support)
```

### Code Backup

Your code is already backed up in Git. Ensure you push to GitHub/GitLab regularly:

```bash
git push origin main
```

---

## 📈 Step 11: Performance Optimization

### Enable Edge Functions (Optional)

```javascript
// Add to app/api/*/route.ts
export const runtime = 'edge'
```

Only use for simple API routes (not database-heavy ones).

### Enable ISR (Incremental Static Regeneration)

Already configured! Menu and categories are cached with 60s revalidation.

### Optimize Images

Images already use Next.js Image component. For better performance:

1. **Upload to Cloudinary/S3** instead of using external URLs
2. **Use WebP/AVIF formats**
3. **Implement blur placeholders** (already configured)

### CDN Configuration

Vercel automatically uses global CDN. No additional configuration needed.

---

## 🧪 Step 12: Production Testing

### Run Full Test Suite

```bash
# Unit tests
npm run test:run

# E2E tests against production
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app npm run test:e2e
```

### Manual Testing Checklist

- [ ] Customer can browse menu
- [ ] Customer can add items to cart
- [ ] Customer can complete checkout
- [ ] Customer receives order confirmation email
- [ ] Customer can view order history
- [ ] Admin can login
- [ ] Admin can create menu items
- [ ] Admin can update order status
- [ ] Admin can configure SMTP settings
- [ ] Admin receives order notification emails
- [ ] Mobile responsiveness works
- [ ] All images load properly
- [ ] No console errors
- [ ] Performance is acceptable (LCP < 2.5s)

### Lighthouse Audit

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://your-app.vercel.app --view

# Target scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 100
```

---

## 🎯 Post-Deployment

### Announce Launch

- [ ] Update documentation with production URL
- [ ] Notify stakeholders
- [ ] Share with restaurant staff
- [ ] Create training materials if needed

### Monitor First 24 Hours

- [ ] Check error logs in Vercel dashboard
- [ ] Monitor database performance in Turso console
- [ ] Watch for failed orders
- [ ] Verify email delivery
- [ ] Check mobile devices
- [ ] Monitor performance metrics

### Gather Feedback

- [ ] Test with real customers
- [ ] Get staff feedback on admin dashboard
- [ ] Monitor support requests
- [ ] Track common issues
- [ ] Plan improvements

---

## 🆘 Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Check build logs in Vercel dashboard
# Usually caused by:
# - TypeScript errors (run `npm run type-check`)
# - Missing dependencies (check package.json)
# - Environment variables not set
```

**Database Connection Fails:**
```bash
# Verify environment variables
vercel env pull .env.local

# Check DATABASE_URL and DATABASE_AUTH_TOKEN
# Verify Turso database is accessible:
turso db shell restaurant-order-adm
```

**Authentication Not Working:**
```bash
# Ensure NEXTAUTH_URL matches your domain
# Ensure NEXTAUTH_SECRET is set
# Clear cookies and try again
```

**Emails Not Sending:**
```bash
# Test SMTP settings:
# 1. Login to admin
# 2. Go to Settings → Email Configuration
# 3. Click "Test Email"
# 4. Check error message
# 5. Verify SMTP credentials
```

**Images Not Loading:**
```bash
# Add image domains to next.config.js:
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
  ],
}
```

### Get Help

- **Vercel Docs:** https://vercel.com/docs
- **Turso Docs:** https://docs.turso.tech
- **Next.js Docs:** https://nextjs.org/docs
- **Prisma Docs:** https://www.prisma.io/docs

---

## 📝 Deployment Checklist

### Pre-Deploy
- [x] All tests passing
- [x] TypeScript check passing
- [x] Build successful locally
- [x] Performance audit complete
- [x] Security review done

### Deploy
- [ ] Turso database created
- [ ] Database schema pushed
- [ ] Database seeded
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Production deployment successful

### Post-Deploy
- [ ] Customer portal tested
- [ ] Admin dashboard tested
- [ ] Email sending verified
- [ ] Mobile testing complete
- [ ] Performance verified
- [ ] Monitoring configured
- [ ] Backup strategy in place

---

## 🎉 Deployment Complete!

Your restaurant ordering system is now live in production!

**Production URLs:**
- Customer Portal: https://your-app.vercel.app
- Admin Dashboard: https://your-app.vercel.app/admin

**Next Steps:**
1. Change default admin password
2. Configure SMTP settings in admin UI
3. Update restaurant information
4. Add real menu items and images
5. Test with real orders
6. Monitor for the first week
7. Gather feedback and iterate

**Support:**
- Vercel Status: https://www.vercel-status.com
- Turso Status: https://status.turso.tech

---

**Deployed:** 2025-12-11
**Version:** 1.0.0
**Status:** Production 🚀
