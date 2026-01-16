import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/pos/terminals/[id] - Get terminal details
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const terminal = await prisma.pOSTerminal.findUnique({
            where: { id },
            include: {
                location: true,
                shifts: {
                    where: { status: 'OPEN' },
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    }
                },
                _count: {
                    select: { orders: true, transactions: true }
                }
            }
        })

        if (!terminal) {
            return NextResponse.json({ error: 'Terminal not found' }, { status: 404 })
        }

        return NextResponse.json({ terminal })
    } catch (error) {
        console.error('Error fetching terminal:', error)
        return NextResponse.json({ error: 'Failed to fetch terminal' }, { status: 500 })
    }
}

// PATCH /api/pos/terminals/[id] - Update terminal
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, terminalType, deviceId, ipAddress, settings, isActive } = body

        const terminal = await prisma.pOSTerminal.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(terminalType && { terminalType }),
                ...(deviceId !== undefined && { deviceId }),
                ...(ipAddress !== undefined && { ipAddress }),
                ...(settings !== undefined && { settings }),
                ...(isActive !== undefined && { isActive }),
                lastActiveAt: new Date(),
            },
            include: {
                location: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json({ terminal })
    } catch (error) {
        console.error('Error updating terminal:', error)
        return NextResponse.json({ error: 'Failed to update terminal' }, { status: 500 })
    }
}

// DELETE /api/pos/terminals/[id] - Deactivate terminal
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        await prisma.pOSTerminal.update({
            where: { id },
            data: { isActive: false }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deactivating terminal:', error)
        return NextResponse.json({ error: 'Failed to deactivate terminal' }, { status: 500 })
    }
}
