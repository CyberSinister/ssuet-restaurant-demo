import { NextRequest, NextResponse } from 'next/server'
import {
  withAuthAndBodyValidation,
  withErrorHandling,
  createErrorResponse,
} from '@/lib/validations/middleware'
import { menuItemSchema, type MenuItemInput } from '@/lib/validations/schemas'

// GET /api/menu - Get all menu items (flat list for customer view)
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { prisma } = await import('@/lib/db/prisma')
  try {
    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const grouped = searchParams.get('grouped') === 'true'

    // If grouped=true, return categories with nested menu items (for admin)
    if (grouped) {
      const categories = await prisma.category.findMany({
        where: includeInactive ? {} : { active: true },
        include: {
          menuItems: {
            where: {
              isDeleted: false,
              ...(includeInactive ? {} : { available: true }),
            },
          },
        },
        orderBy: { displayOrder: 'asc' },
      })

      const formattedCategories = categories.map((category) => ({
        ...category,
        menuItems: category.menuItems.map((item) => ({
          ...item,
          dietaryTags: JSON.parse(item.dietaryTags),
        })),
      }))

      return NextResponse.json(formattedCategories)
    }

    // Default: Return flat list of menu items (for customer view)
    const activeCategories = await prisma.category.findMany({
      where: includeInactive ? {} : { active: true },
      select: { id: true },
    })
    const activeCategoryIds = activeCategories.map((c) => c.id)

    const menuItems = await prisma.menuItem.findMany({
      where: {
        isDeleted: false,
        ...(includeInactive ? {} : { available: true }),
        categoryId: { in: activeCategoryIds },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Parse JSON strings in dietary tags
    const formattedItems = menuItems.map((item) => ({
      ...item,
      dietaryTags: JSON.parse(item.dietaryTags),
    }))

    return NextResponse.json(formattedItems)
  } catch (error) {
    console.error('Error fetching menu:', error)
    return createErrorResponse('Failed to fetch menu', 500)
  }
})

// POST /api/menu - Create a new menu item (admin only)
export const POST = withAuthAndBodyValidation(
  menuItemSchema,
  async (_request: NextRequest, validatedBody: MenuItemInput) => {
    const { prisma } = await import('@/lib/db/prisma')
    try {
      const { name, description, price, categoryId, image, dietaryTags, available } =
        validatedBody

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        return createErrorResponse('Category not found', 404)
      }

      // Create menu item
      const menuItem = await prisma.menuItem.create({
        data: {
          name,
          description,
          price,
          categoryId,
          image,
          dietaryTags: JSON.stringify(dietaryTags),
          available,
        },
        include: {
          category: true,
        },
      })

      // Return with parsed dietary tags
      return NextResponse.json(
        {
          ...menuItem,
          dietaryTags: JSON.parse(menuItem.dietaryTags),
        },
        { status: 201 }
      )
    } catch (error) {
      console.error('Error creating menu item:', error)
      return createErrorResponse('Failed to create menu item', 500)
    }
  }
)
