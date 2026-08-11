import { db } from './db'
import { delay } from './latency'
import type { StaffUser, AuditLogEntry } from '../types'

// Mirrors intended REST endpoints:
//   POST /auth/login   (PIN-based for clubhouse staff terminals)
//   GET  /staff
//   GET  /audit-logs

export async function login(pin: string): Promise<StaffUser | undefined> {
  const user = db.staff.find((s) => s.pin === pin && s.active)
  return delay(user, 400)
}

export async function listStaff(): Promise<StaffUser[]> {
  return delay([...db.staff], 180)
}

export async function listAuditLogs(): Promise<AuditLogEntry[]> {
  return delay([...db.auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)), 200)
}
