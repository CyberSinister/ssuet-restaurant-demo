import { describe, it, expect } from 'vitest'
import {
  menuItemSchema,
  menuItemUpdateSchema,
  categorySchema,
  categoryUpdateSchema,
  categoryReorderSchema,
  orderCreateSchema,
  orderUpdateSchema,
  orderQuerySchema,
  restaurantSettingsSchema,
  smtpConfigSchema,
  loginSchema,
  cartItemSchema,
} from '../schemas'

describe('menuItemSchema', () => {
  const validMenuItem = {
    name: 'Test Item',
    description: 'A delicious test item',
    price: 9.99,
    categoryId: 'clh1234567890abcdefg',
    image: 'https://example.com/image.jpg',
    dietaryTags: ['vegetarian'],
    available: true,
  }

  it('validates a valid menu item', () => {
    const result = menuItemSchema.safeParse(validMenuItem)
    expect(result.success).toBe(true)
  })

  it('rejects negative price', () => {
    const result = menuItemSchema.safeParse({
      ...validMenuItem,
      price: -5.99,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('positive')
    }
  })

  it('rejects price with more than 2 decimal places', () => {
    const result = menuItemSchema.safeParse({
      ...validMenuItem,
      price: 9.999,
    })
    expect(result.success).toBe(false)
  })

  it('rejects price exceeding maximum', () => {
    const result = menuItemSchema.safeParse({
      ...validMenuItem,
      price: 10000,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('9,999.99')
    }
  })

  it('rejects empty name', () => {
    const result = menuItemSchema.safeParse({
      ...validMenuItem,
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects name exceeding 100 characters', () => {
    const result = menuItemSchema.safeParse({
      ...validMenuItem,
      name: 'a'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid image URL', () => {
    const result = menuItemSchema.safeParse({
      ...validMenuItem,
      image: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid category ID format', () => {
    const result = menuItemSchema.safeParse({
      ...validMenuItem,
      categoryId: 'invalid-id',
    })
    expect(result.success).toBe(false)
  })

  it('uses default values for optional fields', () => {
    const result = menuItemSchema.safeParse({
      name: 'Test',
      description: 'Test desc',
      price: 10,
      categoryId: 'clh1234567890abcdefg',
      image: 'https://example.com/image.jpg',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dietaryTags).toEqual([])
      expect(result.data.available).toBe(true)
    }
  })

  it('rejects extra fields in strict mode', () => {
    const result = menuItemSchema.safeParse({
      ...validMenuItem,
      extraField: 'not allowed',
    })
    expect(result.success).toBe(false)
  })
})

describe('categorySchema', () => {
  const validCategory = {
    name: 'Appetizers',
    description: 'Start your meal right',
    displayOrder: 1,
    active: true,
  }

  it('validates a valid category', () => {
    const result = categorySchema.safeParse(validCategory)
    expect(result.success).toBe(true)
  })

  it('rejects negative display order', () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      displayOrder: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer display order', () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      displayOrder: 1.5,
    })
    expect(result.success).toBe(false)
  })

  it('rejects name exceeding 50 characters', () => {
    const result = categorySchema.safeParse({
      ...validCategory,
      name: 'a'.repeat(51),
    })
    expect(result.success).toBe(false)
  })

  it('defaults active to true', () => {
    const result = categorySchema.safeParse({
      name: 'Test',
      description: 'Test desc',
      displayOrder: 1,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.active).toBe(true)
    }
  })
})

describe('categoryReorderSchema', () => {
  it('validates valid reorder data', () => {
    const result = categoryReorderSchema.safeParse({
      categories: [
        { id: 'clh1234567890abcdefg', displayOrder: 1 },
        { id: 'clh1234567890abcdefh', displayOrder: 2 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty categories array', () => {
    const result = categoryReorderSchema.safeParse({
      categories: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid category ID', () => {
    const result = categoryReorderSchema.safeParse({
      categories: [{ id: 'invalid', displayOrder: 1 }],
    })
    expect(result.success).toBe(false)
  })
})

describe('orderCreateSchema', () => {
  const validOrder = {
    items: [
      {
        menuItemId: 'clh1234567890abcdefg',
        quantity: 2,
        specialInstructions: 'No onions',
      },
    ],
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '5551234567',
    orderType: 'pickup' as const,
  }

  it('validates a valid pickup order', () => {
    const result = orderCreateSchema.safeParse(validOrder)
    expect(result.success).toBe(true)
  })

  it('validates a valid delivery order with address', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      orderType: 'delivery',
      address: '123 Main St, Apt 4B',
    })
    expect(result.success).toBe(true)
  })

  it('rejects delivery order without address', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      orderType: 'delivery',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const addressError = result.error.issues.find(issue => issue.path.includes('address'))
      expect(addressError).toBeDefined()
      expect(addressError?.message).toContain('required for delivery')
    }
  })

  it('rejects empty items array', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      items: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      customerEmail: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects phone number less than 10 digits', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      customerPhone: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid phone characters', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      customerPhone: 'abc1234567',
    })
    expect(result.success).toBe(false)
  })

  it('accepts various phone formats', () => {
    const validPhones = [
      '5551234567',
      '(555) 123-4567',
      '555-123-4567',
      '+1 555 123 4567',
    ]

    validPhones.forEach(phone => {
      const result = orderCreateSchema.safeParse({
        ...validOrder,
        customerPhone: phone,
      })
      expect(result.success).toBe(true)
    })
  })

  it('rejects quantity less than 1', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      items: [{ menuItemId: 'clh1234567890abcdefg', quantity: 0 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects quantity exceeding 99', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      items: [{ menuItemId: 'clh1234567890abcdefg', quantity: 100 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects notes exceeding 1000 characters', () => {
    const result = orderCreateSchema.safeParse({
      ...validOrder,
      notes: 'a'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })
})

describe('cartItemSchema', () => {
  it('validates valid cart item', () => {
    const result = cartItemSchema.safeParse({
      menuItemId: 'clh1234567890abcdefg',
      quantity: 2,
      specialInstructions: 'Extra sauce',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-integer quantity', () => {
    const result = cartItemSchema.safeParse({
      menuItemId: 'clh1234567890abcdefg',
      quantity: 2.5,
    })
    expect(result.success).toBe(false)
  })

  it('rejects special instructions exceeding 500 characters', () => {
    const result = cartItemSchema.safeParse({
      menuItemId: 'clh1234567890abcdefg',
      quantity: 1,
      specialInstructions: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe('restaurantSettingsSchema', () => {
  const validSettings = {
    name: 'Test Restaurant',
    phone: '5551234567',
    email: 'info@restaurant.com',
    address: '123 Main St, City, State 12345',
    hours: {
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday: { open: '09:00', close: '21:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '10:00', close: '22:00', closed: false },
      sunday: { open: '10:00', close: '20:00', closed: true },
    },
    deliveryFee: 5.00,
    minimumOrder: 15.00,
    taxRate: 0.08,
  }

  it('validates valid restaurant settings', () => {
    const result = restaurantSettingsSchema.safeParse(validSettings)
    expect(result.success).toBe(true)
  })

  it('rejects invalid time format', () => {
    const result = restaurantSettingsSchema.safeParse({
      ...validSettings,
      hours: {
        ...validSettings.hours,
        monday: { open: '9am', close: '21:00', closed: false },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects time exceeding 23:59', () => {
    const result = restaurantSettingsSchema.safeParse({
      ...validSettings,
      hours: {
        ...validSettings.hours,
        monday: { open: '09:00', close: '24:00', closed: false },
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative delivery fee', () => {
    const result = restaurantSettingsSchema.safeParse({
      ...validSettings,
      deliveryFee: -5,
    })
    expect(result.success).toBe(false)
  })

  it('rejects delivery fee exceeding maximum', () => {
    const result = restaurantSettingsSchema.safeParse({
      ...validSettings,
      deliveryFee: 100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects tax rate exceeding 1 (100%)', () => {
    const result = restaurantSettingsSchema.safeParse({
      ...validSettings,
      taxRate: 1.5,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative tax rate', () => {
    const result = restaurantSettingsSchema.safeParse({
      ...validSettings,
      taxRate: -0.08,
    })
    expect(result.success).toBe(false)
  })

  it('rejects minimum order exceeding maximum', () => {
    const result = restaurantSettingsSchema.safeParse({
      ...validSettings,
      minimumOrder: 1000,
    })
    expect(result.success).toBe(false)
  })
})

describe('smtpConfigSchema', () => {
  const validSMTP = {
    host: 'smtp.example.com',
    port: 587,
    username: 'user@example.com',
    password: 'secure-password',
    secure: true,
    fromEmail: 'noreply@example.com',
    fromName: 'Test Restaurant',
    enabled: true,
  }

  it('validates valid SMTP config', () => {
    const result = smtpConfigSchema.safeParse(validSMTP)
    expect(result.success).toBe(true)
  })

  it('rejects port less than 1', () => {
    const result = smtpConfigSchema.safeParse({
      ...validSMTP,
      port: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects port greater than 65535', () => {
    const result = smtpConfigSchema.safeParse({
      ...validSMTP,
      port: 65536,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid from email', () => {
    const result = smtpConfigSchema.safeParse({
      ...validSMTP,
      fromEmail: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('uses default values', () => {
    const result = smtpConfigSchema.safeParse({
      host: 'smtp.example.com',
      port: 587,
      username: 'user',
      password: 'pass',
      fromEmail: 'test@example.com',
      fromName: 'Test',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.secure).toBe(true)
      expect(result.data.enabled).toBe(false)
    }
  })
})

describe('loginSchema', () => {
  it('validates valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password less than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects extra fields', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      extra: 'field',
    })
    expect(result.success).toBe(false)
  })
})

describe('orderQuerySchema', () => {
  it('uses default pagination values', () => {
    const result = orderQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('coerces string numbers to integers', () => {
    const result = orderQuerySchema.safeParse({
      page: '2',
      limit: '50',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(50)
    }
  })

  it('rejects limit exceeding 100', () => {
    const result = orderQuerySchema.safeParse({
      limit: 101,
    })
    expect(result.success).toBe(false)
  })

  it('validates with optional filters', () => {
    const result = orderQuerySchema.safeParse({
      status: 'pending',
      customerId: 'clh1234567890abcdefg',
      page: 1,
      limit: 20,
    })
    expect(result.success).toBe(true)
  })
})
