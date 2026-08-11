import { useEffect, useMemo, useState } from 'react'
import { PageHeader, LoadingState, EmptyState, StatusBadge, Modal } from '../components/ui'
import * as productsService from '../services/productsService'
import { CATEGORIES } from '../services/productsService'
import type { Product, ProductCategory } from '../types'
import { formatGBP } from '../lib/format'
import { Search, Package, Plus } from 'lucide-react'
import { db } from '../services/db'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<ProductCategory | 'All'>('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)

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
        .filter((p) => category === 'All' || p.category === category)
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())),
    [products, category, query],
  )

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Products" subtitle={`${products.length} active products`} actions={<button className="btn-primary" disabled><Plus className="h-4 w-4" /> Add Product</button>} />
      <div className="px-8 py-4 border-b border-ink-100 bg-white flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pl-9" placeholder="Search by name or SKU…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto thin-scroll">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === c ? 'bg-pine-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll">
        {loading ? (
          <LoadingState label="Loading products…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Package className="h-8 w-8" />} title="No products found" />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-cream/95 backdrop-blur text-xs uppercase tracking-wide text-ink-400 border-b border-ink-100">
              <tr>
                <th className="text-left font-medium px-8 py-2.5">Product</th>
                <th className="text-left font-medium py-2.5">SKU</th>
                <th className="text-left font-medium py-2.5">Category</th>
                <th className="text-right font-medium py-2.5">Price</th>
                <th className="text-right font-medium py-2.5">Member Price</th>
                <th className="text-right font-medium py-2.5">Stock</th>
                <th className="text-left font-medium px-8 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} onClick={() => setSelected(p)} className="border-b border-ink-50 hover:bg-white cursor-pointer">
                  <td className="px-8 py-3 font-medium text-ink-900 flex items-center gap-2">
                    <span className="text-lg">{p.imageEmoji}</span> {p.name}
                  </td>
                  <td className="py-3 text-ink-500 font-mono text-xs">{p.sku}</td>
                  <td className="py-3 text-ink-500">{p.category}</td>
                  <td className="py-3 text-right text-ink-900">{formatGBP(p.sellPrice)}</td>
                  <td className="py-3 text-right text-brass-600">{p.memberPrice ? formatGBP(p.memberPrice) : '—'}</td>
                  <td className="py-3 text-right text-ink-500">{p.stockQty === 999 ? '∞' : p.stockQty}</td>
                  <td className="px-8 py-3"><StatusBadge status={productsService.stockStatus(p)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} width="max-w-md">
        {selected && <ProductDetail product={selected} />}
      </Modal>
    </div>
  )
}

function ProductDetail({ product }: { product: Product }) {
  const vat = db.vatRates.find((v) => v.id === product.vatRateId)
  const supplier = db.suppliers.find((s) => s.id === product.supplierId)
  const { net, vat: vatAmt, gross } = productsService.priceInclVat(product)
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{product.imageEmoji}</span>
        <div>
          <p className="font-semibold text-ink-900">{product.name}</p>
          <p className="text-xs text-ink-400">{product.sku} · {product.barcode}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category" value={product.category} />
        <Field label="Supplier" value={supplier?.name ?? '—'} />
        <Field label="Cost price" value={formatGBP(product.costPrice)} />
        <Field label="Sell price" value={formatGBP(product.sellPrice)} />
        <Field label="Member price" value={product.memberPrice ? formatGBP(product.memberPrice) : '—'} />
        <Field label="Stock" value={product.stockQty === 999 ? 'Unlimited' : `${product.stockQty} (min ${product.minStock})`} />
      </div>
      <div className="rounded-md bg-ink-50 p-3 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-1.5">VAT breakdown — {vat?.name}</p>
        <div className="flex justify-between text-xs"><span className="text-ink-500">Net</span><span>{formatGBP(net)}</span></div>
        <div className="flex justify-between text-xs"><span className="text-ink-500">VAT ({((vat?.rate ?? 0) * 100).toFixed(0)}%)</span><span>{formatGBP(vatAmt)}</span></div>
        <div className="flex justify-between text-xs font-semibold"><span>Gross</span><span>{formatGBP(gross)}</span></div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-ink-900 font-medium">{value}</p>
    </div>
  )
}
