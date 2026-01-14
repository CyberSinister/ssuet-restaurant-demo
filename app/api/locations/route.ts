import { NextRequest, NextResponse } from 'next/server'
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
      where: includeInactive ? {} : { active: true },
      orderBy: [
        { country: 'asc' },
        { city: 'asc' },
        { name: 'asc' }
      ],
    })

    const parsedLocations = locations.map((l: any) => ({
        ...l,
        countryImages: l.countryImages ? JSON.parse(l.countryImages) : [],
        cityImages: l.cityImages ? JSON.parse(l.cityImages) : []
    }))

    return NextResponse.json(parsedLocations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return createErrorResponse('Failed to fetch locations', 500)
  }
})

export const POST = withAuthAndBodyValidation(
  locationSchema,
  async (_request: NextRequest, validatedBody: LocationInput) => {
    try {
      const data = {
        ...validatedBody,
        countryImages: validatedBody.countryImages ? JSON.stringify(validatedBody.countryImages) : null,
        cityImages: validatedBody.cityImages ? JSON.stringify(validatedBody.cityImages) : null,
      }
      const location = await prisma.location.create({
        data
      })
      return NextResponse.json(location, { status: 201 })
    } catch (error: any) {
      console.error('Error creating location:', error)
      if (error.code === 'P2002') {
        return createErrorResponse('Slug must be unique', 400)
      }
      return createErrorResponse('Failed to create location', 500)
    }
  }
)
