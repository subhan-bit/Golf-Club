import { useEffect, useState } from 'react'
import { Search, ScanLine, PackageX, AlertTriangle } from 'lucide-react'
import * as productsService from '../../services/productsService'
import { CATEGORIES } from '../../services/productsService'
import type { Product, ProductCategory } from '../../types'
import { useBasket } from '../../context/BasketContext'
import { formatGBP } from '../../lib/format'
import { LoadingState, EmptyState } from '../ui'

export default function ProductGrid() {
  const [category, setCategory] = useState<ProductCategory | 'All'>('All')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [barcode, setBarcode] = useState('')
  const [barcodeError, setBarcodeError] = useState<string | null>(null)
  const { addProduct, member } = useBasket()

  useEffect(() => {
    setLoading(true)
    productsService.listProducts(category).then((p) => {
      setProducts(p)
      setLoading(false)
    })
  }, [category])

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))

  async function handleScan(code: string) {
    setBarcodeError(null)
    const product = await productsService.findByBarcode(code)
    if (product) {
      addProduct(product)
      setBarcode('')
    } else {
      setBarcodeError(`No product found for "${code}"`)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-3 border-b border-ink-100 bg-white">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Search products by name or SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="relative w-56">
            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Scan / enter barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && barcode.trim()) handleScan(barcode.trim())
              }}
            />
          </div>
          <button className="btn-secondary" onClick={() => barcode.trim() && handleScan(barcode.trim())}>Scan</button>
        </div>
        {barcodeError && <p className="text-xs text-red-600 mb-2">{barcodeError}</p>}
        <div className="flex gap-1.5 overflow-x-auto thin-scroll pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                category === c ? 'bg-pine-800 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll p-6">
        {loading ? (
          <LoadingState label="Loading products…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<PackageX className="h-8 w-8" />} title="No products match" description="Try a different search term or category." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => {
              const status = productsService.stockStatus(p)
              const disabled = status === 'Out of Stock'
              const showMemberPrice = !!member && p.memberPrice != null
              return (
                <button
                  key={p.id}
                  disabled={disabled}
                  onClick={() => addProduct(p)}
                  className="card p-3.5 text-left hover:border-pine-300 hover:shadow-panel transition-all disabled:opacity-40 disabled:cursor-not-allowed flex flex-col"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{p.imageEmoji}</span>
                    {status !== 'In Stock' && (
                      <span className={`badge ${status === 'Low Stock' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'} gap-1`}>
                        <AlertTriangle className="h-3 w-3" /> {status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-ink-900 leading-snug mb-1">{p.name}</p>
                  <div className="mt-auto pt-1">
                    {showMemberPrice ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-semibold text-brass-600">{formatGBP(p.memberPrice!)}</span>
                        <span className="text-xs text-ink-400 line-through">{formatGBP(p.sellPrice)}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-ink-800">{formatGBP(p.sellPrice)}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
