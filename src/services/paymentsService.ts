import { db } from './db'
import { delay } from './latency'
import type { PaymentMethodType, PaymentTransaction } from '../types'
import { nextId } from '../lib/rng'

// Mirrors intended REST endpoints:
//   POST /payments
//   GET  /payments/:id
//   GET  /payments

let txnSeq = 1300 + db.payments.length

export interface RecordPaymentInput {
  orderId: string
  orderNumber: string
  customerName?: string
  amount: number
  method: PaymentMethodType
  stripePaymentId?: string
}

export async function recordPayment(input: RecordPaymentInput): Promise<PaymentTransaction> {
  txnSeq += 1
  const txn: PaymentTransaction = {
    id: nextId('pay'),
    txnNumber: `TXN-2026-${String(txnSeq).padStart(6, '0')}`,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    customerName: input.customerName,
    amount: input.amount,
    method: input.method,
    processor: input.method === 'Cash' ? 'Cash' : input.method === 'Member Account' ? 'Internal' : 'Stripe',
    status: 'Paid',
    stripePaymentId: input.stripePaymentId,
    createdAt: new Date().toISOString(),
  }
  db.payments.unshift(txn)
  return delay(txn, 150)
}

export async function listPayments(): Promise<PaymentTransaction[]> {
  return delay([...db.payments], 200)
}

export async function getPayment(id: string): Promise<PaymentTransaction | undefined> {
  return delay(db.payments.find((p) => p.id === id), 120)
}
