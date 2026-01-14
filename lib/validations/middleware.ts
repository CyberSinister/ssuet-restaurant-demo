import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'

// ============================================================================
// Error Response Types
// ============================================================================

export interface ValidationErrorResponse {
  error: string
  details?: Array<{
    field: string
    message: string
  }>
}

export interface ErrorResponse {
  error: string
  details?: unknown
}

// ============================================================================
// Error Formatting Utilities
// ============================================================================

/**
 * Formats Zod validation errors into a user-friendly structure
 */
export function formatZodError(error: ZodError): ValidationErrorResponse {
  const details = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))

  return {
    error: 'Validation failed',
    details,
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number,
  details?: unknown
): NextResponse<ErrorResponse> {
  const body: ErrorResponse = { error: message }
  if (details !== undefined) {
    body.details = details
  }
  return NextResponse.json(body, { status })
}

// ============================================================================
// Validation Middleware
// ============================================================================

/**
 * Validates request body against a Zod schema
 * Returns validated data or throws a formatted error response
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = formatZodError(error)
      console.error('Validation Error:', JSON.stringify(formattedError, null, 2))
      throw createErrorResponse('Validation failed', 400, formattedError.details)
    }
    if (error instanceof SyntaxError) {
      throw createErrorResponse('Invalid JSON in request body', 400)
    }
    throw createErrorResponse('Failed to parse request body', 400)
  }
}

/**
 * Validates query parameters against a Zod schema
 * Returns validated data or throws a formatted error response
 */
export function validateQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  try {
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string | string[]> = {}

    // Convert URLSearchParams to object
    searchParams.forEach((value, key) => {
      if (params[key]) {
        // Handle multiple values for the same key
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value)
        } else {
          params[key] = [params[key] as string, value]
        }
      } else {
        params[key] = value
      }
    })

    return schema.parse(params)
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = formatZodError(error)
      throw createErrorResponse('Invalid query parameters', 400, formattedError.details)
    }
    throw createErrorResponse('Failed to parse query parameters', 400)
  }
}

/**
 * Validates path parameters against a Zod schema
 * Returns validated data or throws a formatted error response
 */
export function validateParams<T extends z.ZodType>(
  params: Record<string, string | string[]>,
  schema: T
): z.infer<T> {
  try {
    return schema.parse(params)
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = formatZodError(error)
      throw createErrorResponse('Invalid path parameters', 400, formattedError.details)
    }
    throw createErrorResponse('Failed to parse path parameters', 400)
  }
}

// ============================================================================
// Higher-Order Functions for Route Handlers
// ============================================================================

/**
 * Type for Next.js route handler
 */
type RouteHandler = (
  request: NextRequest,
  context: any
) => Promise<NextResponse> | NextResponse

/**
 * Wraps a route handler with automatic error handling
 * Catches errors thrown by validation and returns formatted responses
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      // If error is already a NextResponse (from validation), return it
      if (error instanceof NextResponse) {
        return error
      }

      // Handle unexpected errors
      console.error('Unexpected error in route handler:', error)
      return createErrorResponse('Internal server error', 500)
    }
  }
}

/**
 * Wraps a route handler with body validation
 */
export function withBodyValidation<T extends z.ZodType>(
  schema: T,
  handler: (request: NextRequest, validatedBody: z.infer<T>) => Promise<NextResponse>
): RouteHandler {
  return withErrorHandling(async (request) => {
    const validatedBody = await validateBody(request, schema)
    return handler(request, validatedBody)
  })
}

/**
 * Wraps a route handler with query validation
 */
export function withQueryValidation<T extends z.ZodType>(
  schema: T,
  handler: (request: NextRequest, validatedQuery: z.infer<T>) => Promise<NextResponse>
): RouteHandler {
  return withErrorHandling(async (request) => {
    const validatedQuery = validateQuery(request, schema)
    return handler(request, validatedQuery)
  })
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Wraps a route handler with authentication check
 * Requires the user to be authenticated
 */
export function withAuth(handler: RouteHandler): RouteHandler {
  return withErrorHandling(async (request, context) => {
    const { auth } = await import('@/lib/auth/config')
    const session = await auth()

    if (!session) {
      return createErrorResponse('Unauthorized', 401)
    }

    return handler(request, context)
  })
}

/**
 * Wraps a route handler with authentication and body validation
 */
export function withAuthAndBodyValidation<T extends z.ZodType>(
  schema: T,
  handler: (request: NextRequest, validatedBody: z.infer<T>) => Promise<NextResponse>
): RouteHandler {
  return withAuth(async (request) => {
    const validatedBody = await validateBody(request, schema)
    return handler(request, validatedBody)
  })
}

/**
 * Wraps a route handler with authentication and query validation
 */
export function withAuthAndQueryValidation<T extends z.ZodType>(
  schema: T,
  handler: (request: NextRequest, validatedQuery: z.infer<T>) => Promise<NextResponse>
): RouteHandler {
  return withAuth(async (request) => {
    const validatedQuery = validateQuery(request, schema)
    return handler(request, validatedQuery)
  })
}
