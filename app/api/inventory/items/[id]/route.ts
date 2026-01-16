import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/inventory/items/[id] - Get single inventory item
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const item = await prisma.inventoryItem.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true } },
                preferredSupplier: { select: { id: true, name: true, code: true } },
                supplierItems: {
                    include: {
                        supplier: { select: { id: true, name: true, code: true } }
                    }
                },
                locationStock: {
                    include: {
                        location: { select: { id: true, name: true, code: true } }
                    }
                },
                lots: {
                    where: { status: 'AVAILABLE' },
                    take: 10,
                    orderBy: { expiryDate: 'asc' }
                },
                recipeItems: {
                    include: {
                        recipe: {
                            include: {
                                menuItem: { select: { id: true, name: true } }
                            }
                        }
                    }
                }
            }
        })

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }

        return NextResponse.json({ item })
    } catch (error) {
        console.error('Error fetching inventory item:', error)
        return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 })
    }
}

// PATCH /api/inventory/items/[id] - Update inventory item
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.inventoryItem.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }

        const {
            name, description, categoryId, unitOfMeasure, conversionUnit, conversionRate,
            minimumStock, maximumStock, reorderPoint, reorderQuantity,
            costPrice, trackLots, trackExpiry, defaultShelfLife,
            storageLocation, storageTemp, barcode, isActive, isPerishable,
            preferredSupplierId
        } = body

        const item = await prisma.inventoryItem.update({
            where: { id },
            data: {
                name,
                description,
                categoryId,
                unitOfMeasure,
                conversionUnit,
                conversionRate,
                minimumStock,
                maximumStock,
                reorderPoint,
                reorderQuantity,
                costPrice,
                trackLots,
                trackExpiry,
                defaultShelfLife,
                storageLocation,
                storageTemp,
                barcode,
                isActive,
                isPerishable,
                preferredSupplierId
            },
            include: {
                category: { select: { id: true, name: true } },
                preferredSupplier: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json({ item })
    } catch (error: unknown) {
        console.error('Error updating inventory item:', error)
        const prismaError = error as { code?: string }
        if (prismaError.code === 'P2002') {
            return NextResponse.json(
                { error: 'SKU or barcode already exists' },
                { status: 400 }
            )
        }
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
    }
}

// DELETE /api/inventory/items/[id] - Soft delete inventory item
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const existing = await prisma.inventoryItem.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }

        // Soft delete by setting isActive to false
        await prisma.inventoryItem.update({
            where: { id },
            data: { isActive: false }
        })

        return NextResponse.json({ message: 'Item deleted successfully' })
    } catch (error) {
        console.error('Error deleting inventory item:', error)
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
    }
}
