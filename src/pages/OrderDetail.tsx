import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import * as ordersService from '../services/ordersService'
import * as paymentsService from '../services/paymentsService'
import * as refundsService from '../services/refundsService'
import type { Order, PaymentTransaction, Refund, RefundReason } from '../types'
import { formatGBP, formatDateTime, round2 } from '../lib/format'
import { LoadingState, Modal, StatusBadge } from '../components/ui'
import { ArrowLeft, Undo2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { db } from '../services/db'

const REASONS: RefundReason[] = ['Customer request', 'Incorrect order', 'Damaged item', 'Other']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [payment, setPayment] = useState<PaymentTransaction | null>(null)
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [refundOpen, setRefundOpen] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    const o = await ordersService.getOrder(id)
    setOrder(o ?? null)
    if (o?.paymentId) {
      const p = await paymentsService.getPayment(o.paymentId)
      setPayment(p ?? null)
    }
    const allRefunds = await refundsService.listRefunds()
    setRefunds(allRefunds.filter((r) => r.orderId === id))
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <LoadingState label="Loading order…" />
  if (!order) {
    return (
      <div className="p-8">
        <p className="text-sm text-ink-500">Order not found.</p>
        <Link to="/orders" className="text-pine-700 text-sm font-medium">Back to Orders</Link>
      </div>
    )
  }

  const totalRefunded = round2(refunds.reduce((s, r) => s + r.amount, 0))
  const refundableRemaining = round2(order.total - totalRefunded)
  const till = db.tills.find((t) => t.id === order.tillId)

  return (
    <div className="h-full overflow-y-auto thin-scroll">
      <div className="px-8 py-6 border-b border-ink-100 bg-white flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/orders')} className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-600 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
          </button>
          <h1 className="text-xl font-semibold text-ink-900 font-display">{order.orderNumber}</h1>
          <p className="text-sm text-ink-500 mt-0.5">{formatDateTime(order.createdAt)} · {order.staffName} · {till?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {refundableRemaining > 0 && order.status !== 'Held' && (
            <button className="btn-danger" onClick={() => setRefundOpen(true)}>
              <Undo2 className="h-4 w-4" /> Refund
            </button>
          )}
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Item</th>
                  <th className="text-right font-medium py-2.5">Qty</th>
                  <th className="text-right font-medium py-2.5">Unit</th>
                  <th className="text-right font-medium py-2.5">Discount</th>
                  <th className="text-right font-medium px-5 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id} className="border-t border-ink-50">
                    <td className="px-5 py-3 text-ink-900">
                      {it.productName}
                      {it.refundedQty > 0 && <span className="badge bg-red-100 text-red-600 ml-2 text-[10px]">Refunded</span>}
                    </td>
                    <td className="py-3 text-right text-ink-500">{it.qty}</td>
                    <td className="py-3 text-right text-ink-500">{formatGBP(it.unitPrice)}</td>
                    <td className="py-3 text-right text-ink-500">{it.discountAmount > 0 ? `-${formatGBP(it.discountAmount)}` : '—'}</td>
                    <td className="px-5 py-3 text-right font-medium text-ink-900">{formatGBP(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-ink-100 px-5 py-4 space-y-1.5 bg-ink-50/50">
              <Row label="Subtotal" value={formatGBP(order.subtotal - order.discountTotal)} />
              {order.discountTotal > 0 && <Row label="Discount" value={`-${formatGBP(order.discountTotal)}`} tone="pine" />}
              <Row label="VAT" value={formatGBP(order.vatTotal)} />
              <Row label="Total" value={formatGBP(order.total)} bold />
              {totalRefunded > 0 && <Row label="Refunded" value={`-${formatGBP(totalRefunded)}`} tone="danger" />}
            </div>
          </div>

          {refunds.length > 0 && (
            <div className="card p-5">
              <p className="text-sm font-semibold text-ink-900 mb-3">Refund history</p>
              <div className="space-y-2">
                {refunds.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm border-b border-ink-50 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-ink-800">{r.refundNumber} <span className="text-ink-400">· {r.reason}</span></p>
                      <p className="text-xs text-ink-400">{formatDateTime(r.createdAt)} · {r.staffName}</p>
                    </div>
                    <span className="font-medium text-red-600">-{formatGBP(r.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-sm font-semibold text-ink-900 mb-3">Customer</p>
            {order.customer ? (
              <div>
                <p className="text-sm text-ink-800">{order.customer.name}</p>
                <p className="text-xs text-ink-400">{order.customer.type}</p>
              </div>
            ) : (
              <p className="text-sm text-ink-400">No customer identified</p>
            )}
          </div>
          <div className="card p-5">
            <p className="text-sm font-semibold text-ink-900 mb-3">Payment</p>
            {payment ? (
              <div className="space-y-1.5 text-sm">
                <Row label="Method" value={payment.method} />
                <Row label="Processor" value={payment.processor} />
                <Row label="Status" value={payment.status} />
                {payment.stripePaymentId && <Row label="Stripe ID" value={payment.stripePaymentId} mono />}
                <Row label="Transaction" value={payment.txnNumber} mono />
              </div>
            ) : (
              <p className="text-sm text-ink-400">Order not yet paid</p>
            )}
          </div>
        </div>
      </div>

      <RefundModal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        order={order}
        refundableRemaining={refundableRemaining}
        staffName={user?.name ?? 'Unknown'}
        onDone={() => {
          setRefundOpen(false)
          load()
        }}
      />
    </div>
  )
}

function Row({ label, value, bold, tone, mono }: { label: string; value: string; bold?: boolean; tone?: 'pine' | 'danger'; mono?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'text-base font-semibold text-ink-900' : 'text-sm'} ${tone === 'pine' ? 'text-pine-700' : tone === 'danger' ? 'text-red-600' : 'text-ink-500'}`}>
      <span>{label}</span>
      <span className={`${bold ? '' : 'text-ink-800'} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

function RefundModal({
  open, onClose, order, refundableRemaining, staffName, onDone,
}: { open: boolean; onClose: () => void; order: Order; refundableRemaining: number; staffName: string; onDone: () => void }) {
  const [mode, setMode] = useState<'full' | 'partial' | 'item'>('full')
  const [amount, setAmount] = useState(refundableRemaining)
  const [reason, setReason] = useState<RefundReason>('Customer request')
  const [note, setNote] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [stage, setStage] = useState<'form' | 'processing' | 'success' | 'error'>('form')
  const [error, setError] = useState<string | null>(null)
  const [resultId, setResultId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setMode('full')
      setAmount(refundableRemaining)
      setReason('Customer request')
      setNote('')
      setSelectedItems([])
      setStage('form')
      setError(null)
    }
  }, [open, refundableRemaining])

  const itemsAmount = round2(
    order.items.filter((i) => selectedItems.includes(i.id)).reduce((s, i) => s + i.lineTotal, 0),
  )

  async function submit() {
    setStage('processing')
    const refundAmount = mode === 'full' ? refundableRemaining : mode === 'item' ? itemsAmount : amount
    const result = await refundsService.createRefund({
      orderId: order.id,
      amount: refundAmount,
      reason,
      note: note || undefined,
      staffName,
      type: mode === 'full' ? 'Full' : mode === 'item' ? 'Item' : 'Partial',
      itemIds: mode === 'item' ? selectedItems : undefined,
    })
    if (!result.ok) {
      setError(result.error ?? 'Refund failed')
      setStage('error')
      return
    }
    setResultId(result.refund?.stripeRefundId ?? result.refund?.refundNumber ?? null)
    setStage('success')
  }

  return (
    <Modal open={open} onClose={onClose} title="Process refund" width="max-w-md">
      {stage === 'form' && (
        <div>
          <div className="flex gap-1 mb-4 bg-ink-100 rounded-md p-1">
            {(['full', 'partial', 'item'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors ${mode === m ? 'bg-white shadow-card text-pine-800' : 'text-ink-500'}`}
              >
                {m}
              </button>
            ))}
          </div>

          {mode === 'full' && (
            <p className="text-sm text-ink-600 mb-4">Refund the full remaining amount of <strong>{formatGBP(refundableRemaining)}</strong> to the original payment method.</p>
          )}

          {mode === 'partial' && (
            <div className="mb-4">
              <label className="label">Refund amount</label>
              <input
                type="number"
                className="input"
                max={refundableRemaining}
                min={0}
                value={amount}
                onChange={(e) => setAmount(Math.min(refundableRemaining, Math.max(0, Number(e.target.value))))}
              />
              <p className="text-xs text-ink-400 mt-1">Up to {formatGBP(refundableRemaining)} remaining</p>
            </div>
          )}

          {mode === 'item' && (
            <div className="mb-4 space-y-1.5">
              {order.items.filter((i) => i.refundedQty < i.qty).map((it) => (
                <label key={it.id} className="flex items-center justify-between rounded-md border border-ink-200 px-3 py-2 cursor-pointer hover:bg-ink-50">
                  <span className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(it.id)}
                      onChange={(e) =>
                        setSelectedItems((prev) => (e.target.checked ? [...prev, it.id] : prev.filter((x) => x !== it.id)))
                      }
                    />
                    {it.productName}
                  </span>
                  <span className="text-sm font-medium">{formatGBP(it.lineTotal)}</span>
                </label>
              ))}
              {selectedItems.length > 0 && (
                <p className="text-sm text-ink-600 pt-1">Refund total: <strong>{formatGBP(itemsAmount)}</strong></p>
              )}
            </div>
          )}

          <label className="label">Reason</label>
          <select className="input mb-4" value={reason} onChange={(e) => setReason(e.target.value as RefundReason)}>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <label className="label">Note (optional)</label>
          <textarea className="input mb-5" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Additional context for the audit log…" />

          <button
            className="btn-danger w-full"
            disabled={(mode === 'item' && selectedItems.length === 0) || (mode === 'partial' && amount <= 0)}
            onClick={submit}
          >
            Confirm refund of {formatGBP(mode === 'full' ? refundableRemaining : mode === 'item' ? itemsAmount : amount)}
          </button>
        </div>
      )}

      {stage === 'processing' && (
        <div className="flex flex-col items-center py-10">
          <Loader2 className="h-8 w-8 text-pine-700 animate-spin mb-3" />
          <p className="text-sm text-ink-500">Processing refund via Stripe…</p>
        </div>
      )}

      {stage === 'success' && (
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle2 className="h-12 w-12 text-pine-600 mb-3" />
          <p className="text-lg font-semibold text-ink-900">Refund successful</p>
          {resultId && <p className="text-xs font-mono text-ink-400 mt-1">{resultId}</p>}
          <button className="btn-primary w-full mt-5" onClick={onDone}>Done</button>
        </div>
      )}

      {stage === 'error' && (
        <div className="flex flex-col items-center text-center py-4">
          <XCircle className="h-12 w-12 text-red-500 mb-3" />
          <p className="text-lg font-semibold text-ink-900">Refund failed</p>
          <p className="text-sm text-ink-500 mt-1">{error}</p>
          <button className="btn-secondary w-full mt-5" onClick={() => setStage('form')}>Back</button>
        </div>
      )}
    </Modal>
  )
}
