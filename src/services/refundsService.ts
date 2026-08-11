import { db } from './db'
import { delay } from './latency'
import type { Refund, RefundReason } from '../types'
import { nextId } from '../lib/rng'
import { refundPayment } from './stripeService'
import { round2 } from '../lib/format'

// Mirrors intended REST endpoints:
//   POST /refunds
//   GET  /refunds

let refundSeq = 1300 + db.refunds.length

export interface CreateRefundInput {
  orderId: string
  amount: number
  reason: RefundReason
  note?: string
  staffName: string
  type: 'Full' | 'Partial' | 'Item'
  itemIds?: string[]
}

export async function createRefund(input: CreateRefundInput): Promise<{ ok: boolean; refund?: Refund; error?: string }> {
  const order = db.orders.find((o) => o.id === input.orderId)
  if (!order) return { ok: false, error: 'Order not found' }

  const payment = db.payments.find((p) => p.orderId === order.id)
  let stripeRefundId: string | undefined

  try {
    if (payment && payment.processor === 'Stripe' && payment.stripePaymentId) {
      const result = await refundPayment(payment.stripePaymentId, input.amount)
      stripeRefundId = result.id
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Refund processor error' }
  }

  refundSeq += 1
  const refund: Refund = {
    id: nextId('ref'),
    refundNumber: `REF-2026-${String(refundSeq).padStart(6, '0')}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: input.amount,
    reason: input.reason,
    note: input.note,
    staffName: input.staffName,
    stripeRefundId,
    createdAt: new Date().toISOString(),
    type: input.type,
  }
  db.refunds.unshift(refund)

  const alreadyRefunded = db.refunds
    .filter((r) => r.orderId === order.id && r.id !== refund.id)
    .reduce((s, r) => s + r.amount, 0)
  const totalRefunded = round2(alreadyRefunded + input.amount)
  order.status = totalRefunded >= order.total - 0.01 ? 'Refunded' : 'Partially Refunded'

  if (input.itemIds && input.itemIds.length) {
    for (const itemId of input.itemIds) {
      const item = order.items.find((i) => i.id === itemId)
      if (item) item.refundedQty = item.qty
    }
  }

  if (payment) {
    payment.status = order.status === 'Refunded' ? 'Refunded' : 'Partially Refunded'
  }

  db.auditLogs.unshift({
    id: nextId('log'),
    timestamp: refund.createdAt,
    staffName: input.staffName,
    action: 'Refund',
    detail: `Refunded ${formatAmount(input.amount)} on ${order.orderNumber} (${input.reason})`,
  })

  return delay({ ok: true, refund }, 200)
}

function formatAmount(n: number) {
  return `£${n.toFixed(2)}`
}

export async function listRefunds(): Promise<Refund[]> {
  return delay([...db.refunds], 200)
}
