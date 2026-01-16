import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Utility to generate supplier code
function generateSupplierCode(): string {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `SUP-${random}`
}

// GET /api/inventory/suppliers - List suppliers
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const activeOnly = searchParams.get('activeOnly') !== 'false'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: Record<string, unknown> = {}

        if (activeOnly) where.isActive = true
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        }

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                include: {
                    _count: {
                        select: { items: true, purchaseOrders: true }
                    }
                },
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.supplier.count({ where })
        ])

        return NextResponse.json({
            suppliers,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        })
    } catch (error) {
        console.error('Error fetching suppliers:', error)
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
    }
}

// POST /api/inventory/suppliers - Create supplier
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            name, code, contactName, email, phone, address, city, country,
            paymentTerms, creditLimit, taxNumber
        } = body

        if (!name) {
            return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
        }

        const supplier = await prisma.supplier.create({
            data: {
                code: code || generateSupplierCode(),
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
                isActive: true
            }
        })

        return NextResponse.json({ supplier }, { status: 201 })
    } catch (error: unknown) {
        console.error('Error creating supplier:', error)
        const prismaError = error as { code?: string }
        if (prismaError.code === 'P2002') {
            return NextResponse.json({ error: 'Supplier code already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
    }
}
