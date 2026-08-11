import { db, vatRateFor } from './db'
import { delay } from './latency'
import type { Product, ProductCategory } from '../types'
import { nextId } from '../lib/rng'

// Mirrors intended REST endpoints:
//   GET    /products
//   GET    /products/:id
//   POST   /products
//   PUT    /products/:id
//   GET    /products/barcode/:code

export const CATEGORIES: (ProductCategory | 'All')[] = [
  'All', 'Food', 'Drinks', 'Bar', 'Pro Shop', 'Golf Equipment', 'Clothing', 'Membership', 'Services',
]

export async function listProducts(category?: ProductCategory | 'All'): Promise<Product[]> {
  const items = db.products.filter((p) => p.active && (!category || category === 'All' || p.category === category))
  return delay(items, 180)
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return delay(db.products.find((p) => p.id === id), 120)
}

export async function findByBarcode(code: string): Promise<Product | undefined> {
  return delay(db.products.find((p) => p.barcode === code.trim() || p.sku.toLowerCase() === code.trim().toLowerCase()), 200)
}

export async function createProduct(input: Omit<Product, 'id'>): Promise<Product> {
  const product: Product = { ...input, id: nextId('prod') }
  db.products.unshift(product)
  return delay(product, 300)
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<Product | undefined> {
  const idx = db.products.findIndex((p) => p.id === id)
  if (idx === -1) return delay(undefined, 200)
  db.products[idx] = { ...db.products[idx], ...patch }
  return delay(db.products[idx], 250)
}

export function stockStatus(p: Product): 'In Stock' | 'Low Stock' | 'Out of Stock' {
  if (p.stockQty === 999) return 'In Stock' // unlimited service-type item
  if (p.stockQty <= 0) return 'Out of Stock'
  if (p.stockQty <= p.minStock) return 'Low Stock'
  return 'In Stock'
}

export function priceInclVat(p: Product): { net: number; vat: number; gross: number } {
  const rate = vatRateFor(p)
  const gross = p.sellPrice
  const net = gross / (1 + rate)
  return { net: Math.round(net * 100) / 100, vat: Math.round((gross - net) * 100) / 100, gross }
}
