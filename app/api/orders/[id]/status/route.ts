import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  withAuth,
  validateBody,
  createErrorResponse,
} from '@/lib/validations/middleware'
import {
  orderUpdateSchema,
  uuidSchema,
} from '@/lib/validations/schemas'

// PUT /api/orders/[id]/status - Update order status (admin only)
export const PUT = withAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const id = params.id

      // Validate body
      const validatedBody = await validateBody(request, orderUpdateSchema)

      // Validate ID
      const idValidation = uuidSchema.safeParse(id)
      if (!idValidation.success) {
        return createErrorResponse('Invalid order ID', 400)
      }

      const { status } = validatedBody

      // Check if order exists
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
        },
      })

      if (!existingOrder) {
        return createErrorResponse('Order not found', 404)
      }

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PREPARING', 'CANCELLED'],
        PREPARING: ['READY', 'CANCELLED'],
        READY: ['SERVED', 'COMPLETED', 'CANCELLED'],
        SERVED: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [], // Cannot transition from completed
        CANCELLED: [], // Cannot transition from cancelled
      }

      const allowedStatuses = validTransitions[existingOrder.status]
      if (!allowedStatuses.includes(status)) {
        return createErrorResponse(
          `Cannot transition from ${existingOrder.status} to ${status}`,
          400
        )
      }

      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          customer: true,
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
      })

      // TODO: Send status update email notification to customer
      // This can be implemented based on the email service

      return NextResponse.json(updatedOrder)
    } catch (error) {
      // Handle validation errors from middleware
      if (error instanceof NextResponse) {
        return error
      }
      console.error('Error updating order status:', error)
      return createErrorResponse('Failed to update order status', 500)
    }
  }
)
