import { useState } from 'react'
import { Minus, Plus, Trash2, UserPlus, Tag, ShoppingBag, PauseCircle, XCircle } from 'lucide-react'
import { useBasket } from '../../context/BasketContext'
import { formatGBP } from '../../lib/format'
import CustomerModal from './CustomerModal'
import DiscountModal from './DiscountModal'
import PaymentModal from './PaymentModal'
import ReceiptModal from './ReceiptModal'
import type { Order, PaymentTransaction } from '../../types'
import { EmptyState } from '../ui'

export default function BasketPanel() {
  const { lines, member, customer, totals, incrementLine, decrementLine, removeLine, clearBasket, setCustomer } = useBasket()
  const [customerOpen, setCustomerOpen] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [completedPayment, setCompletedPayment] = useState<PaymentTransaction | null>(null)
  const [heldMessage, setHeldMessage] = useState(false)

  function onPaid(order: Order, payment: PaymentTransaction) {
    setCompletedOrder(order)
    setCompletedPayment(payment)
    setPaymentOpen(false)
    setReceiptOpen(true)
  }

  function newSale() {
    setReceiptOpen(false)
    setCompletedOrder(null)
    setCompletedPayment(null)
  }

  function holdOrder() {
    setHeldMessage(true)
    setTimeout(() => setHeldMessage(false), 2000)
  }

  return (
    <div className="w-[380px] shrink-0 border-l border-ink-100 bg-white flex flex-col h-full">
      <div className="px-5 py-4 border-b border-ink-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-ink-900 flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4 text-pine-700" /> Basket
          </h2>
          <span className="text-xs text-ink-400">{totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''}</span>
        </div>
        {customer ? (
          <button
            onClick={() => setCustomerOpen(true)}
            className="w-full flex items-center justify-between rounded-md bg-pine-50 border border-pine-200 px-3 py-2 text-left hover:bg-pine-100"
          >
            <div>
              <p className="text-sm font-medium text-pine-900">{customer.name}</p>
              <p className="text-xs text-pine-600">{member ? `${member.membershipNo} · ${member.tier}` : customer.type}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setCustomer(null) }}
              className="rounded-full p-1 hover:bg-pine-200 text-pine-700"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </button>
        ) : (
          <button onClick={() => setCustomerOpen(true)} className="w-full btn-secondary justify-start">
            <UserPlus className="h-4 w-4" /> Find Member / Add Customer
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll">
        {lines.length === 0 ? (
          <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="Basket is empty" description="Tap a product to add it to the sale." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {lines.map((line) => (
              <li key={line.lineId} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{line.product.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-ink-400">{formatGBP(line.unitPrice)} each</span>
                      {line.memberDiscountApplied && <span className="badge bg-brass-100 text-brass-700 text-[10px]">Member price</span>}
                    </div>
                  </div>
                  <button onClick={() => removeLine(line.lineId)} className="text-ink-300 hover:text-red-500 shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 bg-ink-100 rounded-md">
                    <button onClick={() => decrementLine(line.lineId)} className="p-1.5 hover:bg-ink-200 rounded-l-md">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{line.qty}</span>
                    <button onClick={() => incrementLine(line.lineId)} className="p-1.5 hover:bg-ink-200 rounded-r-md">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">{formatGBP(line.unitPrice * line.qty)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-ink-100 px-5 py-4 space-y-1.5">
        <div className="flex justify-between text-sm text-ink-500">
          <span>Subtotal</span><span>{formatGBP(totals.subtotal)}</span>
        </div>
        {totals.discountTotal > 0 && (
          <div className="flex justify-between text-sm text-pine-700">
            <span>Discount</span><span>-{formatGBP(totals.discountTotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-ink-500">
          <span>VAT</span><span>{formatGBP(totals.vatTotal)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-ink-900 pt-1.5 border-t border-ink-100 mt-1.5">
          <span>Total</span><span>{formatGBP(totals.total)}</span>
        </div>
      </div>

      <div className="px-5 pb-5 pt-1 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-secondary" onClick={holdOrder} disabled={lines.length === 0}>
            <PauseCircle className="h-4 w-4" /> {heldMessage ? 'Held ✓' : 'Hold Order'}
          </button>
          <button className="btn-secondary" onClick={clearBasket} disabled={lines.length === 0}>
            <Trash2 className="h-4 w-4" /> Clear Basket
          </button>
        </div>
        <button className="btn-secondary w-full" onClick={() => setDiscountOpen(true)} disabled={lines.length === 0}>
          <Tag className="h-4 w-4" /> Discount
        </button>
        <button className="btn-brass w-full !py-3 text-base" onClick={() => setPaymentOpen(true)} disabled={lines.length === 0}>
          Pay {formatGBP(totals.total)}
        </button>
      </div>

      <CustomerModal open={customerOpen} onClose={() => setCustomerOpen(false)} />
      <DiscountModal open={discountOpen} onClose={() => setDiscountOpen(false)} />
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} onPaid={onPaid} />
      <ReceiptModal open={receiptOpen} order={completedOrder} payment={completedPayment} onNewSale={newSale} />
    </div>
  )
}
