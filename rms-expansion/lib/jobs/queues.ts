/**
 * BullMQ Job Queue Configuration
 * 
 * Background job processing for:
 * - Email notifications
 * - SMS/WhatsApp notifications
 * - Inventory stock deductions
 * - Report generation
 * - Scheduled tasks (reservation reminders, expiry checks)
 */

import { Queue, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'

// Redis connection
const getRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL
  
  if (redisUrl) {
    return new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  }
  
  return new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
}

// Shared connection for all queues
let connection: IORedis | null = null

export function getConnection() {
  if (!connection) {
    connection = getRedisConnection()
  }
  // Type assertion needed due to ioredis version incompatibility with BullMQ's bundled version
  return connection as any
}

// =============================================================================
// Queue Definitions
// =============================================================================

// Email Queue
export const emailQueue = new Queue('email', {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})

// SMS Queue
export const smsQueue = new Queue('sms', {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})

// Inventory Queue
export const inventoryQueue = new Queue('inventory', {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: 50,
    removeOnFail: 200,
  },
})

// Reports Queue
export const reportsQueue = new Queue('reports', {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: 20,
    removeOnFail: 50,
  },
})

// Scheduled Tasks Queue
export const scheduledQueue = new Queue('scheduled', {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

// =============================================================================
// Job Types
// =============================================================================

export interface EmailJobData {
  type: 'order-confirmation' | 'reservation-confirmation' | 'reservation-reminder' | 
        'waitlist-notification' | 'password-reset' | 'verification' | 'general'
  to: string
  subject: string
  template?: string
  data: Record<string, any>
}

export interface SMSJobData {
  type: 'order-status' | 'reservation-reminder' | 'waitlist-ready' | 'verification' | 'general'
  to: string
  message: string
  useWhatsApp?: boolean
}

export interface InventoryJobData {
  type: 'deduct-stock' | 'check-low-stock' | 'check-expiring-lots' | 'sync-stock'
  locationId?: string
  orderId?: string
  items?: Array<{ itemId: string; quantity: number }>
}

export interface ReportJobData {
  type: 'daily-sales' | 'inventory-report' | 'staff-performance' | 'custom'
  locationId?: string
  dateFrom?: string
  dateTo?: string
  format?: 'pdf' | 'csv' | 'excel'
  email?: string
}

export interface ScheduledJobData {
  type: 'reservation-reminder' | 'expiry-check' | 'daily-summary' | 'cleanup'
  data?: Record<string, any>
}

// =============================================================================
// Job Creators (Add jobs to queues)
// =============================================================================

export const jobs = {
  // Email jobs
  async sendOrderConfirmation(to: string, orderData: Record<string, any>) {
    return emailQueue.add('order-confirmation', {
      type: 'order-confirmation',
      to,
      subject: `Order Confirmation #${orderData.orderNumber}`,
      template: 'order-confirmation',
      data: orderData,
    })
  },

  async sendReservationConfirmation(to: string, reservationData: Record<string, any>) {
    return emailQueue.add('reservation-confirmation', {
      type: 'reservation-confirmation',
      to,
      subject: `Reservation Confirmed - ${reservationData.date}`,
      template: 'reservation-confirmation',
      data: reservationData,
    })
  },

  async sendReservationReminder(to: string, reservationData: Record<string, any>) {
    // Schedule for 2 hours before
    const reminderTime = new Date(reservationData.startTime)
    reminderTime.setHours(reminderTime.getHours() - 2)
    const delay = Math.max(0, reminderTime.getTime() - Date.now())

    return emailQueue.add('reservation-reminder', {
      type: 'reservation-reminder',
      to,
      subject: `Reminder: Your reservation today at ${reservationData.time}`,
      template: 'reservation-reminder',
      data: reservationData,
    }, { delay })
  },

  async sendPasswordReset(to: string, resetToken: string) {
    return emailQueue.add('password-reset', {
      type: 'password-reset',
      to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: { resetToken, resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}` },
    })
  },

  // SMS jobs
  async sendOrderStatusSMS(to: string, orderNumber: string, status: string) {
    const statusMessages: Record<string, string> = {
      confirmed: `Your order #${orderNumber} has been confirmed and is being prepared.`,
      preparing: `Your order #${orderNumber} is now being prepared.`,
      ready: `Your order #${orderNumber} is ready for pickup!`,
      completed: `Thank you! Your order #${orderNumber} has been completed.`,
    }
    
    return smsQueue.add('order-status', {
      type: 'order-status',
      to,
      message: statusMessages[status] || `Order #${orderNumber} status: ${status}`,
    })
  },

  async sendWaitlistNotification(to: string, guestName: string, useWhatsApp = false) {
    return smsQueue.add('waitlist-ready', {
      type: 'waitlist-ready',
      to,
      message: `Hi ${guestName}! Your table is ready. Please proceed to the host stand within 10 minutes.`,
      useWhatsApp,
    })
  },

  async sendReservationReminderSMS(to: string, reservationData: Record<string, any>) {
    return smsQueue.add('reservation-reminder', {
      type: 'reservation-reminder',
      to,
      message: `Reminder: You have a reservation today at ${reservationData.time} for ${reservationData.partySize} guests. See you soon!`,
    })
  },

  // Inventory jobs
  async deductStockForOrder(orderId: string, locationId: string, items: Array<{ itemId: string; quantity: number }>) {
    return inventoryQueue.add('deduct-stock', {
      type: 'deduct-stock',
      orderId,
      locationId,
      items,
    })
  },

  async checkLowStock(locationId?: string) {
    return inventoryQueue.add('check-low-stock', {
      type: 'check-low-stock',
      locationId,
    })
  },

  async checkExpiringLots(locationId?: string) {
    return inventoryQueue.add('check-expiring-lots', {
      type: 'check-expiring-lots',
      locationId,
    })
  },

  // Report jobs
  async generateDailySalesReport(locationId: string, date: string, email?: string) {
    return reportsQueue.add('daily-sales', {
      type: 'daily-sales',
      locationId,
      dateFrom: date,
      dateTo: date,
      format: 'pdf',
      email,
    })
  },

  async generateInventoryReport(locationId: string, email?: string) {
    return reportsQueue.add('inventory-report', {
      type: 'inventory-report',
      locationId,
      format: 'excel',
      email,
    })
  },
}

// =============================================================================
// Scheduled Jobs Setup
// =============================================================================

export async function setupScheduledJobs() {
  // Daily low stock check at 6 AM
  await scheduledQueue.add(
    'daily-low-stock-check',
    { type: 'expiry-check' },
    {
      repeat: {
        pattern: '0 6 * * *', // Cron: 6 AM daily
      },
    }
  )

  // Expiring lots check at 7 AM
  await scheduledQueue.add(
    'daily-expiry-check',
    { type: 'expiry-check' },
    {
      repeat: {
        pattern: '0 7 * * *',
      },
    }
  )

  // Reservation reminders every hour
  await scheduledQueue.add(
    'reservation-reminders',
    { type: 'reservation-reminder' },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
    }
  )

  // Daily cleanup at midnight
  await scheduledQueue.add(
    'daily-cleanup',
    { type: 'cleanup' },
    {
      repeat: {
        pattern: '0 0 * * *',
      },
    }
  )

  console.log('✅ Scheduled jobs configured')
}

// =============================================================================
// Queue Events (for monitoring)
// =============================================================================

export function setupQueueMonitoring() {
  const queues = [
    { name: 'email', queue: emailQueue },
    { name: 'sms', queue: smsQueue },
    { name: 'inventory', queue: inventoryQueue },
    { name: 'reports', queue: reportsQueue },
    { name: 'scheduled', queue: scheduledQueue },
  ]

  queues.forEach(({ name, queue: _queue }) => {
    const events = new QueueEvents(name, { connection: getConnection() })

    events.on('completed', ({ jobId }) => {
      console.log(`✅ [${name}] Job ${jobId} completed`)
    })

    events.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ [${name}] Job ${jobId} failed:`, failedReason)
    })

    events.on('stalled', ({ jobId }) => {
      console.warn(`⚠️ [${name}] Job ${jobId} stalled`)
    })
  })

  console.log('✅ Queue monitoring configured')
}

// =============================================================================
// Cleanup
// =============================================================================

export async function closeQueues() {
  await Promise.all([
    emailQueue.close(),
    smsQueue.close(),
    inventoryQueue.close(),
    reportsQueue.close(),
    scheduledQueue.close(),
  ])
  
  if (connection) {
    await connection.quit()
    connection = null
  }
  
  console.log('✅ All queues closed')
}

export default jobs
