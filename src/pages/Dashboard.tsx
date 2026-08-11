import { useEffect, useState } from 'react'
import { PageHeader, StatCard, LoadingState } from '../components/ui'
import * as reportsService from '../services/reportsService'
import type { DashboardStats } from '../services/reportsService'
import { formatGBP } from '../lib/format'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

const PIE_COLORS = ['#1b3b2f', '#3f715c', '#b08d57', '#d4ae6e', '#6c665f']

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    reportsService.getDashboardStats().then(setStats)
  }, [])

  return (
    <div className="h-full overflow-y-auto thin-scroll">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? ''}`}
        subtitle="Here's how Royal Green Golf Club is trading today."
        actions={
          <button className="btn-primary" onClick={() => navigate('/pos')}>
            Open POS <ArrowUpRight className="h-4 w-4" />
          </button>
        }
      />
      <div className="p-8 space-y-6">
        {!stats ? (
          <LoadingState label="Loading dashboard…" />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Today's Sales" value={formatGBP(stats.todaySales)} tone="brass" />
              <StatCard label="Transactions" value={String(stats.transactions)} sub="last 30 days" />
              <StatCard label="Average Sale" value={formatGBP(stats.avgTransaction)} />
              <StatCard label="Refunds" value={formatGBP(stats.refundsTotal)} tone="danger" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 card p-5">
                <p className="text-sm font-semibold text-ink-900 mb-4">Sales over time (last 14 days)</p>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={stats.salesByDay}>
                    <defs>
                      <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1b3b2f" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#1b3b2f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e6e4" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#87817a' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#87817a' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `£${v}`} />
                    <Tooltip formatter={(v: number) => formatGBP(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e6e4' }} />
                    <Area type="monotone" dataKey="sales" stroke="#1b3b2f" strokeWidth={2} fill="url(#sales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-5">
                <p className="text-sm font-semibold text-ink-900 mb-4">Payment methods</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stats.paymentMethods} dataKey="value" nameKey="method" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {stats.paymentMethods.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatGBP(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e7e6e4' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {stats.paymentMethods.map((m, i) => (
                    <div key={m.method} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-ink-500">
                        <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {m.method}
                      </span>
                      <span className="font-medium text-ink-800">{formatGBP(m.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <p className="text-sm font-semibold text-ink-900 mb-4">Sales by category</p>
                <div className="space-y-2.5">
                  {stats.salesByCategory.sort((a, b) => b.sales - a.sales).map((c) => {
                    const max = Math.max(...stats.salesByCategory.map((x) => x.sales), 1)
                    return (
                      <div key={c.category}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-ink-600 font-medium">{c.category}</span>
                          <span className="text-ink-400">{formatGBP(c.sales)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                          <div className="h-full bg-pine-700 rounded-full" style={{ width: `${(c.sales / max) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="card p-5">
                <p className="text-sm font-semibold text-ink-900 mb-4">Top-selling products</p>
                <table className="w-full text-sm">
                  <tbody>
                    {stats.topProducts.map((p, i) => (
                      <tr key={p.name} className="border-b border-ink-50 last:border-0">
                        <td className="py-2 text-ink-400 w-6">{i + 1}</td>
                        <td className="py-2 text-ink-800">{p.name}</td>
                        <td className="py-2 text-ink-400 text-right">{p.qty} sold</td>
                        <td className="py-2 text-ink-900 font-medium text-right">{formatGBP(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Cash Sales" value={formatGBP(stats.cashSales)} />
              <StatCard label="Card Sales" value={formatGBP(stats.cardSales)} />
              <StatCard label="Apple Pay Sales" value={formatGBP(stats.applePaySales)} />
              <StatCard label="VAT Collected" value={formatGBP(stats.vatCollected)} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
