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

import { Queue } from 'bullmq'
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
    // Cast to any to avoid type incompatibility between ioredis versions
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
