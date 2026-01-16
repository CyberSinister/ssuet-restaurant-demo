/**
 * Payment Gateway Integrations
 * Supports: Cash, Stripe, JazzCash, Easypaisa
 */

import Stripe from 'stripe'

// Initialize Stripe if key is available
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
    : null

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentRequest {
    amount: number
    currency?: string
    paymentMethodId: string
    orderId: string
    customerEmail?: string
    customerPhone?: string
    metadata?: Record<string, string>
}

export interface PaymentResult {
    success: boolean
    transactionId?: string
    gatewayRef?: string
    status: 'completed' | 'pending' | 'failed'
    error?: string
    gatewayResponse?: Record<string, unknown>
}

export interface RefundRequest {
    transactionId: string
    amount: number
    reason?: string
    gatewayRef?: string
}

export interface RefundResult {
    success: boolean
    refundId?: string
    status: 'completed' | 'pending' | 'failed'
    error?: string
}

// ============================================================================
// CASH GATEWAY (No external processing)
// ============================================================================

export const cashGateway = {
    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        // Cash payments are always successful immediately
        return {
            success: true,
            transactionId: `CASH-${Date.now()}`,
            gatewayRef: null as unknown as string,
            status: 'completed',
            gatewayResponse: { method: 'cash', amount: request.amount }
        }
    },

    async processRefund(_request: RefundRequest): Promise<RefundResult> {
        return {
            success: true,
            refundId: `CASH-REFUND-${Date.now()}`,
            status: 'completed'
        }
    }
}

// ============================================================================
// STRIPE GATEWAY
// ============================================================================

export const stripeGateway = {
    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        if (!stripe) {
            return {
                success: false,
                status: 'failed',
                error: 'Stripe is not configured'
            }
        }

        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(request.amount * 100), // Convert to cents
                currency: request.currency || 'pkr',
                payment_method_types: ['card'],
                metadata: {
                    orderId: request.orderId,
                    ...request.metadata
                },
                receipt_email: request.customerEmail,
            })

            return {
                success: true,
                gatewayRef: paymentIntent.id,
                status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
                gatewayResponse: {
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount,
                    client_secret: paymentIntent.client_secret
                }
            }
        } catch (error: unknown) {
            const stripeError = error as { message?: string }
            return {
                success: false,
                status: 'failed',
                error: stripeError.message || 'Stripe payment failed'
            }
        }
    },

    async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
        if (!stripe) {
            return { success: false, status: 'failed', error: 'Stripe is not configured' }
        }

        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
            return {
                success: paymentIntent.status === 'succeeded',
                gatewayRef: paymentIntent.id,
                status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
                gatewayResponse: { status: paymentIntent.status }
            }
        } catch (error: unknown) {
            const stripeError = error as { message?: string }
            return { success: false, status: 'failed', error: stripeError.message }
        }
    },

    async processRefund(request: RefundRequest): Promise<RefundResult> {
        if (!stripe || !request.gatewayRef) {
            return { success: false, status: 'failed', error: 'Stripe is not configured or missing gateway ref' }
        }

        try {
            const refund = await stripe.refunds.create({
                payment_intent: request.gatewayRef,
                amount: Math.round(request.amount * 100),
                reason: 'requested_by_customer',
            })

            return {
                success: refund.status === 'succeeded',
                refundId: refund.id,
                status: refund.status === 'succeeded' ? 'completed' : 'pending'
            }
        } catch (error: unknown) {
            const stripeError = error as { message?: string }
            return { success: false, status: 'failed', error: stripeError.message }
        }
    }
}

// ============================================================================
// JAZZCASH GATEWAY (Pakistan)
// ============================================================================

interface JazzCashConfig {
    merchantId: string
    password: string
    integrityHash: string
    apiUrl: string
}

function getJazzCashConfig(): JazzCashConfig | null {
    const merchantId = process.env.JAZZCASH_MERCHANT_ID
    const password = process.env.JAZZCASH_PASSWORD
    const integrityHash = process.env.JAZZCASH_INTEGRITY_HASH

    if (!merchantId || !password || !integrityHash) {
        return null
    }

    return {
        merchantId,
        password,
        integrityHash,
        apiUrl: process.env.JAZZCASH_API_URL || 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/PAY'
    }
}

export const jazzCashGateway = {
    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        const config = getJazzCashConfig()
        if (!config) {
            return { success: false, status: 'failed', error: 'JazzCash is not configured' }
        }

        try {
            const txnRefNo = `JC${Date.now()}`
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pp_Amount: Math.round(request.amount * 100).toString(),
                    pp_BillReference: request.orderId,
                    pp_Description: `Order ${request.orderId}`,
                    pp_Language: 'EN',
                    pp_MerchantID: config.merchantId,
                    pp_Password: config.password,
                    pp_TxnRefNo: txnRefNo,
                    pp_TxnType: 'MWALLET',
                    pp_MobileNumber: request.customerPhone,
                    pp_CNIC: '', // Optional
                    ppmpf_1: request.orderId,
                })
            })

            const data = await response.json() as { pp_ResponseCode?: string; pp_ResponseMessage?: string; pp_TxnRefNo?: string }

            if (data.pp_ResponseCode === '000') {
                return {
                    success: true,
                    gatewayRef: data.pp_TxnRefNo || txnRefNo,
                    status: 'completed',
                    gatewayResponse: data
                }
            }

            return {
                success: false,
                status: 'failed',
                error: data.pp_ResponseMessage || 'JazzCash payment failed',
                gatewayResponse: data
            }
        } catch (error: unknown) {
            const fetchError = error as { message?: string }
            return { success: false, status: 'failed', error: fetchError.message || 'JazzCash request failed' }
        }
    },

    async processRefund(_request: RefundRequest): Promise<RefundResult> {
        // JazzCash refunds typically require manual processing or different API
        return {
            success: false,
            status: 'pending',
            error: 'JazzCash refunds require manual processing. Please contact support.'
        }
    }
}

// ============================================================================
// EASYPAISA GATEWAY (Pakistan)
// ============================================================================

interface EasypaisaConfig {
    storeId: string
    hashKey: string
    apiUrl: string
}

function getEasypaisaConfig(): EasypaisaConfig | null {
    const storeId = process.env.EASYPAISA_STORE_ID
    const hashKey = process.env.EASYPAISA_HASH_KEY

    if (!storeId || !hashKey) {
        return null
    }

    return {
        storeId,
        hashKey,
        apiUrl: process.env.EASYPAISA_API_URL || 'https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction'
    }
}

export const easypaisaGateway = {
    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        const config = getEasypaisaConfig()
        if (!config) {
            return { success: false, status: 'failed', error: 'Easypaisa is not configured' }
        }

        try {
            const orderId = `EP${Date.now()}`
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: config.storeId,
                    orderId,
                    transactionAmount: request.amount.toFixed(2),
                    mobileAccountNo: request.customerPhone,
                    emailAddress: request.customerEmail || '',
                })
            })

            const data = await response.json() as { responseCode?: string; responseDesc?: string; transactionId?: string }

            if (data.responseCode === '0000') {
                return {
                    success: true,
                    gatewayRef: data.transactionId,
                    status: 'completed',
                    gatewayResponse: data
                }
            }

            return {
                success: false,
                status: 'failed',
                error: data.responseDesc || 'Easypaisa payment failed',
                gatewayResponse: data
            }
        } catch (error: unknown) {
            const fetchError = error as { message?: string }
            return { success: false, status: 'failed', error: fetchError.message || 'Easypaisa request failed' }
        }
    },

    async processRefund(_request: RefundRequest): Promise<RefundResult> {
        return {
            success: false,
            status: 'pending',
            error: 'Easypaisa refunds require manual processing. Please contact support.'
        }
    }
}

// ============================================================================
// GATEWAY FACTORY
// ============================================================================

export type GatewayProvider = 'cash' | 'stripe' | 'jazzcash' | 'easypaisa'

export function getGateway(provider: GatewayProvider) {
    switch (provider) {
        case 'cash':
            return cashGateway
        case 'stripe':
            return stripeGateway
        case 'jazzcash':
            return jazzCashGateway
        case 'easypaisa':
            return easypaisaGateway
        default:
            throw new Error(`Unknown payment gateway: ${provider}`)
    }
}

// ============================================================================
// UTILITY: Generate transaction number
// ============================================================================

export function generateTransactionNumber(): string {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `TXN-${dateStr}-${random}`
}
