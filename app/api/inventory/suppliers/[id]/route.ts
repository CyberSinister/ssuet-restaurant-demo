import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/inventory/suppliers/[id] - Get single supplier
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        inventoryItem: { select: { id: true, name: true, sku: true } }
                    }
                },
                purchaseOrders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        poNumber: true,
                        status: true,
                        total: true,
                        orderDate: true
                    }
                },
                _count: {
                    select: { items: true, purchaseOrders: true, lots: true }
                }
            }
        })

        if (!supplier) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        return NextResponse.json({ supplier })
    } catch (error) {
        console.error('Error fetching supplier:', error)
        return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
    }
}

// PATCH /api/inventory/suppliers/[id] - Update supplier
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.supplier.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        const {
            name, contactName, email, phone, address, city, country,
            paymentTerms, creditLimit, taxNumber, isActive
        } = body

        const supplier = await prisma.supplier.update({
            where: { id },
            data: {
                name,
                contactName,
                email,
                phone,
                address,
                city,
                country,
                paymentTerms,
                creditLimit,
                taxNumber,
                isActive
            }
        })

        return NextResponse.json({ supplier })
    } catch (error) {
        console.error('Error updating supplier:', error)
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
    }
}

// DELETE /api/inventory/suppliers/[id] - Deactivate supplier
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const existing = await prisma.supplier.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        // Soft delete
        await prisma.supplier.update({
            where: { id },
            data: { isActive: false }
        })

        return NextResponse.json({ message: 'Supplier deactivated successfully' })
    } catch (error) {
        console.error('Error deleting supplier:', error)
        return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
    }
}
