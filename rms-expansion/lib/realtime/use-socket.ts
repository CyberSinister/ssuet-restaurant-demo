/**
 * Socket.IO Client Hook for React
 * 
 * Usage:
 * const { socket, isConnected, joinLocation, leaveLocation } = useSocket()
 * 
 * // Join a location room
 * useEffect(() => {
 *   if (locationId) {
 *     joinLocation(locationId)
 *     return () => leaveLocation(locationId)
 *   }
 * }, [locationId])
 * 
 * // Listen for events
 * useSocketEvent('order:created', (data) => {
 *   console.log('New order:', data)
 * })
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from './socket-server'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

// Socket instance singleton
let socket: TypedSocket | null = null

function getSocket(): TypedSocket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    
    socket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }
  return socket
}

// Main hook
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const socketRef = useRef<TypedSocket | null>(null)

  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    // Get auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      socket.auth = { token }
    }

    // Connect
    socket.connect()

    // Event handlers
    const onConnect = () => {
      setIsConnected(true)
      setConnectionError(null)
      console.log('🔌 Socket connected:', socket.id)
    }

    const onDisconnect = (reason: string) => {
      setIsConnected(false)
      console.log('🔌 Socket disconnected:', reason)
    }

    const onConnectError = (error: Error) => {
      setConnectionError(error.message)
      console.error('🔌 Socket connection error:', error)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)

    // Check if already connected
    if (socket.connected) {
      setIsConnected(true)
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
    }
  }, [])

  // Room management
  const joinLocation = useCallback((locationId: string) => {
    socketRef.current?.emit('join:location', locationId)
  }, [])

  const leaveLocation = useCallback((locationId: string) => {
    socketRef.current?.emit('leave:location', locationId)
  }, [])

  const joinKitchenStation = useCallback((stationId: string) => {
    socketRef.current?.emit('join:kitchen-station', stationId)
  }, [])

  const leaveKitchenStation = useCallback((stationId: string) => {
    socketRef.current?.emit('leave:kitchen-station', stationId)
  }, [])

  const joinTable = useCallback((tableId: string) => {
    socketRef.current?.emit('join:table', tableId)
  }, [])

  const leaveTable = useCallback((tableId: string) => {
    socketRef.current?.emit('leave:table', tableId)
  }, [])

  // Kitchen actions
  const viewKitchenOrder = useCallback((kitchenOrderId: string) => {
    socketRef.current?.emit('kitchen:view-order', kitchenOrderId)
  }, [])

  const startKitchenOrder = useCallback((kitchenOrderId: string) => {
    socketRef.current?.emit('kitchen:start-order', kitchenOrderId)
  }, [])

  const completeKitchenItem = useCallback((kitchenOrderId: string, itemId: string) => {
    socketRef.current?.emit('kitchen:complete-item', { kitchenOrderId, itemId })
  }, [])

  const bumpKitchenOrder = useCallback((kitchenOrderId: string) => {
    socketRef.current?.emit('kitchen:bump-order', kitchenOrderId)
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    // Room management
    joinLocation,
    leaveLocation,
    joinKitchenStation,
    leaveKitchenStation,
    joinTable,
    leaveTable,
    // Kitchen actions
    viewKitchenOrder,
    startKitchenOrder,
    completeKitchenItem,
    bumpKitchenOrder,
  }
}

// Event listener hook
export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  callback: ServerToClientEvents[K],
  deps: any[] = []
) {
  useEffect(() => {
    const socket = getSocket()
    
    socket.on(event, callback as any)
    
    return () => {
      socket.off(event, callback as any)
    }
  }, [event, ...deps])
}

// Multiple events listener
export function useSocketEvents(
  events: Partial<{ [K in keyof ServerToClientEvents]: ServerToClientEvents[K] }>,
  deps: any[] = []
) {
  useEffect(() => {
    const socket = getSocket()
    
    const entries = Object.entries(events) as [keyof ServerToClientEvents, any][]
    
    entries.forEach(([event, handler]) => {
      socket.on(event, handler)
    })
    
    return () => {
      entries.forEach(([event, handler]) => {
        socket.off(event, handler)
      })
    }
  }, deps)
}

// Kitchen-specific hook
export function useKitchenSocket(stationId: string | null) {
  const { 
    isConnected, 
    joinKitchenStation, 
    leaveKitchenStation,
    viewKitchenOrder,
    startKitchenOrder,
    completeKitchenItem,
    bumpKitchenOrder,
  } = useSocket()

  const [orders, setOrders] = useState<any[]>([])

  // Join station room
  useEffect(() => {
    if (stationId && isConnected) {
      joinKitchenStation(stationId)
      return () => leaveKitchenStation(stationId)
    }
    return undefined
  }, [stationId, isConnected, joinKitchenStation, leaveKitchenStation])

  // Listen for kitchen events
  useSocketEvent('kitchen:new-order', (data) => {
    setOrders(prev => [data.kitchenOrder, ...prev])
  }, [])

  useSocketEvent('kitchen:order-updated', (data) => {
    setOrders(prev => prev.map(order => 
      order.id === data.kitchenOrderId 
        ? { ...order, status: data.status }
        : order
    ))
  }, [])

  useSocketEvent('kitchen:order-bumped', (data) => {
    setOrders(prev => prev.filter(order => order.id !== data.kitchenOrderId))
  }, [])

  return {
    orders,
    setOrders,
    isConnected,
    viewOrder: viewKitchenOrder,
    startOrder: startKitchenOrder,
    completeItem: completeKitchenItem,
    bumpOrder: bumpKitchenOrder,
  }
}

// Location-specific hook for general updates
export function useLocationSocket(locationId: string | null) {
  const { isConnected, joinLocation, leaveLocation } = useSocket()
  
  const [newOrders, setNewOrders] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  // Join location room
  useEffect(() => {
    if (locationId && isConnected) {
      joinLocation(locationId)
      return () => leaveLocation(locationId)
    }
    return undefined
  }, [locationId, isConnected, joinLocation, leaveLocation])

  // Listen for events
  useSocketEvent('order:created', (data) => {
    setNewOrders(prev => [data.order, ...prev.slice(0, 9)]) // Keep last 10
  }, [])

  useSocketEvent('system:notification', (data) => {
    setNotifications(prev => [data, ...prev.slice(0, 19)]) // Keep last 20
  }, [])

  const clearNewOrders = useCallback(() => setNewOrders([]), [])
  const clearNotifications = useCallback(() => setNotifications([]), [])

  return {
    isConnected,
    newOrders,
    notifications,
    clearNewOrders,
    clearNotifications,
  }
}

// Table status hook
export function useTableSocket(locationId: string | null) {
  const { isConnected, joinLocation, leaveLocation } = useSocket()
  const [tableUpdates, setTableUpdates] = useState<Map<string, { status: string; timestamp: Date }>>(new Map())

  useEffect(() => {
    if (locationId && isConnected) {
      joinLocation(locationId)
      return () => leaveLocation(locationId)
    }
    return undefined
  }, [locationId, isConnected, joinLocation, leaveLocation])

  useSocketEvent('table:status-changed', (data) => {
    setTableUpdates(prev => {
      const newMap = new Map(prev)
      newMap.set(data.tableId, { status: data.status, timestamp: new Date() })
      return newMap
    })
  }, [])

  useSocketEvent('table:occupied', (data) => {
    setTableUpdates(prev => {
      const newMap = new Map(prev)
      newMap.set(data.tableId, { status: 'OCCUPIED', timestamp: new Date() })
      return newMap
    })
  }, [])

  useSocketEvent('table:cleared', (data) => {
    setTableUpdates(prev => {
      const newMap = new Map(prev)
      newMap.set(data.tableId, { status: 'AVAILABLE', timestamp: new Date() })
      return newMap
    })
  }, [])

  return {
    isConnected,
    tableUpdates,
    getTableStatus: (tableId: string) => tableUpdates.get(tableId),
  }
}

// Inventory alerts hook
export function useInventoryAlerts(locationId: string | null) {
  const { isConnected, joinLocation, leaveLocation } = useSocket()
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([])
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([])

  useEffect(() => {
    if (locationId && isConnected) {
      joinLocation(locationId)
      return () => leaveLocation(locationId)
    }
    return undefined
  }, [locationId, isConnected, joinLocation, leaveLocation])

  useSocketEvent('inventory:low-stock', (data) => {
    setLowStockAlerts(prev => {
      // Avoid duplicates
      if (prev.some(a => a.itemId === data.itemId)) {
        return prev.map(a => a.itemId === data.itemId ? { ...data, timestamp: new Date() } : a)
      }
      return [{ ...data, timestamp: new Date() }, ...prev]
    })
  }, [])

  useSocketEvent('inventory:lot-expiring', (data) => {
    setExpiryAlerts(prev => {
      if (prev.some(a => a.lotId === data.lotId)) {
        return prev.map(a => a.lotId === data.lotId ? { ...data, timestamp: new Date() } : a)
      }
      return [{ ...data, timestamp: new Date() }, ...prev]
    })
  }, [])

  const dismissLowStock = useCallback((itemId: string) => {
    setLowStockAlerts(prev => prev.filter(a => a.itemId !== itemId))
  }, [])

  const dismissExpiry = useCallback((lotId: string) => {
    setExpiryAlerts(prev => prev.filter(a => a.lotId !== lotId))
  }, [])

  return {
    isConnected,
    lowStockAlerts,
    expiryAlerts,
    dismissLowStock,
    dismissExpiry,
  }
}

export default useSocket
