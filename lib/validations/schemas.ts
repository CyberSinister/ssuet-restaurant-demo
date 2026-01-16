import { z } from 'zod'

// ============================================================================
// Common Schemas
// ============================================================================

export const uuidSchema = z.string().cuid()

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ============================================================================
// Authentication Schemas
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
}).strict()

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters').optional(),
}).strict()

// ============================================================================
// Menu Management Schemas
// ============================================================================

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must not exceed 500 characters'),
  price: z.number()
    .positive('Price must be positive')
    .multipleOf(0.01, 'Price must have at most 2 decimal places')
    .max(9999.99, 'Price must not exceed $9,999.99'),
  categoryId: z.string().min(1, 'Category ID is required'),
  image: z.string().min(1, 'Image is required'),
  dietaryTags: z.array(z.string()).default([]),
  available: z.boolean().default(true),
}).strict()

export const menuItemUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters').optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description must not exceed 500 characters').optional(),
  price: z.number()
    .positive('Price must be positive')
    .multipleOf(0.01, 'Price must have at most 2 decimal places')
    .max(9999.99, 'Price must not exceed $9,999.99')
    .optional(),
  categoryId: z.string().min(1, 'Category ID is required').optional(),
  image: z.string().min(1, 'Image must be a non-empty string').optional(),
  dietaryTags: z.array(z.string()).optional(),
  available: z.boolean().optional(),
}).strict()

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must not exceed 50 characters'),
  description: z.string().min(1, 'Description is required').max(200, 'Description must not exceed 200 characters'),
  displayOrder: z.number().int('Display order must be an integer').positive('Display order must be positive'),
  active: z.boolean().default(true),
}).strict()

export const categoryUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must not exceed 50 characters').optional(),
  description: z.string().min(1, 'Description is required').max(200, 'Description must not exceed 200 characters').optional(),
  displayOrder: z.number().int('Display order must be an integer').positive('Display order must be positive').optional(),
  active: z.boolean().optional(),
}).strict()

export const categoryReorderSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string().min(1, 'Category ID is required'),
      displayOrder: z.number().int('Display order must be an integer').positive('Display order must be positive'),
    })
  ).min(1, 'At least one category is required'),
}).strict()

// ============================================================================
// Order Schemas
// ============================================================================

// Phone validation - flexible format allowing various international formats
const phoneRegex = /^[\d\s()+-]+$/
export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(phoneRegex, 'Phone number contains invalid characters'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500, 'Address must not exceed 500 characters').optional(),
}).strict()

export const cartItemSchema = z.object({
  menuItemId: z.string().cuid('Invalid menu item ID'),
  quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1').max(99, 'Quantity must not exceed 99'),
  specialInstructions: z.string().max(500, 'Special instructions must not exceed 500 characters').optional(),
}).strict()

export const orderTypeEnum = z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'DRIVE_THRU'], {
  errorMap: () => ({ message: 'Invalid order type' }),
})

export const orderStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'], {
  errorMap: () => ({ message: 'Invalid order status' }),
})

export const orderCreateSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'At least one item is required'),
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100, 'Customer name must not exceed 100 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(phoneRegex, 'Phone number contains invalid characters'),
  orderType: orderTypeEnum,
  address: z.string().min(5, 'Address must be at least 5 characters').max(500, 'Address must not exceed 500 characters').optional(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
})
  .strict()
  .refine(
    (data) => {
      // If order type is delivery, address is required
      if (data.orderType === 'DELIVERY' && !data.address) {
        return false
      }
      return true
    },
    {
      message: 'Address is required for delivery orders',
      path: ['address'],
    }
  )

export const orderUpdateSchema = z.object({
  status: orderStatusEnum,
}).strict()

export const orderQuerySchema = z.object({
  status: orderStatusEnum.optional(),
  customerId: z.string().cuid('Invalid customer ID').optional(),
  email: z.string().email('Invalid email address').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ============================================================================
// Settings Schemas
// ============================================================================

const hoursSchema = z.object({
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  closed: z.boolean(),
})

export const restaurantSettingsSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required').max(100, 'Restaurant name must not exceed 100 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(phoneRegex, 'Phone number contains invalid characters'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500, 'Address must not exceed 500 characters'),
  hours: z.object({
    monday: hoursSchema,
    tuesday: hoursSchema,
    wednesday: hoursSchema,
    thursday: hoursSchema,
    friday: hoursSchema,
    saturday: hoursSchema,
    sunday: hoursSchema,
  }),
  deliveryFee: z.number()
    .min(0, 'Delivery fee cannot be negative')
    .max(99.99, 'Delivery fee must not exceed $99.99')
    .multipleOf(0.01, 'Delivery fee must have at most 2 decimal places'),
  minimumOrder: z.number()
    .min(0, 'Minimum order cannot be negative')
    .max(999.99, 'Minimum order must not exceed $999.99')
    .multipleOf(0.01, 'Minimum order must have at most 2 decimal places'),
  taxRate: z.number()
    .min(0, 'Tax rate cannot be negative')
    .max(1, 'Tax rate must not exceed 100%')
    .multipleOf(0.0001, 'Tax rate must have at most 4 decimal places'),
}).strict()

export const smtpConfigSchema = z.object({
  host: z.string().min(1, 'SMTP host is required').max(255, 'SMTP host must not exceed 255 characters'),
  port: z.number().int('Port must be an integer').min(1, 'Port must be at least 1').max(65535, 'Port must not exceed 65535'),
  username: z.string().min(1, 'Username is required').max(255, 'Username must not exceed 255 characters'),
  password: z.string().min(1, 'Password is required').max(255, 'Password must not exceed 255 characters'),
  secure: z.boolean().default(true),
  fromEmail: z.string().email('Invalid from email address'),
  fromName: z.string().min(1, 'From name is required').max(100, 'From name must not exceed 100 characters'),
  enabled: z.boolean().default(false),
}).strict()

export const smtpConfigUpdateSchema = z.object({
  host: z.string().min(1, 'SMTP host is required').max(255, 'SMTP host must not exceed 255 characters').optional(),
  port: z.number().int('Port must be an integer').min(1, 'Port must be at least 1').max(65535, 'Port must not exceed 65535').optional(),
  username: z.string().min(1, 'Username is required').max(255, 'Username must not exceed 255 characters').optional(),
  password: z.string().min(1, 'Password is required').max(255, 'Password must not exceed 255 characters').optional(),
  secure: z.boolean().optional(),
  fromEmail: z.string().email('Invalid from email address').optional(),
  fromName: z.string().min(1, 'From name is required').max(100, 'From name must not exceed 100 characters').optional(),
  enabled: z.boolean().optional(),
}).strict()

export const smtpTestEmailSchema = z.object({
  to: z.string().email('Invalid recipient email address'),
}).strict()

// ============================================================================
// TypeScript Type Inference
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

export type MenuItemInput = z.infer<typeof menuItemSchema>
export type MenuItemUpdateInput = z.infer<typeof menuItemUpdateSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
export type CategoryReorderInput = z.infer<typeof categoryReorderSchema>

export type CustomerInput = z.infer<typeof customerSchema>
export type CartItemInput = z.infer<typeof cartItemSchema>
export type OrderCreateInput = z.infer<typeof orderCreateSchema>
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>
export type OrderQueryInput = z.infer<typeof orderQuerySchema>

export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>
export type SMTPConfigInput = z.infer<typeof smtpConfigSchema>
export type SMTPConfigUpdateInput = z.infer<typeof smtpConfigUpdateSchema>
export type SMTPTestEmailInput = z.infer<typeof smtpTestEmailSchema>

export type PaginationInput = z.infer<typeof paginationSchema>
export type OrderType = z.infer<typeof orderTypeEnum>
export type OrderStatus = z.infer<typeof orderStatusEnum>

// ============================================================================
// Location Schemas
// ============================================================================

export const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must not exceed 100 characters'),
  address: z.string().min(1, 'Address is required').max(500, 'Address must not exceed 500 characters'),
  city: z.string().min(1, 'City is required').max(100, 'City must not exceed 100 characters'),
  country: z.string().min(1, 'Country is required').max(100, 'Country must not exceed 100 characters'),
  phone: z.string().max(20, 'Phone must not exceed 20 characters').optional().nullable(),
  email: z.string().email('Invalid email address').or(z.literal('')).optional().nullable(),
  image: z.string().optional().nullable(),
  countryImages: z.array(z.string()).optional().nullable(),
  cityImages: z.array(z.string()).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  hours: z.string().optional().nullable(),
  active: z.boolean().default(true),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must not exceed 100 characters'),
})

export const locationUpdateSchema = locationSchema.partial()

export type LocationInput = z.infer<typeof locationSchema>
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>
