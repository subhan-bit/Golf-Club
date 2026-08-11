import { useState } from 'react'
import { Modal } from '../ui'
import { Printer, Mail, ReceiptText, CheckCircle2 } from 'lucide-react'
import type { Order, PaymentTransaction } from '../../types'
import { formatGBP, formatDateTime } from '../../lib/format'
import { CLUB } from '../../data/seedCore'

export default function ReceiptModal({
  open, order, payment, onNewSale,
}: { open: boolean; order: Order | null; payment: PaymentTransaction | null; onNewSale: () => void }) {
  const [emailed, setEmailed] = useState(false)
  const [printed, setPrinted] = useState(false)

  if (!open || !order || !payment) return null

  return (
    <Modal open={open} onClose={onNewSale} title="Receipt" width="max-w-sm">
      <div className="font-mono text-xs bg-white border border-dashed border-ink-300 rounded-md p-5">
        <div className="text-center mb-3">
          <p className="text-sm font-bold tracking-wide">{CLUB.name.toUpperCase()}</p>
          <p className="text-[10px] text-ink-500">{CLUB.address}</p>
          <p className="text-[10px] text-ink-500">VAT No. {CLUB.vatNumber}</p>
        </div>
        <div className="border-t border-dashed border-ink-300 pt-2 mb-2">
          <p>Receipt #{order.orderNumber.split('-').pop()}</p>
          {order.customer && <p>{order.customer.name}{order.customer.type === 'Member' ? ' — Member' : ''}</p>}
          <p>{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="border-t border-dashed border-ink-300 pt-2 space-y-1">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between gap-2">
              <span className="truncate">{it.qty} × {it.productName}</span>
              <span>{formatGBP(it.lineTotal)}</span>
            </div>
          ))}
        </div>
        {order.discountTotal > 0 && (
          <div className="border-t border-dashed border-ink-300 mt-2 pt-2 flex justify-between text-pine-700">
            <span>Discount</span>
            <span>-{formatGBP(order.discountTotal)}</span>
          </div>
        )}
        <div className="border-t border-dashed border-ink-300 mt-2 pt-2 space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatGBP(order.subtotal - order.discountTotal)}</span></div>
          <div className="flex justify-between"><span>VAT</span><span>{formatGBP(order.vatTotal)}</span></div>
        </div>
        <div className="border-t border-ink-400 mt-2 pt-2 flex justify-between text-sm font-bold">
          <span>TOTAL</span><span>{formatGBP(order.total)}</span>
        </div>
        <div className="border-t border-dashed border-ink-300 mt-3 pt-2">
          <div className="flex justify-between"><span>Payment</span><span>{payment.method}</span></div>
          <div className="flex justify-between"><span>Transaction</span><span className="truncate">{payment.txnNumber}</span></div>
        </div>
        <p className="text-center mt-4">Thank you.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          className="btn-secondary"
          onClick={() => setPrinted(true)}
        >
          <Printer className="h-4 w-4" /> {printed ? 'Printed ✓' : 'Print Receipt'}
        </button>
        <button
          className="btn-secondary"
          onClick={() => setEmailed(true)}
        >
          <Mail className="h-4 w-4" /> {emailed ? 'Sent ✓' : 'Email Receipt'}
        </button>
      </div>
      {(printed || emailed) && (
        <p className="flex items-center gap-1.5 text-xs text-pine-700 mt-2 justify-center">
          <CheckCircle2 className="h-3.5 w-3.5" /> {printed && emailed ? 'Printed and emailed (simulated)' : printed ? 'Sent to receipt printer (simulated)' : 'Emailed to customer (simulated)'}
        </p>
      )}

      <button className="btn-primary w-full mt-4" onClick={onNewSale}>
        <ReceiptText className="h-4 w-4" /> New Sale
      </button>
    </Modal>
  )
}
