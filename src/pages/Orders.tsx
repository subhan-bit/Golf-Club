import { useEffect, useMemo, useState } from 'react'
import { PageHeader, LoadingState, EmptyState, StatusBadge } from '../components/ui'
import * as ordersService from '../services/ordersService'
import * as paymentsService from '../services/paymentsService'
import type { Order } from '../types'
import { formatGBP, formatDateTime } from '../lib/format'
import { useNavigate } from 'react-router-dom'
import { Search, ClipboardList } from 'lucide-react'

type RangeFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<RangeFilter>('all')
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([ordersService.listOrders(), paymentsService.listPayments()]).then(([o, payments]) => {
      setOrders(o)
      const map: Record<string, string> = {}
      for (const p of payments) map[p.orderId] = p.method
      setPaymentMethods(map)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const now = new Date()
    return orders.filter((o) => {
      const d = new Date(o.createdAt)
      if (range === 'today' && d.toDateString() !== now.toDateString()) return false
      if (range === 'yesterday') {
        const y = new Date(now)
        y.setDate(y.getDate() - 1)
        if (d.toDateString() !== y.toDateString()) return false
      }
      if (range === 'week' && now.getTime() - d.getTime() > 7 * 86400000) return false
      if (range === 'month' && now.getTime() - d.getTime() > 30 * 86400000) return false
      if (query) {
        const q = query.toLowerCase()
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer?.name.toLowerCase().includes(q) ||
          o.paymentId?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [orders, range, query])

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Orders" subtitle={`${orders.length} total orders`} />
      <div className="px-8 py-4 border-b border-ink-100 bg-white flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pl-9" placeholder="Search order ID, member, or transaction…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {(['today', 'yesterday', 'week', 'month', 'all'] as RangeFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                range === r ? 'bg-pine-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {r === 'week' ? 'This week' : r === 'month' ? 'This month' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll">
        {loading ? (
          <LoadingState label="Loading orders…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ClipboardList className="h-8 w-8" />} title="No orders found" description="Try widening your filters." />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-cream/95 backdrop-blur text-xs uppercase tracking-wide text-ink-400 border-b border-ink-100">
              <tr>
                <th className="text-left font-medium px-8 py-2.5">Order</th>
                <th className="text-left font-medium py-2.5">Date</th>
                <th className="text-left font-medium py-2.5">Customer</th>
                <th className="text-left font-medium py-2.5">Staff</th>
                <th className="text-right font-medium py-2.5">Amount</th>
                <th className="text-left font-medium py-2.5">Payment</th>
                <th className="text-left font-medium py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="border-b border-ink-50 hover:bg-white cursor-pointer"
                >
                  <td className="px-8 py-3 font-medium text-ink-900">{o.orderNumber}</td>
                  <td className="py-3 text-ink-500">{formatDateTime(o.createdAt)}</td>
                  <td className="py-3 text-ink-700">{o.customer?.name ?? '—'}</td>
                  <td className="py-3 text-ink-500">{o.staffName}</td>
                  <td className="py-3 text-right font-medium text-ink-900">{formatGBP(o.total)}</td>
                  <td className="py-3 text-ink-500">{paymentMethods[o.id] ?? '—'}</td>
                  <td className="py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
