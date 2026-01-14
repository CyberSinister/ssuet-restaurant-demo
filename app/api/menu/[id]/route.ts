import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  withAuth,
  withErrorHandling,
  validateBody,
  createErrorResponse,
} from '@/lib/validations/middleware'
import { menuItemUpdateSchema, uuidSchema } from '@/lib/validations/schemas'

// GET /api/menu/[id] - Get a single menu item
export const GET = withErrorHandling(
  async (request: NextRequest, context: any) => {
    try {
      const { params } = context
      const id = params.id

      // Validate ID
      const validationResult = uuidSchema.safeParse(id)
      if (!validationResult.success) {
        return createErrorResponse('Invalid menu item ID', 400)
      }

      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
        include: {
          category: true,
        },
      })

      if (!menuItem) {
        return createErrorResponse('Menu item not found', 404)
      }

      return NextResponse.json({
        ...menuItem,
        dietaryTags: JSON.parse(menuItem.dietaryTags),
      })
    } catch (error) {
      console.error('Error fetching menu item:', error)
      return createErrorResponse('Failed to fetch menu item', 500)
    }
  }
)

// PUT /api/menu/[id] - Update a menu item (admin only)
export const PUT = withAuth(
  async (request: NextRequest, context: any) => {
    try {
      const { params } = context
      const id = params.id

      // Validate ID
      const idValidation = uuidSchema.safeParse(id)
      if (!idValidation.success) {
        return createErrorResponse('Invalid menu item ID', 400)
      }

      // Validate body
      const validatedBody = await validateBody(request, menuItemUpdateSchema)

      // Check if menu item exists
      const existingItem = await prisma.menuItem.findUnique({
        where: { id },
      })

      if (!existingItem) {
        return createErrorResponse('Menu item not found', 404)
      }

      // If categoryId is being updated, verify new category exists
      if (validatedBody.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: validatedBody.categoryId },
        })

        if (!category) {
          return createErrorResponse('Category not found', 404)
        }
      }

      // Update menu item
      const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: {
          ...(validatedBody.name && { name: validatedBody.name }),
          ...(validatedBody.description && { description: validatedBody.description }),
          ...(validatedBody.price !== undefined && { price: validatedBody.price }),
          ...(validatedBody.categoryId && { categoryId: validatedBody.categoryId }),
          ...(validatedBody.image && { image: validatedBody.image }),
          ...(validatedBody.dietaryTags && {
            dietaryTags: JSON.stringify(validatedBody.dietaryTags),
          }),
          ...(validatedBody.available !== undefined && { available: validatedBody.available }),
        },
        include: {
          category: true,
        },
      })

      return NextResponse.json({
        ...updatedItem,
        dietaryTags: JSON.parse(updatedItem.dietaryTags),
      })
    } catch (error) {
      // Handle validation errors from middleware
      if (error instanceof NextResponse) {
        return error
      }
      console.error('Error updating menu item:', error)
      return createErrorResponse('Failed to update menu item', 500)
    }
  }
)

// DELETE /api/menu/[id] - Delete a menu item (admin only)
export const DELETE = withAuth(
  async (request: NextRequest, context: any) => {
    try {
      const { params } = context
      const id = params.id

      // Validate ID
      const validationResult = uuidSchema.safeParse(id)
      if (!validationResult.success) {
        return createErrorResponse('Invalid menu item ID', 400)
      }

      // Check if menu item exists
      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
      })

      if (!menuItem) {
        return createErrorResponse('Menu item not found', 404)
      }

      // Check if menu item is used in any orders
      const orderItemsCount = await prisma.orderItem.count({
        where: { menuItemId: id },
      })

      if (orderItemsCount > 0) {
        // Instead of hard deleting (which would break history), 
        // we mark it as isDeleted: true. 
        // Our GET APIs now filter these out so they "disappear" from the UI.
        await prisma.menuItem.update({
          where: { id },
          data: { 
            available: false,
            isDeleted: true 
          },
        })

        return NextResponse.json({
          message: 'Menu item deleted successfully',
        })
      }

      // Delete menu item completely if no history
      await prisma.menuItem.delete({
        where: { id },
      })

      return NextResponse.json({
        message: 'Menu item deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting menu item:', error)
      return createErrorResponse('Failed to delete menu item', 500)
    }
  }
)
