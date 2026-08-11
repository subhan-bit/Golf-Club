import { useEffect, useState } from 'react'
import { PageHeader, LoadingState, EmptyState } from '../components/ui'
import * as refundsService from '../services/refundsService'
import type { Refund } from '../types'
import { formatGBP, formatDateTime } from '../lib/format'
import { Undo2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Refunds() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    refundsService.listRefunds().then((r) => {
      setRefunds(r)
      setLoading(false)
    })
  }, [])

  const total = refunds.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Refunds" subtitle={`${refunds.length} refunds · ${formatGBP(total)} total`} />
      <div className="flex-1 overflow-y-auto thin-scroll">
        {loading ? (
          <LoadingState label="Loading refunds…" />
        ) : refunds.length === 0 ? (
          <EmptyState icon={<Undo2 className="h-8 w-8" />} title="No refunds recorded" />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-cream/95 backdrop-blur text-xs uppercase tracking-wide text-ink-400 border-b border-ink-100">
              <tr>
                <th className="text-left font-medium px-8 py-2.5">Refund</th>
                <th className="text-left font-medium py-2.5">Order</th>
                <th className="text-left font-medium py-2.5">Type</th>
                <th className="text-left font-medium py-2.5">Reason</th>
                <th className="text-left font-medium py-2.5">Staff</th>
                <th className="text-right font-medium py-2.5">Amount</th>
                <th className="text-left font-medium px-8 py-2.5">Date</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/orders/${r.orderId}`)} className="border-b border-ink-50 hover:bg-white cursor-pointer">
                  <td className="px-8 py-3 font-mono text-xs text-ink-700">{r.refundNumber}</td>
                  <td className="py-3 text-ink-500">{r.orderNumber}</td>
                  <td className="py-3 text-ink-500">{r.type}</td>
                  <td className="py-3 text-ink-500">{r.reason}</td>
                  <td className="py-3 text-ink-500">{r.staffName}</td>
                  <td className="py-3 text-right font-medium text-red-600">-{formatGBP(r.amount)}</td>
                  <td className="px-8 py-3 text-ink-500">{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
