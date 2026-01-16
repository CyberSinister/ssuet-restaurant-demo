import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/tables - List tables
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const areaId = searchParams.get('areaId')
        const locationId = searchParams.get('locationId')
        const status = searchParams.get('status')

        const where: any = { isActive: true }

        if (areaId) where.areaId = areaId
        if (status) where.status = status

        // If locationId provided, filter by areas in that location
        if (locationId && !areaId) {
            where.area = { locationId }
        }

        const tables = await prisma.table.findMany({
            where,
            include: {
                area: {
                    select: { id: true, name: true, locationId: true }
                },
                _count: {
                    select: { orders: { where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } } } }
                }
            },
            orderBy: [{ area: { displayOrder: 'asc' } }, { tableNumber: 'asc' }]
        })

        return NextResponse.json({ tables })
    } catch (error) {
        console.error('Error fetching tables:', error)
        return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
    }
}

// POST /api/tables - Create table
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            tableNumber, areaId, minSeats, maxSeats,
            positionX, positionY, shape, width, height, rotation
        } = body

        if (!tableNumber || !areaId || !maxSeats) {
            return NextResponse.json(
                { error: 'tableNumber, areaId, and maxSeats are required' },
                { status: 400 }
            )
        }

        const table = await prisma.table.create({
            data: {
                tableNumber,
                areaId,
                minSeats: minSeats || 1,
                maxSeats,
                positionX,
                positionY,
                shape: shape || 'RECTANGLE',
                width,
                height,
                rotation: rotation || 0,
                status: 'AVAILABLE',
                isActive: true
            },
            include: {
                area: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json({ table }, { status: 201 })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Table number already exists in this area' }, { status: 400 })
        }
        console.error('Error creating table:', error)
        return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
    }
}
