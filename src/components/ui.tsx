import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between px-8 py-6 border-b border-ink-100 bg-white">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 font-display">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Modal({
  open, onClose, title, children, width = 'max-w-lg',
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 backdrop-blur-[2px] p-4">
      <div className={`w-full ${width} card shadow-modal max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-ink-100 text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto thin-scroll p-5">{children}</div>
      </div>
    </div>
  )
}

export function StatCard({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'brass' | 'danger' }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold font-display ${tone === 'brass' ? 'text-brass-600' : tone === 'danger' ? 'text-red-600' : 'text-ink-900'}`}>{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  'In Stock': 'bg-pine-100 text-pine-700',
  'Low Stock': 'bg-amber-100 text-amber-700',
  'Out of Stock': 'bg-red-100 text-red-700',
  Paid: 'bg-pine-100 text-pine-700',
  Held: 'bg-amber-100 text-amber-700',
  Refunded: 'bg-red-100 text-red-700',
  'Partially Refunded': 'bg-amber-100 text-amber-700',
  Failed: 'bg-red-100 text-red-700',
  Cancelled: 'bg-ink-100 text-ink-500',
  Active: 'bg-pine-100 text-pine-700',
  Suspended: 'bg-amber-100 text-amber-700',
  Lapsed: 'bg-ink-100 text-ink-500',
  Open: 'bg-pine-100 text-pine-700',
  Closed: 'bg-ink-100 text-ink-500',
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_STYLES[status] ?? 'bg-ink-100 text-ink-600'}`}>{status}</span>
}

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && <div className="mb-3 text-ink-300">{icon}</div>}
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {description && <p className="text-xs text-ink-400 mt-1 max-w-xs">{description}</p>}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-2 text-sm text-ink-400">
        <span className="h-3.5 w-3.5 rounded-full border-2 border-ink-300 border-t-pine-700 animate-spin" />
        {label}
      </div>
    </div>
  )
}
