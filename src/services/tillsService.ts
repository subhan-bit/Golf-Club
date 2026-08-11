import { db } from './db'
import { delay } from './latency'
import type { Till, TillSession } from '../types'
import { nextId } from '../lib/rng'
import { round2 } from '../lib/format'

// Mirrors intended REST endpoints:
//   GET  /tills
//   POST /tills/open
//   POST /tills/close
//   POST /tills/:id/cash-in
//   POST /tills/:id/cash-out

export async function listTills(): Promise<Till[]> {
  return delay([...db.tills], 150)
}

export async function openTill(tillId: string, staffId: string, staffName: string, openingBalance: number): Promise<Till | undefined> {
  const till = db.tills.find((t) => t.id === tillId)
  if (!till) return delay(undefined, 100)
  till.status = 'Open'
  till.currentStaffId = staffId
  till.currentStaffName = staffName
  till.openingBalance = openingBalance
  till.expectedCash = openingBalance
  till.openedAt = new Date().toISOString()
  db.auditLogs.unshift({
    id: nextId('log'),
    timestamp: till.openedAt,
    staffName,
    action: 'Till opened',
    detail: `${till.name} — opening float £${openingBalance.toFixed(2)}`,
  })
  return delay(till, 300)
}

export async function closeTill(
  tillId: string,
  actualCash: number,
): Promise<{ ok: boolean; session?: TillSession; error?: string }> {
  const till = db.tills.find((t) => t.id === tillId)
  if (!till || till.status !== 'Open') return { ok: false, error: 'Till is not open' }

  const cashSales = db.payments
    .filter((p) => p.method === 'Cash')
    .filter((p) => till.openedAt && p.createdAt >= till.openedAt)
    .reduce((s, p) => s + p.amount, 0)
  const cardSales = db.payments
    .filter((p) => p.method !== 'Cash')
    .filter((p) => till.openedAt && p.createdAt >= till.openedAt)
    .reduce((s, p) => s + p.amount, 0)

  const expectedCash = round2(till.openingBalance + cashSales)
  const difference = round2(actualCash - expectedCash)

  const session: TillSession = {
    id: nextId('sess'),
    tillId,
    staffName: till.currentStaffName ?? 'Unknown',
    openedAt: till.openedAt ?? new Date().toISOString(),
    closedAt: new Date().toISOString(),
    openingBalance: till.openingBalance,
    expectedCash,
    actualCash,
    difference,
    cashSales,
    cardSales,
  }
  db.tillSessions.unshift(session)

  till.status = 'Closed'
  db.auditLogs.unshift({
    id: nextId('log'),
    timestamp: session.closedAt!,
    staffName: session.staffName,
    action: 'Till closed',
    detail: `${till.name} — expected £${expectedCash.toFixed(2)}, actual £${actualCash.toFixed(2)} (${difference >= 0 ? '+' : ''}£${difference.toFixed(2)})`,
  })
  till.currentStaffId = undefined
  till.currentStaffName = undefined

  return delay({ ok: true, session }, 350)
}

export async function listTillSessions(): Promise<TillSession[]> {
  return delay([...db.tillSessions].sort((a, b) => b.openedAt.localeCompare(a.openedAt)), 180)
}
