import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/inventory/recipes - List recipes
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const menuItemId = searchParams.get('menuItemId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: Record<string, unknown> = {}
        if (menuItemId) where.menuItemId = menuItemId

        const [recipes, total] = await Promise.all([
            prisma.recipe.findMany({
                where,
                include: {
                    menuItem: { select: { id: true, name: true, price: true, image: true } },
                    items: {
                        include: {
                            inventoryItem: {
                                select: { id: true, name: true, sku: true, unitOfMeasure: true, costPrice: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.recipe.count({ where })
        ])

        // Calculate cost for each recipe
        const recipesWithCost = recipes.map(recipe => {
            const totalCost = recipe.items.reduce((sum, item) => {
                const qty = Number(item.quantity)
                const cost = Number(item.inventoryItem.costPrice)
                const wastage = Number(item.wastagePercent) / 100
                return sum + (qty * cost * (1 + wastage))
            }, 0)
            return { ...recipe, calculatedCost: totalCost }
        })

        return NextResponse.json({
            recipes: recipesWithCost,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        })
    } catch (error) {
        console.error('Error fetching recipes:', error)
        return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
    }
}

// POST /api/inventory/recipes - Create recipe
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            menuItemId,
            yieldQty,
            yieldUnit,
            prepTime,
            cookTime,
            instructions,
            items // [{ inventoryItemId, quantity, unit, wastagePercent }]
        } = body

        if (!menuItemId) {
            return NextResponse.json({ error: 'menuItemId is required' }, { status: 400 })
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'At least one ingredient is required' }, { status: 400 })
        }

        // Check if recipe already exists for this menu item
        const existing = await prisma.recipe.findUnique({ where: { menuItemId } })
        if (existing) {
            return NextResponse.json(
                { error: 'Recipe already exists for this menu item. Use PATCH to update.' },
                { status: 400 }
            )
        }

        const recipe = await prisma.recipe.create({
            data: {
                menuItemId,
                yieldQty: yieldQty || 1,
                yieldUnit: yieldUnit || 'portion',
                prepTime,
                cookTime,
                instructions,
                items: {
                    create: items.map((item: { inventoryItemId: string; quantity: number; unit: string; wastagePercent?: number }) => ({
                        inventoryItemId: item.inventoryItemId,
                        quantity: item.quantity,
                        unit: item.unit,
                        wastagePercent: item.wastagePercent || 0
                    }))
                }
            },
            include: {
                menuItem: { select: { id: true, name: true } },
                items: {
                    include: {
                        inventoryItem: { select: { id: true, name: true, sku: true, costPrice: true } }
                    }
                }
            }
        })

        // Calculate and update menu item cost price
        const totalCost = recipe.items.reduce((sum, item) => {
            const qty = Number(item.quantity)
            const cost = Number(item.inventoryItem.costPrice)
            const wastage = Number(item.wastagePercent) / 100
            return sum + (qty * cost * (1 + wastage))
        }, 0)

        await prisma.menuItem.update({
            where: { id: menuItemId },
            data: { costPrice: totalCost, trackInventory: true }
        })

        return NextResponse.json({
            recipe: { ...recipe, calculatedCost: totalCost }
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating recipe:', error)
        return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
    }
}
