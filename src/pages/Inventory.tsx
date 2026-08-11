import { useEffect, useMemo, useState } from 'react'
import { PageHeader, LoadingState, EmptyState, StatusBadge, Modal } from '../components/ui'
import * as productsService from '../services/productsService'
import * as inventoryService from '../services/inventoryService'
import type { Product, InventoryMovement } from '../types'
import { formatGBP, formatDateTime } from '../lib/format'
import { Search, Boxes, History } from 'lucide-react'
import { db } from '../services/db'
import { useAuth } from '../context/AuthContext'

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Low Stock' | 'Out of Stock'>('All')
  const [historyFor, setHistoryFor] = useState<Product | null>(null)
  const [adjustFor, setAdjustFor] = useState<Product | null>(null)
  const { user } = useAuth()

  function load() {
    setLoading(true)
    productsService.listProducts('All').then((p) => {
      setProducts(p)
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(
    () =>
      products
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
        .filter((p) => statusFilter === 'All' || productsService.stockStatus(p) === statusFilter),
    [products, query, statusFilter],
  )

  const lowCount = products.filter((p) => productsService.stockStatus(p) === 'Low Stock').length
  const outCount = products.filter((p) => productsService.stockStatus(p) === 'Out of Stock').length

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Inventory" subtitle={`${lowCount} low stock · ${outCount} out of stock`} />
      <div className="px-8 py-4 border-b border-ink-100 bg-white flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pl-9" placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {(['All', 'Low Stock', 'Out of Stock'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-pine-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll">
        {loading ? (
          <LoadingState label="Loading inventory…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Boxes className="h-8 w-8" />} title="No products found" />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-cream/95 backdrop-blur text-xs uppercase tracking-wide text-ink-400 border-b border-ink-100">
              <tr>
                <th className="text-left font-medium px-8 py-2.5">Product</th>
                <th className="text-left font-medium py-2.5">SKU</th>
                <th className="text-left font-medium py-2.5">Category</th>
                <th className="text-right font-medium py-2.5">Current</th>
                <th className="text-right font-medium py-2.5">Min</th>
                <th className="text-right font-medium py-2.5">Cost</th>
                <th className="text-right font-medium py-2.5">Sell</th>
                <th className="text-left font-medium py-2.5">Supplier</th>
                <th className="text-left font-medium py-2.5">Status</th>
                <th className="px-8 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const supplier = db.suppliers.find((s) => s.id === p.supplierId)
                return (
                  <tr key={p.id} className="border-b border-ink-50 hover:bg-white">
                    <td className="px-8 py-3 font-medium text-ink-900">{p.imageEmoji} {p.name}</td>
                    <td className="py-3 text-ink-500 font-mono text-xs">{p.sku}</td>
                    <td className="py-3 text-ink-500">{p.category}</td>
                    <td className="py-3 text-right font-medium">{p.stockQty === 999 ? '∞' : p.stockQty}</td>
                    <td className="py-3 text-right text-ink-400">{p.stockQty === 999 ? '—' : p.minStock}</td>
                    <td className="py-3 text-right text-ink-500">{formatGBP(p.costPrice)}</td>
                    <td className="py-3 text-right text-ink-500">{formatGBP(p.sellPrice)}</td>
                    <td className="py-3 text-ink-500">{supplier?.name ?? '—'}</td>
                    <td className="py-3"><StatusBadge status={productsService.stockStatus(p)} /></td>
                    <td className="px-8 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setHistoryFor(p)} className="text-ink-400 hover:text-pine-700"><History className="h-4 w-4" /></button>
                        {p.stockQty !== 999 && (
                          <button onClick={() => setAdjustFor(p)} className="btn-secondary !py-1 !px-2.5 text-xs">Adjust</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!historyFor} onClose={() => setHistoryFor(null)} title={`Stock history — ${historyFor?.name ?? ''}`} width="max-w-lg">
        {historyFor && <StockHistory product={historyFor} />}
      </Modal>

      <Modal open={!!adjustFor} onClose={() => setAdjustFor(null)} title={`Adjust stock — ${adjustFor?.name ?? ''}`} width="max-w-sm">
        {adjustFor && (
          <AdjustStockForm
            product={adjustFor}
            staffName={user?.name ?? 'Unknown'}
            onDone={() => {
              setAdjustFor(null)
              load()
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function StockHistory({ product }: { product: Product }) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    inventoryService.movementHistory(product.id).then((m) => {
      setMovements(m)
      setLoading(false)
    })
  }, [product.id])
  if (loading) return <LoadingState />
  if (movements.length === 0) return <EmptyState title="No stock movements yet" />
  return (
    <div className="space-y-2">
      {movements.map((m) => (
        <div key={m.id} className="flex items-center justify-between text-sm border-b border-ink-50 pb-2 last:border-0">
          <div>
            <p className="text-ink-800">{m.type}{m.note ? ` — ${m.note}` : ''}</p>
            <p className="text-xs text-ink-400">{formatDateTime(m.createdAt)} · {m.staffName}</p>
          </div>
          <div className="text-right">
            <p className={`font-medium ${m.qtyChange < 0 ? 'text-red-600' : 'text-pine-700'}`}>{m.qtyChange > 0 ? '+' : ''}{m.qtyChange}</p>
            <p className="text-xs text-ink-400">bal. {m.balanceAfter}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function AdjustStockForm({ product, staffName, onDone }: { product: Product; staffName: string; onDone: () => void }) {
  const [qty, setQty] = useState(0)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (qty === 0) return
    setSubmitting(true)
    await inventoryService.adjustStock(product.id, qty, staffName, 'Adjustment', note || undefined)
    setSubmitting(false)
    onDone()
  }

  return (
    <div>
      <p className="text-sm text-ink-500 mb-4">Current stock: <strong>{product.stockQty}</strong></p>
      <label className="label">Adjustment (use negative for a reduction)</label>
      <input type="number" className="input mb-3" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      <label className="label">Note</label>
      <input className="input mb-5" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Stock count correction" />
      <button className="btn-primary w-full" disabled={qty === 0 || submitting} onClick={submit}>
        {submitting ? 'Saving…' : `Set new balance to ${Math.max(0, product.stockQty + qty)}`}
      </button>
    </div>
  )
}
