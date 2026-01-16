import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/areas - List areas
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const locationId = searchParams.get('locationId')

        const areas = await prisma.area.findMany({
            where: {
                ...(locationId && { locationId }),
                isActive: true
            },
            include: {
                location: { select: { id: true, name: true } },
                tables: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        tableNumber: true,
                        status: true,
                        maxSeats: true,
                        positionX: true,
                        positionY: true,
                        shape: true,
                        width: true,
                        height: true,
                        rotation: true
                    }
                },
                _count: {
                    select: { tables: true }
                }
            },
            orderBy: { displayOrder: 'asc' }
        })

        return NextResponse.json({ areas })
    } catch (error) {
        console.error('Error fetching areas:', error)
        return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 })
    }
}

// POST /api/areas - Create area
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            name, locationId, description, minCapacity, maxCapacity,
            isPrivate, rentalFee, smokingAllowed, isOutdoors, isAccessible,
            floorPlanData
        } = body

        if (!name || !locationId || !maxCapacity) {
            return NextResponse.json(
                { error: 'name, locationId, and maxCapacity are required' },
                { status: 400 }
            )
        }

        const area = await prisma.area.create({
            data: {
                name,
                locationId,
                description,
                minCapacity: minCapacity || 1,
                maxCapacity,
                isPrivate: isPrivate || false,
                rentalFee,
                smokingAllowed: smokingAllowed || false,
                isOutdoors: isOutdoors || false,
                isAccessible: isAccessible !== false,
                floorPlanData,
                isActive: true
            },
            include: {
                location: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json({ area }, { status: 201 })
    } catch (error) {
        console.error('Error creating area:', error)
        return NextResponse.json({ error: 'Failed to create area' }, { status: 500 })
    }
}
