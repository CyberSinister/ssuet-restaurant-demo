import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple in-memory rate limiter for API routes
 * For production, use Redis-based rate limiting with @upstash/ratelimit
 */

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Maximum requests per interval
}

interface RateLimitStore {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitStore>()

// Default rate limits
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  AUTH: {
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // Public API endpoints - moderate limits
  PUBLIC: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Admin endpoints - more generous limits
  ADMIN: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
  },
  // Order creation - moderate limits to prevent spam
  ORDER: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 orders per minute
  },
} as const

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): { success: boolean; response?: NextResponse } => {
    const ip = getClientIp(request)
    const key = `${ip}:${request.nextUrl.pathname}`
    const now = Date.now()

    const record = store.get(key)

    // If no record exists or reset time has passed, create new record
    if (!record || now > record.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + config.interval,
      })
      return { success: true }
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': record.resetTime.toString(),
            },
          }
        ),
      }
    }

    // Increment counter
    record.count++
    store.set(key, record)

    return { success: true }
  }
}

// Cleanup old entries periodically
setInterval(
  () => {
    const now = Date.now()
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key)
      }
    }
  },
  5 * 60 * 1000
) // Clean up every 5 minutes

// Rate limiter middleware factory
export function createRateLimiter(config: RateLimitConfig) {
  const limiter = rateLimit(config)

  return async (request: NextRequest): Promise<NextResponse | undefined> => {
    const result = limiter(request)
    if (!result.success && result.response) {
      return result.response
    }
    return undefined
  }
}

// Pre-configured rate limiters
export const authRateLimiter = createRateLimiter(RATE_LIMITS.AUTH)
export const publicRateLimiter = createRateLimiter(RATE_LIMITS.PUBLIC)
export const adminRateLimiter = createRateLimiter(RATE_LIMITS.ADMIN)
export const orderRateLimiter = createRateLimiter(RATE_LIMITS.ORDER)
