import { describe, it, expect } from 'vitest'
import {
  calculateOrderTotal,
  validateMinimumOrder,
  calculateItemTotal,
} from '../cart-calculations'
import {
  createMockCartItem,
  createMockMenuItem,
  createMockRestaurantSettings,
} from '../../test-utils/factories'

describe('calculateOrderTotal', () => {
  const settings = createMockRestaurantSettings({
    deliveryFee: 5,
    taxRate: 0.08,
  })

  it('calculates pickup order correctly', () => {
    const cart = [
      createMockCartItem({
        menuItem: createMockMenuItem({ price: 10 }),
        quantity: 2,
      }),
      createMockCartItem({
        menuItem: createMockMenuItem({ price: 15 }),
        quantity: 1,
      }),
    ]

    const result = calculateOrderTotal(cart, 'TAKEAWAY', settings)

    expect(result.subtotal).toBe(35)
    expect(result.deliveryFee).toBe(0)
    expect(result.tax).toBeCloseTo(2.8, 2) // 35 * 0.08
    expect(result.total).toBeCloseTo(37.8, 2)
  })

  it('calculates delivery order with delivery fee', () => {
    const cart = [
      createMockCartItem({
        menuItem: createMockMenuItem({ price: 20 }),
        quantity: 1,
      }),
    ]

    const result = calculateOrderTotal(cart, 'DELIVERY', settings)

    expect(result.subtotal).toBe(20)
    expect(result.deliveryFee).toBe(5)
    expect(result.tax).toBe(2) // (20 + 5) * 0.08 = 2.0
    expect(result.total).toBe(27)
  })

  it('handles empty cart', () => {
    const result = calculateOrderTotal([], 'TAKEAWAY', settings)

    expect(result.subtotal).toBe(0)
    expect(result.deliveryFee).toBe(0)
    expect(result.tax).toBe(0)
    expect(result.total).toBe(0)
  })

  it('handles decimal prices correctly', () => {
    const cart = [
      createMockCartItem({
        menuItem: createMockMenuItem({ price: 9.99 }),
        quantity: 3,
      }),
    ]

    const result = calculateOrderTotal(cart, 'TAKEAWAY', settings)

    expect(result.subtotal).toBeCloseTo(29.97, 2)
    expect(result.tax).toBeCloseTo(2.3976, 2)
    expect(result.total).toBeCloseTo(32.3676, 2)
  })

  it('applies different tax rates correctly', () => {
    const highTaxSettings = createMockRestaurantSettings({ taxRate: 0.15 })
    const cart = [
      createMockCartItem({
        menuItem: createMockMenuItem({ price: 100 }),
        quantity: 1,
      }),
    ]

    const result = calculateOrderTotal(cart, 'TAKEAWAY', highTaxSettings)

    expect(result.tax).toBe(15)
    expect(result.total).toBe(115)
  })

  it('calculates tax on subtotal plus delivery fee', () => {
    const cart = [
      createMockCartItem({
        menuItem: createMockMenuItem({ price: 50 }),
        quantity: 1,
      }),
    ]

    const result = calculateOrderTotal(cart, 'DELIVERY', settings)

    // Tax should be calculated on (50 + 5) = 55
    expect(result.tax).toBe(4.4) // 55 * 0.08
    expect(result.total).toBe(59.4)
  })
})

describe('validateMinimumOrder', () => {
  it('returns true when subtotal meets minimum', () => {
    expect(validateMinimumOrder(20, 15)).toBe(true)
    expect(validateMinimumOrder(15, 15)).toBe(true)
  })

  it('returns false when subtotal is below minimum', () => {
    expect(validateMinimumOrder(10, 15)).toBe(false)
    expect(validateMinimumOrder(14.99, 15)).toBe(false)
  })

  it('handles zero minimum', () => {
    expect(validateMinimumOrder(0, 0)).toBe(true)
    expect(validateMinimumOrder(5, 0)).toBe(true)
  })

  it('handles decimal values correctly', () => {
    expect(validateMinimumOrder(15.01, 15)).toBe(true)
    expect(validateMinimumOrder(14.99, 15)).toBe(false)
  })
})

describe('calculateItemTotal', () => {
  it('calculates item total correctly', () => {
    expect(calculateItemTotal(10, 2)).toBe(20)
    expect(calculateItemTotal(9.99, 3)).toBeCloseTo(29.97, 2)
    expect(calculateItemTotal(15.50, 1)).toBe(15.50)
  })

  it('handles zero quantity', () => {
    expect(calculateItemTotal(10, 0)).toBe(0)
  })

  it('handles zero price', () => {
    expect(calculateItemTotal(0, 5)).toBe(0)
  })

  it('handles large quantities', () => {
    expect(calculateItemTotal(5, 100)).toBe(500)
  })

  it('handles decimal prices and quantities', () => {
    expect(calculateItemTotal(12.99, 5)).toBeCloseTo(64.95, 2)
  })
})
