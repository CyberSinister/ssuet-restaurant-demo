import { Category, MenuItem, CartItem, Order, RestaurantSettings, OrderStatus, OrderType } from '../types'

export function createMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: 'cat-1',
    name: 'Test Category',
    description: 'Test category description',
    displayOrder: 1,
    active: true,
    ...overrides,
  }
}

export function createMockMenuItem(overrides?: Partial<MenuItem>): MenuItem {
  return {
    id: 'item-1',
    name: 'Test Item',
    description: 'Test item description',
    price: 9.99,
    categoryId: 'cat-1',
    image: '/test-image.jpg',
    dietaryTags: [],
    available: true,
    ...overrides,
  }
}

export function createMockCartItem(overrides?: Partial<CartItem>): CartItem {
  return {
    menuItem: createMockMenuItem(),
    quantity: 1,
    specialInstructions: '',
    ...overrides,
  }
}

export function createMockOrder(overrides?: Partial<Order>): Order {
  const items = overrides?.items || [createMockCartItem()]
  const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
  const tax = subtotal * 0.08
  const deliveryFee = overrides?.orderType === 'delivery' ? 5 : 0
  const total = subtotal + tax + deliveryFee

  return {
    id: 'order-1',
    items,
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '555-0100',
    orderType: 'pickup' as OrderType,
    status: 'pending' as OrderStatus,
    subtotal,
    tax,
    total,
    createdAt: Date.now(),
    ...overrides,
  }
}

export function createMockRestaurantSettings(
  overrides?: Partial<RestaurantSettings>
): RestaurantSettings {
  return {
    name: 'Test Restaurant',
    phone: '555-0100',
    email: 'test@restaurant.com',
    address: '123 Test St, Test City, TC 12345',
    hours: {
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
      wednesday: { open: '09:00', close: '21:00', closed: false },
      thursday: { open: '09:00', close: '21:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '10:00', close: '22:00', closed: false },
      sunday: { open: '10:00', close: '20:00', closed: false },
    },
    deliveryFee: 5,
    minimumOrder: 15,
    taxRate: 0.08,
    ...overrides,
  }
}

export const mockCategories: Category[] = [
  createMockCategory({ id: 'cat-1', name: 'Appetizers', displayOrder: 1 }),
  createMockCategory({ id: 'cat-2', name: 'Main Courses', displayOrder: 2 }),
  createMockCategory({ id: 'cat-3', name: 'Desserts', displayOrder: 3 }),
]

export const mockMenuItems: MenuItem[] = [
  createMockMenuItem({
    id: 'item-1',
    name: 'Spring Rolls',
    price: 6.99,
    categoryId: 'cat-1',
    dietaryTags: ['vegetarian'],
  }),
  createMockMenuItem({
    id: 'item-2',
    name: 'Chicken Wings',
    price: 8.99,
    categoryId: 'cat-1',
    dietaryTags: ['gluten-free'],
  }),
  createMockMenuItem({
    id: 'item-3',
    name: 'Grilled Salmon',
    price: 18.99,
    categoryId: 'cat-2',
    dietaryTags: ['gluten-free'],
  }),
  createMockMenuItem({
    id: 'item-4',
    name: 'Chocolate Cake',
    price: 7.99,
    categoryId: 'cat-3',
    dietaryTags: ['vegetarian'],
  }),
]
