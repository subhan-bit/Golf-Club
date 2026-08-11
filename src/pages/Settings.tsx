import { useEffect, useState } from 'react'
import { PageHeader } from '../components/ui'
import { db } from '../services/db'
import { CLUB } from '../data/seedCore'
import * as staffService from '../services/staffService'
import type { AuditLogEntry } from '../types'
import { formatDateTime } from '../lib/format'
import { stripeIsDemoMode } from '../services/stripeService'
import { ShieldCheck, KeyRound } from 'lucide-react'

export default function Settings() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  useEffect(() => { staffService.listAuditLogs().then(setLogs) }, [])

  return (
    <div className="h-full overflow-y-auto thin-scroll">
      <PageHeader title="Settings" subtitle="Club configuration, tax rules, discounts, and payment setup" />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <p className="text-sm font-semibold text-ink-900 mb-4">Club details</p>
          <div className="space-y-2.5 text-sm">
            <Row label="Club name" value={CLUB.name} />
            <Row label="Address" value={CLUB.address} />
            <Row label="VAT number" value={CLUB.vatNumber} />
            <Row label="Phone" value={CLUB.phone} />
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold text-ink-900 mb-4 flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-pine-700" /> Payment processor
          </p>
          <div className="space-y-2.5 text-sm">
            <Row label="Provider" value="Stripe Terminal / Stripe Payments" />
            <Row label="Mode" value={stripeIsDemoMode ? 'Demo (mocked)' : 'Live'} />
            <Row label="Secret key" value="•••••••• (server-side only, never exposed to frontend)" />
            <Row label="Publishable key" value={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'Not configured — using demo mode'} />
          </div>
          <p className="text-xs text-ink-400 mt-3 flex items-start gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-pine-600" />
            No card numbers, CVV, or PINs are ever collected or stored by this application.
          </p>
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold text-ink-900 mb-4">VAT rates</p>
          <table className="w-full text-sm">
            <tbody>
              {db.vatRates.map((v) => (
                <tr key={v.id} className="border-b border-ink-50 last:border-0">
                  <td className="py-2 text-ink-800">{v.name}</td>
                  <td className="py-2 text-right text-ink-500">{(v.rate * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold text-ink-900 mb-4">Discount rules</p>
          <table className="w-full text-sm">
            <tbody>
              {db.discountRules.map((d) => (
                <tr key={d.id} className="border-b border-ink-50 last:border-0">
                  <td className="py-2 text-ink-800">{d.appliesTo}</td>
                  <td className="py-2 text-right text-ink-500">{d.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-2 card p-5">
          <p className="text-sm font-semibold text-ink-900 mb-4">Audit log</p>
          <div className="space-y-2 max-h-80 overflow-y-auto thin-scroll">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start justify-between text-sm border-b border-ink-50 pb-2 last:border-0">
                <div>
                  <p className="text-ink-800">{l.action} <span className="text-ink-400">— {l.detail}</span></p>
                  <p className="text-xs text-ink-400">{l.staffName}</p>
                </div>
                <span className="text-xs text-ink-400 shrink-0 ml-4">{formatDateTime(l.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink-500 shrink-0">{label}</span>
      <span className="text-ink-900 font-medium text-right">{value}</span>
    </div>
  )
}
