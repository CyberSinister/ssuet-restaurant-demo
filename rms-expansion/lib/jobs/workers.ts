/**
 * BullMQ Workers
 * 
 * Run separately from the main app:
 *   npx tsx lib/jobs/workers.ts
 * 
 * Or import and start in the main server for simpler deployments
 */

import { Worker, Job } from 'bullmq'
import { getConnection, EmailJobData, SMSJobData, InventoryJobData, ReportJobData, ScheduledJobData } from './queues'

// =============================================================================
// Email Worker
// =============================================================================

const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job: Job<EmailJobData>) => {
    const { type, to, subject, template, data } = job.data
    
    console.log(`📧 Processing email job: ${type} to ${to}`)
    
    // Import email service dynamically to avoid circular deps
    const { sendEmail } = await import('@/lib/email/service')
    
    try {
      await sendEmail({
        to,
        subject,
        template: template || type,
        data,
      })
      
      console.log(`✅ Email sent: ${type} to ${to}`)
      return { success: true, sentAt: new Date().toISOString() }
    } catch (error) {
      console.error(`❌ Email failed: ${type} to ${to}`, error)
      throw error
    }
  },
  {
    connection: getConnection(),
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // 10 emails per second max
    },
  }
)

// =============================================================================
// SMS Worker
// =============================================================================

const smsWorker = new Worker<SMSJobData>(
  'sms',
  async (job: Job<SMSJobData>) => {
    const { type, to, message, useWhatsApp } = job.data
    
    console.log(`📱 Processing SMS job: ${type} to ${to}`)
    
    const { sendSMS, sendWhatsApp } = await import('../notifications/twilio')
    
    try {
      if (useWhatsApp) {
        await sendWhatsApp(to, message)
      } else {
        await sendSMS(to, message)
      }
      
      console.log(`✅ ${useWhatsApp ? 'WhatsApp' : 'SMS'} sent to ${to}`)
      return { success: true, sentAt: new Date().toISOString() }
    } catch (error) {
      console.error(`❌ ${useWhatsApp ? 'WhatsApp' : 'SMS'} failed to ${to}`, error)
      throw error
    }
  },
  {
    connection: getConnection(),
    concurrency: 3,
    limiter: {
      max: 5,
      duration: 1000, // 5 messages per second max
    },
  }
)

// =============================================================================
// Inventory Worker
// =============================================================================

const inventoryWorker = new Worker<InventoryJobData>(
  'inventory',
  async (job: Job<InventoryJobData>) => {
    const { type, locationId, orderId, items } = job.data
    
    console.log(`📦 Processing inventory job: ${type}`)
    
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      switch (type) {
        case 'deduct-stock': {
          if (!items || !locationId) {
            throw new Error('Missing items or locationId for stock deduction')
          }
          
          // Deduct stock for each item
          for (const item of items) {
            // Get recipe for the menu item
            const recipe = await prisma.recipe.findUnique({
              where: { menuItemId: item.itemId },
              include: { items: true },
            })
            
            if (recipe) {
              // Deduct ingredients based on recipe
              for (const recipeItem of recipe.items) {
                const deductQty = Number(recipeItem.quantity) * item.quantity
                
                await prisma.locationStock.update({
                  where: {
                    locationId_inventoryItemId: {
                      locationId,
                      inventoryItemId: recipeItem.inventoryItemId,
                    },
                  },
                  data: {
                    currentStock: {
                      decrement: deductQty,
                    },
                  },
                })
                
                // Create stock movement record
                const stock = await prisma.locationStock.findUnique({
                  where: {
                    locationId_inventoryItemId: {
                      locationId,
                      inventoryItemId: recipeItem.inventoryItemId,
                    },
                  },
                })
                
                await prisma.stockMovement.create({
                  data: {
                    movementNumber: `MOV-${Date.now()}`,
                    inventoryItemId: recipeItem.inventoryItemId,
                    locationId,
                    movementType: 'SALE',
                    quantity: -deductQty,
                    previousStock: Number(stock?.currentStock || 0) + deductQty,
                    newStock: Number(stock?.currentStock || 0),
                    referenceType: 'order',
                    referenceId: orderId,
                    performedById: 'system',
                  },
                })
              }
            }
          }
          
          console.log(`✅ Stock deducted for order ${orderId}`)
          break
        }
        
        case 'check-low-stock': {
          // Find items below reorder point
          const lowStockItems = await prisma.locationStock.findMany({
            where: {
              ...(locationId && { locationId }),
              currentStock: {
                lte: prisma.locationStock.fields.minimumStock,
              },
            },
            include: {
              inventoryItem: true,
              location: true,
            },
          })
          
          // Emit alerts via socket
          const { getSocketServer } = await import('../realtime/socket-server')
          const socketServer = getSocketServer()
          
          for (const item of lowStockItems) {
            socketServer?.emitLowStockAlert(
              item.locationId,
              item.inventoryItemId,
              item.inventoryItem.name,
              Number(item.currentStock),
              Number(item.minimumStock || item.inventoryItem.minimumStock)
            )
          }
          
          console.log(`✅ Low stock check completed: ${lowStockItems.length} alerts`)
          break
        }
        
        case 'check-expiring-lots': {
          const daysThreshold = 7 // Alert for items expiring in 7 days
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + daysThreshold)
          
          const expiringLots = await prisma.inventoryLot.findMany({
            where: {
              ...(locationId && { locationId }),
              expiryDate: {
                lte: expiryDate,
              },
              status: 'AVAILABLE',
              remainingQty: {
                gt: 0,
              },
            },
            include: {
              inventoryItem: true,
              location: true,
            },
          })
          
          const { getSocketServer } = await import('../realtime/socket-server')
          const socketServer = getSocketServer()
          
          for (const lot of expiringLots) {
            const daysUntilExpiry = Math.ceil(
              (new Date(lot.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            
            socketServer?.emitLotExpiring(
              lot.locationId,
              lot.id,
              lot.inventoryItem.name,
              lot.expiryDate!.toISOString(),
              daysUntilExpiry
            )
          }
          
          console.log(`✅ Expiry check completed: ${expiringLots.length} lots expiring soon`)
          break
        }
      }
      
      return { success: true }
    } finally {
      await prisma.$disconnect()
    }
  },
  {
    connection: getConnection(),
    concurrency: 2,
  }
)

// =============================================================================
// Reports Worker
// =============================================================================

const reportsWorker = new Worker<ReportJobData>(
  'reports',
  async (job: Job<ReportJobData>) => {
    const { type, locationId, dateFrom, dateTo, format: _format, email } = job.data
    
    console.log(`📊 Processing report job: ${type}`)
    
    // Report generation would go here
    // This is a placeholder - implement actual report generation
    
    try {
      switch (type) {
        case 'daily-sales': {
          // Generate daily sales report
          console.log(`Generating daily sales report for ${dateFrom}`)
          // ... implementation
          break
        }
        
        case 'inventory-report': {
          // Generate inventory report
          console.log(`Generating inventory report for location ${locationId}`)
          // ... implementation
          break
        }
      }
      
      // If email provided, send the report
      if (email) {
        const { sendEmail } = await import('@/lib/email/service')
        await sendEmail({
          to: email,
          subject: `${type.replace('-', ' ').toUpperCase()} Report`,
          template: 'report-ready',
          data: { reportType: type, dateFrom, dateTo },
        })
      }
      
      console.log(`✅ Report generated: ${type}`)
      return { success: true, generatedAt: new Date().toISOString() }
    } catch (error) {
      console.error(`❌ Report generation failed: ${type}`, error)
      throw error
    }
  },
  {
    connection: getConnection(),
    concurrency: 1, // Reports can be heavy, process one at a time
  }
)

// =============================================================================
// Scheduled Tasks Worker
// =============================================================================

const scheduledWorker = new Worker<ScheduledJobData>(
  'scheduled',
  async (job: Job<ScheduledJobData>) => {
    const { type, data: _data } = job.data
    
    console.log(`⏰ Processing scheduled job: ${type}`)
    
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      switch (type) {
        case 'reservation-reminder': {
          // Find reservations starting in the next 2 hours that haven't been reminded
          const now = new Date()
          const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
          
          const upcomingReservations = await prisma.reservation.findMany({
            where: {
              date: {
                gte: now,
                lte: twoHoursLater,
              },
              status: 'CONFIRMED',
              reminderSent: false,
            },
          })
          
          const { sendSMS: _sendSMS } = await import('../notifications/twilio')
          const { jobs } = await import('./queues')
          
          for (const reservation of upcomingReservations) {
            // Queue reminder notifications
            if (reservation.guestPhone) {
              await jobs.sendReservationReminderSMS(reservation.guestPhone, {
                time: reservation.startTime.toLocaleTimeString(),
                partySize: reservation.partySize,
              })
            }
            
            if (reservation.guestEmail) {
              await jobs.sendReservationReminder(reservation.guestEmail, {
                reservationNumber: reservation.reservationNumber,
                date: reservation.date.toLocaleDateString(),
                time: reservation.startTime.toLocaleTimeString(),
                partySize: reservation.partySize,
              })
            }
            
            // Mark as reminded
            await prisma.reservation.update({
              where: { id: reservation.id },
              data: {
                reminderSent: true,
                reminderSentAt: new Date(),
              },
            })
          }
          
          console.log(`✅ Sent ${upcomingReservations.length} reservation reminders`)
          break
        }
        
        case 'expiry-check': {
          // Trigger expiry check for all locations
          const { jobs } = await import('./queues')
          await jobs.checkExpiringLots()
          break
        }
        
        case 'cleanup': {
          // Clean up old data
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          
          // Clean up old notifications
          await prisma.notification.deleteMany({
            where: {
              createdAt: {
                lt: thirtyDaysAgo,
              },
              status: {
                in: ['sent', 'delivered'],
              },
            },
          })
          
          // Clean up old audit logs (keep 90 days)
          const ninetyDaysAgo = new Date()
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
          
          await prisma.auditLog.deleteMany({
            where: {
              createdAt: {
                lt: ninetyDaysAgo,
              },
            },
          })
          
          console.log('✅ Cleanup completed')
          break
        }
      }
      
      return { success: true }
    } finally {
      await prisma.$disconnect()
    }
  },
  {
    connection: getConnection(),
    concurrency: 1,
  }
)

// =============================================================================
// Worker Events
// =============================================================================

const workers = [emailWorker, smsWorker, inventoryWorker, reportsWorker, scheduledWorker]

workers.forEach((worker) => {
  worker.on('completed', (job) => {
    console.log(`✅ [${worker.name}] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ [${worker.name}] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error(`❌ [${worker.name}] Worker error:`, err)
  })
})

// =============================================================================
// Start Workers (if running standalone)
// =============================================================================

export async function startWorkers() {
  console.log('🚀 Starting BullMQ workers...')
  
  // Workers start automatically when created
  // This function is for explicit startup and logging
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🔧 BullMQ Workers Started                                    ║
║                                                                ║
║   Queues:                                                      ║
║   • email     (concurrency: 5)                                 ║
║   • sms       (concurrency: 3)                                 ║
║   • inventory (concurrency: 2)                                 ║
║   • reports   (concurrency: 1)                                 ║
║   • scheduled (concurrency: 1)                                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `)
}

export async function stopWorkers() {
  console.log('🛑 Stopping workers...')
  await Promise.all(workers.map((w) => w.close()))
  console.log('✅ All workers stopped')
}

// Run if executed directly
if (require.main === module) {
  startWorkers().catch(console.error)
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await stopWorkers()
    process.exit(0)
  })
  
  process.on('SIGINT', async () => {
    await stopWorkers()
    process.exit(0)
  })
}

export { emailWorker, smsWorker, inventoryWorker, reportsWorker, scheduledWorker }
