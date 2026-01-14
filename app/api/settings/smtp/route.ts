import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  withAuth,
  withErrorHandling,
  validateBody,
  createErrorResponse,
} from '@/lib/validations/middleware'
import {
  smtpConfigUpdateSchema,
  type SMTPConfigUpdateInput,
} from '@/lib/validations/schemas'

// GET /api/settings/smtp - Get SMTP configuration (admin only, password masked)
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const smtpConfig = await prisma.sMTPConfig.findFirst()

    if (!smtpConfig) {
      // Return default/empty config if none exists
      return NextResponse.json({
        host: '',
        port: 587,
        secure: true,
        username: '',
        password: '',
        fromEmail: '',
        fromName: '',
        enabled: false,
      })
    }

    // Mask password for security
    return NextResponse.json({
      ...smtpConfig,
      password: smtpConfig.password ? '********' : '',
    })
  } catch (error) {
    console.error('Error fetching SMTP config:', error)
    return createErrorResponse('Failed to fetch SMTP configuration', 500)
  }
})

// PUT /api/settings/smtp - Update SMTP configuration (admin only)
export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const validatedBody = await validateBody(request, smtpConfigUpdateSchema)

    const existingConfig = await prisma.sMTPConfig.findFirst()

    let updatedConfig

    if (existingConfig) {
      // Update existing config
      const updateData: any = {}

      if (validatedBody.host) updateData.host = validatedBody.host
      if (validatedBody.port !== undefined) updateData.port = validatedBody.port
      if (validatedBody.username) updateData.username = validatedBody.username
      // Only update password if provided and not the masked placeholder
      if (validatedBody.password && validatedBody.password !== '********') {
        updateData.password = validatedBody.password
      }
      if (validatedBody.secure !== undefined) updateData.secure = validatedBody.secure
      if (validatedBody.fromEmail) updateData.fromEmail = validatedBody.fromEmail
      if (validatedBody.fromName) updateData.fromName = validatedBody.fromName
      if (validatedBody.enabled !== undefined) updateData.enabled = validatedBody.enabled

      updatedConfig = await prisma.sMTPConfig.update({
        where: { id: existingConfig.id },
        data: updateData,
      })
    } else {
      // Create new config - all fields required for creation
      if (!validatedBody.host || !validatedBody.username || !validatedBody.password ||
          !validatedBody.fromEmail || !validatedBody.fromName) {
        return createErrorResponse(
          'All SMTP fields are required when creating initial configuration',
          400
        )
      }

      updatedConfig = await prisma.sMTPConfig.create({
        data: {
          host: validatedBody.host,
          port: validatedBody.port ?? 587,
          username: validatedBody.username,
          password: validatedBody.password,
          secure: validatedBody.secure ?? true,
          fromEmail: validatedBody.fromEmail,
          fromName: validatedBody.fromName,
          enabled: validatedBody.enabled ?? false,
        },
      })
    }

    // Return with masked password
    return NextResponse.json({
      ...updatedConfig,
      password: '********',
    })
  } catch (error) {
    // Handle validation errors from middleware
    if (error instanceof NextResponse) {
      return error
    }
    console.error('Error updating SMTP config:', error)
    return createErrorResponse('Failed to update SMTP configuration', 500)
  }
})
