export interface Category {
  id: string
  name: string
  description: string
  displayOrder: number
  active: boolean
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  image: string
  dietaryTags: string[]
  available: boolean
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  specialInstructions?: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled'

export type OrderType = 'delivery' | 'pickup'

export interface Order {
  id: string
  items: CartItem[]
  customerName: string
  customerEmail: string
  customerPhone: string
  orderType: OrderType
  address?: string
  status: OrderStatus
  subtotal: number
  tax: number
  total: number
  createdAt: number
  notes?: string
}

export interface RestaurantSettings {
  name: string
  phone: string
  email: string
  address: string
  hours: {
    [key: string]: { open: string; close: string; closed: boolean }
  }
  deliveryFee: number
  minimumOrder: number
  taxRate: number
}

export interface SMTPConfig {
  host: string
  port: number
  username: string
  password: string
  secure: boolean
  fromEmail: string
  fromName: string
  enabled: boolean
}

export interface Location {
  id: string
  name: string
  address: string
  city: string
  country: string
  phone?: string
  email?: string
  image?: string
  latitude?: number
  longitude?: number
  hours?: string
  active: boolean
  slug: string
  createdAt: string | Date
  updatedAt: string | Date
}
