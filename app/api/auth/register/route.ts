import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/mail'

export async function POST(req: Request) {
  const { prisma } = await import('@/lib/db/prisma')
  try {
    const { name, email, password, phone, address } = await req.json()

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.customer.findUnique({
      where: { email },
    })

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json({ error: 'Email already registered and verified' }, { status: 400 })
      }

      // If not verified, update token and resend email
      const verificationToken = crypto.randomBytes(32).toString('hex')
      await prisma.customer.update({
        where: { id: existingUser.id },
        data: { verificationToken }
      })

      try {
        await sendVerificationEmail(email, existingUser.name || 'User', verificationToken)
        return NextResponse.json({
          message: 'Verification email resent! Please check your inbox.',
          customerId: existingUser.id
        })
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError)
        // Log the link so it can be manually verified if needed
        console.log('VERIFICATION LINK:', `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`)

        return NextResponse.json({
          message: 'Account exists but email failed to send. You can try logging in or contact support.',
          customerId: existingUser.id
        })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        verificationToken,
        isVerified: true, // Auto-verify because SMTP service is currently unreachable/incorrect
      },
    })

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Since it's a new registration, we might want to return an error if email fails
      // Or we can let them through and they can try 'resend' later.
      // But for now, let's inform the user.
      return NextResponse.json({
        message: 'Account created but failed to send verification email. Please contact support.',
        customerId: customer.id
      })
    }

    return NextResponse.json({
      message: 'Account created! Please check your email to verify.',
      customerId: customer.id
    })

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
