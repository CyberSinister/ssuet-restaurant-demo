import { NextRequest, NextResponse } from 'next/server'
import {
  withAuthAndBodyValidation,
  withErrorHandling,
  createErrorResponse,
} from '@/lib/validations/middleware'
import { categorySchema, type CategoryInput } from '@/lib/validations/schemas'

// GET /api/categories - Get all categories
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { prisma } = await import('@/lib/db/prisma')
  try {
    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const includeItems = searchParams.get('includeItems') === 'true'

    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { active: true },
      include: includeItems
        ? {
          menuItems: {
            where: includeInactive ? {} : { available: true },
          },
          _count: {
            select: { menuItems: true },
          },
        }
        : {
          _count: {
            select: { menuItems: true },
          },
        },
      orderBy: { displayOrder: 'asc' },
    })

    // Parse dietary tags if menu items are included
    const formattedCategories = includeItems
      ? categories.map((category) => ({
        ...category,
        menuItems: 'menuItems' in category
          ? (category as any).menuItems.map((item: any) => ({
            ...item,
            dietaryTags: JSON.parse(item.dietaryTags),
          }))
          : undefined,
      }))
      : categories

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return createErrorResponse('Failed to fetch categories', 500)
  }
})

// POST /api/categories - Create a new category (admin only)
export const POST = withAuthAndBodyValidation(
  categorySchema,
  async (_request: NextRequest, validatedBody: CategoryInput) => {
    const { prisma } = await import('@/lib/db/prisma')
    try {
      const { name, description, displayOrder, active } = validatedBody

      // Check if displayOrder is already in use
      const existingCategory = await prisma.category.findFirst({
        where: { displayOrder },
      })

      if (existingCategory) {
        // Shift all categories at or after this displayOrder
        await prisma.category.updateMany({
          where: { displayOrder: { gte: displayOrder } },
          data: { displayOrder: { increment: 1 } },
        })
      }

      // Create category
      const category = await prisma.category.create({
        data: {
          name,
          description,
          displayOrder,
          active,
        },
        include: {
          _count: {
            select: { menuItems: true },
          },
        },
      })

      return NextResponse.json(category, { status: 201 })
    } catch (error) {
      console.error('Error creating category:', error)
      return createErrorResponse('Failed to create category', 500)
    }
  }
)
