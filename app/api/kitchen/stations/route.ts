import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/kitchen/stations - List all kitchen stations
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const locationId = searchParams.get('locationId')

        const stations = await prisma.kitchenStation.findMany({
            where: {
                ...(locationId && { locationId }),
                isActive: true
            },
            include: {
                location: { select: { id: true, name: true } },
                categories: {
                    include: {
                        category: { select: { id: true, name: true } }
                    }
                },
                _count: {
                    select: {
                        kitchenOrders: {
                            where: { status: { in: ['NEW', 'VIEWED', 'IN_PROGRESS'] } }
                        }
                    }
                }
            },
            orderBy: { displayOrder: 'asc' }
        })

        return NextResponse.json({ stations })
    } catch (error) {
        console.error('Error fetching kitchen stations:', error)
        return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 })
    }
}

// POST /api/kitchen/stations - Create kitchen station
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, code, locationId, color, warningTime, criticalTime, categoryIds } = body

        if (!name || !code || !locationId) {
            return NextResponse.json(
                { error: 'name, code, and locationId are required' },
                { status: 400 }
            )
        }

        const station = await prisma.kitchenStation.create({
            data: {
                name,
                code: code.toUpperCase(),
                locationId,
                color,
                warningTime: warningTime || 10,
                criticalTime: criticalTime || 15,
                isActive: true,
                categories: categoryIds ? {
                    create: categoryIds.map((categoryId: string) => ({
                        categoryId
                    }))
                } : undefined
            },
            include: {
                location: { select: { id: true, name: true } },
                categories: {
                    include: { category: { select: { id: true, name: true } } }
                }
            }
        })

        return NextResponse.json({ station }, { status: 201 })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Station code already exists' }, { status: 400 })
        }
        console.error('Error creating kitchen station:', error)
        return NextResponse.json({ error: 'Failed to create station' }, { status: 500 })
    }
}
