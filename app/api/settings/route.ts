
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/settings - Get restaurant settings
export async function GET(_request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/db/prisma')
    let settings = await prisma.restaurantSettings.findFirst()

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.restaurantSettings.create({
        data: {
          name: 'Broadway Pizza',
          phone: '0300-1234567',
          email: 'order@broadway.com',
          address: 'Main Broadway Street',
          hours: JSON.stringify({
            mon: '11:00 AM - 02:00 AM',
            tue: '11:00 AM - 02:00 AM',
            wed: '11:00 AM - 02:00 AM',
            thu: '11:00 AM - 02:00 AM',
            fri: '11:00 AM - 02:00 AM',
            sat: '11:00 AM - 02:00 AM',
            sun: '11:00 AM - 02:00 AM',
          }),
          deliveryFee: 150,
          minimumOrder: 500,
          taxRate: 0.16,
        }
      })
    }

    // Parse hours JSON
    const formattedSettings = {
      ...settings,
      hours: typeof settings.hours === 'string' ? JSON.parse(settings.hours) : settings.hours,
    }

    return NextResponse.json(formattedSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// PUT /api/settings - Update restaurant settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/db/prisma')
    const { validateBody } = await import('@/lib/validations/middleware')
    const { restaurantSettingsSchema } = await import('@/lib/validations/schemas')

    const validatedBody = await validateBody(request, restaurantSettingsSchema)
    const { name, phone, email, address, hours, deliveryFee, minimumOrder, taxRate } =
      validatedBody

    const settings = await prisma.restaurantSettings.findFirst()

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    const updatedSettings = await prisma.restaurantSettings.update({
      where: { id: settings.id },
      data: {
        name,
        phone,
        email,
        address,
        hours: JSON.stringify(hours),
        deliveryFee,
        minimumOrder,
        taxRate,
      },
    })

    return NextResponse.json({
      ...updatedSettings,
      hours: updatedSettings.hours ?? {},
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
