import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/db/prisma'
import {
  withAuthAndBodyValidation,
  withErrorHandling,
  createErrorResponse,
} from '@/lib/validations/middleware'
import { locationSchema, type LocationInput } from '@/lib/validations/schemas'

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const locations = await prisma.location.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [
        { country: 'asc' },
        { city: 'asc' },
        { name: 'asc' }
      ],
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return createErrorResponse('Failed to fetch locations', 500)
  }
})

export const POST = withAuthAndBodyValidation(
  locationSchema,
  async (_request: NextRequest, validatedBody: LocationInput) => {
    try {
      const location = await prisma.location.create({
        data: validatedBody as any
      })
      const parsedLocation = {
        ...location,
        countryImages: location.countryImages ? JSON.parse(location.countryImages) : [],
        cityImages: location.cityImages ? JSON.parse(location.cityImages) : []
      }
      return NextResponse.json(parsedLocation, { status: 201 })
    } catch (error: any) {
      console.error('Error creating location:', error)
      if (error.code === 'P2002') {
        return createErrorResponse('Slug must be unique', 400)
      }
      return createErrorResponse('Failed to create location', 500)
    }
  }
)
