import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Utility to generate movement number
function generateMovementNumber(): string {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `MOV-${dateStr}-${random}`
}

// POST /api/inventory/stock/count - Record physical stock count
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { locationId, counts, performedById, notes } = body

        if (!locationId || !counts || !Array.isArray(counts) || !performedById) {
            return NextResponse.json(
                { error: 'locationId, counts array, and performedById are required' },
                { status: 400 }
            )
        }

        // Validate counts structure
        for (const count of counts) {
            if (!count.inventoryItemId || count.countedQty === undefined) {
                return NextResponse.json(
                    { error: 'Each count must have inventoryItemId and countedQty' },
                    { status: 400 }
                )
            }
        }

        const results = []
        const discrepancies = []

        for (const count of counts) {
            const { inventoryItemId, countedQty } = count

            // Get current stock
            let locationStock = await prisma.locationStock.findUnique({
                where: { locationId_inventoryItemId: { locationId, inventoryItemId } }
            })

            const systemQty = locationStock ? Number(locationStock.currentStock) : 0
            const difference = countedQty - systemQty

            // Create count movement if there's a discrepancy
            if (difference !== 0) {
                const movement = await prisma.stockMovement.create({
                    data: {
                        movementNumber: generateMovementNumber(),
                        inventoryItemId,
                        locationId,
                        movementType: 'COUNT',
                        quantity: difference,
                        previousStock: systemQty,
                        newStock: countedQty,
                        reason: `Physical count adjustment. System: ${systemQty}, Counted: ${countedQty}`,
                        notes,
                        performedById
                    }
                })

                // Update location stock
                if (locationStock) {
                    locationStock = await prisma.locationStock.update({
                        where: { id: locationStock.id },
                        data: {
                            currentStock: countedQty,
                            lastCountedAt: new Date(),
                            lastCountedBy: performedById
                        }
                    })
                } else {
                    locationStock = await prisma.locationStock.create({
                        data: {
                            locationId,
                            inventoryItemId,
                            currentStock: countedQty,
                            lastCountedAt: new Date(),
                            lastCountedBy: performedById
                        }
                    })
                }

                // Update item's global stock
                const allLocationStock = await prisma.locationStock.aggregate({
                    where: { inventoryItemId },
                    _sum: { currentStock: true }
                })

                await prisma.inventoryItem.update({
                    where: { id: inventoryItemId },
                    data: { currentStock: allLocationStock._sum.currentStock || 0 }
                })

                discrepancies.push({
                    inventoryItemId,
                    systemQty,
                    countedQty,
                    difference,
                    movementId: movement.id
                })

                results.push({ inventoryItemId, adjusted: true, movement })
            } else {
                // Just update last counted time
                if (locationStock) {
                    await prisma.locationStock.update({
                        where: { id: locationStock.id },
                        data: {
                            lastCountedAt: new Date(),
                            lastCountedBy: performedById
                        }
                    })
                }
                results.push({ inventoryItemId, adjusted: false, message: 'No discrepancy' })
            }
        }

        return NextResponse.json({
            message: 'Stock count recorded',
            totalItems: counts.length,
            adjustedItems: discrepancies.length,
            discrepancies,
            results
        }, { status: 201 })
    } catch (error) {
        console.error('Error recording stock count:', error)
        return NextResponse.json({ error: 'Failed to record stock count' }, { status: 500 })
    }
}
