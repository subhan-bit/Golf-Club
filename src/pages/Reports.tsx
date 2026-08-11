import { useEffect, useMemo, useState } from 'react'
import { PageHeader, LoadingState, StatCard } from '../components/ui'
import { db } from '../services/db'
import { formatGBP } from '../lib/format'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

type Range = 'today' | 'week' | 'month' | 'all'

export default function Reports() {
  const [range, setRange] = useState<Range>('month')
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  const data = useMemo(() => {
    const now = new Date()
    const orders = db.orders.filter((o) => o.status !== 'Held' && o.status !== 'Cancelled').filter((o) => {
      const d = new Date(o.createdAt)
      if (range === 'today') return d.toDateString() === now.toDateString()
      if (range === 'week') return now.getTime() - d.getTime() <= 7 * 86400000
      if (range === 'month') return now.getTime() - d.getTime() <= 30 * 86400000
      return true
    })

    const vatByRate = new Map<string, { name: string; rate: number; net: number; vat: number; gross: number }>()
    for (const vr of db.vatRates) vatByRate.set(vr.id, { name: vr.name, rate: vr.rate, net: 0, vat: 0, gross: 0 })
    for (const o of orders) {
      for (const item of o.items) {
        const product = db.products.find((p) => p.id === item.productId)
        const vrId = product?.vatRateId ?? 'vat-std'
        const bucket = vatByRate.get(vrId)
        if (!bucket) continue
        const gross = item.lineTotal
        const net = gross / (1 + item.vatRate)
        bucket.gross += gross
        bucket.net += net
        bucket.vat += gross - net
      }
    }

    const staffTotals = new Map<string, number>()
    for (const o of orders) staffTotals.set(o.staffName, (staffTotals.get(o.staffName) ?? 0) + o.total)

    const grossTotal = orders.reduce((s, o) => s + o.total, 0)
    const vatTotal = orders.reduce((s, o) => s + o.vatTotal, 0)
    const discountTotal = orders.reduce((s, o) => s + o.discountTotal, 0)

    return {
      orderCount: orders.length,
      grossTotal, vatTotal, discountTotal,
      vatBreakdown: Array.from(vatByRate.values()).filter((v) => v.gross > 0),
      staffTotals: Array.from(staffTotals.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total),
    }
  }, [range])

  return (
    <div className="h-full overflow-y-auto thin-scroll">
      <PageHeader
        title="Reports"
        subtitle="VAT, staff performance, and sales summaries"
        actions={
          <div className="flex gap-1.5">
            {(['today', 'week', 'month', 'all'] as Range[]).map((r) => (
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
        }
      />
      <div className="p-8 space-y-6">
        {!ready ? (
          <LoadingState />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Orders" value={String(data.orderCount)} />
              <StatCard label="Gross Sales" value={formatGBP(data.grossTotal)} tone="brass" />
              <StatCard label="VAT Collected" value={formatGBP(data.vatTotal)} />
              <StatCard label="Discounts Given" value={formatGBP(data.discountTotal)} />
            </div>

            <div className="card p-5">
              <p className="text-sm font-semibold text-ink-900 mb-4">VAT breakdown by rate</p>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-ink-400 border-b border-ink-100">
                  <tr>
                    <th className="text-left font-medium py-2">Rate</th>
                    <th className="text-right font-medium py-2">Net</th>
                    <th className="text-right font-medium py-2">VAT</th>
                    <th className="text-right font-medium py-2">Gross</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vatBreakdown.map((v) => (
                    <tr key={v.name} className="border-b border-ink-50 last:border-0">
                      <td className="py-2.5 text-ink-800">{v.name} ({(v.rate * 100).toFixed(0)}%)</td>
                      <td className="py-2.5 text-right text-ink-500">{formatGBP(v.net)}</td>
                      <td className="py-2.5 text-right text-ink-500">{formatGBP(v.vat)}</td>
                      <td className="py-2.5 text-right font-medium text-ink-900">{formatGBP(v.gross)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card p-5">
              <p className="text-sm font-semibold text-ink-900 mb-4">Sales by staff member</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.staffTotals}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e6e4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#87817a' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#87817a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
                  <Tooltip formatter={(v: number) => formatGBP(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e6e4' }} />
                  <Bar dataKey="total" fill="#1b3b2f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
