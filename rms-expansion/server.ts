/**
 * Custom Next.js Server with Socket.IO
 * 
 * Run with: 
 *   Development: npx tsx server.ts
 *   Production: node dist/server.js
 * 
 * This integrates Socket.IO with the Next.js server on the same port.
 */

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initializeSocketServer } from './lib/realtime/socket-server'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

async function main() {
  // Initialize Next.js
  const app = next({ dev, hostname, port })
  const handle = app.getRequestHandler()

  await app.prepare()

  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Initialize Socket.IO server
  const socketServer = initializeSocketServer(httpServer)
  await socketServer.initialize()

  // Make socket server available globally for API routes
  ;(global as any).socketServer = socketServer

  // Start listening
  httpServer.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🍕 Restaurant Management System                              ║
║                                                                ║
║   > Ready on http://${hostname}:${port}                              ║
║   > Socket.IO ready                                            ║
║   > Environment: ${dev ? 'development' : 'production'}                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `)
  })

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...')
    await socketServer.close()
    httpServer.close(() => {
      console.log('✅ Server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
