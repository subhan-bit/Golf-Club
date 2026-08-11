import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { BasketLine, Customer, Member, Product } from '../types'
import { nextId } from '../lib/rng'
import { computePreview } from '../services/ordersService'
import { round2 } from '../lib/format'

interface BasketContextValue {
  lines: BasketLine[]
  member: Member | null
  customer: Customer | null
  basketDiscountPercent: number
  addProduct: (product: Product) => void
  incrementLine: (lineId: string) => void
  decrementLine: (lineId: string) => void
  removeLine: (lineId: string) => void
  setLineDiscount: (lineId: string, percent: number | undefined) => void
  setMember: (member: Member | null) => void
  setCustomer: (customer: Customer | null) => void
  setBasketDiscountPercent: (percent: number) => void
  clearBasket: () => void
  totals: { subtotal: number; discountTotal: number; vatTotal: number; total: number; itemCount: number }
}

const BasketContext = createContext<BasketContextValue | undefined>(undefined)

export function BasketProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BasketLine[]>([])
  const [member, setMemberState] = useState<Member | null>(null)
  const [customer, setCustomerState] = useState<Customer | null>(null)
  const [basketDiscountPercent, setBasketDiscountPercent] = useState(0)

  function priceFor(product: Product): { price: number; discounted: boolean } {
    if (member && product.memberPrice != null) {
      return { price: product.memberPrice, discounted: true }
    }
    return { price: product.sellPrice, discounted: false }
  }

  function addProduct(product: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id && !l.lineDiscountPercent)
      if (existing) {
        return prev.map((l) => (l.lineId === existing.lineId ? { ...l, qty: l.qty + 1 } : l))
      }
      const { price, discounted } = priceFor(product)
      const newLine: BasketLine = {
        lineId: nextId('line'),
        product,
        qty: 1,
        unitPrice: price,
        memberDiscountApplied: discounted,
      }
      return [...prev, newLine]
    })
  }

  function incrementLine(lineId: string) {
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, qty: l.qty + 1 } : l)))
  }
  function decrementLine(lineId: string) {
    setLines((prev) =>
      prev
        .map((l) => (l.lineId === lineId ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0),
    )
  }
  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId))
  }
  function setLineDiscount(lineId: string, percent: number | undefined) {
    setLines((prev) =>
      prev.map((l) =>
        l.lineId === lineId
          ? { ...l, lineDiscountPercent: percent, lineDiscountAmount: percent ? round2(l.unitPrice * l.qty * (percent / 100)) : undefined }
          : l,
      ),
    )
  }

  function setMember(m: Member | null) {
    setMemberState(m)
    if (m) {
      setCustomerState({ id: nextId('cust'), type: 'Member', name: m.name, email: m.email, memberId: m.id })
      // re-price existing lines against member pricing
      setLines((prev) =>
        prev.map((l) => {
          if (l.product.memberPrice != null) {
            return { ...l, unitPrice: l.product.memberPrice, memberDiscountApplied: true }
          }
          return l
        }),
      )
    } else {
      setLines((prev) =>
        prev.map((l) => (l.memberDiscountApplied ? { ...l, unitPrice: l.product.sellPrice, memberDiscountApplied: false } : l)),
      )
    }
  }

  function setCustomer(c: Customer | null) {
    setCustomerState(c)
    if (!c) setMemberState(null)
  }

  function clearBasket() {
    setLines([])
    setMemberState(null)
    setCustomerState(null)
    setBasketDiscountPercent(0)
  }

  const totals = useMemo(() => {
    const preview = computePreview(lines, basketDiscountPercent)
    return { ...preview, itemCount: lines.reduce((s, l) => s + l.qty, 0) }
  }, [lines, basketDiscountPercent])

  return (
    <BasketContext.Provider
      value={{
        lines, member, customer, basketDiscountPercent,
        addProduct, incrementLine, decrementLine, removeLine, setLineDiscount,
        setMember, setCustomer, setBasketDiscountPercent, clearBasket, totals,
      }}
    >
      {children}
    </BasketContext.Provider>
  )
}

export function useBasket() {
  const ctx = useContext(BasketContext)
  if (!ctx) throw new Error('useBasket must be used within BasketProvider')
  return ctx
}
