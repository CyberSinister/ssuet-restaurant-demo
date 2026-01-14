import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { defaultBrandingConfig } from '@/lib/types/branding'

export async function GET() {
  try {
    let config = await prisma.brandingConfig.findUnique({
      where: { id: 'default' }
    })

    if (!config) {
        // Create default if not exists
        // We separate the ID because defaultBrandingConfig object doesn't have it
        // and Prisma requires us to match the schema
        const { ...defaults } = defaultBrandingConfig
        
        config = await prisma.brandingConfig.create({
            data: {
                id: 'default',
                logoUrl: defaults.logoUrl,
                mobileLogoUrl: defaults.mobileLogoUrl,
                logoAlt: defaults.logoAlt,
                faviconUrl: defaults.faviconUrl,
                primaryColor: defaults.primaryColor,
                secondaryColor: defaults.secondaryColor,
                accentColor: defaults.accentColor,
                backgroundColor: defaults.backgroundColor,
                foregroundColor: defaults.foregroundColor,
                mutedColor: defaults.mutedColor,
                cardColor: defaults.cardColor,
                fontFamily: defaults.fontFamily,
                headingFont: defaults.headingFont,
                borderRadius: defaults.borderRadius,
                darkMode: defaults.darkMode
            }
        })
    }
    
    return NextResponse.json(config)
  } catch (error) {
    console.error('Failed to fetch branding:', error)
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json()
        const { id, updatedAt, createdAt, ...data } = body // Exclude system fields
        
        const config = await prisma.brandingConfig.upsert({
            where: { id: 'default' },
            update: data,
            create: {
                id: 'default',
                ...data
            }
        })
        
        return NextResponse.json(config)
    } catch (error) {
        console.error('Failed to update branding:', error)
        return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
    }
}
