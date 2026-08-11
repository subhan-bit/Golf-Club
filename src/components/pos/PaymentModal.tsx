import { useState } from 'react'
import { Modal } from '../ui'
import { CreditCard, Wifi, Smartphone, Banknote, Wallet, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useBasket } from '../../context/BasketContext'
import { useAuth } from '../../context/AuthContext'
import { useTill } from '../../context/TillContext'
import type { Order, PaymentMethodType, PaymentTransaction } from '../../types'
import * as ordersService from '../../services/ordersService'
import * as paymentsService from '../../services/paymentsService'
import * as stripeService from '../../services/stripeService'
import * as inventoryService from '../../services/inventoryService'
import * as membersService from '../../services/membersService'
import { formatGBP } from '../../lib/format'

type Stage = 'select' | 'terminal' | 'processing' | 'success' | 'failed' | 'cash' | 'account-error'

const METHODS: { type: PaymentMethodType; icon: typeof CreditCard; note?: string }[] = [
  { type: 'Contactless', icon: Wifi },
  { type: 'Card', icon: CreditCard },
  { type: 'Apple Pay', icon: Smartphone },
  { type: 'Google Pay', icon: Wallet },
  { type: 'Cash', icon: Banknote },
]

export default function PaymentModal({
  open, onClose, onPaid,
}: { open: boolean; onClose: () => void; onPaid: (order: Order, payment: PaymentTransaction) => void }) {
  const { lines, member, customer, totals, basketDiscountPercent, clearBasket } = useBasket()
  const { user } = useAuth()
  const { activeTill } = useTill()
  const [stage, setStage] = useState<Stage>('select')
  const [method, setMethod] = useState<PaymentMethodType | null>(null)
  const [cashGiven, setCashGiven] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const [lastPayment, setLastPayment] = useState<PaymentTransaction | null>(null)

  function reset() {
    setStage('select')
    setMethod(null)
    setCashGiven('')
    setError(null)
  }
  function handleClose() {
    reset()
    onClose()
  }

  async function finalizeOrder(paymentMethod: PaymentMethodType, stripePaymentId?: string) {
    if (!user || !activeTill) return
    const order = await ordersService.createOrder({
      basket: lines, customer: customer ?? undefined, staff: user, tillId: activeTill.id, basketDiscountPercent,
    })
    const payment = await paymentsService.recordPayment({
      orderId: order.id, orderNumber: order.orderNumber, customerName: customer?.name,
      amount: order.total, method: paymentMethod, stripePaymentId,
    })
    await ordersService.markOrderPaid(order.id, payment.id)
    for (const line of lines) {
      await inventoryService.reduceStockForSale(line.product.id, line.qty, user.name, order.orderNumber)
    }
    setLastOrder(order)
    setLastPayment(payment)
    return { order, payment }
  }

  async function selectMethod(m: PaymentMethodType) {
    setMethod(m)
    setError(null)
    if (m === 'Cash') {
      setStage('cash')
      return
    }
    if (m === 'Member Account') {
      if (!member) return
      setStage('processing')
      const orderTemp = await ordersService.createOrder({ basket: lines, customer: customer ?? undefined, staff: user!, tillId: activeTill!.id, basketDiscountPercent })
      const result = await membersService.chargeMemberAccount(member.id, orderTemp.total, orderTemp.orderNumber)
      if (!result.ok) {
        setError(result.error ?? 'Unable to charge member account')
        setStage('account-error')
        return
      }
      const payment = await paymentsService.recordPayment({
        orderId: orderTemp.id, orderNumber: orderTemp.orderNumber, customerName: customer?.name,
        amount: orderTemp.total, method: 'Member Account',
      })
      await ordersService.markOrderPaid(orderTemp.id, payment.id)
      for (const line of lines) await inventoryService.reduceStockForSale(line.product.id, line.qty, user!.name, orderTemp.orderNumber)
      setLastOrder(orderTemp)
      setLastPayment(payment)
      setStage('success')
      return
    }
    // Card / Contactless / Apple Pay / Google Pay -> Stripe Terminal simulation
    setStage('terminal')
  }

  async function simulateOutcome(outcome: 'success' | 'fail') {
    if (!method) return
    setStage('processing')
    const intent = await stripeService.createPaymentIntent(totals.total)
    const capture = await stripeService.processTerminalPayment(intent.id, method, outcome)
    if (capture.status !== 'succeeded') {
      setError(capture.failureReason ?? 'Payment failed')
      setStage('failed')
      return
    }
    await finalizeOrder(method, capture.paymentIntentId)
    setStage('success')
  }

  async function confirmCash() {
    setStage('processing')
    const result = await finalizeOrder('Cash')
    if (result) setStage('success')
  }

  function done() {
    if (lastOrder && lastPayment) onPaid(lastOrder, lastPayment)
    clearBasket()
    reset()
  }

  const cashGivenNum = Number(cashGiven) || 0
  const change = Math.max(0, cashGivenNum - totals.total)

  return (
    <Modal open={open} onClose={handleClose} title="Take payment" width="max-w-md">
      <div className="text-center mb-5">
        <p className="text-xs uppercase tracking-wide text-ink-400 font-medium">Total due</p>
        <p className="text-4xl font-display font-semibold text-ink-900 mt-1">{formatGBP(totals.total)}</p>
        {customer && <p className="text-xs text-ink-400 mt-1">{customer.name}{member ? ` · ${member.membershipNo}` : ''}</p>}
      </div>

      {stage === 'select' && (
        <div className="space-y-2">
          {METHODS.map(({ type, icon: Icon }) => (
            <button
              key={type}
              onClick={() => selectMethod(type)}
              className="w-full flex items-center gap-3 rounded-md border border-ink-200 px-4 py-3 hover:bg-pine-50 hover:border-pine-300 transition-colors"
            >
              <Icon className="h-4.5 w-4.5 text-pine-700" />
              <span className="text-sm font-medium">{type}</span>
            </button>
          ))}
          {member && (
            <button
              onClick={() => selectMethod('Member Account')}
              disabled={member.accountBalance < totals.total}
              className="w-full flex items-center justify-between rounded-md border border-brass-300 bg-brass-50 px-4 py-3 hover:bg-brass-100 disabled:opacity-40 transition-colors"
            >
              <span className="flex items-center gap-3">
                <Wallet className="h-4.5 w-4.5 text-brass-600" />
                <span className="text-sm font-medium">Charge to Member Account</span>
              </span>
              <span className="text-xs text-ink-500">Bal. {formatGBP(member.accountBalance)}</span>
            </button>
          )}
        </div>
      )}

      {stage === 'terminal' && (
        <div className="text-center py-4">
          <div className="mx-auto w-56 rounded-2xl bg-ink-950 text-white p-6 shadow-modal">
            <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-2">Payment Terminal</p>
            <p className="text-3xl font-semibold font-mono mb-3">{formatGBP(totals.total)}</p>
            <div className="flex items-center justify-center gap-2 text-pine-300 text-xs">
              <Wifi className="h-3.5 w-3.5 animate-pulse" />
              Waiting for customer…
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-ink-800 overflow-hidden">
              <div className="h-full w-1/3 bg-brass-400 animate-[pulse_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
          <p className="text-xs text-ink-400 mt-4">Simulated Stripe Terminal — {method}</p>
          <div className="flex flex-col gap-2 mt-5">
            <button className="btn-primary" onClick={() => simulateOutcome('success')}>Simulate Successful Payment</button>
            <button className="btn-secondary" onClick={() => simulateOutcome('fail')}>Simulate Failed Payment</button>
            <button className="btn-ghost" onClick={() => setStage('select')}>Cancel Payment</button>
          </div>
        </div>
      )}

      {stage === 'cash' && (
        <div>
          <label className="label">Cash received</label>
          <input
            autoFocus
            type="number"
            className="input text-lg font-mono mb-3"
            placeholder="0.00"
            value={cashGiven}
            onChange={(e) => setCashGiven(e.target.value)}
          />
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[10, 20, 50, Math.ceil(totals.total)].map((v) => (
              <button key={v} className="btn-secondary !py-2" onClick={() => setCashGiven(String(v))}>{formatGBP(v)}</button>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm mb-5 bg-ink-50 rounded-md px-3 py-2">
            <span className="text-ink-500">Change due</span>
            <span className="font-semibold font-mono">{formatGBP(change)}</span>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setStage('select')}>Back</button>
            <button className="btn-primary flex-1" disabled={cashGivenNum < totals.total} onClick={confirmCash}>Confirm Cash Payment</button>
          </div>
        </div>
      )}

      {stage === 'processing' && (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 text-pine-700 animate-spin mb-3" />
          <p className="text-sm text-ink-500">Processing payment…</p>
        </div>
      )}

      {stage === 'success' && lastPayment && (
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle2 className="h-12 w-12 text-pine-600 mb-3" />
          <p className="text-lg font-semibold text-ink-900">Payment successful</p>
          <div className="mt-4 w-full bg-ink-50 rounded-md p-4 text-left text-sm space-y-1.5">
            <Row label="Transaction ID" value={lastPayment.stripePaymentId ?? lastPayment.txnNumber} mono />
            <Row label="Payment method" value={lastPayment.method} />
            <Row label="Amount" value={formatGBP(lastPayment.amount)} />
          </div>
          <button className="btn-primary w-full mt-5" onClick={done}>Continue to receipt</button>
        </div>
      )}

      {stage === 'failed' && (
        <div className="flex flex-col items-center text-center py-4">
          <XCircle className="h-12 w-12 text-red-500 mb-3" />
          <p className="text-lg font-semibold text-ink-900">Payment failed</p>
          <p className="text-sm text-ink-500 mt-1">{error}</p>
          <div className="flex gap-2 w-full mt-5">
            <button className="btn-secondary flex-1" onClick={() => setStage('select')}>Try another method</button>
            <button className="btn-primary flex-1" onClick={() => method && selectMethod(method)}>Retry</button>
          </div>
        </div>
      )}

      {stage === 'account-error' && (
        <div className="flex flex-col items-center text-center py-4">
          <XCircle className="h-12 w-12 text-red-500 mb-3" />
          <p className="text-lg font-semibold text-ink-900">Unable to charge account</p>
          <p className="text-sm text-ink-500 mt-1">{error}</p>
          <button className="btn-secondary w-full mt-5" onClick={() => setStage('select')}>Choose another method</button>
        </div>
      )}
    </Modal>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={`font-medium text-ink-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
