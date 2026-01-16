/**
 * Twilio SMS & WhatsApp Service
 * 
 * Handles sending SMS and WhatsApp messages via Twilio API
 */

import twilio from 'twilio'

// Initialize Twilio client
let twilioClient: twilio.Twilio | null = null

function getClient(): twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured')
    }
    
    twilioClient = twilio(accountSid, authToken)
  }
  return twilioClient
}

// =============================================================================
// SMS Functions
// =============================================================================

export interface SendSMSOptions {
  to: string
  message: string
  from?: string
}

export async function sendSMS(to: string, message: string, from?: string): Promise<string> {
  const client = getClient()
  const fromNumber = from || process.env.TWILIO_PHONE_NUMBER
  
  if (!fromNumber) {
    throw new Error('Twilio phone number not configured')
  }
  
  // Format phone number (ensure it has country code)
  const formattedTo = formatPhoneNumber(to)
  
  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedTo,
    })
    
    console.log(`SMS sent to ${formattedTo}: ${result.sid}`)
    return result.sid
  } catch (error: any) {
    console.error('Failed to send SMS:', error.message)
    throw new Error(`SMS sending failed: ${error.message}`)
  }
}

// =============================================================================
// WhatsApp Functions
// =============================================================================

export async function sendWhatsApp(to: string, message: string): Promise<string> {
  const client = getClient()
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER
  
  if (!whatsappNumber) {
    throw new Error('Twilio WhatsApp number not configured')
  }
  
  if (process.env.TWILIO_WHATSAPP_ENABLED !== 'true') {
    throw new Error('WhatsApp is not enabled')
  }
  
  const formattedTo = formatPhoneNumber(to)
  
  try {
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:${formattedTo}`,
    })
    
    console.log(`WhatsApp sent to ${formattedTo}: ${result.sid}`)
    return result.sid
  } catch (error: any) {
    console.error('Failed to send WhatsApp:', error.message)
    throw new Error(`WhatsApp sending failed: ${error.message}`)
  }
}

// =============================================================================
// Template Messages
// =============================================================================

export const smsTemplates = {
  orderConfirmation: (orderNumber: string, estimatedTime?: number) => {
    let msg = `Your order #${orderNumber} has been confirmed!`
    if (estimatedTime) {
      msg += ` Estimated ready time: ${estimatedTime} minutes.`
    }
    return msg
  },
  
  orderReady: (orderNumber: string, orderType: 'pickup' | 'delivery') => {
    if (orderType === 'pickup') {
      return `Your order #${orderNumber} is ready for pickup! Please collect it from the counter.`
    }
    return `Your order #${orderNumber} is out for delivery!`
  },
  
  orderDelivered: (orderNumber: string) => {
    return `Your order #${orderNumber} has been delivered. Thank you for ordering with us!`
  },
  
  reservationConfirmation: (date: string, time: string, partySize: number, restaurantName: string) => {
    return `Your reservation at ${restaurantName} is confirmed for ${date} at ${time} for ${partySize} guests. Reply CANCEL to cancel.`
  },
  
  reservationReminder: (time: string, partySize: number, restaurantName: string) => {
    return `Reminder: Your reservation at ${restaurantName} is today at ${time} for ${partySize} guests. See you soon!`
  },
  
  waitlistReady: (guestName: string, restaurantName: string) => {
    return `Hi ${guestName}! Your table at ${restaurantName} is ready. Please proceed to the host stand within 10 minutes.`
  },
  
  waitlistUpdate: (position: number, estimatedWait: number) => {
    return `You are now #${position} in line. Estimated wait time: ${estimatedWait} minutes.`
  },
  
  verificationCode: (code: string) => {
    return `Your verification code is: ${code}. This code expires in 10 minutes.`
  },
  
  passwordReset: (code: string) => {
    return `Your password reset code is: ${code}. This code expires in 15 minutes.`
  },
}

// =============================================================================
// Convenience Functions
// =============================================================================

export async function sendOrderConfirmationSMS(
  to: string,
  orderNumber: string,
  estimatedTime?: number
): Promise<string> {
  return sendSMS(to, smsTemplates.orderConfirmation(orderNumber, estimatedTime))
}

export async function sendOrderReadySMS(
  to: string,
  orderNumber: string,
  orderType: 'pickup' | 'delivery'
): Promise<string> {
  return sendSMS(to, smsTemplates.orderReady(orderNumber, orderType))
}

export async function sendReservationConfirmationSMS(
  to: string,
  date: string,
  time: string,
  partySize: number,
  restaurantName: string
): Promise<string> {
  return sendSMS(to, smsTemplates.reservationConfirmation(date, time, partySize, restaurantName))
}

export async function sendReservationReminderSMS(
  to: string,
  time: string,
  partySize: number,
  restaurantName: string
): Promise<string> {
  return sendSMS(to, smsTemplates.reservationReminder(time, partySize, restaurantName))
}

export async function sendWaitlistReadySMS(
  to: string,
  guestName: string,
  restaurantName: string,
  useWhatsApp = false
): Promise<string> {
  const message = smsTemplates.waitlistReady(guestName, restaurantName)
  return useWhatsApp ? sendWhatsApp(to, message) : sendSMS(to, message)
}

export async function sendVerificationCodeSMS(to: string, code: string): Promise<string> {
  return sendSMS(to, smsTemplates.verificationCode(code))
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format phone number to E.164 format
 * Handles Pakistani numbers and international formats
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // If starts with 0, assume Pakistani number
  if (cleaned.startsWith('0')) {
    cleaned = '+92' + cleaned.substring(1)
  }
  
  // If doesn't start with +, assume Pakistani number
  if (!cleaned.startsWith('+')) {
    // If 10 digits, add Pakistani code
    if (cleaned.length === 10) {
      cleaned = '+92' + cleaned
    }
    // If 11 digits starting with 92, add +
    else if (cleaned.length === 12 && cleaned.startsWith('92')) {
      cleaned = '+' + cleaned
    }
    // Otherwise just add +
    else {
      cleaned = '+' + cleaned
    }
  }
  
  return cleaned
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  // Basic E.164 validation: + followed by 10-15 digits
  return /^\+\d{10,15}$/.test(formatted)
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  )
}

/**
 * Check if WhatsApp is enabled
 */
export function isWhatsAppEnabled(): boolean {
  return (
    isTwilioConfigured() &&
    process.env.TWILIO_WHATSAPP_ENABLED === 'true' &&
    !!process.env.TWILIO_WHATSAPP_NUMBER
  )
}

/**
 * Get message delivery status
 */
export async function getMessageStatus(messageSid: string): Promise<string> {
  const client = getClient()
  const message = await client.messages(messageSid).fetch()
  return message.status
}

// =============================================================================
// Bulk Messaging (for marketing, with rate limiting)
// =============================================================================

export interface BulkSMSOptions {
  recipients: Array<{ to: string; message: string }>
  delayBetween?: number // ms between messages
}

export async function sendBulkSMS(options: BulkSMSOptions): Promise<Array<{ to: string; sid?: string; error?: string }>> {
  const { recipients, delayBetween = 100 } = options
  const results: Array<{ to: string; sid?: string; error?: string }> = []
  
  for (const { to, message } of recipients) {
    try {
      const sid = await sendSMS(to, message)
      results.push({ to, sid })
    } catch (error: any) {
      results.push({ to, error: error.message })
    }
    
    // Rate limiting delay
    if (delayBetween > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetween))
    }
  }
  
  return results
}

export default {
  sendSMS,
  sendWhatsApp,
  sendOrderConfirmationSMS,
  sendOrderReadySMS,
  sendReservationConfirmationSMS,
  sendReservationReminderSMS,
  sendWaitlistReadySMS,
  sendVerificationCodeSMS,
  sendBulkSMS,
  isValidPhoneNumber,
  isTwilioConfigured,
  isWhatsAppEnabled,
  getMessageStatus,
  smsTemplates,
}
