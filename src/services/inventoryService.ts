import { db } from './db'
import { delay } from './latency'
import type { InventoryMovement } from '../types'
import { nextId } from '../lib/rng'

// Mirrors intended REST endpoints:
//   GET  /inventory
//   POST /inventory/adjust
//   GET  /inventory/:productId/history

export async function adjustStock(
  productId: string,
  qtyChange: number,
  staffName: string,
  type: InventoryMovement['type'],
  note?: string,
): Promise<{ ok: boolean; movement?: InventoryMovement; error?: string }> {
  const product = db.products.find((p) => p.id === productId)
  if (!product) return { ok: false, error: 'Product not found' }
  if (product.stockQty === 999) return { ok: false, error: 'This item has unlimited stock and cannot be adjusted' }

  const newQty = Math.max(0, product.stockQty + qtyChange)
  product.stockQty = newQty
  const movement: InventoryMovement = {
    id: nextId('mov'),
    productId,
    productName: product.name,
    type,
    qtyChange,
    balanceAfter: newQty,
    staffName,
    note,
    createdAt: new Date().toISOString(),
  }
  db.inventoryMovements.unshift(movement)
  db.auditLogs.unshift({
    id: nextId('log'),
    timestamp: movement.createdAt,
    staffName,
    action: 'Stock adjustment',
    detail: `${product.name} adjusted by ${qtyChange > 0 ? '+' : ''}${qtyChange} (now ${newQty})`,
  })
  return delay({ ok: true, movement }, 250)
}

export async function reduceStockForSale(productId: string, qty: number, staffName: string, orderNumber: string): Promise<void> {
  const product = db.products.find((p) => p.id === productId)
  if (!product || product.stockQty === 999) return
  product.stockQty = Math.max(0, product.stockQty - qty)
  db.inventoryMovements.unshift({
    id: nextId('mov'),
    productId,
    productName: product.name,
    type: 'Sale',
    qtyChange: -qty,
    balanceAfter: product.stockQty,
    staffName,
    note: `Sold on ${orderNumber}`,
    createdAt: new Date().toISOString(),
  })
}

export async function movementHistory(productId: string): Promise<InventoryMovement[]> {
  return delay(
    db.inventoryMovements.filter((m) => m.productId === productId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    180,
  )
}

export async function allMovements(): Promise<InventoryMovement[]> {
  return delay([...db.inventoryMovements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 200)
}
