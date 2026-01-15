# Validation Quick Start Guide

Quick reference for using Zod validation in this project.

## Import Schemas

```typescript
import {
  menuItemSchema,
  orderCreateSchema,
  categorySchema,
  type MenuItemInput,
  type OrderCreateInput,
} from '@/lib/validations/schemas'
```

## Import Middleware

```typescript
import {
  withBodyValidation,
  withAuth,
  withAuthAndBodyValidation,
  createErrorResponse,
} from '@/lib/validations/middleware'
```

## Common Patterns

### 1. Public Endpoint with Body Validation

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withBodyValidation } from '@/lib/validations/middleware'
import { orderCreateSchema } from '@/lib/validations/schemas'

export const POST = withBodyValidation(
  orderCreateSchema,
  async (request, validatedBody) => {
    // validatedBody is typed and validated
    const order = await createOrder(validatedBody)
    return NextResponse.json(order, { status: 201 })
  }
)
```

### 2. Admin-Only Endpoint with Body Validation

```typescript
import { withAuthAndBodyValidation } from '@/lib/validations/middleware'
import { menuItemSchema } from '@/lib/validations/schemas'

export const POST = withAuthAndBodyValidation(
  menuItemSchema,
  async (request, validatedBody) => {
    // User is authenticated and body is validated
    const item = await prisma.menuItem.create({ data: validatedBody })
    return NextResponse.json(item, { status: 201 })
  }
)
```

### 3. Admin-Only Endpoint without Body Validation

```typescript
import { withAuth, createErrorResponse } from '@/lib/validations/middleware'

export const DELETE = withAuth(
  async (request, { params }) => {
    await prisma.menuItem.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Deleted successfully' })
  }
)
```

### 4. Query Parameter Validation

```typescript
import { withQueryValidation } from '@/lib/validations/middleware'
import { orderQuerySchema } from '@/lib/validations/schemas'

export const GET = withQueryValidation(
  orderQuerySchema,
  async (request, validatedQuery) => {
    const { status, page, limit } = validatedQuery
    const orders = await fetchOrders({ status, page, limit })
    return NextResponse.json(orders)
  }
)
```

### 5. Manual Validation (Advanced)

```typescript
import { validateBody, validateParams } from '@/lib/validations/middleware'
import { menuItemSchema, uuidSchema } from '@/lib/validations/schemas'

export const PUT = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Validate path parameter
    const { id } = validateParams({ id: params.id }, z.object({ id: uuidSchema }))
    
    // Validate body
    const validatedBody = await validateBody(request, menuItemSchema)
    
    // Your logic here
    const updated = await prisma.menuItem.update({
      where: { id },
      data: validatedBody,
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error // Validation error
    }
    return createErrorResponse('Internal error', 500)
  }
}
```

## Type Usage

```typescript
import type { MenuItemInput, OrderCreateInput } from '@/lib/validations/schemas'

// Use in function signatures
async function createMenuItem(data: MenuItemInput) {
  return prisma.menuItem.create({ data })
}

// Use in type annotations
const orderData: OrderCreateInput = {
  items: [...],
  customerName: 'John Doe',
  // TypeScript will enforce all required fields
}
```

## Error Handling

### Standard Error Response

```typescript
import { createErrorResponse } from '@/lib/validations/middleware'

// Simple error
return createErrorResponse('Not found', 404)

// Error with details
return createErrorResponse('Validation failed', 400, {
  fields: ['email', 'password']
})
```

### Validation Error Format

Validation errors automatically return:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email address" },
    { "field": "price", "message": "Price must be positive" }
  ]
}
```

## Common Schemas

### Menu Items

```typescript
// Create
menuItemSchema.parse({
  name: 'Pizza',
  description: 'Delicious pizza',
  price: 12.99,
  categoryId: 'clx123...',
  image: 'https://example.com/pizza.jpg',
  dietaryTags: ['vegetarian'],
  available: true
})

// Update (all fields optional)
menuItemUpdateSchema.parse({
  price: 13.99,
  available: false
})
```

### Orders

```typescript
orderCreateSchema.parse({
  items: [
    { menuItemId: 'clx123...', quantity: 2, specialInstructions: 'Extra cheese' }
  ],
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '555-1234',
  orderType: 'delivery',
  address: '123 Main St',
  notes: 'Ring doorbell'
})
```

### Categories

```typescript
categorySchema.parse({
  name: 'Appetizers',
  description: 'Start your meal right',
  displayOrder: 1,
  active: true
})
```

## Validation Rules Quick Reference

| Field | Rules |
|-------|-------|
| Email | Valid email format |
| Password | Min 8 characters |
| Phone | 10-20 chars, digits/spaces/()+-/ |
| Price | Positive, max 2 decimals, max $9,999.99 |
| Quantity | 1-99 |
| Name | 1-100 chars |
| Description | 1-500 chars |
| CUID | Valid CUID format |
| URL | Valid URL format |

## Tips

1. **Always use strict schemas** - Already configured in all schemas
2. **Server-side validation only** - Never trust client data
3. **Use type inference** - Import types from schemas
4. **Handle validation errors** - Middleware catches them automatically
5. **Test your schemas** - Use `.safeParse()` for testing

## Testing

```typescript
import { menuItemSchema } from '@/lib/validations/schemas'

// Valid data
const result = menuItemSchema.safeParse(validData)
if (result.success) {
  console.log(result.data) // Typed data
}

// Invalid data
const result = menuItemSchema.safeParse(invalidData)
if (!result.success) {
  console.log(result.error.issues) // Validation errors
}
```

## Next.js 14 App Router Notes

- All routes are in `app/api/` directory
- Use `NextRequest` and `NextResponse`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Middleware wraps the exported function
- Access route params via `{ params }` argument

## Common Gotchas

1. **Password in SMTP updates** - Use '********' to skip password update
2. **Delivery orders** - Address is required (enforced by schema)
3. **Menu item deletion** - Marks unavailable if has orders
4. **Category deletion** - Fails if has menu items
5. **Status transitions** - Only certain transitions allowed

## Full Documentation

See `lib/validations/README.md` for complete documentation.
