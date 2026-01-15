import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { sendOrderConfirmationEmail } from '@/lib/email/service'
import {
  withBodyValidation,
  withQueryValidation,
  createErrorResponse,
} from '@/lib/validations/middleware'
import {
  orderCreateSchema,
  orderQuerySchema,
  type OrderCreateInput,
  type OrderQueryInput,
} from '@/lib/validations/schemas'

// POST /api/orders - Create a new order
export const POST = withBodyValidation(
  orderCreateSchema,
  async (_request: NextRequest, validatedBody: OrderCreateInput) => {
    try {
      const {
        items,
        customerName,
        customerEmail,
        customerPhone,
        orderType,
        address,
        notes,
      } = validatedBody

      // Fetch menu items to calculate prices
      const menuItemIds = items.map((item) => item.menuItemId)
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: { in: menuItemIds },
          available: true,
        },
      })

      // Verify all items exist and are available
      if (menuItems.length !== menuItemIds.length) {
        return createErrorResponse('One or more menu items are not available', 400)
      }

      // Create a map for quick lookup
      const menuItemMap = new Map(menuItems.map((item) => [item.id, item]))

      // Calculate order totals
      let subtotal = 0
      for (const item of items) {
        const menuItem = menuItemMap.get(item.menuItemId)
        if (!menuItem) {
          return createErrorResponse(`Menu item ${item.menuItemId} not found`, 400)
        }
        subtotal += menuItem.price * item.quantity
      }

      // Get restaurant settings for tax rate and delivery fee
      const settings = await prisma.restaurantSettings.findFirst()
      if (!settings) {
        return createErrorResponse('Restaurant settings not found', 500)
      }

      const tax = subtotal * settings.taxRate
      const deliveryFee = orderType === 'delivery' ? settings.deliveryFee : 0
      const total = subtotal + tax + deliveryFee

      // Validate minimum order for delivery
      if (orderType === 'delivery' && subtotal < settings.minimumOrder) {
        return createErrorResponse(
          `Minimum order amount is $${settings.minimumOrder.toFixed(2)}`,
          400
        )
      }

      // Handle Customer Creation/Update with Auto-Login Logic
      let customer = await prisma.customer.findUnique({
        where: { email: customerEmail },
      })

      let generatedPassword = ''

      if (!customer) {
        // Create new customer with generated password
        const { hash } = await import('bcryptjs')
        generatedPassword = Math.random().toString(36).slice(-8)
        const hashedPassword = await hash(generatedPassword, 12)

        customer = await prisma.customer.create({
          data: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            password: hashedPassword,
            address: address || '', // Store address if provided
          },
        })
      } else {
        // Update existing details if needed
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            name: customerName,
            phone: customerPhone,
            // Only update address if provided and not empty
            ...(address ? { address } : {}),
          },
        })
      }

      // Determine the pickup location (if implicit from notes or address hack, otherwise default)
      // Since we don't have explicit Branch ID yet, we'll assume the address field if provided for pickup is store loc
      // or just leave it generic. The UI sends address as undefined for pickup usually unless hacked.
      // But we can extract it if we passed it in payload differently.
      // For now, if orderType is pickup, address might be undefined.

      // Create order with order items
      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          orderType,
          address,
          subtotal,
          tax,
          total,
          notes,
          status: 'pending',
          orderItems: {
            create: items.map((item) => {
              const menuItem = menuItemMap.get(item.menuItemId)!
              return {
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: menuItem.price,
                specialInstructions: item.specialInstructions,
              }
            }),
          },
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
          customer: true,
        },
      })

      // Send confirmation email (fire and forget)
      sendOrderConfirmationEmail(customerEmail, {
        orderId: order.id,
        customerName,
        items: order.orderItems,
        total,
        orderType,
        address: address, // For delivery
        pickupLocation: undefined, // Add logic if we track branches
        generatedPassword: generatedPassword || undefined,
      }).catch((error) => console.error('Failed to send confirmation email:', error))

      return NextResponse.json(order, { status: 201 })
    } catch (error) {
      console.error('Error creating order:', error)
      return createErrorResponse('Failed to create order', 500)
    }
  }
)

// GET /api/orders - Get orders (with optional filtering)
export const GET = withQueryValidation(
  orderQuerySchema,
  async (_request: NextRequest, validatedQuery: OrderQueryInput) => {
    try {
      const { status, customerId, email, page, limit } = validatedQuery

      const where: any = {}
      if (status) where.status = status
      if (customerId) where.customerId = customerId
      if (email) where.customer = { email }

      // Calculate pagination
      const skip = (page - 1) * limit

      // Fetch orders with pagination
      const [orders, totalCount] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            customer: true,
            orderItems: {
              include: {
                menuItem: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ])

      return NextResponse.json({
        data: orders,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      })
    } catch (error) {
      console.error('Error fetching orders:', error)
      return createErrorResponse('Failed to fetch orders', 500)
    }
  }
)
