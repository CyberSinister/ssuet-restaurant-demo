import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  withAuth,
  withErrorHandling,
  validateBody,
  createErrorResponse,
} from '@/lib/validations/middleware'
import { categoryUpdateSchema, uuidSchema } from '@/lib/validations/schemas'

// GET /api/categories/[id] - Get a single category
export const GET = withErrorHandling(
  async (request: NextRequest, context: any) => {
    try {
      const { params } = context
      const id = params.id

      // Validate ID
      const validationResult = uuidSchema.safeParse(id)
      if (!validationResult.success) {
        return createErrorResponse('Invalid category ID', 400)
      }

      const searchParams = request.nextUrl.searchParams
      const includeItems = searchParams.get('includeItems') === 'true'

      const category = await prisma.category.findUnique({
        where: { id },
        include: includeItems
          ? {
            menuItems: true,
            _count: {
              select: { menuItems: true },
            },
          }
          : {
            _count: {
              select: { menuItems: true },
            },
          },
      })

      if (!category) {
        return createErrorResponse('Category not found', 404)
      }

      return NextResponse.json(category)
    } catch (error) {
      console.error('Error fetching category:', error)
      return createErrorResponse('Failed to fetch category', 500)
    }
  }
)

// PUT /api/categories/[id] - Update a category (admin only)
export const PUT = withAuth(
  async (request: NextRequest, context: any) => {
    try {
      const { params } = context
      const id = params.id

      // Validate ID
      const idValidation = uuidSchema.safeParse(id)
      if (!idValidation.success) {
        return createErrorResponse('Invalid category ID', 400)
      }

      // Validate body
      const validatedBody = await validateBody(request, categoryUpdateSchema)

      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id },
      })

      if (!existingCategory) {
        return createErrorResponse('Category not found', 404)
      }

      // If displayOrder is being updated, handle reordering
      if (validatedBody.displayOrder && validatedBody.displayOrder !== existingCategory.displayOrder) {
        const oldOrder = existingCategory.displayOrder
        const newOrder = validatedBody.displayOrder

        if (newOrder > oldOrder) {
          // Moving down: decrement categories between old and new positions
          await prisma.category.updateMany({
            where: {
              displayOrder: { gt: oldOrder, lte: newOrder },
              id: { not: id },
            },
            data: { displayOrder: { decrement: 1 } },
          })
        } else {
          // Moving up: increment categories between new and old positions
          await prisma.category.updateMany({
            where: {
              displayOrder: { gte: newOrder, lt: oldOrder },
              id: { not: id },
            },
            data: { displayOrder: { increment: 1 } },
          })
        }
      }

      // Update category
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          ...(validatedBody.name && { name: validatedBody.name }),
          ...(validatedBody.description && { description: validatedBody.description }),
          ...(validatedBody.displayOrder !== undefined && { displayOrder: validatedBody.displayOrder }),
          ...(validatedBody.active !== undefined && { active: validatedBody.active }),
        },
        include: {
          _count: {
            select: { menuItems: true },
          },
        },
      })

      return NextResponse.json(updatedCategory)
    } catch (error) {
      // Handle validation errors from middleware
      if (error instanceof NextResponse) {
        return error
      }
      console.error('Error updating category:', error)
      return createErrorResponse('Failed to update category', 500)
    }
  }
)

// DELETE /api/categories/[id] - Delete a category (admin only)
export const DELETE = withAuth(
  async (_request: NextRequest, context: any) => {
    try {
      const { params } = context
      const id = params.id

      // Validate ID
      const validationResult = uuidSchema.safeParse(id)
      if (!validationResult.success) {
        return createErrorResponse('Invalid category ID', 400)
      }

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { menuItems: true },
          },
        },
      })

      if (!category) {
        return createErrorResponse('Category not found', 404)
      }

      // Check if category has menu items
      if (category._count.menuItems > 0) {
        return createErrorResponse(
          `Cannot delete category with ${category._count.menuItems} menu items. Please move or delete the items first.`,
          400
        )
      }

      // Delete category
      await prisma.category.delete({
        where: { id },
      })

      // Reorder remaining categories to fill the gap
      await prisma.category.updateMany({
        where: { displayOrder: { gt: category.displayOrder } },
        data: { displayOrder: { decrement: 1 } },
      })

      return NextResponse.json({
        message: 'Category deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting category:', error)
      return createErrorResponse('Failed to delete category', 500)
    }
  }
)
