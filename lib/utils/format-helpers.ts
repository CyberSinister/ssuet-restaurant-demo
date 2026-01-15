/**
 * Utility functions for formatting and validation
 */

/**
 * Format business hours for display
 * @param hours - Business hours object
 * @returns Formatted string like "Mon-Fri: 9:00 AM - 5:00 PM"
 */
export function formatBusinessHours(hours: {
  [key: string]: { open: string; close: string; closed: boolean }
}): string {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const daysAbbrev = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const groupedHours: { [key: string]: number[] } = {}

  days.forEach((day, index) => {
    const dayHours = hours[day]
    if (!dayHours?.closed) {
      const key = `${dayHours.open}-${dayHours.close}`
      if (!groupedHours[key]) {
        groupedHours[key] = []
      }
      groupedHours[key].push(index)
    }
  })

  const formatted: string[] = []

  Object.entries(groupedHours).forEach(([timeRange, dayIndexes]) => {
    const [open, close] = timeRange.split('-')
    const formattedOpen = formatTime(open)
    const formattedClose = formatTime(close)

    if (dayIndexes.length === 1) {
      formatted.push(`${daysAbbrev[dayIndexes[0]]}: ${formattedOpen} - ${formattedClose}`)
    } else {
      const ranges: string[] = []
      let start = dayIndexes[0]
      let end = dayIndexes[0]

      for (let i = 1; i <= dayIndexes.length; i++) {
        if (i < dayIndexes.length && dayIndexes[i] === end + 1) {
          end = dayIndexes[i]
        } else {
          if (start === end) {
            ranges.push(daysAbbrev[start])
          } else {
            ranges.push(`${daysAbbrev[start]}-${daysAbbrev[end]}`)
          }
          if (i < dayIndexes.length) {
            start = dayIndexes[i]
            end = dayIndexes[i]
          }
        }
      }

      formatted.push(`${ranges.join(', ')}: ${formattedOpen} - ${formattedClose}`)
    }
  })

  return formatted.join(' | ')
}

/**
 * Format time from 24-hour to 12-hour format
 * @param time - Time string in HH:MM format
 * @returns Formatted time like "9:00 AM"
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Mask sensitive data like passwords
 * @param data - String to mask
 * @param visibleChars - Number of characters to show at the start
 * @returns Masked string
 */
export function maskSensitiveData(data: string, visibleChars: number = 0): string {
  if (!data) return ''
  if (visibleChars === 0) return '•'.repeat(8)
  return data.slice(0, visibleChars) + '•'.repeat(Math.max(8, data.length - visibleChars))
}

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format phone number for display
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Format as (XXX) XXX-XXXX for 10-digit US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  // Format as +X (XXX) XXX-XXXX for 11-digit numbers (with country code)
  if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // Return original if not a standard format
  return phone
}

/**
 * Format currency amount
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format tax rate as percentage
 * @param rate - Tax rate as decimal (e.g., 0.0875 for 8.75%)
 * @returns Formatted percentage string
 */
export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

/**
 * Parse phone number to standardized format
 * @param phone - Phone number in any format
 * @returns Standardized phone number (digits only)
 */
export function parsePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Validate SMTP port number
 * @param port - Port number
 * @returns True if valid port (1-65535)
 */
export function isValidPort(port: number): boolean {
  return port >= 1 && port <= 65535
}

/**
 * Get display name for order status
 * @param status - Order status
 * @returns Formatted status name
 */
export function getOrderStatusDisplay(
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
): string {
  const statusMap = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready for Pickup',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return statusMap[status] || status
}

/**
 * Get color variant for order status badge
 * @param status - Order status
 * @returns Badge variant
 */
export function getOrderStatusVariant(
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variantMap = {
    pending: 'secondary' as const,
    confirmed: 'default' as const,
    preparing: 'default' as const,
    ready: 'default' as const,
    completed: 'outline' as const,
    cancelled: 'destructive' as const,
  }
  return variantMap[status] || 'default'
}
