// ─────────────────────────────────────────────────────────────────────────
// Mock "database" layer.
//
// This module holds mutable, in-memory arrays that stand in for PostgreSQL
// tables during the prototype. Every service in this folder reads/writes
// through here rather than touching component state directly, so that in
// production this file is the ONLY thing that needs replacing with real
// HTTP calls to a FastAPI backend — the service function signatures
// (see productsService.ts, ordersService.ts, etc.) would not need to change.
// ─────────────────────────────────────────────────────────────────────────
import type {
  Product, Member, Customer, Order, OrderItem, PaymentTransaction, Refund,
  Till, TillSession, InventoryMovement, AuditLogEntry, DiscountRule,
  MemberAccountTransaction, PaymentMethodType,
} from '../types'
import { PRODUCTS } from '../data/seedProducts'
import { MEMBERS } from '../data/seedMembers'
import { VAT_RATES, STAFF, SUPPLIERS, TILLS, DISCOUNT_RULES } from '../data/seedCore'
import { mulberry32, pick, randInt, nextId } from '../lib/rng'
import { round2 } from '../lib/format'

export const db = {
  products: [...PRODUCTS] as Product[],
  members: [...MEMBERS] as Member[],
  customers: [] as Customer[],
  vatRates: [...VAT_RATES],
  staff: [...STAFF],
  suppliers: [...SUPPLIERS],
  tills: [...TILLS] as Till[],
  tillSessions: [] as TillSession[],
  discountRules: [...DISCOUNT_RULES] as DiscountRule[],
  orders: [] as Order[],
  payments: [] as PaymentTransaction[],
  refunds: [] as Refund[],
  inventoryMovements: [] as InventoryMovement[],
  auditLogs: [] as AuditLogEntry[],
  memberAccountTxns: [] as MemberAccountTransaction[],
}

export function vatRateFor(product: Product): number {
  const vr = db.vatRates.find((v) => v.id === product.vatRateId)
  return vr ? vr.rate : 0
}

// ── Historical demo data generation ────────────────────────────────────────
const rand = mulberry32(20260805)

const PAYMENT_METHODS: PaymentMethodType[] = ['Card', 'Contactless', 'Apple Pay', 'Google Pay', 'Cash']
const PAYMENT_WEIGHTS = [0.18, 0.32, 0.22, 0.13, 0.15] // roughly reflects contactless-heavy clubhouse spend

function weightedPaymentMethod(): PaymentMethodType {
  const r = rand()
  let cum = 0
  for (let i = 0; i < PAYMENT_METHODS.length; i++) {
    cum += PAYMENT_WEIGHTS[i]
    if (r <= cum) return PAYMENT_METHODS[i]
  }
  return 'Card'
}

function buildOrderFromBasket(
  items: { product: Product; qty: number; memberDiscount: number }[],
  opts: { staffId: string; staffName: string; tillId: string; customer?: Customer; createdAt: string; orderNo: string },
): Order {
  const orderItems: OrderItem[] = items.map((it) => {
    const vat = vatRateFor(it.product)
    const base = it.product.sellPrice
    const unitPrice = it.memberDiscount > 0 && it.product.memberPrice ? it.product.memberPrice : base
    const discountAmount = round2((base - unitPrice) * it.qty)
    const lineGross = round2(unitPrice * it.qty)
    return {
      id: nextId('itm'),
      productId: it.product.id,
      productName: it.product.name,
      qty: it.qty,
      unitPrice,
      vatRate: vat,
      discountAmount,
      lineTotal: lineGross,
      refundedQty: 0,
    }
  })
  const subtotal = round2(orderItems.reduce((s, i) => s + i.unitPrice * i.qty + i.discountAmount, 0))
  const discountTotal = round2(orderItems.reduce((s, i) => s + i.discountAmount, 0))
  const vatTotal = round2(
    orderItems.reduce((s, i) => {
      // VAT-inclusive pricing: extract VAT portion from gross line total
      const gross = i.lineTotal
      const vatPortion = gross - gross / (1 + i.vatRate)
      return s + vatPortion
    }, 0),
  )
  const total = round2(orderItems.reduce((s, i) => s + i.lineTotal, 0))

  return {
    id: nextId('ord'),
    orderNumber: opts.orderNo,
    createdAt: opts.createdAt,
    staffId: opts.staffId,
    staffName: opts.staffName,
    tillId: opts.tillId,
    customer: opts.customer,
    items: orderItems,
    subtotal,
    discountTotal,
    vatTotal,
    total,
    status: 'Paid',
  }
}

function generateHistoricalData() {
  const sellable = db.products.filter((p) => p.category !== 'Membership')
  const now = new Date()
  let orderCounter = 1200

  for (let i = 0; i < 58; i++) {
    orderCounter += 1
    const daysAgo = randInt(rand, 0, 29)
    const hour = randInt(rand, 7, 20)
    const minute = randInt(rand, 0, 59)
    const created = new Date(now)
    created.setDate(created.getDate() - daysAgo)
    created.setHours(hour, minute, 0, 0)

    const staff = pick(rand, db.staff)
    const till = pick(rand, db.tills)
    const isMemberSale = rand() < 0.55
    const member = isMemberSale ? pick(rand, db.members.filter((m) => m.status === 'Active')) : undefined

    const lineCount = randInt(rand, 1, 4)
    const items: { product: Product; qty: number; memberDiscount: number }[] = []
    for (let l = 0; l < lineCount; l++) {
      const product = pick(rand, sellable)
      const qty = randInt(rand, 1, 3)
      items.push({ product, qty, memberDiscount: member ? member.discountPercent : 0 })
    }

    const customer: Customer | undefined = member
      ? { id: nextId('cust'), type: 'Member', name: member.name, email: member.email, memberId: member.id }
      : rand() < 0.3
        ? { id: nextId('cust'), type: 'Visitor', name: 'Walk-in Visitor' }
        : undefined

    const orderNo = `ORD-2026-${String(orderCounter).padStart(6, '0')}`
    const order = buildOrderFromBasket(items, {
      staffId: staff.id,
      staffName: staff.name,
      tillId: till.id,
      customer,
      createdAt: created.toISOString(),
      orderNo,
    })

    const method = weightedPaymentMethod()
    const txnNo = `TXN-2026-${String(orderCounter).padStart(6, '0')}`
    const payment: PaymentTransaction = {
      id: nextId('pay'),
      txnNumber: txnNo,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: customer?.name,
      amount: order.total,
      method,
      processor: method === 'Cash' ? 'Cash' : 'Stripe',
      status: 'Paid',
      stripePaymentId: method === 'Cash' ? undefined : `pi_demo_${nextId('').slice(-10)}`,
      createdAt: order.createdAt,
    }
    order.paymentId = payment.id
    db.orders.push(order)
    db.payments.push(payment)

    // Inventory movements for the sale
    for (const it of items) {
      const product = db.products.find((p) => p.id === it.product.id)
      if (product && product.stockQty !== 999) {
        product.stockQty = Math.max(0, product.stockQty - it.qty)
        db.inventoryMovements.push({
          id: nextId('mov'),
          productId: product.id,
          productName: product.name,
          type: 'Sale',
          qtyChange: -it.qty,
          balanceAfter: product.stockQty,
          staffName: staff.name,
          note: `Sold on ${order.orderNumber}`,
          createdAt: order.createdAt,
        })
      }
    }

    // Sprinkle in a handful of refunds on older orders
    if (daysAgo > 3 && rand() < 0.09) {
      const isFull = rand() < 0.4
      const refundAmount = isFull ? order.total : round2(order.total * (0.3 + rand() * 0.4))
      const refund: Refund = {
        id: nextId('ref'),
        refundNumber: `REF-2026-${String(orderCounter).padStart(6, '0')}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: refundAmount,
        reason: pick(rand, ['Customer request', 'Incorrect order', 'Damaged item', 'Other'] as const),
        staffName: pick(rand, db.staff).name,
        stripeRefundId: method === 'Cash' ? undefined : `re_demo_${nextId('').slice(-10)}`,
        createdAt: new Date(created.getTime() + 1000 * 60 * 60 * randInt(rand, 1, 20)).toISOString(),
        type: isFull ? 'Full' : 'Partial',
      }
      db.refunds.push(refund)
      order.status = isFull ? 'Refunded' : 'Partially Refunded'
      payment.status = isFull ? 'Refunded' : 'Partially Refunded'
    }
  }

  // Sort newest first
  db.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  db.payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  db.refunds.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // A few low/out-of-stock products for demo purposes are already reflected
  // by the sale simulation above. Force a couple of guaranteed examples too:
  const forceLow = db.products.find((p) => p.sku === 'FD-006')
  if (forceLow) forceLow.stockQty = 3
  const forceOut = db.products.find((p) => p.sku === 'PS-004')
  if (forceOut) forceOut.stockQty = 0

  // Seed member account transactions from account balances
  for (const m of db.members) {
    if (m.accountBalance !== 0) {
      db.memberAccountTxns.push({
        id: nextId('mat'),
        memberId: m.id,
        type: m.accountBalance >= 0 ? 'Top Up' : 'Charge',
        amount: Math.abs(m.accountBalance),
        balanceAfter: m.accountBalance,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      })
    }
  }

  // Seed a closed till session for history
  db.tillSessions.push({
    id: nextId('sess'),
    tillId: 'till-1',
    staffName: 'Sarah Jones',
    openedAt: new Date(new Date().setDate(now.getDate() - 1)).toISOString(),
    closedAt: new Date(new Date().setDate(now.getDate() - 1)).toISOString(),
    openingBalance: 150,
    expectedCash: 890.5,
    actualCash: 885.5,
    difference: -5,
    cashSales: 740.5,
    cardSales: 2140.25,
  })

  // Seed initial audit log entries
  db.auditLogs.push(
    { id: nextId('log'), timestamp: new Date(now.getTime() - 1000 * 60 * 90).toISOString(), staffName: 'Sarah Jones', action: 'Till opened', detail: 'Till 1 — opening float £150.00' },
    { id: nextId('log'), timestamp: new Date(now.getTime() - 1000 * 60 * 60).toISOString(), staffName: 'Michael Osei', action: 'Stock adjustment', detail: 'Tee Pegs (Pack of 50) adjusted to 2 units — low stock' },
    { id: nextId('log'), timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), staffName: 'Sarah Jones', action: 'Refund', detail: 'Refunded £25.00 on ORD-2026-001292' },
  )
}

generateHistoricalData()
