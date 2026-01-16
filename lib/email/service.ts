import nodemailer from 'nodemailer'
import { prisma } from '@/lib/db/prisma'

export async function getEmailTransporter() {
  // Check if email is enabled
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'true') {
    return null
  }

  // Try to get SMTP config from database first
  const smtpConfig = await prisma.sMTPConfig.findFirst({
    where: { enabled: true },
  })

  let config: any

  if (smtpConfig) {
    config = {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password, // TODO: Decrypt in production
      },
    }
  } else if (process.env.SMTP_HOST) {
    // Fallback to environment variables
    config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    }
  } else {
    return null
  }

  return nodemailer.createTransport(config)
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderDetails: {
    orderId: string
    customerName: string
    items: any[]
    total: number
    orderType: string
    address?: string
    generatedPassword?: string
    pickupLocation?: string
  }
) {
  const transporter = await getEmailTransporter()

  if (!transporter) {
    console.log('Email not configured, skipping email send')
    return
  }

  const smtpConfig = await prisma.sMTPConfig.findFirst({
    where: { enabled: true },
  })

  const fromEmail = smtpConfig?.fromEmail || process.env.SMTP_FROM_EMAIL || 'noreply@bistrobay.com'
  const fromName = smtpConfig?.fromName || process.env.SMTP_FROM_NAME || 'Bistro Bay'

  const itemsList = orderDetails.items
    .map(
      (item) =>
        `<li style="margin-bottom: 5px;">
           <strong>${item.quantity}x</strong> ${item.menuItem.name} 
           <span style="float: right;">Rs. ${(item.price * item.quantity).toLocaleString()}</span>
           ${item.specialInstructions ? `<br><small style="color: #666;">Note: ${item.specialInstructions}</small>` : ''}
         </li>`
    )
    .join('')

  const accountSection = orderDetails.generatedPassword 
    ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #166534;">Account Created</h3>
        <p style="margin-bottom: 5px;">We've created an account for you for faster checkout next time!</p>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Password:</strong> ${orderDetails.generatedPassword}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="color: #166534; text-decoration: underline;">Login here</a> to view your order history.</p>
      </div>
    `
    : ''

  const locationSection = orderDetails.orderType === 'DELIVERY'
    ? `<p><strong>Delivering To:</strong><br>${orderDetails.address}</p>`
    : `<p><strong>Pickup Location:</strong><br>${orderDetails.address || orderDetails.pickupLocation || 'Main Branch'}</p>`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Order Confirmation</h1>
      <p>Hi ${orderDetails.customerName},</p>
      <p>Thank you for your order! We've received it and are getting started.</p>

      ${accountSection}

      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Order Details</h2>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Type:</strong> <span style="text-transform: uppercase; font-weight: bold;">${orderDetails.orderType}</span></p>
        ${locationSection}
      </div>

      <h3>Receipt</h3>
      <ul style="list-style: none; padding: 0;">
        ${itemsList}
      </ul>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
      
      <p style="font-size: 1.2em; text-align: right;">
        <strong>Total: Rs. ${orderDetails.total.toLocaleString()}</strong>
      </p>

      <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
        We'll verify your order shortly. If you have any questions, please contact us.
      </p>

      <p>Thanks,<br>${fromName}</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `Order Confirmation - ${orderDetails.orderId}`,
      html,
    })
    console.log(`Order confirmation email sent to ${to}`)
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}

// Generic email sender for template-based emails
export async function sendEmail(params: {
  to: string
  subject: string
  template?: string
  data?: Record<string, any>
  html?: string
}) {
  const transporter = await getEmailTransporter()

  if (!transporter) {
    console.log('Email not configured, skipping email send')
    return { success: false, error: 'Email not configured' }
  }

  const smtpConfig = await prisma.sMTPConfig.findFirst({
    where: { enabled: true },
  })

  const fromEmail = smtpConfig?.fromEmail || process.env.SMTP_FROM_EMAIL || 'noreply@bistrobay.com'
  const fromName = smtpConfig?.fromName || process.env.SMTP_FROM_NAME || 'Bistro Bay'

  // Generate HTML from template and data, or use provided HTML
  let html = params.html || ''

  if (!html && params.template && params.data) {
    // Simple template rendering - can be enhanced with a proper template engine
    html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>${params.subject}</h1>
        <div>
          ${Object.entries(params.data)
            .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
            .join('')}
        </div>
        <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
          This is an automated message from ${fromName}.
        </p>
      </div>
    `
  }

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html,
    })
    console.log(`Email sent to ${params.to}: ${params.subject}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: String(error) }
  }
}

export async function sendOrderStatusEmail(
  to: string,
  orderDetails: {
    orderId: string
    customerName: string
    status: string
  }
) {
  const transporter = await getEmailTransporter()

  if (!transporter) {
    console.log('Email not configured, skipping email send')
    return
  }

  const smtpConfig = await prisma.sMTPConfig.findFirst({
    where: { enabled: true },
  })

  const fromEmail = smtpConfig?.fromEmail || process.env.SMTP_FROM_EMAIL || 'noreply@bistrobay.com'
  const fromName = smtpConfig?.fromName || process.env.SMTP_FROM_NAME || 'Bistro Bay'

  const statusMessages: { [key: string]: string } = {
    confirmed: 'Your order has been confirmed and is being prepared.',
    preparing: 'Your order is being prepared.',
    ready: 'Your order is ready for pickup!',
    completed: 'Your order has been completed. Thank you!',
    cancelled: 'Your order has been cancelled.',
  }

  const html = `
    <h1>Order Status Update</h1>
    <p>Hi ${orderDetails.customerName},</p>
    <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
    <p>${statusMessages[orderDetails.status] || 'Your order status has been updated.'}</p>

    <p>Thanks,<br>The Bistro Bay Team</p>
  `

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `Order Update - ${orderDetails.orderId}`,
      html,
    })
    console.log(`Order status email sent to ${to}`)
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}
