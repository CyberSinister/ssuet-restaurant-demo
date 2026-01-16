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
        subtotal += Number(menuItem.price) * item.quantity
      }

      // Get restaurant settings for tax rate and delivery fee
      const settings = await prisma.restaurantSettings.findFirst()
      if (!settings) {
        return createErrorResponse('Restaurant settings not found', 500)
      }

      const tax = subtotal * Number(settings.taxRate)
      const deliveryFee = orderType === 'DELIVERY' ? Number(settings.deliveryFee) : 0
      const total = subtotal + tax + deliveryFee

      // Validate minimum order for delivery
      if (orderType === 'DELIVERY' && subtotal < Number(settings.minimumOrder)) {
        return createErrorResponse(
          `Minimum order amount is $${Number(settings.minimumOrder).toFixed(2)}`,
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

      // Get default location for online orders
      const defaultLocation = await prisma.location.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      })

      if (!defaultLocation) {
        return createErrorResponse('No active location found', 500)
      }

      // Generate order number
      const orderCount = await prisma.order.count()
      const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`

      // Create order with order items
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          locationId: defaultLocation.id,
          orderType,
          orderSource: 'WEBSITE',
          deliveryAddress: address,
          subtotal,
          taxAmount: tax,
          total,
          notes,
          status: 'PENDING',
          orderItems: {
            create: items.map((item) => {
              const menuItem = menuItemMap.get(item.menuItemId)!
              const unitPrice = Number(menuItem.price)
              const totalPrice = unitPrice * item.quantity
              return {
                menuItemId: item.menuItemId,
                name: menuItem.name,
                quantity: item.quantity,
                unitPrice: menuItem.price,
                totalPrice: totalPrice,
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
