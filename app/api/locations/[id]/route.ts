import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  withAuth,
  withErrorHandling,
  validateBody,
  createErrorResponse,
} from '@/lib/validations/middleware'
import { locationUpdateSchema } from '@/lib/validations/schemas'

export const GET = withErrorHandling(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: params.id },
    })

    if (!location) {
      return createErrorResponse('Location not found', 404)
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching location:', error)
    return createErrorResponse('Failed to fetch location', 500)
  }
})

export const PATCH = withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const validatedBody = await validateBody(request, locationUpdateSchema)
    
    const data = {
      ...validatedBody,
      countryImages: validatedBody.countryImages ? JSON.stringify(validatedBody.countryImages) : (validatedBody.countryImages === null ? null : undefined),
      cityImages: validatedBody.cityImages ? JSON.stringify(validatedBody.cityImages) : (validatedBody.cityImages === null ? null : undefined),
    }

    const location = await prisma.location.update({
      where: { id: params.id },
      data,
    })

    const parsedLocation = {
        ...location,
        countryImages: location.countryImages ? JSON.parse(location.countryImages) : [],
        cityImages: location.cityImages ? JSON.parse(location.cityImages) : []
    }

    return NextResponse.json(parsedLocation)
  } catch (error: any) {
    if (error instanceof NextResponse) return error
    
    console.error('Error updating location:', error)
    if (error.code === 'P2025') {
      return createErrorResponse('Location not found', 404)
    }
    if (error.code === 'P2002') {
      return createErrorResponse('Slug must be unique', 400)
    }
    return createErrorResponse('Failed to update location', 500)
  }
})

export const DELETE = withAuth(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await prisma.location.delete({
      where: { id: params.id },
    })
    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('Error deleting location:', error)
    if (error.code === 'P2025') {
      return createErrorResponse('Location not found', 404)
    }
    return createErrorResponse('Failed to delete location', 500)
  }
})
