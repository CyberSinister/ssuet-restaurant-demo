import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import nodemailer from 'nodemailer'
import {
  withAuthAndBodyValidation,
  createErrorResponse,
} from '@/lib/validations/middleware'
import {
  smtpTestEmailSchema,
  type SMTPTestEmailInput,
} from '@/lib/validations/schemas'

// POST /api/settings/smtp/test - Send test email (admin only)
export const POST = withAuthAndBodyValidation(
  smtpTestEmailSchema,
  async (request: NextRequest, validatedBody: SMTPTestEmailInput) => {
    try {
      const { to } = validatedBody

      // Get SMTP configuration
      const smtpConfig = await prisma.sMTPConfig.findFirst()

      if (!smtpConfig) {
        return createErrorResponse('SMTP configuration not found', 404)
      }

      if (!smtpConfig.enabled) {
        return createErrorResponse('SMTP is not enabled', 400)
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
      })

      // Verify transporter configuration
      try {
        await transporter.verify()
      } catch (verifyError) {
        console.error('SMTP verification failed:', verifyError)
        return createErrorResponse('SMTP configuration is invalid. Please check your settings.', 400)
      }

      // Send test email
      const info = await transporter.sendMail({
        from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
        to,
        subject: 'Test Email from Restaurant Ordering System',
        text: 'This is a test email to verify your SMTP configuration is working correctly.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">SMTP Test Email</h2>
            <p>This is a test email to verify your SMTP configuration is working correctly.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Sent from: ${smtpConfig.fromName} (${smtpConfig.fromEmail})<br>
              SMTP Server: ${smtpConfig.host}:${smtpConfig.port}<br>
              Secure Connection: ${smtpConfig.secure ? 'Yes' : 'No'}
            </p>
          </div>
        `,
      })

      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: info.messageId,
        recipient: to,
      })
    } catch (error) {
      console.error('Error sending test email:', error)

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('EAUTH')) {
          return createErrorResponse('Authentication failed. Please check your username and password.', 400)
        }
        if (error.message.includes('ECONNREFUSED')) {
          return createErrorResponse('Connection refused. Please check your host and port.', 400)
        }
        if (error.message.includes('ETIMEDOUT')) {
          return createErrorResponse('Connection timed out. Please check your network and firewall settings.', 400)
        }
      }

      return createErrorResponse('Failed to send test email', 500)
    }
  }
)
