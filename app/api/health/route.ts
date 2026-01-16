import { NextResponse } from 'next/server'

// GET /api/health - Health check endpoint for Docker/Kubernetes
export async function GET() {
    try {
        // Basic health check
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
        }

        return NextResponse.json(health)
    } catch (error) {
        return NextResponse.json(
            { status: 'error', message: 'Health check failed' },
            { status: 503 }
        )
    }
}
