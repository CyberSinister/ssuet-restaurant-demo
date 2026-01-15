import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { prisma } = await import('@/lib/db/prisma')
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const customer = await prisma.customer.findFirst({
      where: { verificationToken: token },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    })

    return NextResponse.json({ message: 'Email verified successfully!' })

  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
