import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Utility to generate movement number
function generateMovementNumber(): string {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `MOV-${dateStr}-${random}`
}

// POST /api/inventory/stock/transfer - Transfer stock between locations
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            inventoryItemId,
            sourceLocationId,
            destinationLocationId,
            quantity,
            notes,
            performedById
        } = body

        if (!inventoryItemId || !sourceLocationId || !destinationLocationId || !quantity || !performedById) {
            return NextResponse.json(
                { error: 'inventoryItemId, sourceLocationId, destinationLocationId, quantity, and performedById are required' },
                { status: 400 }
            )
        }

        if (quantity <= 0) {
            return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 })
        }

        if (sourceLocationId === destinationLocationId) {
            return NextResponse.json({ error: 'Source and destination must be different' }, { status: 400 })
        }

        // Verify all entities exist
        const [item, sourceLocation, destLocation] = await Promise.all([
            prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } }),
            prisma.location.findUnique({ where: { id: sourceLocationId } }),
            prisma.location.findUnique({ where: { id: destinationLocationId } })
        ])

        if (!item) {
            return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
        }
        if (!sourceLocation) {
            return NextResponse.json({ error: 'Source location not found' }, { status: 404 })
        }
        if (!destLocation) {
            return NextResponse.json({ error: 'Destination location not found' }, { status: 404 })
        }

        // Get source stock
        const sourceStock = await prisma.locationStock.findUnique({
            where: { locationId_inventoryItemId: { locationId: sourceLocationId, inventoryItemId } }
        })

        const sourceCurrentStock = sourceStock ? Number(sourceStock.currentStock) : 0

        if (sourceCurrentStock < quantity) {
            return NextResponse.json(
                { error: `Insufficient stock at source. Available: ${sourceCurrentStock}` },
                { status: 400 }
            )
        }

        // Get or prepare destination stock
        let destStock = await prisma.locationStock.findUnique({
            where: { locationId_inventoryItemId: { locationId: destinationLocationId, inventoryItemId } }
        })
        const destCurrentStock = destStock ? Number(destStock.currentStock) : 0

        // Perform transfer in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create transfer out movement
            const outMovement = await tx.stockMovement.create({
                data: {
                    movementNumber: generateMovementNumber(),
                    inventoryItemId,
                    locationId: sourceLocationId,
                    movementType: 'TRANSFER_OUT',
                    quantity: -quantity,
                    previousStock: sourceCurrentStock,
                    newStock: sourceCurrentStock - quantity,
                    destinationLocationId,
                    notes,
                    performedById
                }
            })

            // Create transfer in movement
            const inMovement = await tx.stockMovement.create({
                data: {
                    movementNumber: generateMovementNumber(),
                    inventoryItemId,
                    locationId: destinationLocationId,
                    movementType: 'TRANSFER_IN',
                    quantity,
                    previousStock: destCurrentStock,
                    newStock: destCurrentStock + quantity,
                    referenceId: outMovement.id,
                    notes,
                    performedById
                }
            })

            // Update source stock
            await tx.locationStock.update({
                where: { id: sourceStock!.id },
                data: { currentStock: sourceCurrentStock - quantity }
            })

            // Update or create destination stock
            if (destStock) {
                destStock = await tx.locationStock.update({
                    where: { id: destStock.id },
                    data: { currentStock: destCurrentStock + quantity }
                })
            } else {
                destStock = await tx.locationStock.create({
                    data: {
                        locationId: destinationLocationId,
                        inventoryItemId,
                        currentStock: quantity
                    }
                })
            }

            return { outMovement, inMovement, destStock }
        })

        return NextResponse.json({
            message: 'Transfer completed successfully',
            transfer: {
                from: sourceLocation.name,
                to: destLocation.name,
                quantity,
                item: item.name
            },
            movements: [result.outMovement, result.inMovement]
        }, { status: 201 })
    } catch (error) {
        console.error('Error transferring stock:', error)
        return NextResponse.json({ error: 'Failed to transfer stock' }, { status: 500 })
    }
}
