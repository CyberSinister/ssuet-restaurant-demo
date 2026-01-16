/**
 * Socket.IO Server for Real-Time Features
 * 
 * This can run:
 * 1. Integrated with Next.js custom server
 * 2. As a standalone service
 * 
 * Features:
 * - Kitchen Display updates
 * - Order status changes
 * - Table status updates
 * - Waitlist notifications
 * - Low stock alerts
 */

import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import IORedis from 'ioredis'
import { Server as HTTPServer } from 'http'

// Types
export interface ServerToClientEvents {
  // Kitchen events
  'kitchen:new-order': (data: KitchenOrderEvent) => void
  'kitchen:order-updated': (data: { kitchenOrderId: string; status: string; stationId: string }) => void
  'kitchen:item-ready': (data: { kitchenOrderId: string; itemId: string }) => void
  'kitchen:order-bumped': (data: { kitchenOrderId: string; stationId: string }) => void
  
  // Order events
  'order:created': (data: OrderEvent) => void
  'order:status-changed': (data: { orderId: string; status: string; locationId: string }) => void
  'order:payment-received': (data: { orderId: string; amount: number; status: string }) => void
  'order:assigned-to-table': (data: { orderId: string; tableId: string }) => void
  
  // Table events
  'table:status-changed': (data: { tableId: string; status: string; areaId: string }) => void
  'table:occupied': (data: { tableId: string; orderId: string }) => void
  'table:cleared': (data: { tableId: string }) => void
  
  // Reservation events
  'reservation:created': (data: ReservationEvent) => void
  'reservation:updated': (data: { reservationId: string; status: string }) => void
  'reservation:seated': (data: { reservationId: string; tableId: string }) => void
  
  // Waitlist events
  'waitlist:updated': (data: WaitlistEvent) => void
  'waitlist:position-changed': (data: { entryId: string; position: number }) => void
  'waitlist:notification-sent': (data: { entryId: string; method: string }) => void
  
  // Inventory events
  'inventory:low-stock': (data: { itemId: string; itemName: string; currentStock: number; minimumStock: number }) => void
  'inventory:lot-expiring': (data: { lotId: string; itemName: string; expiryDate: string; daysUntilExpiry: number }) => void
  'inventory:stock-updated': (data: { itemId: string; locationId: string; newStock: number }) => void
  
  // POS events
  'pos:shift-opened': (data: { shiftId: string; terminalId: string; userId: string }) => void
  'pos:shift-closed': (data: { shiftId: string; terminalId: string }) => void
  
  // System events
  'system:notification': (data: { type: string; message: string; severity: 'info' | 'warning' | 'error' }) => void
}

export interface ClientToServerEvents {
  // Room management
  'join:location': (locationId: string) => void
  'leave:location': (locationId: string) => void
  'join:kitchen-station': (stationId: string) => void
  'leave:kitchen-station': (stationId: string) => void
  'join:table': (tableId: string) => void
  'leave:table': (tableId: string) => void
  
  // Kitchen actions
  'kitchen:view-order': (kitchenOrderId: string) => void
  'kitchen:start-order': (kitchenOrderId: string) => void
  'kitchen:complete-item': (data: { kitchenOrderId: string; itemId: string }) => void
  'kitchen:bump-order': (kitchenOrderId: string) => void
  
  // Table actions
  'table:request-status': (tableId: string) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId?: string
  userRole?: string
  locationId?: string
  stationIds?: string[]
}

// Event data types
interface KitchenOrderEvent {
  kitchenOrder: {
    id: string
    ticketNumber: number
    orderId: string
    stationId: string
    status: string
    priority: string
    items: Array<{
      id: string
      menuItemName: string
      quantity: number
      specialInstructions?: string
    }>
  }
}

interface OrderEvent {
  order: {
    id: string
    orderNumber: string
    orderType: string
    status: string
    total: number
    customerName?: string
    tableNumber?: string
  }
}

interface ReservationEvent {
  reservation: {
    id: string
    reservationNumber: string
    guestName: string
    partySize: number
    date: string
    startTime: string
    status: string
  }
}

interface WaitlistEvent {
  entry: {
    id: string
    guestName: string
    partySize: number
    position: number
    quotedWaitTime?: number
    status: string
  }
}

// Socket.IO Server Class
export class RMSSocketServer {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  private pubClient: IORedis | null = null
  private subClient: IORedis | null = null

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    })
  }

  async initialize(): Promise<void> {
    // Setup Redis adapter for horizontal scaling
    if (process.env.REDIS_URL) {
      try {
        this.pubClient = new IORedis(process.env.REDIS_URL)
        this.subClient = new IORedis(process.env.REDIS_URL)

        // IORedis auto-connects, wait for ready
        await Promise.all([
          new Promise<void>((resolve) => this.pubClient!.on('ready', resolve)),
          new Promise<void>((resolve) => this.subClient!.on('ready', resolve)),
        ])

        this.io.adapter(createAdapter(this.pubClient as any, this.subClient as any))
        console.log('✅ Socket.IO Redis adapter connected')
      } catch (error) {
        console.error('❌ Failed to connect Socket.IO Redis adapter:', error)
        // Continue without Redis adapter (single server mode)
      }
    }

    this.setupMiddleware()
    this.setupEventHandlers()
    
    console.log('✅ Socket.IO server initialized')
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
        
        if (!token) {
          // Allow anonymous connections for public features (waitlist display, etc.)
          socket.data.userId = undefined
          socket.data.userRole = 'guest'
          return next()
        }

        // Verify JWT token (implement your token verification)
        // const decoded = await verifyToken(token)
        // socket.data.userId = decoded.userId
        // socket.data.userRole = decoded.role
        
        // For now, just pass through
        socket.data.userId = token
        socket.data.userRole = 'authenticated'
        
        next()
      } catch (error) {
        next(new Error('Authentication failed'))
      }
    })
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`)

      // Room management
      socket.on('join:location', (locationId) => {
        socket.join(`location:${locationId}`)
        socket.data.locationId = locationId
        console.log(`📍 ${socket.id} joined location: ${locationId}`)
      })

      socket.on('leave:location', (locationId) => {
        socket.leave(`location:${locationId}`)
        console.log(`📍 ${socket.id} left location: ${locationId}`)
      })

      socket.on('join:kitchen-station', (stationId) => {
        socket.join(`kitchen:${stationId}`)
        if (!socket.data.stationIds) socket.data.stationIds = []
        socket.data.stationIds.push(stationId)
        console.log(`🍳 ${socket.id} joined kitchen station: ${stationId}`)
      })

      socket.on('leave:kitchen-station', (stationId) => {
        socket.leave(`kitchen:${stationId}`)
        if (socket.data.stationIds) {
          socket.data.stationIds = socket.data.stationIds.filter(id => id !== stationId)
        }
        console.log(`🍳 ${socket.id} left kitchen station: ${stationId}`)
      })

      socket.on('join:table', (tableId) => {
        socket.join(`table:${tableId}`)
        console.log(`🪑 ${socket.id} joined table: ${tableId}`)
      })

      socket.on('leave:table', (tableId) => {
        socket.leave(`table:${tableId}`)
        console.log(`🪑 ${socket.id} left table: ${tableId}`)
      })

      // Kitchen actions (these would trigger database updates and broadcast to others)
      socket.on('kitchen:view-order', (kitchenOrderId) => {
        // This would be handled by an API call that then emits to all clients
        console.log(`👁️ Order viewed: ${kitchenOrderId} by ${socket.id}`)
      })

      socket.on('kitchen:bump-order', (kitchenOrderId) => {
        console.log(`✅ Order bumped: ${kitchenOrderId} by ${socket.id}`)
      })

      // Disconnect
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Client disconnected: ${socket.id} - Reason: ${reason}`)
      })
    })
  }

  // ==========================================================================
  // Emission Methods (called from API routes/services)
  // ==========================================================================

  // Kitchen events
  emitKitchenNewOrder(stationId: string, data: KitchenOrderEvent): void {
    this.io.to(`kitchen:${stationId}`).emit('kitchen:new-order', data)
  }

  emitKitchenOrderUpdated(stationId: string, kitchenOrderId: string, status: string): void {
    this.io.to(`kitchen:${stationId}`).emit('kitchen:order-updated', { kitchenOrderId, status, stationId })
  }

  emitKitchenItemReady(stationId: string, kitchenOrderId: string, itemId: string): void {
    this.io.to(`kitchen:${stationId}`).emit('kitchen:item-ready', { kitchenOrderId, itemId })
  }

  emitKitchenOrderBumped(stationId: string, kitchenOrderId: string): void {
    this.io.to(`kitchen:${stationId}`).emit('kitchen:order-bumped', { kitchenOrderId, stationId })
  }

  // Order events
  emitOrderCreated(locationId: string, data: OrderEvent): void {
    this.io.to(`location:${locationId}`).emit('order:created', data)
  }

  emitOrderStatusChanged(locationId: string, orderId: string, status: string): void {
    this.io.to(`location:${locationId}`).emit('order:status-changed', { orderId, status, locationId })
  }

  emitOrderPaymentReceived(locationId: string, orderId: string, amount: number, status: string): void {
    this.io.to(`location:${locationId}`).emit('order:payment-received', { orderId, amount, status })
  }

  // Table events
  emitTableStatusChanged(locationId: string, tableId: string, status: string, areaId: string): void {
    this.io.to(`location:${locationId}`).emit('table:status-changed', { tableId, status, areaId })
    this.io.to(`table:${tableId}`).emit('table:status-changed', { tableId, status, areaId })
  }

  emitTableOccupied(locationId: string, tableId: string, orderId: string): void {
    this.io.to(`location:${locationId}`).emit('table:occupied', { tableId, orderId })
  }

  emitTableCleared(locationId: string, tableId: string): void {
    this.io.to(`location:${locationId}`).emit('table:cleared', { tableId })
  }

  // Reservation events
  emitReservationCreated(locationId: string, data: ReservationEvent): void {
    this.io.to(`location:${locationId}`).emit('reservation:created', data)
  }

  emitReservationUpdated(locationId: string, reservationId: string, status: string): void {
    this.io.to(`location:${locationId}`).emit('reservation:updated', { reservationId, status })
  }

  emitReservationSeated(locationId: string, reservationId: string, tableId: string): void {
    this.io.to(`location:${locationId}`).emit('reservation:seated', { reservationId, tableId })
  }

  // Waitlist events
  emitWaitlistUpdated(locationId: string, data: WaitlistEvent): void {
    this.io.to(`location:${locationId}`).emit('waitlist:updated', data)
  }

  emitWaitlistPositionChanged(locationId: string, entryId: string, position: number): void {
    this.io.to(`location:${locationId}`).emit('waitlist:position-changed', { entryId, position })
  }

  emitWaitlistNotificationSent(locationId: string, entryId: string, method: string): void {
    this.io.to(`location:${locationId}`).emit('waitlist:notification-sent', { entryId, method })
  }

  // Inventory events
  emitLowStockAlert(locationId: string, itemId: string, itemName: string, currentStock: number, minimumStock: number): void {
    this.io.to(`location:${locationId}`).emit('inventory:low-stock', { itemId, itemName, currentStock, minimumStock })
  }

  emitLotExpiring(locationId: string, lotId: string, itemName: string, expiryDate: string, daysUntilExpiry: number): void {
    this.io.to(`location:${locationId}`).emit('inventory:lot-expiring', { lotId, itemName, expiryDate, daysUntilExpiry })
  }

  emitStockUpdated(locationId: string, itemId: string, newStock: number): void {
    this.io.to(`location:${locationId}`).emit('inventory:stock-updated', { itemId, locationId, newStock })
  }

  // POS events
  emitShiftOpened(locationId: string, shiftId: string, terminalId: string, userId: string): void {
    this.io.to(`location:${locationId}`).emit('pos:shift-opened', { shiftId, terminalId, userId })
  }

  emitShiftClosed(locationId: string, shiftId: string, terminalId: string): void {
    this.io.to(`location:${locationId}`).emit('pos:shift-closed', { shiftId, terminalId })
  }

  // System notifications
  emitSystemNotification(locationId: string, type: string, message: string, severity: 'info' | 'warning' | 'error'): void {
    this.io.to(`location:${locationId}`).emit('system:notification', { type, message, severity })
  }

  // Broadcast to all connected clients
  broadcast<K extends keyof ServerToClientEvents>(event: K, data: Parameters<ServerToClientEvents[K]>[0]): void {
    // Using type assertion to work around strict typing
    (this.io as any).emit(event, data)
  }

  // Get IO instance for advanced usage
  getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
    return this.io
  }

  // Cleanup
  async close(): Promise<void> {
    if (this.pubClient) await this.pubClient.quit()
    if (this.subClient) await this.subClient.quit()
    this.io.close()
  }
}

// Singleton instance
let socketServer: RMSSocketServer | null = null

export function getSocketServer(): RMSSocketServer | null {
  return socketServer
}

export function initializeSocketServer(httpServer: HTTPServer): RMSSocketServer {
  if (!socketServer) {
    socketServer = new RMSSocketServer(httpServer)
  }
  return socketServer
}

export default RMSSocketServer
