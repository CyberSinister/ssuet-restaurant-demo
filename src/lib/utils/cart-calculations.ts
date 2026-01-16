import { CartItem, RestaurantSettings, OrderType } from '../types'

export interface OrderCalculation {
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
}

export function calculateOrderTotal(
  cart: CartItem[],
  orderType: OrderType,
  settings: RestaurantSettings
): OrderCalculation {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  )

  const deliveryFee = orderType === 'DELIVERY' ? settings.deliveryFee : 0
  const tax = (subtotal + deliveryFee) * settings.taxRate
  const total = subtotal + deliveryFee + tax

  return {
    subtotal,
    tax,
    deliveryFee,
    total,
  }
}

export function validateMinimumOrder(
  subtotal: number,
  minimumOrder: number
): boolean {
  return subtotal >= minimumOrder
}

export function calculateItemTotal(price: number, quantity: number): number {
  return price * quantity
}
