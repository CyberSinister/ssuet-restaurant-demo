import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// PATCH /api/tables/[id]/status - Update table status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { status } = body

        const validStatuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'BLOCKED']
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            )
        }

        const table = await prisma.table.update({
            where: { id },
            data: { status },
            include: {
                area: { select: { id: true, name: true, locationId: true } }
            }
        })

        // TODO: Emit real-time update via Socket.IO
        // getSocketServer()?.emitTableStatusChanged(table.area.locationId, id, status, table.areaId)

        return NextResponse.json({ table })
    } catch (error) {
        console.error('Error updating table status:', error)
        return NextResponse.json({ error: 'Failed to update table status' }, { status: 500 })
    }
}
