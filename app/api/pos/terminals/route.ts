import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/pos/terminals - List all terminals
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const locationId = searchParams.get('locationId')

        const terminals = await prisma.pOSTerminal.findMany({
            where: locationId ? { locationId } : undefined,
            include: {
                location: {
                    select: { id: true, name: true, code: true }
                },
                _count: {
                    select: { orders: true, shifts: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ terminals })
    } catch (error) {
        console.error('Error fetching terminals:', error)
        return NextResponse.json(
            { error: 'Failed to fetch terminals' },
            { status: 500 }
        )
    }
}

// POST /api/pos/terminals - Create a new terminal
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, terminalType, locationId, deviceId, ipAddress, settings } = body

        if (!name || !locationId) {
            return NextResponse.json(
                { error: 'Name and locationId are required' },
                { status: 400 }
            )
        }

        const terminal = await prisma.pOSTerminal.create({
            data: {
                name,
                terminalType: terminalType || 'COUNTER',
                locationId,
                deviceId,
                ipAddress,
                settings,
                isActive: true,
            },
            include: {
                location: {
                    select: { id: true, name: true, code: true }
                }
            }
        })

        return NextResponse.json({ terminal }, { status: 201 })
    } catch (error) {
        console.error('Error creating terminal:', error)
        return NextResponse.json(
            { error: 'Failed to create terminal' },
            { status: 500 }
        )
    }
}
