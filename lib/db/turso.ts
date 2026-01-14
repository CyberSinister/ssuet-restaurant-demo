import { createClient } from '@libsql/client'

// Turso client for use with Prisma in production
// This is for when you want to use Turso as your database provider
export function createTursoClient() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }

  // Only use auth token if it's a remote Turso database
  const isRemote = url.startsWith('libsql://') || url.startsWith('https://')

  return createClient({
    url,
    authToken: isRemote ? authToken : undefined,
  })
}

// Example usage for direct queries (if needed outside Prisma)
export const tursoClient = process.env.DATABASE_URL?.startsWith('libsql://')
  ? createTursoClient()
  : null
