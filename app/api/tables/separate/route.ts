import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

// POST /api/tables/separate - Separate combined tables
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tableId } = body

        if (!tableId) {
            return NextResponse.json({ error: 'tableId is required' }, { status: 400 })
        }

        const table = await prisma.table.findUnique({ where: { id: tableId } })
        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 })
        }

        if (!table.combinableWith) {
            return NextResponse.json({ error: 'Table is not combined' }, { status: 400 })
        }

        // Get all linked table IDs
        let linkedIds: string[]
        try {
            linkedIds = JSON.parse(table.combinableWith as string)
        } catch {
            linkedIds = []
        }

        // Clear combinableWith on all tables
        const allTableIds = [tableId, ...linkedIds]
        await prisma.table.updateMany({
            where: { id: { in: allTableIds } },
            data: {
                combinableWith: Prisma.DbNull,
                status: 'AVAILABLE'
            }
        })

        const separatedTables = await prisma.table.findMany({
            where: { id: { in: allTableIds } },
            include: { area: { select: { id: true, name: true } } }
        })

        return NextResponse.json({
            message: 'Tables separated successfully',
            tables: separatedTables
        })
    } catch (error) {
        console.error('Error separating tables:', error)
        return NextResponse.json({ error: 'Failed to separate tables' }, { status: 500 })
    }
}
