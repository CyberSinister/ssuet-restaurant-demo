import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Utility to generate movement number
function generateMovementNumber(): string {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `MOV-${dateStr}-${random}`
}

// POST /api/inventory/stock/adjust - Adjust stock levels
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            inventoryItemId,
            locationId,
            quantity, // Positive for add, negative for subtract
            reason,
            notes,
            performedById,
            lotId // Optional for lot-tracked items
        } = body

        if (!inventoryItemId || !locationId || quantity === undefined || !performedById) {
            return NextResponse.json(
                { error: 'inventoryItemId, locationId, quantity, and performedById are required' },
                { status: 400 }
            )
        }

        // Get current item and stock
        const item = await prisma.inventoryItem.findUnique({
            where: { id: inventoryItemId }
        })

        if (!item) {
            return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
        }

        // Get or create location stock
        let locationStock = await prisma.locationStock.findUnique({
            where: {
                locationId_inventoryItemId: { locationId, inventoryItemId }
            }
        })

        const previousStock = locationStock ? Number(locationStock.currentStock) : 0
        const newStock = previousStock + quantity

        if (newStock < 0) {
            return NextResponse.json(
                { error: `Insufficient stock. Current: ${previousStock}, Adjustment: ${quantity}` },
                { status: 400 }
            )
        }

        // Create stock movement record
        const movement = await prisma.stockMovement.create({
            data: {
                movementNumber: generateMovementNumber(),
                inventoryItemId,
                locationId,
                lotId,
                movementType: 'ADJUSTMENT',
                quantity,
                previousStock,
                newStock,
                unitCost: item.costPrice,
                totalCost: Math.abs(quantity) * Number(item.costPrice),
                reason: reason || 'Manual adjustment',
                notes,
                performedById
            }
        })

        // Update or create location stock
        if (locationStock) {
            locationStock = await prisma.locationStock.update({
                where: { id: locationStock.id },
                data: { currentStock: newStock }
            })
        } else {
            locationStock = await prisma.locationStock.create({
                data: {
                    locationId,
                    inventoryItemId,
                    currentStock: newStock
                }
            })
        }

        // Update item's global current stock
        const allLocationStock = await prisma.locationStock.aggregate({
            where: { inventoryItemId },
            _sum: { currentStock: true }
        })

        await prisma.inventoryItem.update({
            where: { id: inventoryItemId },
            data: { currentStock: allLocationStock._sum.currentStock || 0 }
        })

        return NextResponse.json({
            movement,
            locationStock,
            previousStock,
            newStock
        }, { status: 201 })
    } catch (error) {
        console.error('Error adjusting stock:', error)
        return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 })
    }
}
