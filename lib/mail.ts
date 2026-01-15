import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
})

export const sendVerificationEmail = async (email: string, name: string, token: string) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Silquetech'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: process.env.EMAIL_SUBJECT || 'Verify Your Account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e2e2; border-radius: 10px;">
        <h2 style="color: #16a34a; text-align: center; text-transform: uppercase; font-weight: 900;">Welcome!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for creating an account. We're excited to have you on board!</p>
        <p>To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}
