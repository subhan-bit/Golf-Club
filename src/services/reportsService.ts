import { db } from './db'
import { delay } from './latency'
import { round2 } from '../lib/format'

// Mirrors intended REST endpoint: GET /reports/sales

function isSameDay(iso: string, ref: Date) {
  const d = new Date(iso)
  return d.toDateString() === ref.toDateString()
}
function isWithinDays(iso: string, days: number) {
  const d = new Date(iso).getTime()
  return d >= Date.now() - days * 24 * 60 * 60 * 1000
}

export interface DashboardStats {
  todaySales: number
  weekSales: number
  monthSales: number
  transactions: number
  avgTransaction: number
  cashSales: number
  cardSales: number
  applePaySales: number
  refundsTotal: number
  vatCollected: number
  salesByDay: { date: string; sales: number }[]
  salesByCategory: { category: string; sales: number }[]
  paymentMethods: { method: string; value: number }[]
  topProducts: { name: string; qty: number; revenue: number }[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const paidOrders = db.orders.filter((o) => o.status === 'Paid' || o.status === 'Partially Refunded' || o.status === 'Refunded')

  const todaySales = round2(paidOrders.filter((o) => isSameDay(o.createdAt, now)).reduce((s, o) => s + o.total, 0))
  const weekSales = round2(paidOrders.filter((o) => isWithinDays(o.createdAt, 7)).reduce((s, o) => s + o.total, 0))
  const monthSales = round2(paidOrders.filter((o) => isWithinDays(o.createdAt, 30)).reduce((s, o) => s + o.total, 0))
  const transactions = paidOrders.length
  const avgTransaction = transactions ? round2(paidOrders.reduce((s, o) => s + o.total, 0) / transactions) : 0

  const cashSales = round2(db.payments.filter((p) => p.method === 'Cash').reduce((s, p) => s + p.amount, 0))
  const cardSales = round2(db.payments.filter((p) => p.method === 'Card' || p.method === 'Contactless').reduce((s, p) => s + p.amount, 0))
  const applePaySales = round2(db.payments.filter((p) => p.method === 'Apple Pay').reduce((s, p) => s + p.amount, 0))
  const refundsTotal = round2(db.refunds.reduce((s, r) => s + r.amount, 0))
  const vatCollected = round2(paidOrders.reduce((s, o) => s + o.vatTotal, 0))

  const dayMap = new Map<string, number>()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dayMap.set(d.toDateString(), 0)
  }
  for (const o of paidOrders) {
    const key = new Date(o.createdAt).toDateString()
    if (dayMap.has(key)) dayMap.set(key, round2((dayMap.get(key) ?? 0) + o.total))
  }
  const salesByDay = Array.from(dayMap.entries()).map(([date, sales]) => ({
    date: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    sales,
  }))

  const catMap = new Map<string, number>()
  const productQty = new Map<string, { qty: number; revenue: number }>()
  for (const o of paidOrders) {
    for (const item of o.items) {
      const product = db.products.find((p) => p.id === item.productId)
      const cat = product?.category ?? 'Other'
      catMap.set(cat, round2((catMap.get(cat) ?? 0) + item.lineTotal))
      const existing = productQty.get(item.productName) ?? { qty: 0, revenue: 0 }
      productQty.set(item.productName, { qty: existing.qty + item.qty, revenue: round2(existing.revenue + item.lineTotal) })
    }
  }
  const salesByCategory = Array.from(catMap.entries()).map(([category, sales]) => ({ category, sales }))
  const topProducts = Array.from(productQty.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  const methodMap = new Map<string, number>()
  for (const p of db.payments) {
    methodMap.set(p.method, round2((methodMap.get(p.method) ?? 0) + p.amount))
  }
  const paymentMethods = Array.from(methodMap.entries()).map(([method, value]) => ({ method, value }))

  return delay(
    {
      todaySales, weekSales, monthSales, transactions, avgTransaction,
      cashSales, cardSales, applePaySales, refundsTotal, vatCollected,
      salesByDay, salesByCategory, paymentMethods, topProducts,
    },
    280,
  )
}
