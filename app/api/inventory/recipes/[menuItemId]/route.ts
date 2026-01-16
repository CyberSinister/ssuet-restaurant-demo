import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ menuItemId: string }>
}

// GET /api/inventory/recipes/[menuItemId] - Get recipe for menu item
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { menuItemId } = await params

        const recipe = await prisma.recipe.findUnique({
            where: { menuItemId },
            include: {
                menuItem: { select: { id: true, name: true, price: true, image: true } },
                items: {
                    include: {
                        inventoryItem: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                unitOfMeasure: true,
                                costPrice: true,
                                currentStock: true
                            }
                        }
                    }
                }
            }
        })

        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
        }

        // Calculate cost and check availability
        let totalCost = 0
        const itemsWithAvailability = recipe.items.map(item => {
            const qty = Number(item.quantity)
            const cost = Number(item.inventoryItem.costPrice)
            const wastage = Number(item.wastagePercent) / 100
            const itemCost = qty * cost * (1 + wastage)
            totalCost += itemCost

            const available = Number(item.inventoryItem.currentStock)
            const canMake = Math.floor(available / qty)

            return {
                ...item,
                itemCost,
                available,
                canMake
            }
        })

        const maxPortions = Math.min(...itemsWithAvailability.map(i => i.canMake))

        return NextResponse.json({
            recipe: {
                ...recipe,
                items: itemsWithAvailability,
                calculatedCost: totalCost,
                maxPortions: maxPortions === Infinity ? 0 : maxPortions
            }
        })
    } catch (error) {
        console.error('Error fetching recipe:', error)
        return NextResponse.json({ error: 'Failed to fetch recipe' }, { status: 500 })
    }
}

// PATCH /api/inventory/recipes/[menuItemId] - Update recipe
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { menuItemId } = await params
        const body = await request.json()

        const existing = await prisma.recipe.findUnique({ where: { menuItemId } })
        if (!existing) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
        }

        const { yieldQty, yieldUnit, prepTime, cookTime, instructions, items } = body

        // Update recipe
        const updateData: Record<string, unknown> = {}
        if (yieldQty !== undefined) updateData.yieldQty = yieldQty
        if (yieldUnit) updateData.yieldUnit = yieldUnit
        if (prepTime !== undefined) updateData.prepTime = prepTime
        if (cookTime !== undefined) updateData.cookTime = cookTime
        if (instructions !== undefined) updateData.instructions = instructions

        // If items provided, replace all items
        if (items && Array.isArray(items)) {
            // Delete existing items
            await prisma.recipeItem.deleteMany({ where: { recipeId: existing.id } })

            // Create new items
            await prisma.recipeItem.createMany({
                data: items.map((item: { inventoryItemId: string; quantity: number; unit: string; wastagePercent?: number }) => ({
                    recipeId: existing.id,
                    inventoryItemId: item.inventoryItemId,
                    quantity: item.quantity,
                    unit: item.unit,
                    wastagePercent: item.wastagePercent || 0
                }))
            })
        }

        const recipe = await prisma.recipe.update({
            where: { menuItemId },
            data: updateData,
            include: {
                menuItem: { select: { id: true, name: true } },
                items: {
                    include: {
                        inventoryItem: { select: { id: true, name: true, costPrice: true } }
                    }
                }
            }
        })

        // Recalculate menu item cost
        const totalCost = recipe.items.reduce((sum, item) => {
            const qty = Number(item.quantity)
            const cost = Number(item.inventoryItem.costPrice)
            const wastage = Number(item.wastagePercent) / 100
            return sum + (qty * cost * (1 + wastage))
        }, 0)

        await prisma.menuItem.update({
            where: { id: menuItemId },
            data: { costPrice: totalCost }
        })

        return NextResponse.json({
            recipe: { ...recipe, calculatedCost: totalCost }
        })
    } catch (error) {
        console.error('Error updating recipe:', error)
        return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
    }
}

// DELETE /api/inventory/recipes/[menuItemId] - Delete recipe
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { menuItemId } = await params

        const existing = await prisma.recipe.findUnique({ where: { menuItemId } })
        if (!existing) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
        }

        await prisma.recipe.delete({ where: { menuItemId } })

        // Reset menu item inventory tracking
        await prisma.menuItem.update({
            where: { id: menuItemId },
            data: { trackInventory: false, costPrice: null }
        })

        return NextResponse.json({ message: 'Recipe deleted successfully' })
    } catch (error) {
        console.error('Error deleting recipe:', error)
        return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
    }
}
