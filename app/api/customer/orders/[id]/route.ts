import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { prisma } = await import('@/lib/db/prisma')
  try {
    const id = params.id

    const orders = await prisma.order.findMany({
      where: { customerId: id },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)

  } catch (error: any) {
    console.error('Fetch customer orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
