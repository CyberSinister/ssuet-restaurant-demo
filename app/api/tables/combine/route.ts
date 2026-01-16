import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// POST /api/tables/combine - Combine multiple tables
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tableIds, status } = body

        if (!tableIds || !Array.isArray(tableIds) || tableIds.length < 2) {
            return NextResponse.json(
                { error: 'At least 2 table IDs are required' },
                { status: 400 }
            )
        }

        // Verify all tables exist and are in same area
        const tables = await prisma.table.findMany({
            where: { id: { in: tableIds } },
            include: { area: { select: { id: true, name: true } } }
        })

        if (tables.length !== tableIds.length) {
            return NextResponse.json({ error: 'One or more tables not found' }, { status: 404 })
        }

        const areaIds = [...new Set(tables.map(t => t.areaId))]
        if (areaIds.length > 1) {
            return NextResponse.json(
                { error: 'All tables must be in the same area' },
                { status: 400 }
            )
        }

        // Check none are already combined
        const alreadyCombined = tables.some(t => t.combinableWith)
        if (alreadyCombined) {
            return NextResponse.json(
                { error: 'One or more tables are already combined' },
                { status: 400 }
            )
        }

        // Primary table is first one, others are linked to it
        const primaryTableId = tableIds[0]
        const linkedTableIds = tableIds.slice(1)

        // Calculate combined capacity
        const totalMinSeats = tables.reduce((sum, t) => sum + t.minSeats, 0)
        const totalMaxSeats = tables.reduce((sum, t) => sum + t.maxSeats, 0)

        // Update primary table
        await prisma.table.update({
            where: { id: primaryTableId },
            data: {
                combinableWith: JSON.stringify(linkedTableIds),
                status: status || 'RESERVED'
            }
        })

        // Mark linked tables as combined (blocked)
        await prisma.table.updateMany({
            where: { id: { in: linkedTableIds } },
            data: {
                combinableWith: JSON.stringify([primaryTableId]),
                status: 'BLOCKED'
            }
        })

        const combinedTable = await prisma.table.findUnique({
            where: { id: primaryTableId },
            include: { area: { select: { id: true, name: true } } }
        })

        return NextResponse.json({
            message: 'Tables combined successfully',
            primaryTable: combinedTable,
            combinedWith: linkedTableIds,
            capacity: { min: totalMinSeats, max: totalMaxSeats }
        })
    } catch (error) {
        console.error('Error combining tables:', error)
        return NextResponse.json({ error: 'Failed to combine tables' }, { status: 500 })
    }
}
