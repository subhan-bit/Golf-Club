import { db } from './db'
import { delay } from './latency'
import type { BasketLine, Customer, Order, OrderItem, StaffUser } from '../types'
import { nextId } from '../lib/rng'
import { round2 } from '../lib/format'
import { vatRateFor } from './db'

// Mirrors intended REST endpoints:
//   GET  /orders            (filters: range, search)
//   GET  /orders/:id
//   POST /orders             — create order from basket at checkout

let orderSeq = 1300 + db.orders.length

export interface CreateOrderInput {
  basket: BasketLine[]
  customer?: Customer
  staff: StaffUser
  tillId: string
  basketDiscountPercent?: number
}

function computeOrderTotals(basket: BasketLine[], basketDiscountPercent = 0) {
  const items: OrderItem[] = basket.map((line) => {
    const vat = vatRateFor(line.product)
    const grossBeforeExtra = line.unitPrice * line.qty
    const memberDiscount = line.memberDiscountApplied ? (line.product.sellPrice - line.unitPrice) * line.qty : 0
    const lineDiscount = line.lineDiscountAmount ?? (line.lineDiscountPercent ? grossBeforeExtra * (line.lineDiscountPercent / 100) : 0)
    const basketDiscountShare = grossBeforeExtra * (basketDiscountPercent / 100)
    const totalDiscount = round2(memberDiscount + lineDiscount + basketDiscountShare)
    const lineTotal = round2(grossBeforeExtra - lineDiscount - basketDiscountShare)
    return {
      id: nextId('itm'),
      productId: line.product.id,
      productName: line.product.name,
      qty: line.qty,
      unitPrice: line.unitPrice,
      vatRate: vat,
      discountAmount: totalDiscount,
      lineTotal,
      refundedQty: 0,
    }
  })
  const subtotal = round2(basket.reduce((s, l) => s + l.product.sellPrice * l.qty, 0))
  const discountTotal = round2(items.reduce((s, i) => s + i.discountAmount, 0))
  const vatTotal = round2(
    items.reduce((s, i) => {
      const gross = i.lineTotal
      const vatPortion = gross - gross / (1 + i.vatRate)
      return s + vatPortion
    }, 0),
  )
  const total = round2(items.reduce((s, i) => s + i.lineTotal, 0))
  return { items, subtotal, discountTotal, vatTotal, total }
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { items, subtotal, discountTotal, vatTotal, total } = computeOrderTotals(input.basket, input.basketDiscountPercent)
  orderSeq += 1
  const order: Order = {
    id: nextId('ord'),
    orderNumber: `ORD-2026-${String(orderSeq).padStart(6, '0')}`,
    createdAt: new Date().toISOString(),
    staffId: input.staff.id,
    staffName: input.staff.name,
    tillId: input.tillId,
    customer: input.customer,
    items,
    subtotal,
    discountTotal,
    vatTotal,
    total,
    status: 'Held',
  }
  db.orders.unshift(order)
  return delay(order, 200)
}

export async function markOrderPaid(orderId: string, paymentId: string): Promise<Order | undefined> {
  const order = db.orders.find((o) => o.id === orderId)
  if (!order) return delay(undefined, 100)
  order.status = 'Paid'
  order.paymentId = paymentId
  return delay(order, 150)
}

export async function listOrders(): Promise<Order[]> {
  return delay([...db.orders], 220)
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return delay(db.orders.find((o) => o.id === id), 150)
}

export function computePreview(basket: BasketLine[], basketDiscountPercent = 0) {
  return computeOrderTotals(basket, basketDiscountPercent)
}
