import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatPhone,
  formatDate,
  formatDateShort,
  formatBusinessHours,
  formatPercent,
} from '../format-helpers'

describe('formatCurrency', () => {
  it('formats positive amounts correctly', () => {
    expect(formatCurrency(10.99)).toBe('$10.99')
    expect(formatCurrency(100)).toBe('$100.00')
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats negative amounts correctly', () => {
    expect(formatCurrency(-10.99)).toBe('-$10.99')
  })

  it('handles decimal precision', () => {
    expect(formatCurrency(10.999)).toBe('$11.00')
    expect(formatCurrency(10.001)).toBe('$10.00')
  })

  it('handles large numbers', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00')
  })
})

describe('formatPhone', () => {
  it('formats 10-digit phone numbers', () => {
    expect(formatPhone('5551234567')).toBe('(555) 123-4567')
    expect(formatPhone('1234567890')).toBe('(123) 456-7890')
  })

  it('handles phone numbers with formatting', () => {
    expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567')
    expect(formatPhone('555-123-4567')).toBe('(555) 123-4567')
    expect(formatPhone('555.123.4567')).toBe('(555) 123-4567')
  })

  it('returns original input for invalid phone numbers', () => {
    expect(formatPhone('123')).toBe('123')
    expect(formatPhone('invalid')).toBe('invalid')
    expect(formatPhone('')).toBe('')
  })
})

describe('formatDate', () => {
  it('formats timestamp correctly', () => {
    const timestamp = new Date('2024-03-15T14:30:00').getTime()
    const formatted = formatDate(timestamp)
    expect(formatted).toContain('March')
    expect(formatted).toContain('15')
    expect(formatted).toContain('2024')
  })

  it('includes time in format', () => {
    const timestamp = new Date('2024-03-15T14:30:00').getTime()
    const formatted = formatDate(timestamp)
    expect(formatted).toMatch(/\d{1,2}:\d{2}/)
  })
})

describe('formatDateShort', () => {
  it('formats timestamp in short format', () => {
    const timestamp = new Date('2024-03-15T14:30:00').getTime()
    const formatted = formatDateShort(timestamp)
    expect(formatted).toContain('Mar')
    expect(formatted).toContain('15')
    expect(formatted).toMatch(/\d{1,2}:\d{2}/)
  })

  it('does not include year', () => {
    const timestamp = new Date('2024-03-15T14:30:00').getTime()
    const formatted = formatDateShort(timestamp)
    expect(formatted).not.toContain('2024')
  })
})

describe('formatBusinessHours', () => {
  it('formats open hours correctly', () => {
    const hours = { open: '09:00', close: '17:00', closed: false }
    expect(formatBusinessHours(hours)).toBe('9:00 AM - 5:00 PM')
  })

  it('formats noon correctly', () => {
    const hours = { open: '12:00', close: '20:00', closed: false }
    expect(formatBusinessHours(hours)).toBe('12:00 PM - 8:00 PM')
  })

  it('formats midnight correctly', () => {
    const hours = { open: '00:00', close: '23:59', closed: false }
    expect(formatBusinessHours(hours)).toBe('12:00 AM - 11:59 PM')
  })

  it('returns "Closed" for closed days', () => {
    const hours = { open: '09:00', close: '17:00', closed: true }
    expect(formatBusinessHours(hours)).toBe('Closed')
  })

  it('handles evening hours', () => {
    const hours = { open: '17:00', close: '22:00', closed: false }
    expect(formatBusinessHours(hours)).toBe('5:00 PM - 10:00 PM')
  })
})

describe('formatPercent', () => {
  it('formats decimals as percentages', () => {
    expect(formatPercent(0.08)).toBe('8%')
    expect(formatPercent(0.15)).toBe('15%')
    expect(formatPercent(0.5)).toBe('50%')
    expect(formatPercent(1)).toBe('100%')
  })

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('0%')
  })

  it('rounds to nearest percent', () => {
    expect(formatPercent(0.085)).toBe('9%')
    expect(formatPercent(0.084)).toBe('8%')
  })
})
