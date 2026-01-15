# API Validation Documentation

This directory contains comprehensive Zod validation schemas and middleware for all API routes in the restaurant ordering application.

## Files

- **`schemas.ts`** - All Zod validation schemas and TypeScript type definitions
- **`middleware.ts`** - Validation middleware helpers and error handling utilities

## Table of Contents

1. [Validation Schemas](#validation-schemas)
2. [Middleware Functions](#middleware-functions)
3. [API Routes Reference](#api-routes-reference)
4. [Error Handling](#error-handling)
5. [Usage Examples](#usage-examples)

---

## Validation Schemas

### Authentication

#### `loginSchema`
Validates user login credentials.
```typescript
{
  email: string (valid email)
  password: string (min 8 chars)
}
```

#### `registerSchema`
Validates user registration data.
```typescript
{
  email: string (valid email)
  password: string (min 8 chars)
  name?: string (2-100 chars)
}
```

### Menu Management

#### `menuItemSchema`
Validates menu item creation.
```typescript
{
  name: string (1-100 chars)
  description: string (1-500 chars)
  price: number (positive, max 2 decimals, max $9,999.99)
  categoryId: string (cuid)
  image: string (valid URL)
  dietaryTags?: string[] (default: [])
  available?: boolean (default: true)
}
```

#### `menuItemUpdateSchema`
Partial schema for menu item updates. All fields optional.

#### `categorySchema`
Validates category creation.
```typescript
{
  name: string (1-50 chars)
  description: string (1-200 chars)
  displayOrder: number (positive integer)
  active?: boolean (default: true)
}
```

#### `categoryUpdateSchema`
Partial schema for category updates. All fields optional.

#### `categoryReorderSchema`
Validates category reordering.
```typescript
{
  categories: Array<{
    id: string (cuid)
    displayOrder: number (positive integer)
  }> (min 1 item)
}
```

### Orders

#### `customerSchema`
Validates customer information.
```typescript
{
  name: string (2-100 chars)
  email: string (valid email)
  phone: string (10-20 chars, digits/spaces/()+-/)
  address?: string (5-500 chars)
}
```

#### `cartItemSchema`
Validates cart item.
```typescript
{
  menuItemId: string (cuid)
  quantity: number (1-99)
  specialInstructions?: string (max 500 chars)
}
```

#### `orderCreateSchema`
Validates order creation with business rules.
```typescript
{
  items: cartItemSchema[] (min 1 item)
  customerName: string (2-100 chars)
  customerEmail: string (valid email)
  customerPhone: string (10-20 chars)
  orderType: 'delivery' | 'pickup'
  address?: string (5-500 chars, required for delivery)
  notes?: string (max 1000 chars)
}
```
**Business Rule**: Address is required when `orderType === 'delivery'`

#### `orderUpdateSchema`
Validates order status updates.
```typescript
{
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
}
```

#### `orderQuerySchema`
Validates order query parameters.
```typescript
{
  status?: OrderStatus
  customerId?: string (cuid)
  page?: number (positive int, default: 1)
  limit?: number (positive int, max 100, default: 20)
}
```

### Settings

#### `restaurantSettingsSchema`
Validates restaurant settings.
```typescript
{
  name: string (1-100 chars)
  phone: string (10-20 chars)
  email: string (valid email)
  address: string (5-500 chars)
  hours: {
    monday: { open: string (HH:MM), close: string (HH:MM), closed: boolean }
    tuesday: { ... }
    wednesday: { ... }
    thursday: { ... }
    friday: { ... }
    saturday: { ... }
    sunday: { ... }
  }
  deliveryFee: number (0-99.99, max 2 decimals)
  minimumOrder: number (0-999.99, max 2 decimals)
  taxRate: number (0-1, max 4 decimals)
}
```

#### `smtpConfigSchema`
Validates SMTP configuration.
```typescript
{
  host: string (1-255 chars)
  port: number (1-65535)
  username: string (1-255 chars)
  password: string (1-255 chars)
  secure?: boolean (default: true)
  fromEmail: string (valid email)
  fromName: string (1-100 chars)
  enabled?: boolean (default: false)
}
```

#### `smtpConfigUpdateSchema`
Partial schema for SMTP updates. All fields optional.

#### `smtpTestEmailSchema`
Validates test email request.
```typescript
{
  to: string (valid email)
}
```

### Common

#### `uuidSchema`
Validates CUID (Collision-resistant Unique ID).
```typescript
string (cuid format)
```

#### `paginationSchema`
Validates pagination parameters.
```typescript
{
  page?: number (positive int, default: 1)
  limit?: number (positive int, max 100, default: 20)
}
```

---

## Middleware Functions

### Validation Functions

#### `validateBody<T>(request, schema)`
Validates request body against a Zod schema.
- **Throws**: `NextResponse` with 400 status on validation error
- **Returns**: Validated and typed data

#### `validateQuery<T>(request, schema)`
Validates query parameters against a Zod schema.
- **Throws**: `NextResponse` with 400 status on validation error
- **Returns**: Validated and typed data

#### `validateParams<T>(params, schema)`
Validates path parameters against a Zod schema.
- **Throws**: `NextResponse` with 400 status on validation error
- **Returns**: Validated and typed data

### Higher-Order Functions

#### `withErrorHandling(handler)`
Wraps a route handler with automatic error handling.
- Catches `NextResponse` errors from validation
- Catches unexpected errors and returns 500

#### `withBodyValidation(schema, handler)`
Wraps a route handler with body validation.
- Validates request body before calling handler
- Handler receives validated data as second parameter

#### `withQueryValidation(schema, handler)`
Wraps a route handler with query validation.
- Validates query parameters before calling handler
- Handler receives validated data as second parameter

#### `withAuth(handler)`
Wraps a route handler with authentication check.
- Returns 401 if user is not authenticated
- Continues to handler if authenticated

#### `withAuthAndBodyValidation(schema, handler)`
Combines authentication and body validation.

#### `withAuthAndQueryValidation(schema, handler)`
Combines authentication and query validation.

### Error Utilities

#### `formatZodError(error)`
Formats Zod validation errors into user-friendly structure.
```typescript
{
  error: 'Validation failed'
  details: [
    { field: 'fieldName', message: 'Error message' }
  ]
}
```

#### `createErrorResponse(message, status, details?)`
Creates a standardized error response.
```typescript
NextResponse<{
  error: string
  details?: unknown
}>
```

---

## API Routes Reference

### Menu Items

#### `GET /api/menu`
Get all menu items grouped by categories.
- **Query Params**: `includeInactive=true` (optional, admin only)
- **Auth**: Public
- **Response**: Category[] with nested MenuItem[]

#### `POST /api/menu`
Create a new menu item.
- **Auth**: Admin required
- **Body**: `menuItemSchema`
- **Response**: Created MenuItem with 201 status

#### `GET /api/menu/[id]`
Get a single menu item.
- **Auth**: Public
- **Response**: MenuItem

#### `PUT /api/menu/[id]`
Update a menu item.
- **Auth**: Admin required
- **Body**: `menuItemUpdateSchema`
- **Response**: Updated MenuItem

#### `DELETE /api/menu/[id]`
Delete a menu item (or mark unavailable if has orders).
- **Auth**: Admin required
- **Response**: Success message or updated MenuItem

### Categories

#### `GET /api/categories`
Get all categories.
- **Query Params**:
  - `includeInactive=true` (optional)
  - `includeItems=true` (optional, includes menu items)
- **Auth**: Public
- **Response**: Category[]

#### `POST /api/categories`
Create a new category.
- **Auth**: Admin required
- **Body**: `categorySchema`
- **Response**: Created Category with 201 status

#### `GET /api/categories/[id]`
Get a single category.
- **Query Params**: `includeItems=true` (optional)
- **Auth**: Public
- **Response**: Category

#### `PUT /api/categories/[id]`
Update a category.
- **Auth**: Admin required
- **Body**: `categoryUpdateSchema`
- **Response**: Updated Category

#### `DELETE /api/categories/[id]`
Delete a category (fails if has menu items).
- **Auth**: Admin required
- **Response**: Success message

#### `PUT /api/categories/reorder`
Reorder categories.
- **Auth**: Admin required
- **Body**: `categoryReorderSchema`
- **Response**: Updated Category[]

### Orders

#### `GET /api/orders`
Get all orders with pagination.
- **Query Params**: `orderQuerySchema`
- **Auth**: Public
- **Response**: Paginated order list

#### `POST /api/orders`
Create a new order.
- **Auth**: Public
- **Body**: `orderCreateSchema`
- **Response**: Created Order with 201 status
- **Side Effect**: Sends confirmation email

#### `GET /api/orders/[id]`
Get a single order.
- **Auth**: Public
- **Response**: Order with full details

#### `PUT /api/orders/[id]/status`
Update order status.
- **Auth**: Admin required
- **Body**: `orderUpdateSchema`
- **Response**: Updated Order
- **Business Rules**: Validates status transitions

### Settings

#### `GET /api/settings`
Get restaurant settings.
- **Auth**: Public
- **Response**: RestaurantSettings

#### `PUT /api/settings`
Update restaurant settings.
- **Auth**: Admin required
- **Body**: `restaurantSettingsSchema`
- **Response**: Updated RestaurantSettings

### SMTP Configuration

#### `GET /api/settings/smtp`
Get SMTP configuration (password masked).
- **Auth**: Admin required
- **Response**: SMTPConfig with masked password

#### `PUT /api/settings/smtp`
Update SMTP configuration.
- **Auth**: Admin required
- **Body**: `smtpConfigUpdateSchema`
- **Response**: SMTPConfig with masked password
- **Note**: Password only updated if not '********'

#### `POST /api/settings/smtp/test`
Send test email.
- **Auth**: Admin required
- **Body**: `smtpTestEmailSchema`
- **Response**: Test email result with messageId

---

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful GET/PUT requests
- **201 Created**: Successful POST requests
- **400 Bad Request**: Validation errors, business rule violations
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Unexpected errors

### Error Response Format

All errors follow a consistent format:

```typescript
{
  error: string  // Human-readable error message
  details?: Array<{  // Optional validation details
    field: string
    message: string
  }>
}
```

### Validation Errors

Validation errors return 400 status with detailed field-level errors:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    },
    {
      "field": "price",
      "message": "Price must be positive"
    }
  ]
}
```

---

## Usage Examples

### Creating a Menu Item

```typescript
// API Route: app/api/menu/route.ts
import { withAuthAndBodyValidation } from '@/lib/validations/middleware'
import { menuItemSchema } from '@/lib/validations/schemas'

export const POST = withAuthAndBodyValidation(
  menuItemSchema,
  async (request, validatedBody) => {
    // validatedBody is fully typed and validated
    const menuItem = await prisma.menuItem.create({
      data: validatedBody
    })
    return NextResponse.json(menuItem, { status: 201 })
  }
)
```

### Fetching Orders with Pagination

```typescript
// API Route: app/api/orders/route.ts
import { withQueryValidation } from '@/lib/validations/middleware'
import { orderQuerySchema } from '@/lib/validations/schemas'

export const GET = withQueryValidation(
  orderQuerySchema,
  async (request, validatedQuery) => {
    const { status, page, limit } = validatedQuery
    const orders = await prisma.order.findMany({
      where: status ? { status } : {},
      skip: (page - 1) * limit,
      take: limit
    })
    return NextResponse.json(orders)
  }
)
```

### Manual Validation

```typescript
import { validateBody, createErrorResponse } from '@/lib/validations/middleware'
import { menuItemSchema } from '@/lib/validations/schemas'

export async function POST(request: NextRequest) {
  try {
    const validatedBody = await validateBody(request, menuItemSchema)
    // Use validatedBody...
  } catch (error) {
    if (error instanceof NextResponse) {
      return error // Validation error response
    }
    return createErrorResponse('Internal error', 500)
  }
}
```

### Using Type Inference

```typescript
import { menuItemSchema, type MenuItemInput } from '@/lib/validations/schemas'

function createMenuItem(data: MenuItemInput) {
  // data is fully typed based on the schema
  return prisma.menuItem.create({ data })
}
```

---

## Business Rules Implemented

### Order Creation
1. All menu items must exist and be available
2. Minimum order amount enforced for delivery orders
3. Address required for delivery orders
4. Prices calculated from database (not trusted from client)
5. Tax and delivery fees calculated server-side

### Order Status Transitions
Valid transitions:
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `preparing`, `cancelled`
- `preparing` → `ready`, `cancelled`
- `ready` → `completed`, `cancelled`
- `completed` → (none)
- `cancelled` → (none)

### Menu Item Deletion
- If menu item has existing orders, it's marked as unavailable instead of deleted
- Preserves order history integrity

### Category Deletion
- Categories with menu items cannot be deleted
- User must move or delete items first

### Category Reordering
- Automatic reordering when inserting/moving categories
- Gaps are filled automatically on deletion

---

## Type Safety

All schemas export TypeScript types using `z.infer<typeof schema>`:

```typescript
import type {
  MenuItemInput,
  OrderCreateInput,
  RestaurantSettingsInput
} from '@/lib/validations/schemas'

// These types are automatically derived from Zod schemas
// Ensures runtime validation matches compile-time types
```

---

## Testing

### Testing Validation

```typescript
import { menuItemSchema } from '@/lib/validations/schemas'

describe('menuItemSchema', () => {
  it('validates correct menu item', () => {
    const result = menuItemSchema.safeParse({
      name: 'Pizza',
      description: 'Delicious pizza',
      price: 12.99,
      categoryId: 'clx1234567890',
      image: 'https://example.com/pizza.jpg'
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative price', () => {
    const result = menuItemSchema.safeParse({
      name: 'Pizza',
      price: -5.00
    })
    expect(result.success).toBe(false)
  })
})
```

---

## Performance Considerations

1. **Validation is synchronous** (except body parsing) - minimal overhead
2. **Early validation** prevents unnecessary database queries
3. **Type safety** reduces runtime errors
4. **Strict mode** prevents unexpected fields from being processed
5. **Pagination** limits result set sizes

---

## Security Features

1. **Input sanitization** via Zod validation
2. **Type coercion** prevents type confusion attacks
3. **Length limits** prevent DOS attacks
4. **Strict schemas** reject extra fields
5. **Email validation** prevents header injection
6. **URL validation** prevents malicious URLs
7. **SMTP password masking** in responses
8. **Authentication middleware** protects admin routes
