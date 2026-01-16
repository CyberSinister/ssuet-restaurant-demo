import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// Utility to generate movement and lot numbers
function generateMovementNumber(): string {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `MOV-${dateStr}-${random}`
}

function generateLotNumber(): string {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `LOT-${dateStr}-${random}`
}

// POST /api/inventory/purchase-orders/[id]/receive - Receive goods from PO
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { receivedItems, performedById, notes } = body
        // receivedItems: [{ poItemId, receivedQty, lotNumber?, expiryDate?, notes? }]

        if (!receivedItems || !Array.isArray(receivedItems) || receivedItems.length === 0) {
            return NextResponse.json(
                { error: 'receivedItems array is required' },
                { status: 400 }
            )
        }

        if (!performedById) {
            return NextResponse.json(
                { error: 'performedById is required' },
                { status: 400 }
            )
        }

        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: true }
        })

        if (!po) {
            return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
        }

        if (!['APPROVED', 'ORDERED', 'PARTIAL'].includes(po.status)) {
            return NextResponse.json(
                { error: 'Can only receive goods for approved/ordered/partial POs' },
                { status: 400 }
            )
        }

        const results = []

        for (const received of receivedItems) {
            const { poItemId, receivedQty, lotNumber, expiryDate } = received

            const poItem = po.items.find((i: { id: string }) => i.id === poItemId)
            if (!poItem) {
                results.push({ poItemId, error: 'PO item not found' })
                continue
            }

            const newReceivedQty = Number(poItem.receivedQty) + receivedQty
            const orderedQty = Number(poItem.quantity)

            if (newReceivedQty > orderedQty) {
                results.push({
                    poItemId,
                    error: `Cannot receive more than ordered. Ordered: ${orderedQty}, Already received: ${poItem.receivedQty}`
                })
                continue
            }

            // Get inventory item for cost
            const item = await prisma.inventoryItem.findUnique({
                where: { id: poItem.inventoryItemId }
            })

            if (!item) {
                results.push({ poItemId, error: 'Inventory item not found' })
                continue
            }

            // Update PO item received qty
            await prisma.purchaseOrderItem.update({
                where: { id: poItemId },
                data: { receivedQty: newReceivedQty }
            })

            // Get or create location stock
            let locationStock = await prisma.locationStock.findUnique({
                where: {
                    locationId_inventoryItemId: {
                        locationId: po.locationId,
                        inventoryItemId: poItem.inventoryItemId
                    }
                }
            })

            const previousStock = locationStock ? Number(locationStock.currentStock) : 0
            const newStock = previousStock + receivedQty

            // Create lot if item tracks lots
            let lot = null
            if (item.trackLots || item.trackExpiry) {
                lot = await prisma.inventoryLot.create({
                    data: {
                        lotNumber: lotNumber || generateLotNumber(),
                        inventoryItemId: poItem.inventoryItemId,
                        locationId: po.locationId,
                        quantity: receivedQty,
                        remainingQty: receivedQty,
                        costPrice: poItem.unitPrice,
                        receivedDate: new Date(),
                        expiryDate: expiryDate ? new Date(expiryDate) : null,
                        supplierId: po.supplierId,
                        purchaseOrderId: po.id,
                        status: 'AVAILABLE'
                    }
                })
            }

            // Create stock movement
            const movement = await prisma.stockMovement.create({
                data: {
                    movementNumber: generateMovementNumber(),
                    inventoryItemId: poItem.inventoryItemId,
                    locationId: po.locationId,
                    lotId: lot?.id,
                    movementType: 'PURCHASE',
                    quantity: receivedQty,
                    previousStock,
                    newStock,
                    unitCost: poItem.unitPrice,
                    totalCost: receivedQty * Number(poItem.unitPrice),
                    referenceType: 'PURCHASE_ORDER',
                    referenceId: po.id,
                    notes: notes || `Received from PO ${po.poNumber}`,
                    performedById
                }
            })

            // Update or create location stock
            if (locationStock) {
                await prisma.locationStock.update({
                    where: { id: locationStock.id },
                    data: { currentStock: newStock }
                })
            } else {
                await prisma.locationStock.create({
                    data: {
                        locationId: po.locationId,
                        inventoryItemId: poItem.inventoryItemId,
                        currentStock: newStock
                    }
                })
            }

            // Update item's global stock and cost
            const allStock = await prisma.locationStock.aggregate({
                where: { inventoryItemId: poItem.inventoryItemId },
                _sum: { currentStock: true }
            })

            await prisma.inventoryItem.update({
                where: { id: poItem.inventoryItemId },
                data: {
                    currentStock: allStock._sum.currentStock || 0,
                    lastCostPrice: item.costPrice,
                    costPrice: poItem.unitPrice
                }
            })

            results.push({
                poItemId,
                success: true,
                receivedQty,
                totalReceived: newReceivedQty,
                movementId: movement.id,
                lotId: lot?.id
            })
        }

        // Check if all items fully received
        const updatedPo = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: true }
        })

        const allItemsReceived = updatedPo?.items.every(
            (item: { receivedQty: unknown; quantity: unknown }) => Number(item.receivedQty) >= Number(item.quantity)
        )

        // Update PO status
        const newStatus = allItemsReceived ? 'RECEIVED' : 'PARTIAL'
        await prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: newStatus,
                receivedDate: allItemsReceived ? new Date() : null
            }
        })

        return NextResponse.json({
            message: allItemsReceived ? 'All items received' : 'Partial receipt recorded',
            status: newStatus,
            results
        })
    } catch (error) {
        console.error('Error receiving goods:', error)
        return NextResponse.json({ error: 'Failed to receive goods' }, { status: 500 })
    }
}
