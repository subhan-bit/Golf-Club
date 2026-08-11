import { useMemo } from 'react'
import { PageHeader, EmptyState, StatusBadge } from '../components/ui'
import { db } from '../services/db'
import { formatGBP, formatDateTime } from '../lib/format'
import { UserCircle } from 'lucide-react'

export default function Customers() {
  const rows = useMemo(() => {
    const map = new Map<string, { name: string; type: string; orders: number; spend: number; lastSeen: string }>()
    for (const o of db.orders) {
      if (!o.customer) continue
      const key = `${o.customer.type}-${o.customer.name}-${o.customer.memberId ?? ''}`
      const existing = map.get(key)
      if (existing) {
        existing.orders += 1
        existing.spend += o.total
        if (o.createdAt > existing.lastSeen) existing.lastSeen = o.createdAt
      } else {
        map.set(key, { name: o.customer.name, type: o.customer.type, orders: 1, spend: o.total, lastSeen: o.createdAt })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.spend - a.spend)
  }, [])

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Customers" subtitle="Members, visitors, guests, staff, and corporate accounts who have transacted at the till" />
      <div className="flex-1 overflow-y-auto thin-scroll">
        {rows.length === 0 ? (
          <EmptyState icon={<UserCircle className="h-8 w-8" />} title="No customer activity yet" />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-cream/95 backdrop-blur text-xs uppercase tracking-wide text-ink-400 border-b border-ink-100">
              <tr>
                <th className="text-left font-medium px-8 py-2.5">Customer</th>
                <th className="text-left font-medium py-2.5">Type</th>
                <th className="text-right font-medium py-2.5">Orders</th>
                <th className="text-right font-medium py-2.5">Total Spend</th>
                <th className="text-left font-medium px-8 py-2.5">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-ink-50 hover:bg-white">
                  <td className="px-8 py-3 font-medium text-ink-900">{r.name}</td>
                  <td className="py-3"><StatusBadge status={r.type === 'Member' ? 'Active' : r.type} /></td>
                  <td className="py-3 text-right text-ink-500">{r.orders}</td>
                  <td className="py-3 text-right font-medium text-ink-900">{formatGBP(r.spend)}</td>
                  <td className="px-8 py-3 text-ink-500">{formatDateTime(r.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
