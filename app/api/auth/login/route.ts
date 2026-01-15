import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { prisma } = await import('@/lib/db/prisma')
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const customer = await prisma.customer.findUnique({
      where: { email },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!customer.isVerified) {
      return NextResponse.json({ error: 'Please verify your email address' }, { status: 403 })
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // In a real app, we'd set a JWT cookie here. 
    // For this implementation, we'll return the user info and handle session in localStorage for simplicity, 
    // or return a simplified token/ID.
    
    const { password: _, ...customerWithoutPassword } = customer

    return NextResponse.json({ 
      message: 'Login successful',
      customer: customerWithoutPassword 
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
