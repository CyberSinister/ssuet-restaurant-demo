import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function GET(
    _request: NextRequest,
    { params }: { params: { filename: string } }
) {
    const filename = params.filename
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename)

    if (!existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 })
    }

    try {
        const fileBuffer = await readFile(filePath)

        // Determine content type based on extension
        const ext = path.extname(filename).toLowerCase()
        const contentTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
        }

        const contentType = contentTypes[ext] || 'application/octet-stream'

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error) {
        console.error('Error serving file:', error)
        return new NextResponse('Error serving file', { status: 500 })
    }
}
