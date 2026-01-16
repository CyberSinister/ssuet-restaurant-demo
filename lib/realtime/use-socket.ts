/**
 * React Hook for Socket.IO Client
 * 
 * Provides type-safe socket connection with automatic room management
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from './socket-server'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseSocketOptions {
    autoConnect?: boolean
    locationId?: string
    stationId?: string
    tableId?: string
    onConnect?: () => void
    onDisconnect?: (reason: string) => void
}

export function useSocket(options: UseSocketOptions = {}) {
    const {
        autoConnect = true,
        locationId,
        stationId,
        tableId,
        onConnect,
        onDisconnect,
    } = options

    const socketRef = useRef<TypedSocket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [connectionError, setConnectionError] = useState<string | null>(null)

    // Initialize socket connection
    useEffect(() => {
        if (!autoConnect) return

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin

        socketRef.current = io(socketUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        })

        const socket = socketRef.current

        socket.on('connect', () => {
            setIsConnected(true)
            setConnectionError(null)
            console.log('🔌 Socket connected:', socket.id)
            onConnect?.()
        })

        socket.on('disconnect', (reason) => {
            setIsConnected(false)
            console.log('🔌 Socket disconnected:', reason)
            onDisconnect?.(reason)
        })

        socket.on('connect_error', (error) => {
            setConnectionError(error.message)
            console.error('❌ Socket connection error:', error.message)
        })

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [autoConnect, onConnect, onDisconnect])

    // Join location room
    useEffect(() => {
        if (!isConnected || !locationId || !socketRef.current) return

        socketRef.current.emit('join:location', locationId)

        return () => {
            socketRef.current?.emit('leave:location', locationId)
        }
    }, [isConnected, locationId])

    // Join kitchen station room
    useEffect(() => {
        if (!isConnected || !stationId || !socketRef.current) return

        socketRef.current.emit('join:kitchen-station', stationId)

        return () => {
            socketRef.current?.emit('leave:kitchen-station', stationId)
        }
    }, [isConnected, stationId])

    // Join table room
    useEffect(() => {
        if (!isConnected || !tableId || !socketRef.current) return

        socketRef.current.emit('join:table', tableId)

        return () => {
            socketRef.current?.emit('leave:table', tableId)
        }
    }, [isConnected, tableId])

    // Subscribe to events
    const on = useCallback(<K extends keyof ServerToClientEvents>(
        event: K,
        handler: ServerToClientEvents[K]
    ) => {
        socketRef.current?.on(event, handler as any)
        return () => {
            socketRef.current?.off(event, handler as any)
        }
    }, [])

    // Emit events
    const emit = useCallback(<K extends keyof ClientToServerEvents>(
        event: K,
        ...args: Parameters<ClientToServerEvents[K]>
    ) => {
        socketRef.current?.emit(event, ...args)
    }, [])

    return {
        socket: socketRef.current,
        isConnected,
        connectionError,
        on,
        emit,
    }
}

// Kitchen-specific hook
export function useKitchenSocket(stationId: string, locationId: string) {
    const { socket, isConnected, on, emit } = useSocket({
        stationId,
        locationId,
    })

    const viewOrder = useCallback((kitchenOrderId: string) => {
        emit('kitchen:view-order', kitchenOrderId)
    }, [emit])

    const startOrder = useCallback((kitchenOrderId: string) => {
        emit('kitchen:start-order', kitchenOrderId)
    }, [emit])

    const completeItem = useCallback((kitchenOrderId: string, itemId: string) => {
        emit('kitchen:complete-item', { kitchenOrderId, itemId })
    }, [emit])

    const bumpOrder = useCallback((kitchenOrderId: string) => {
        emit('kitchen:bump-order', kitchenOrderId)
    }, [emit])

    return {
        socket,
        isConnected,
        on,
        viewOrder,
        startOrder,
        completeItem,
        bumpOrder,
    }
}

export default useSocket
