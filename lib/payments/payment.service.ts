/**
 * Payment Service
 * Handles payment processing, transaction management, and refunds
 */

import { prisma } from '@/lib/db/prisma'
import { Prisma, TransactionStatus, PaymentStatus } from '@prisma/client'
import { getGateway, generateTransactionNumber, type GatewayProvider, type PaymentRequest } from './gateways'

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessPaymentInput {
    orderId: string
    paymentMethodId: string
    amount: number
    tipAmount?: number
    terminalId?: string
    shiftId?: string
    isSplitPayment?: boolean
    splitIndex?: number
    customerEmail?: string
    customerPhone?: string
}

export interface PaymentMethodInput {
    name: string
    code: string
    type: 'CASH' | 'CARD' | 'DIGITAL_WALLET' | 'BANK_TRANSFER' | 'ONLINE'
    gatewayProvider?: string
    gatewayConfig?: Prisma.JsonValue
    isActive?: boolean
    requiresAuth?: boolean
    allowsRefund?: boolean
    allowsTip?: boolean
    feeType?: string
    feePercentage?: number
    feeFixed?: number
    displayOrder?: number
    iconUrl?: string
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export async function getPaymentMethods(activeOnly = true) {
    return prisma.paymentMethod.findMany({
        where: activeOnly ? { isActive: true } : undefined,
        orderBy: { displayOrder: 'asc' }
    })
}

export async function createPaymentMethod(input: PaymentMethodInput) {
    return prisma.paymentMethod.create({
        data: {
            name: input.name,
            code: input.code,
            type: input.type,
            gatewayProvider: input.gatewayProvider,
            gatewayConfig: input.gatewayConfig ?? Prisma.JsonNull,
            isActive: input.isActive ?? true,
            requiresAuth: input.requiresAuth ?? false,
            allowsRefund: input.allowsRefund ?? true,
            allowsTip: input.allowsTip ?? false,
            feeType: input.feeType,
            feePercentage: input.feePercentage,
            feeFixed: input.feeFixed,
            displayOrder: input.displayOrder ?? 0,
            iconUrl: input.iconUrl,
        }
    })
}

export async function updatePaymentMethod(id: string, input: Partial<PaymentMethodInput>) {
    // Transform input to handle JSON null values properly
    const { gatewayConfig, ...rest } = input
    const data: Prisma.PaymentMethodUpdateInput = {
        ...rest,
        ...(gatewayConfig !== undefined && {
            gatewayConfig: gatewayConfig ?? Prisma.JsonNull
        }),
    }
    return prisma.paymentMethod.update({
        where: { id },
        data
    })
}

// ============================================================================
// PROCESS PAYMENT
// ============================================================================

export async function processPayment(input: ProcessPaymentInput) {
    // Get payment method and order
    const [paymentMethod, order] = await Promise.all([
        prisma.paymentMethod.findUnique({ where: { id: input.paymentMethodId } }),
        prisma.order.findUnique({ where: { id: input.orderId } })
    ])

    if (!paymentMethod) {
        throw new Error('Payment method not found')
    }

    if (!order) {
        throw new Error('Order not found')
    }

    // Calculate fee
    let feeAmount = 0
    if (paymentMethod.feeType === 'percentage' && paymentMethod.feePercentage) {
        feeAmount = input.amount * Number(paymentMethod.feePercentage)
    } else if (paymentMethod.feeType === 'fixed' && paymentMethod.feeFixed) {
        feeAmount = Number(paymentMethod.feeFixed)
    } else if (paymentMethod.feeType === 'both') {
        const percentageFee = paymentMethod.feePercentage ? input.amount * Number(paymentMethod.feePercentage) : 0
        const fixedFee = paymentMethod.feeFixed ? Number(paymentMethod.feeFixed) : 0
        feeAmount = percentageFee + fixedFee
    }

    const tipAmount = input.tipAmount || 0
    const netAmount = input.amount - feeAmount

    // Create transaction record
    const transaction = await prisma.transaction.create({
        data: {
            transactionNumber: generateTransactionNumber(),
            orderId: input.orderId,
            paymentMethodId: input.paymentMethodId,
            terminalId: input.terminalId,
            shiftId: input.shiftId,
            amount: input.amount,
            tipAmount,
            feeAmount,
            netAmount,
            isSplitPayment: input.isSplitPayment || false,
            splitIndex: input.splitIndex,
            status: TransactionStatus.PROCESSING,
        }
    })

    try {
        // Get gateway and process payment
        const gatewayProvider = (paymentMethod.gatewayProvider || 'cash') as GatewayProvider
        const gateway = getGateway(gatewayProvider)

        const paymentRequest: PaymentRequest = {
            amount: input.amount,
            paymentMethodId: input.paymentMethodId,
            orderId: input.orderId,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            metadata: { transactionNumber: transaction.transactionNumber }
        }

        const result = await gateway.processPayment(paymentRequest)

        // Update transaction with result
        const status = result.success
            ? TransactionStatus.COMPLETED
            : TransactionStatus.FAILED

        const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                status,
                gatewayRef: result.gatewayRef,
                gatewayResponse: (result.gatewayResponse as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                processedAt: result.success ? new Date() : null,
            },
            include: {
                paymentMethod: true,
                order: true,
            }
        })

        // Update order payment status if successful
        if (result.success) {
            await updateOrderPaymentStatus(input.orderId)
        }

        return {
            success: result.success,
            transaction: updatedTransaction,
            error: result.error
        }
    } catch (error) {
        // Mark transaction as failed
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.FAILED }
        })
        throw error
    }
}

// ============================================================================
// REFUND
// ============================================================================

export async function processRefund(
    transactionId: string,
    amount: number,
    reason: string,
    refundedBy: string
) {
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { paymentMethod: true }
    })

    if (!transaction) {
        throw new Error('Transaction not found')
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
        throw new Error('Can only refund completed transactions')
    }

    const alreadyRefunded = Number(transaction.refundedAmount)
    const maxRefundable = Number(transaction.amount) - alreadyRefunded

    if (amount > maxRefundable) {
        throw new Error(`Maximum refundable amount is ${maxRefundable}`)
    }

    // Process refund via gateway
    const gatewayProvider = (transaction.paymentMethod.gatewayProvider || 'cash') as GatewayProvider
    const gateway = getGateway(gatewayProvider)

    const result = await gateway.processRefund({
        transactionId: transaction.id,
        amount,
        reason,
        gatewayRef: transaction.gatewayRef || undefined
    })

    if (!result.success) {
        throw new Error(result.error || 'Refund failed')
    }

    // Update transaction
    const newRefundedAmount = alreadyRefunded + amount
    const isFullyRefunded = newRefundedAmount >= Number(transaction.amount)

    const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
            refundedAmount: newRefundedAmount,
            refundReason: reason,
            refundedAt: new Date(),
            refundedBy,
            status: isFullyRefunded
                ? TransactionStatus.REFUNDED
                : TransactionStatus.PARTIALLY_REFUNDED
        },
        include: { paymentMethod: true, order: true }
    })

    // Update order payment status
    await updateOrderPaymentStatus(transaction.orderId)

    return updatedTransaction
}

// ============================================================================
// GET TRANSACTIONS
// ============================================================================

export async function getTransactionsByOrder(orderId: string) {
    return prisma.transaction.findMany({
        where: { orderId },
        include: { paymentMethod: true },
        orderBy: { createdAt: 'asc' }
    })
}

export async function getTransactionById(id: string) {
    return prisma.transaction.findUnique({
        where: { id },
        include: {
            paymentMethod: true,
            order: true,
            terminal: true,
            shift: true,
        }
    })
}

// ============================================================================
// HELPERS
// ============================================================================

async function updateOrderPaymentStatus(orderId: string) {
    const transactions = await prisma.transaction.findMany({
        where: { orderId, status: TransactionStatus.COMPLETED }
    })

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    })

    if (!order) return

    const totalPaid = transactions.reduce((sum, t) => {
        const amount = Number(t.amount)
        const refunded = Number(t.refundedAmount)
        return sum + (amount - refunded)
    }, 0)

    const orderTotal = Number(order.total)

    let paymentStatus: PaymentStatus
    if (totalPaid >= orderTotal) {
        paymentStatus = PaymentStatus.PAID
    } else if (totalPaid > 0) {
        paymentStatus = PaymentStatus.PARTIAL
    } else {
        paymentStatus = PaymentStatus.UNPAID
    }

    // Check if all refunded
    const totalRefunded = transactions.reduce((sum, t) => sum + Number(t.refundedAmount), 0)
    const totalCharged = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
    if (totalRefunded >= totalCharged && totalCharged > 0) {
        paymentStatus = PaymentStatus.REFUNDED
    }

    await prisma.order.update({
        where: { id: orderId },
        data: {
            paymentStatus,
            paidAmount: totalPaid
        }
    })
}
