import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

/**
 * Optimized database queries with proper field selection and indexing
 */

// Menu queries with optimized field selection
export async function getActiveMenuItems() {
  return prisma.menuItem.findMany({
    where: { available: true },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      categoryId: true,
      image: true,
      dietaryTags: true,
      available: true,
      category: {
        select: {
          id: true,
          name: true,
          active: true,
        },
      },
    },
    orderBy: [
      { category: { displayOrder: 'asc' } },
      { name: 'asc' },
    ],
  })
}

export async function getMenuItemById(id: string) {
  return prisma.menuItem.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      categoryId: true,
      image: true,
      dietaryTags: true,
      available: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

export async function getMenuItemsByCategory(categoryId: string) {
  return prisma.menuItem.findMany({
    where: {
      categoryId,
      available: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      categoryId: true,
      image: true,
      dietaryTags: true,
      available: true,
    },
    orderBy: { name: 'asc' },
  })
}

// Category queries
export async function getActiveCategories() {
  return prisma.category.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      description: true,
      displayOrder: true,
      active: true,
    },
    orderBy: { displayOrder: 'asc' },
  })
}

export async function getAllCategories() {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      displayOrder: true,
      active: true,
      _count: {
        select: { menuItems: true },
      },
    },
    orderBy: { displayOrder: 'asc' },
  })
}

// Order queries with pagination
export interface OrderQueryOptions {
  page?: number
  limit?: number
  status?: string
  customerId?: string
}

export async function getOrdersPaginated(options: OrderQueryOptions = {}) {
  const { page = 1, limit = 20, status, customerId } = options
  const skip = (page - 1) * limit

  const where: Prisma.OrderWhereInput = {}
  if (status) where.status = status
  if (customerId) where.customerId = customerId

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        customerId: true,
        orderType: true,
        status: true,
        address: true,
        subtotal: true,
        tax: true,
        total: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          select: {
            id: true,
            menuItemId: true,
            quantity: true,
            price: true,
            specialInstructions: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  }
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
            },
          },
        },
      },
    },
  })
}

export async function getRecentOrders(limit = 10) {
  return prisma.order.findMany({
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
      customer: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

// Customer queries
export async function getOrCreateCustomer(data: {
  name: string
  email: string
  phone: string
  password?: string
}) {
  // Try to find existing customer by email or phone
  const existing = await prisma.customer.findFirst({
    where: {
      OR: [{ email: data.email }, { phone: data.phone }],
    },
  })

  if (existing) {
    // Update customer info if changed
    return prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    })
  }

  // Create new customer
  return prisma.customer.create({
    data: {
      ...data,
      password: data.password || 'GUEST_USER_PLACEHOLDER_PASSWORD'
    },
  })
}

// Settings queries
export async function getRestaurantSettings() {
  const settings = await prisma.restaurantSettings.findFirst({
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      hours: true,
      deliveryFee: true,
      minimumOrder: true,
      taxRate: true,
    },
  })

  return settings
}

export async function getSMTPConfig() {
  return prisma.sMTPConfig.findFirst({
    select: {
      id: true,
      host: true,
      port: true,
      secure: true,
      username: true,
      fromEmail: true,
      fromName: true,
      enabled: true,
    },
  })
}

// Stats queries with efficient aggregation
export async function getOrderStats(startDate?: Date, endDate?: Date) {
  const where: Prisma.OrderWhereInput = {}
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [stats, statusCounts] = await Promise.all([
    prisma.order.aggregate({
      where,
      _count: true,
      _sum: {
        total: true,
      },
      _avg: {
        total: true,
      },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
  ])

  return {
    totalOrders: stats._count,
    totalRevenue: stats._sum.total || 0,
    averageOrderValue: stats._avg.total || 0,
    ordersByStatus: statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count
        return acc
      },
      {} as Record<string, number>
    ),
  }
}
