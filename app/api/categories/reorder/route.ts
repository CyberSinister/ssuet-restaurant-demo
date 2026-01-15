import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  withAuthAndBodyValidation,
  createErrorResponse,
} from '@/lib/validations/middleware'
import {
  categoryReorderSchema,
  type CategoryReorderInput,
} from '@/lib/validations/schemas'

// PUT /api/categories/reorder - Reorder categories (admin only)
export const PUT = withAuthAndBodyValidation(
  categoryReorderSchema,
  async (_request: NextRequest, validatedBody: CategoryReorderInput) => {
    try {
      const { categories } = validatedBody

      // Verify all categories exist
      const categoryIds = categories.map((c) => c.id)
      const existingCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      })

      if (existingCategories.length !== categoryIds.length) {
        return createErrorResponse('One or more categories not found', 404)
      }

      // Check for duplicate display orders
      const displayOrders = categories.map((c) => c.displayOrder)
      const uniqueDisplayOrders = new Set(displayOrders)
      if (uniqueDisplayOrders.size !== displayOrders.length) {
        return createErrorResponse('Duplicate display orders are not allowed', 400)
      }

      // Update all categories in a transaction
      await prisma.$transaction(
        categories.map((category) =>
          prisma.category.update({
            where: { id: category.id },
            data: { displayOrder: category.displayOrder },
          })
        )
      )

      // Fetch updated categories
      const updatedCategories = await prisma.category.findMany({
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: {
            select: { menuItems: true },
          },
        },
      })

      return NextResponse.json({
        message: 'Categories reordered successfully',
        categories: updatedCategories,
      })
    } catch (error) {
      console.error('Error reordering categories:', error)
      return createErrorResponse('Failed to reorder categories', 500)
    }
  }
)
