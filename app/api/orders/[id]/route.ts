import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  withErrorHandling,
  createErrorResponse,
} from '@/lib/validations/middleware'
import { uuidSchema } from '@/lib/validations/schemas'

// GET /api/orders/[id] - Get a single order
export const GET = withErrorHandling(
  async (_request: NextRequest, context: any) => {
    try {
      const { params } = context
      const id = params.id

      // Validate ID
      const validationResult = uuidSchema.safeParse(id)
      if (!validationResult.success) {
        return createErrorResponse('Invalid order ID', 400)
      }

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
      })

      if (!order) {
        return createErrorResponse('Order not found', 404)
      }

      // Parse dietary tags in menu items
      const formattedOrder = {
        ...order,
        orderItems: order.orderItems.map((item) => ({
          ...item,
          menuItem: {
            ...item.menuItem,
            dietaryTags: JSON.parse(item.menuItem.dietaryTags),
          },
        })),
      }

      return NextResponse.json(formattedOrder)
    } catch (error) {
      console.error('Error fetching order:', error)
      return createErrorResponse('Failed to fetch order', 500)
    }
  }
)
