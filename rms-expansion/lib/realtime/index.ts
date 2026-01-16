// Real-time module exports

export { RMSSocketServer, initializeSocketServer, getSocketServer } from './socket-server'
export { 
  useSocket, 
  useSocketEvent, 
  useSocketEvents,
  useKitchenSocket,
  useLocationSocket,
  useTableSocket,
  useInventoryAlerts,
} from './use-socket'

export type { 
  ServerToClientEvents, 
  ClientToServerEvents,
  SocketData,
} from './socket-server'
