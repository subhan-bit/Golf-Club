import { useEffect, useMemo, useState } from 'react'
import { PageHeader, LoadingState, EmptyState, StatusBadge } from '../components/ui'
import * as paymentsService from '../services/paymentsService'
import type { PaymentTransaction } from '../types'
import { formatGBP, formatDateTime } from '../lib/format'
import { Search, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Payments() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('All')
  const navigate = useNavigate()

  useEffect(() => {
    paymentsService.listPayments().then((p) => {
      setPayments(p)
      setLoading(false)
    })
  }, [])

  const methods = ['All', 'Card', 'Contactless', 'Apple Pay', 'Google Pay', 'Cash', 'Member Account']

  const filtered = useMemo(
    () =>
      payments
        .filter((p) => methodFilter === 'All' || p.method === methodFilter)
        .filter(
          (p) =>
            p.txnNumber.toLowerCase().includes(query.toLowerCase()) ||
            p.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
            (p.stripePaymentId ?? '').toLowerCase().includes(query.toLowerCase()) ||
            (p.customerName ?? '').toLowerCase().includes(query.toLowerCase()),
        ),
    [payments, query, methodFilter],
  )

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Payments" subtitle={`${payments.length} transactions`} />
      <div className="px-8 py-4 border-b border-ink-100 bg-white flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pl-9" placeholder="Search transaction, order, or Stripe ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto thin-scroll">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                methodFilter === m ? 'bg-pine-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto thin-scroll">
        {loading ? (
          <LoadingState label="Loading payments…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<CreditCard className="h-8 w-8" />} title="No payments found" />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-cream/95 backdrop-blur text-xs uppercase tracking-wide text-ink-400 border-b border-ink-100">
              <tr>
                <th className="text-left font-medium px-8 py-2.5">Transaction</th>
                <th className="text-left font-medium py-2.5">Order</th>
                <th className="text-left font-medium py-2.5">Customer</th>
                <th className="text-left font-medium py-2.5">Method</th>
                <th className="text-left font-medium py-2.5">Processor</th>
                <th className="text-right font-medium py-2.5">Amount</th>
                <th className="text-left font-medium py-2.5">Status</th>
                <th className="text-left font-medium px-8 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/orders/${p.orderId}`)} className="border-b border-ink-50 hover:bg-white cursor-pointer">
                  <td className="px-8 py-3 font-mono text-xs text-ink-700">{p.txnNumber}</td>
                  <td className="py-3 text-ink-500">{p.orderNumber}</td>
                  <td className="py-3 text-ink-700">{p.customerName ?? '—'}</td>
                  <td className="py-3 text-ink-500">{p.method}</td>
                  <td className="py-3 text-ink-500">{p.processor}</td>
                  <td className="py-3 text-right font-medium text-ink-900">{formatGBP(p.amount)}</td>
                  <td className="py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-8 py-3 text-ink-500">{formatDateTime(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
