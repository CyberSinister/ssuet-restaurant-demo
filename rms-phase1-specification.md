# Restaurant Management System - Phase 1 Technical Specification

## Overview

This document outlines the technical architecture, database schema, and implementation plan for Phase 1 of the RMS expansion. Phase 1 focuses on **Core Operations**: POS enhancements, inventory control, kitchen display system, and table reservations.

---

## Technology Stack

### Current Stack (Retained)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **ORM**: Prisma
- **State Management**: Zustand
- **UI**: Tailwind CSS + shadcn/ui + Radix
- **Auth**: NextAuth.js

### New Additions for Phase 1
- **Database**: PostgreSQL (migrating from SQLite)
- **Caching**: Redis (Upstash or self-hosted)
- **Real-time**: Pusher or Socket.io
- **Background Jobs**: BullMQ with Redis
- **File Storage**: S3-compatible (Cloudflare R2 or MinIO)

### Recommended Services (Pakistan-friendly)
- **PostgreSQL**: Neon (free tier), Supabase, or Railway
- **Redis**: Upstash (serverless, free tier available)
- **Real-time**: Pusher (generous free tier) or Ably
- **Deployment**: Vercel (frontend) + Railway/Render (background workers)

---

## Phase 1 Modules

### 1. POS + Online Payment System
### 2. Inventory Control
### 3. Kitchen Display System (KDS)
### 4. Table Reservation & Area Management

---

## Database Schema Expansion

### Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CORE ENTITIES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Location ─────┬───── Table ───── Reservation                               │
│      │         │         │                                                   │
│      │         │         └───── Order ─────┬───── OrderItem                 │
│      │         │                   │       │          │                      │
│      │         │                   │       │          └─── MenuItem          │
│      │         │                   │       │                   │             │
│      │    Terminal ────────────────┘       │              Inventory          │
│      │         │                           │                   │             │
│      │    Transaction ─────────────────────┘              StockMovement     │
│      │         │                                               │             │
│      │    PaymentMethod                                   Supplier          │
│      │                                                                       │
│  KitchenStation ───── KitchenOrder ───── KitchenOrderItem                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Schema Definitions

### 1. POS & Payment Models

```prisma
// POS Terminal - represents physical/virtual terminals at each location
model POSTerminal {
  id            String    @id @default(cuid())
  name          String    // "Counter 1", "Tableside iPad 3"
  terminalType  String    // "counter", "tableside", "kiosk", "mobile"
  locationId    String
  location      Location  @relation(fields: [locationId], references: [id])
  isActive      Boolean   @default(true)
  lastActiveAt  DateTime?
  
  // Hardware identifiers
  deviceId      String?   @unique
  ipAddress     String?
  
  // Settings stored as JSON
  settings      Json?     // receipt printer, cash drawer, etc.
  
  orders        Order[]
  transactions  Transaction[]
  shifts        POSShift[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([locationId])
}

// Shift management for cash reconciliation
model POSShift {
  id              String      @id @default(cuid())
  terminalId      String
  terminal        POSTerminal @relation(fields: [terminalId], references: [id])
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  
  startTime       DateTime    @default(now())
  endTime         DateTime?
  
  openingCash     Decimal     @db.Decimal(10, 2)
  closingCash     Decimal?    @db.Decimal(10, 2)
  expectedCash    Decimal?    @db.Decimal(10, 2)
  cashDifference  Decimal?    @db.Decimal(10, 2)
  
  status          String      @default("open") // "open", "closed", "reconciled"
  notes           String?
  
  transactions    Transaction[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([terminalId])
  @@index([userId])
  @@index([status])
}

// Payment methods configuration
model PaymentMethod {
  id              String    @id @default(cuid())
  name            String    // "Cash", "Credit Card", "JazzCash", "Easypaisa"
  code            String    @unique // "cash", "card", "jazzcash", "easypaisa"
  type            String    // "cash", "card", "digital_wallet", "online"
  
  // Gateway configuration (encrypted in production)
  gatewayConfig   Json?     // API keys, merchant IDs, etc.
  
  isActive        Boolean   @default(true)
  requiresAuth    Boolean   @default(false) // needs PIN/signature
  allowsRefund    Boolean   @default(true)
  allowsTip       Boolean   @default(false)
  
  // Processing fees
  feeType         String?   // "percentage", "fixed", "both"
  feePercentage   Decimal?  @db.Decimal(5, 4)
  feeFixed        Decimal?  @db.Decimal(10, 2)
  
  displayOrder    Int       @default(0)
  iconUrl         String?
  
  transactions    Transaction[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Individual payment transactions
model Transaction {
  id                String        @id @default(cuid())
  transactionNumber String        @unique // "TXN-20250115-0001"
  
  orderId           String
  order             Order         @relation(fields: [orderId], references: [id])
  
  terminalId        String?
  terminal          POSTerminal?  @relation(fields: [terminalId], references: [id])
  
  shiftId           String?
  shift             POSShift?     @relation(fields: [shiftId], references: [id])
  
  paymentMethodId   String
  paymentMethod     PaymentMethod @relation(fields: [paymentMethodId], references: [id])
  
  // Amount details
  amount            Decimal       @db.Decimal(10, 2)
  tipAmount         Decimal       @default(0) @db.Decimal(10, 2)
  feeAmount         Decimal       @default(0) @db.Decimal(10, 2)
  netAmount         Decimal       @db.Decimal(10, 2) // amount - fees
  
  // For split payments
  isSplitPayment    Boolean       @default(false)
  splitIndex        Int?          // 1, 2, 3 for multiple payments on same order
  
  // Transaction status
  status            String        @default("pending") 
  // "pending", "processing", "completed", "failed", "refunded", "partially_refunded"
  
  // Gateway response data
  gatewayRef        String?       // External transaction ID
  gatewayResponse   Json?         // Full response for debugging
  
  // Refund tracking
  refundedAmount    Decimal       @default(0) @db.Decimal(10, 2)
  refundReason      String?
  refundedAt        DateTime?
  refundedBy        String?
  
  // Card details (masked/tokenized)
  cardLastFour      String?
  cardBrand         String?       // "visa", "mastercard"
  
  processedAt       DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([orderId])
  @@index([terminalId])
  @@index([paymentMethodId])
  @@index([status])
  @@index([createdAt])
}

// Receipt configuration
model ReceiptTemplate {
  id            String    @id @default(cuid())
  name          String
  type          String    // "thermal_80mm", "thermal_58mm", "a4", "email"
  locationId    String?   // null = default for all locations
  location      Location? @relation(fields: [locationId], references: [id])
  
  // Template content (HTML/Markdown with variables)
  headerContent String    @db.Text
  footerContent String    @db.Text
  
  showLogo      Boolean   @default(true)
  showQRCode    Boolean   @default(true)
  
  isDefault     Boolean   @default(false)
  isActive      Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([locationId])
}
```

### 2. Inventory Control Models

```prisma
// Inventory item (raw materials, ingredients, supplies)
model InventoryItem {
  id              String    @id @default(cuid())
  sku             String    @unique
  name            String
  description     String?
  
  categoryId      String
  category        InventoryCategory @relation(fields: [categoryId], references: [id])
  
  // Unit of measure
  unitOfMeasure   String    // "kg", "g", "l", "ml", "pcs", "box"
  conversionUnit  String?   // Secondary unit for purchasing vs usage
  conversionRate  Decimal?  @db.Decimal(10, 4) // e.g., 1 box = 24 pcs
  
  // Stock levels
  currentStock    Decimal   @default(0) @db.Decimal(10, 3)
  minimumStock    Decimal   @default(0) @db.Decimal(10, 3)
  maximumStock    Decimal?  @db.Decimal(10, 3)
  reorderPoint    Decimal   @default(0) @db.Decimal(10, 3)
  reorderQuantity Decimal?  @db.Decimal(10, 3)
  
  // Costing
  costPrice       Decimal   @default(0) @db.Decimal(10, 2)
  lastCostPrice   Decimal?  @db.Decimal(10, 2)
  averageCost     Decimal?  @db.Decimal(10, 2)
  
  // Tracking
  trackLots       Boolean   @default(false) // Enable lot/batch tracking
  trackExpiry     Boolean   @default(false)
  defaultShelfLife Int?     // Days
  
  // Storage
  storageLocation String?   // "Walk-in Freezer", "Dry Storage"
  storageTemp     String?   // "frozen", "refrigerated", "room"
  
  // Barcode
  barcode         String?   @unique
  
  isActive        Boolean   @default(true)
  isPerishable    Boolean   @default(false)
  
  // Supplier info
  preferredSupplierId String?
  preferredSupplier   Supplier? @relation("PreferredSupplier", fields: [preferredSupplierId], references: [id])
  
  // Relations
  suppliers       SupplierItem[]
  stockMovements  StockMovement[]
  lots            InventoryLot[]
  recipeItems     RecipeItem[]
  locationStock   LocationStock[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([categoryId])
  @@index([sku])
  @@index([barcode])
}

// Inventory categories
model InventoryCategory {
  id          String          @id @default(cuid())
  name        String          // "Proteins", "Vegetables", "Dairy", "Packaging"
  parentId    String?
  parent      InventoryCategory?  @relation("SubCategories", fields: [parentId], references: [id])
  children    InventoryCategory[] @relation("SubCategories")
  
  items       InventoryItem[]
  
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

// Stock per location (for multi-branch)
model LocationStock {
  id              String        @id @default(cuid())
  locationId      String
  location        Location      @relation(fields: [locationId], references: [id])
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  
  currentStock    Decimal       @db.Decimal(10, 3)
  minimumStock    Decimal?      @db.Decimal(10, 3)
  
  lastCountedAt   DateTime?
  lastCountedBy   String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@unique([locationId, inventoryItemId])
  @@index([locationId])
  @@index([inventoryItemId])
}

// Lot/Batch tracking for perishables
model InventoryLot {
  id              String        @id @default(cuid())
  lotNumber       String
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  locationId      String
  location        Location      @relation(fields: [locationId], references: [id])
  
  quantity        Decimal       @db.Decimal(10, 3)
  remainingQty    Decimal       @db.Decimal(10, 3)
  
  costPrice       Decimal       @db.Decimal(10, 2)
  
  // Dates
  receivedDate    DateTime      @default(now())
  manufactureDate DateTime?
  expiryDate      DateTime?
  
  // Status
  status          String        @default("available") 
  // "available", "reserved", "expired", "recalled", "consumed"
  
  // Traceability
  supplierId      String?
  supplier        Supplier?     @relation(fields: [supplierId], references: [id])
  purchaseOrderId String?
  purchaseOrder   PurchaseOrder? @relation(fields: [purchaseOrderId], references: [id])
  
  notes           String?
  
  stockMovements  StockMovement[]
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@unique([lotNumber, inventoryItemId, locationId])
  @@index([inventoryItemId])
  @@index([expiryDate])
  @@index([status])
}

// Stock movements (audit trail)
model StockMovement {
  id              String        @id @default(cuid())
  movementNumber  String        @unique // "MOV-20250115-0001"
  
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  
  locationId      String
  location        Location      @relation(fields: [locationId], references: [id])
  
  lotId           String?
  lot             InventoryLot? @relation(fields: [lotId], references: [id])
  
  // Movement details
  movementType    String        
  // "purchase", "sale", "adjustment", "transfer_in", "transfer_out", 
  // "waste", "return", "production", "count"
  
  quantity        Decimal       @db.Decimal(10, 3) // Positive or negative
  previousStock   Decimal       @db.Decimal(10, 3)
  newStock        Decimal       @db.Decimal(10, 3)
  
  unitCost        Decimal?      @db.Decimal(10, 2)
  totalCost       Decimal?      @db.Decimal(10, 2)
  
  // References
  referenceType   String?       // "order", "purchase_order", "transfer", "adjustment"
  referenceId     String?
  
  // For transfers between locations
  destinationLocationId String?
  destinationLocation   Location? @relation("TransferDestination", fields: [destinationLocationId], references: [id])
  
  reason          String?
  notes           String?
  
  performedById   String
  performedBy     User          @relation(fields: [performedById], references: [id])
  
  createdAt       DateTime      @default(now())
  
  @@index([inventoryItemId])
  @@index([locationId])
  @@index([movementType])
  @@index([createdAt])
}

// Suppliers
model Supplier {
  id              String    @id @default(cuid())
  code            String    @unique // "SUP-001"
  name            String
  contactName     String?
  email           String?
  phone           String?
  address         String?
  city            String?
  country         String?
  
  // Payment terms
  paymentTerms    String?   // "Net 30", "COD"
  creditLimit     Decimal?  @db.Decimal(10, 2)
  
  // Tax info
  taxNumber       String?   // NTN/GST number
  
  isActive        Boolean   @default(true)
  
  // Relations
  items           SupplierItem[]
  purchaseOrders  PurchaseOrder[]
  lots            InventoryLot[]
  preferredFor    InventoryItem[] @relation("PreferredSupplier")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Supplier-Item relationship with pricing
model SupplierItem {
  id              String        @id @default(cuid())
  supplierId      String
  supplier        Supplier      @relation(fields: [supplierId], references: [id])
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  
  supplierSKU     String?
  unitPrice       Decimal       @db.Decimal(10, 2)
  minimumOrder    Decimal?      @db.Decimal(10, 3)
  leadTimeDays    Int?
  
  isPreferred     Boolean       @default(false)
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@unique([supplierId, inventoryItemId])
}

// Purchase Orders
model PurchaseOrder {
  id              String    @id @default(cuid())
  poNumber        String    @unique // "PO-20250115-0001"
  
  supplierId      String
  supplier        Supplier  @relation(fields: [supplierId], references: [id])
  
  locationId      String
  location        Location  @relation(fields: [locationId], references: [id])
  
  status          String    @default("draft")
  // "draft", "pending", "approved", "ordered", "partial", "received", "cancelled"
  
  // Amounts
  subtotal        Decimal   @db.Decimal(10, 2)
  taxAmount       Decimal   @default(0) @db.Decimal(10, 2)
  discountAmount  Decimal   @default(0) @db.Decimal(10, 2)
  total           Decimal   @db.Decimal(10, 2)
  
  // Dates
  orderDate       DateTime?
  expectedDate    DateTime?
  receivedDate    DateTime?
  
  notes           String?
  
  // Approval workflow
  createdById     String
  createdBy       User      @relation("POCreatedBy", fields: [createdById], references: [id])
  approvedById    String?
  approvedBy      User?     @relation("POApprovedBy", fields: [approvedById], references: [id])
  approvedAt      DateTime?
  
  items           PurchaseOrderItem[]
  lots            InventoryLot[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([supplierId])
  @@index([status])
}

model PurchaseOrderItem {
  id              String        @id @default(cuid())
  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  
  quantity        Decimal       @db.Decimal(10, 3)
  receivedQty     Decimal       @default(0) @db.Decimal(10, 3)
  unitPrice       Decimal       @db.Decimal(10, 2)
  totalPrice      Decimal       @db.Decimal(10, 2)
  
  notes           String?
  
  @@index([purchaseOrderId])
}

// Recipe/BOM for menu items
model Recipe {
  id          String       @id @default(cuid())
  menuItemId  String       @unique
  menuItem    MenuItem     @relation(fields: [menuItemId], references: [id])
  
  yieldQty    Decimal      @default(1) @db.Decimal(10, 3)
  yieldUnit   String       @default("portion")
  
  prepTime    Int?         // minutes
  cookTime    Int?         // minutes
  
  instructions String?     @db.Text
  
  items       RecipeItem[]
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model RecipeItem {
  id              String        @id @default(cuid())
  recipeId        String
  recipe          Recipe        @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  
  inventoryItemId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  
  quantity        Decimal       @db.Decimal(10, 4)
  unit            String
  
  wastagePercent  Decimal       @default(0) @db.Decimal(5, 2)
  
  @@index([recipeId])
}
```

### 3. Kitchen Display System Models

```prisma
// Kitchen stations
model KitchenStation {
  id            String    @id @default(cuid())
  name          String    // "Grill", "Salad", "Dessert", "Drinks"
  code          String    @unique // "GRILL", "SALAD"
  locationId    String
  location      Location  @relation(fields: [locationId], references: [id])
  
  // Display settings
  displayOrder  Int       @default(0)
  color         String?   // For UI differentiation
  
  // Alert thresholds (minutes)
  warningTime   Int       @default(10)
  criticalTime  Int       @default(15)
  
  isActive      Boolean   @default(true)
  
  // What categories this station handles
  categories    KitchenStationCategory[]
  orders        KitchenOrder[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([locationId])
}

// Maps categories to stations
model KitchenStationCategory {
  id          String         @id @default(cuid())
  stationId   String
  station     KitchenStation @relation(fields: [stationId], references: [id], onDelete: Cascade)
  categoryId  String
  category    Category       @relation(fields: [categoryId], references: [id])
  
  @@unique([stationId, categoryId])
}

// Kitchen order (ticket)
model KitchenOrder {
  id            String         @id @default(cuid())
  ticketNumber  Int            // Display number for the day
  
  orderId       String
  order         Order          @relation(fields: [orderId], references: [id])
  
  stationId     String
  station       KitchenStation @relation(fields: [stationId], references: [id])
  
  status        String         @default("new")
  // "new", "viewed", "in_progress", "ready", "served", "cancelled"
  
  priority      String         @default("normal") // "low", "normal", "high", "rush"
  
  // Timing
  receivedAt    DateTime       @default(now())
  viewedAt      DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  servedAt      DateTime?
  
  // Calculated times (seconds)
  waitTime      Int?           // Time until started
  prepTime      Int?           // Time to complete
  
  notes         String?
  
  items         KitchenOrderItem[]
  
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  @@index([orderId])
  @@index([stationId])
  @@index([status])
  @@index([receivedAt])
}

model KitchenOrderItem {
  id              String       @id @default(cuid())
  kitchenOrderId  String
  kitchenOrder    KitchenOrder @relation(fields: [kitchenOrderId], references: [id], onDelete: Cascade)
  
  orderItemId     String
  orderItem       OrderItem    @relation(fields: [orderItemId], references: [id])
  
  menuItemId      String
  menuItem        MenuItem     @relation(fields: [menuItemId], references: [id])
  
  quantity        Int
  
  status          String       @default("pending")
  // "pending", "preparing", "ready", "cancelled"
  
  completedAt     DateTime?
  
  @@index([kitchenOrderId])
}
```

### 4. Table & Reservation Models

```prisma
// Restaurant areas/sections
model Area {
  id            String    @id @default(cuid())
  name          String    // "Main Dining", "Patio", "Private Room"
  locationId    String
  location      Location  @relation(fields: [locationId], references: [id])
  
  description   String?
  
  // Capacity
  minCapacity   Int       @default(1)
  maxCapacity   Int
  
  // For private events
  isPrivate     Boolean   @default(false)
  rentalFee     Decimal?  @db.Decimal(10, 2)
  
  // Settings
  smokingAllowed Boolean  @default(false)
  outdoors      Boolean   @default(false)
  accessible    Boolean   @default(true)
  
  isActive      Boolean   @default(true)
  displayOrder  Int       @default(0)
  
  tables        Table[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([locationId])
}

// Individual tables
model Table {
  id            String    @id @default(cuid())
  tableNumber   String    // "T1", "A12"
  
  areaId        String
  area          Area      @relation(fields: [areaId], references: [id])
  
  // Capacity
  minSeats      Int       @default(1)
  maxSeats      Int
  
  // Physical position for floor plan
  positionX     Int?
  positionY     Int?
  shape         String    @default("rectangle") // "rectangle", "circle", "square"
  width         Int?      // For floor plan rendering
  height        Int?
  
  // Status
  status        String    @default("available")
  // "available", "occupied", "reserved", "cleaning", "blocked"
  
  // Can be combined with adjacent tables
  combinableWith String?  // JSON array of table IDs
  
  isActive      Boolean   @default(true)
  
  reservations  Reservation[]
  orders        Order[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([tableNumber, areaId])
  @@index([areaId])
  @@index([status])
}

// Reservations
model Reservation {
  id                String    @id @default(cuid())
  reservationNumber String    @unique // "RES-20250115-0001"
  
  locationId        String
  location          Location  @relation(fields: [locationId], references: [id])
  
  // Customer info (may or may not be registered)
  customerId        String?
  customer          Customer? @relation(fields: [customerId], references: [id])
  guestName         String
  guestEmail        String?
  guestPhone        String
  
  // Reservation details
  partySize         Int
  date              DateTime  @db.Date
  startTime         DateTime
  endTime           DateTime?
  duration          Int       @default(90) // Default duration in minutes
  
  // Table assignment
  tableId           String?
  table             Table?    @relation(fields: [tableId], references: [id])
  
  // For combined tables
  additionalTables  String?   // JSON array of table IDs
  
  // Status
  status            String    @default("pending")
  // "pending", "confirmed", "seated", "completed", "no_show", "cancelled"
  
  // Special requests
  occasion          String?   // "birthday", "anniversary", "business"
  specialRequests   String?   @db.Text
  
  // Internal notes
  internalNotes     String?
  
  // Source
  source            String    @default("direct")
  // "direct", "phone", "website", "app", "third_party"
  
  // Confirmations
  confirmationSent  Boolean   @default(false)
  reminderSent      Boolean   @default(false)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([locationId])
  @@index([date])
  @@index([status])
  @@index([customerId])
}

// Waitlist
model WaitlistEntry {
  id            String    @id @default(cuid())
  locationId    String
  location      Location  @relation(fields: [locationId], references: [id])
  
  // Customer info
  customerId    String?
  customer      Customer? @relation(fields: [customerId], references: [id])
  guestName     String
  guestPhone    String
  
  partySize     Int
  
  // Queue management
  position      Int
  quotedWaitTime Int?     // minutes
  actualWaitTime Int?     // calculated when seated
  
  status        String    @default("waiting")
  // "waiting", "notified", "seated", "left", "no_show"
  
  // Notification tracking
  notifiedAt    DateTime?
  notificationMethod String? // "sms", "whatsapp", "app"
  
  // Preferences
  seatingPreference String? // "indoor", "outdoor", "bar", "any"
  
  notes         String?
  
  joinedAt      DateTime  @default(now())
  seatedAt      DateTime?
  
  @@index([locationId])
  @@index([status])
  @@index([joinedAt])
}
```

### 5. Updated Core Models (Modifications)

```prisma
// Enhanced Order model
model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique // "ORD-20250115-0001"
  
  // Customer
  customerId      String?
  customer        Customer?     @relation(fields: [customerId], references: [id])
  
  // For guest orders
  customerName    String?
  customerEmail   String?
  customerPhone   String?
  
  // Location & Table
  locationId      String
  location        Location      @relation(fields: [locationId], references: [id])
  tableId         String?
  table           Table?        @relation(fields: [tableId], references: [id])
  
  // Order source
  orderType       String        // "dine_in", "takeaway", "delivery", "drive_thru"
  orderSource     String        @default("pos")
  // "pos", "website", "app", "kiosk", "phone", "third_party"
  
  // For delivery
  deliveryAddress String?       @db.Text
  deliveryNotes   String?
  
  // POS info
  terminalId      String?
  terminal        POSTerminal?  @relation(fields: [terminalId], references: [id])
  serverId        String?       // Waiter/server who took the order
  server          User?         @relation("OrderServer", fields: [serverId], references: [id])
  
  // Status
  status          String        @default("pending")
  // "pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled"
  
  // Amounts
  subtotal        Decimal       @db.Decimal(10, 2)
  discountAmount  Decimal       @default(0) @db.Decimal(10, 2)
  discountReason  String?
  taxAmount       Decimal       @db.Decimal(10, 2)
  deliveryFee     Decimal       @default(0) @db.Decimal(10, 2)
  serviceCharge   Decimal       @default(0) @db.Decimal(10, 2)
  tipAmount       Decimal       @default(0) @db.Decimal(10, 2)
  total           Decimal       @db.Decimal(10, 2)
  
  // Payment status
  paymentStatus   String        @default("unpaid")
  // "unpaid", "partial", "paid", "refunded"
  paidAmount      Decimal       @default(0) @db.Decimal(10, 2)
  
  // Timing
  placedAt        DateTime      @default(now())
  confirmedAt     DateTime?
  prepStartedAt   DateTime?
  readyAt         DateTime?
  servedAt        DateTime?
  completedAt     DateTime?
  
  estimatedPrepTime Int?        // minutes
  actualPrepTime    Int?        // calculated
  
  notes           String?
  
  // Relations
  orderItems      OrderItem[]
  transactions    Transaction[]
  kitchenOrders   KitchenOrder[]
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([customerId])
  @@index([locationId])
  @@index([status])
  @@index([orderType])
  @@index([placedAt])
}

// Enhanced MenuItem
model MenuItem {
  id              String      @id @default(cuid())
  name            String
  description     String
  
  categoryId      String
  category        Category    @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  // Pricing
  price           Decimal     @db.Decimal(10, 2)
  costPrice       Decimal?    @db.Decimal(10, 2) // For margin calculation
  compareAtPrice  Decimal?    @db.Decimal(10, 2) // Original price for discounts
  
  // Images
  image           String?
  images          Json?       // Array of additional images
  
  // Variants and modifiers
  variants        Json?       // Size, etc. [{name: "Large", priceAdjust: 50}]
  modifiers       Json?       // Toppings, extras
  
  // Dietary and nutrition
  dietaryTags     Json        // ["Vegetarian", "Gluten-Free"]
  nutritionInfo   Json?       // {calories: 450, protein: 25, ...}
  allergens       Json?       // ["nuts", "dairy", "gluten"]
  
  // Kitchen
  prepTime        Int?        // Estimated prep time in minutes
  kitchenNote     String?     // Special instructions for kitchen
  
  // Availability
  available       Boolean     @default(true)
  isDeleted       Boolean     @default(false)
  isFeatured      Boolean     @default(false)
  isNew           Boolean     @default(false)
  
  // Scheduling
  availableFrom   DateTime?
  availableTo     DateTime?
  availableDays   Json?       // ["mon", "tue", "wed"] for specific days
  availableHours  Json?       // {start: "11:00", end: "15:00"} for lunch specials
  
  // Inventory
  trackInventory  Boolean     @default(false)
  recipe          Recipe?
  
  displayOrder    Int         @default(0)
  
  // Relations
  orderItems      OrderItem[]
  kitchenItems    KitchenOrderItem[]
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([categoryId])
  @@index([available])
}

// Enhanced Location
model Location {
  id              String    @id @default(cuid())
  code            String    @unique // "KHI-001", "LHR-001"
  name            String
  
  // Address
  address         String
  city            String
  state           String?
  country         String
  postalCode      String?
  
  // Contact
  phone           String?
  email           String?
  
  // Coordinates
  latitude        Decimal?  @db.Decimal(10, 8)
  longitude       Decimal?  @db.Decimal(11, 8)
  
  // Images
  image           String?
  images          Json?     // Array of images
  
  // Operating hours
  hours           Json?     // Complex schedule object
  timezone        String    @default("Asia/Karachi")
  
  // Settings
  settings        Json?     // Location-specific settings
  
  // Capabilities
  hasDelivery     Boolean   @default(true)
  hasTakeaway     Boolean   @default(true)
  hasDineIn       Boolean   @default(true)
  hasDriveThru    Boolean   @default(false)
  
  // Delivery
  deliveryRadius  Decimal?  @db.Decimal(5, 2) // km
  deliveryFee     Decimal?  @db.Decimal(10, 2)
  minimumOrder    Decimal?  @db.Decimal(10, 2)
  
  isActive        Boolean   @default(true)
  slug            String    @unique
  
  // Relations
  areas           Area[]
  terminals       POSTerminal[]
  kitchenStations KitchenStation[]
  orders          Order[]
  reservations    Reservation[]
  waitlist        WaitlistEntry[]
  locationStock   LocationStock[]
  stockMovements  StockMovement[]
  transfersTo     StockMovement[] @relation("TransferDestination")
  purchaseOrders  PurchaseOrder[]
  inventoryLots   InventoryLot[]
  receiptTemplates ReceiptTemplate[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([city])
  @@index([country])
}

// Enhanced User (for staff management)
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password        String
  
  // Profile
  firstName       String?
  lastName        String?
  name            String?   // Full name (computed or stored)
  phone           String?
  avatar          String?
  
  // Role & Permissions
  role            String    @default("staff")
  // "super_admin", "admin", "manager", "cashier", "waiter", "kitchen", "staff"
  permissions     Json?     // Fine-grained permissions
  
  // Assignment
  locationId      String?
  location        Location? @relation(fields: [locationId], references: [id])
  
  // Employment
  employeeCode    String?   @unique
  hireDate        DateTime?
  pin             String?   // For quick POS login
  
  isActive        Boolean   @default(true)
  lastLoginAt     DateTime?
  
  // Relations
  shifts          POSShift[]
  stockMovements  StockMovement[]
  purchaseOrdersCreated  PurchaseOrder[] @relation("POCreatedBy")
  purchaseOrdersApproved PurchaseOrder[] @relation("POApprovedBy")
  ordersServed    Order[] @relation("OrderServer")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([locationId])
  @@index([role])
}
```

---

## API Endpoints Structure

### POS & Payments

```
POST   /api/pos/terminals              # Create terminal
GET    /api/pos/terminals              # List terminals
GET    /api/pos/terminals/:id          # Get terminal
PATCH  /api/pos/terminals/:id          # Update terminal
DELETE /api/pos/terminals/:id          # Deactivate terminal

POST   /api/pos/shifts/open            # Open shift
POST   /api/pos/shifts/:id/close       # Close shift
GET    /api/pos/shifts                 # List shifts
GET    /api/pos/shifts/:id             # Shift details with transactions

POST   /api/payments                   # Process payment
GET    /api/payments/:orderId          # Get payments for order
POST   /api/payments/:id/refund        # Process refund
GET    /api/payments/methods           # List payment methods

POST   /api/orders/:id/split           # Split order for payment
POST   /api/orders/:id/discount        # Apply discount
```

### Inventory

```
# Inventory Items
GET    /api/inventory/items            # List items with filters
POST   /api/inventory/items            # Create item
GET    /api/inventory/items/:id        # Get item details
PATCH  /api/inventory/items/:id        # Update item
DELETE /api/inventory/items/:id        # Soft delete

# Stock Operations
POST   /api/inventory/stock/adjust     # Adjust stock
POST   /api/inventory/stock/transfer   # Transfer between locations
POST   /api/inventory/stock/count      # Record stock count
GET    /api/inventory/stock/movements  # Movement history
GET    /api/inventory/stock/alerts     # Low stock alerts

# Lots
GET    /api/inventory/lots             # List lots
GET    /api/inventory/lots/expiring    # Expiring soon

# Suppliers
GET    /api/inventory/suppliers        # List suppliers
POST   /api/inventory/suppliers        # Create supplier
GET    /api/inventory/suppliers/:id    # Supplier details

# Purchase Orders
GET    /api/inventory/purchase-orders        # List POs
POST   /api/inventory/purchase-orders        # Create PO
PATCH  /api/inventory/purchase-orders/:id    # Update PO
POST   /api/inventory/purchase-orders/:id/receive  # Receive goods

# Recipes
GET    /api/inventory/recipes/:menuItemId    # Get recipe
POST   /api/inventory/recipes                # Create recipe
PATCH  /api/inventory/recipes/:id            # Update recipe
```

### Kitchen Display

```
GET    /api/kitchen/stations           # List stations
POST   /api/kitchen/stations           # Create station
PATCH  /api/kitchen/stations/:id       # Update station

GET    /api/kitchen/orders             # Orders for station (real-time)
PATCH  /api/kitchen/orders/:id/status  # Update order status
POST   /api/kitchen/orders/:id/bump    # Bump to next status
GET    /api/kitchen/orders/:id/items   # Items in kitchen order
PATCH  /api/kitchen/items/:id/status   # Update item status

GET    /api/kitchen/metrics            # Performance metrics
```

### Tables & Reservations

```
# Areas
GET    /api/areas                      # List areas
POST   /api/areas                      # Create area
PATCH  /api/areas/:id                  # Update area

# Tables
GET    /api/tables                     # List tables
POST   /api/tables                     # Create table
PATCH  /api/tables/:id                 # Update table
PATCH  /api/tables/:id/status          # Update table status
POST   /api/tables/combine             # Combine tables
POST   /api/tables/separate            # Separate tables

# Reservations
GET    /api/reservations               # List reservations
POST   /api/reservations               # Create reservation
GET    /api/reservations/:id           # Get reservation
PATCH  /api/reservations/:id           # Update reservation
POST   /api/reservations/:id/confirm   # Confirm reservation
POST   /api/reservations/:id/seat      # Mark as seated
POST   /api/reservations/:id/cancel    # Cancel reservation
GET    /api/reservations/availability  # Check availability

# Waitlist
GET    /api/waitlist                   # Current waitlist
POST   /api/waitlist                   # Add to waitlist
PATCH  /api/waitlist/:id               # Update entry
POST   /api/waitlist/:id/notify        # Send notification
POST   /api/waitlist/:id/seat          # Seat the party
DELETE /api/waitlist/:id               # Remove from waitlist
```

---

## Real-time Events

Using Pusher/Socket.io for real-time updates:

```typescript
// Channels
`location-${locationId}` // Location-wide events
`kitchen-${stationId}`   // Kitchen station events
`table-${tableId}`       // Table status events
`order-${orderId}`       // Order status events

// Event Types
interface RealtimeEvents {
  // Kitchen
  'kitchen:new-order': { kitchenOrder: KitchenOrder }
  'kitchen:order-updated': { kitchenOrderId: string, status: string }
  'kitchen:item-ready': { kitchenOrderId: string, itemId: string }
  
  // Orders
  'order:created': { order: Order }
  'order:status-changed': { orderId: string, status: string }
  'order:payment-received': { orderId: string, amount: number }
  
  // Tables
  'table:status-changed': { tableId: string, status: string }
  'table:assigned': { tableId: string, orderId: string }
  
  // Waitlist
  'waitlist:updated': { entry: WaitlistEntry }
  'waitlist:notification-sent': { entryId: string }
  
  // Inventory
  'inventory:low-stock': { item: InventoryItem }
  'inventory:lot-expiring': { lot: InventoryLot }
}
```

---

## Background Jobs

Using BullMQ for background processing:

```typescript
// Job Queues
const queues = {
  // Email
  'email': {
    'send-order-confirmation': OrderConfirmationJob,
    'send-reservation-confirmation': ReservationConfirmationJob,
    'send-waitlist-notification': WaitlistNotificationJob,
  },
  
  // Inventory
  'inventory': {
    'deduct-stock-for-order': StockDeductionJob,
    'process-stock-alerts': StockAlertJob,
    'check-expiring-lots': ExpiryCheckJob,
  },
  
  // Reports
  'reports': {
    'generate-daily-sales': DailySalesReportJob,
    'generate-inventory-report': InventoryReportJob,
  },
  
  // Notifications
  'notifications': {
    'reservation-reminder': ReservationReminderJob,
  },
}
```

---

## Implementation Phases

### Phase 1A: Foundation (Week 1-2)
1. Migrate SQLite → PostgreSQL
2. Update Prisma schema with new models
3. Set up Redis for caching
4. Configure real-time infrastructure (Pusher)

### Phase 1B: POS Enhancement (Week 3-4)
1. Terminal management UI
2. Shift management
3. Payment method configuration
4. Split payment functionality
5. Receipt generation

### Phase 1C: Inventory Control (Week 5-7)
1. Inventory items CRUD
2. Stock movements & adjustments
3. Supplier management
4. Purchase orders
5. Low stock alerts
6. Recipe management (link menu items to inventory)

### Phase 1D: Kitchen Display System (Week 8-9)
1. Kitchen station configuration
2. KDS display interface
3. Real-time order routing
4. Order bumping workflow
5. Performance metrics

### Phase 1E: Tables & Reservations (Week 10-12)
1. Area and table management
2. Floor plan editor
3. Reservation system
4. Waitlist management
5. Table status tracking
6. SMS/WhatsApp notifications

---

## File Structure (New Additions)

```
app/
├── api/
│   ├── pos/
│   │   ├── terminals/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── shifts/
│   │       ├── route.ts
│   │       ├── open/route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           └── close/route.ts
│   ├── payments/
│   │   ├── route.ts
│   │   ├── methods/route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── refund/route.ts
│   ├── inventory/
│   │   ├── items/
│   │   ├── stock/
│   │   ├── suppliers/
│   │   ├── purchase-orders/
│   │   ├── lots/
│   │   └── recipes/
│   ├── kitchen/
│   │   ├── stations/
│   │   ├── orders/
│   │   └── metrics/route.ts
│   ├── tables/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── areas/
│   ├── reservations/
│   └── waitlist/
├── admin/
│   ├── pos/page.tsx
│   ├── inventory/
│   │   ├── page.tsx
│   │   ├── items/page.tsx
│   │   ├── suppliers/page.tsx
│   │   └── purchase-orders/page.tsx
│   ├── kitchen/
│   │   ├── page.tsx              # KDS Dashboard
│   │   └── stations/page.tsx
│   └── reservations/
│       ├── page.tsx
│       ├── calendar/page.tsx
│       └── waitlist/page.tsx
├── kitchen/                       # Standalone KDS interface
│   ├── layout.tsx
│   ├── page.tsx
│   └── [stationId]/page.tsx
└── pos/                           # Standalone POS interface
    ├── layout.tsx
    └── page.tsx

lib/
├── services/
│   ├── pos.service.ts
│   ├── payment.service.ts
│   ├── inventory.service.ts
│   ├── kitchen.service.ts
│   ├── reservation.service.ts
│   └── notification.service.ts
├── hooks/
│   ├── use-pos.ts
│   ├── use-inventory.ts
│   ├── use-kitchen.ts
│   ├── use-tables.ts
│   └── use-reservations.ts
├── stores/
│   ├── pos-store.ts
│   ├── kitchen-store.ts
│   └── table-store.ts
├── jobs/
│   ├── index.ts
│   ├── email.jobs.ts
│   ├── inventory.jobs.ts
│   └── notification.jobs.ts
└── realtime/
    ├── pusher.ts
    └── events.ts

components/
├── pos/
│   ├── POSTerminal.tsx
│   ├── ShiftManager.tsx
│   ├── PaymentDialog.tsx
│   └── ReceiptPreview.tsx
├── inventory/
│   ├── InventoryTable.tsx
│   ├── StockAdjustmentDialog.tsx
│   ├── PurchaseOrderForm.tsx
│   └── LowStockAlerts.tsx
├── kitchen/
│   ├── KitchenDisplay.tsx
│   ├── OrderTicket.tsx
│   ├── StationSelector.tsx
│   └── PrepTimer.tsx
└── reservations/
    ├── ReservationCalendar.tsx
    ├── FloorPlan.tsx
    ├── TableCard.tsx
    └── WaitlistManager.tsx
```

---

## Environment Variables (New)

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/rms?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"
# Or Upstash
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Real-time
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER=""
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER=""

# SMS/WhatsApp (Twilio or local provider)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Payment Gateways
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
# Or local gateways
JAZZCASH_MERCHANT_ID=""
JAZZCASH_PASSWORD=""
EASYPAISA_MERCHANT_CODE=""
```

---

## Next Steps

1. **Review this specification** - Let me know if you want to adjust scope, add/remove features, or change priorities

2. **Database Migration** - I can create the migration scripts to move from SQLite to PostgreSQL

3. **Start Implementation** - Begin with Phase 1A (foundation) and work through systematically

4. **UI/UX Decisions** - We'll need to design the KDS interface, POS layout, and floor plan editor

Would you like me to proceed with creating the PostgreSQL migration and updated Prisma schema file?
