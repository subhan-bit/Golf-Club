import { db } from './db'
import { delay } from './latency'
import type { Member, MemberAccountTransaction } from '../types'
import { nextId } from '../lib/rng'
import { round2 } from '../lib/format'

// Mirrors intended REST endpoints:
//   GET /members
//   GET /members/search?q=
//   GET /members/:id
//   POST /members/:id/account-charge

export async function listMembers(): Promise<Member[]> {
  return delay([...db.members], 200)
}

export async function searchMembers(query: string): Promise<Member[]> {
  const q = query.trim().toLowerCase()
  if (!q) return delay([], 120)
  const results = db.members.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.membershipNo.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')),
  )
  return delay(results, 260)
}

export async function getMember(id: string): Promise<Member | undefined> {
  return delay(db.members.find((m) => m.id === id), 150)
}

export async function chargeMemberAccount(
  memberId: string,
  amount: number,
  orderNumber: string,
): Promise<{ ok: boolean; member?: Member; error?: string }> {
  const member = db.members.find((m) => m.id === memberId)
  if (!member) return delay({ ok: false, error: 'Member not found' }, 200)
  if (member.accountBalance < amount) {
    return delay({ ok: false, error: 'Insufficient member account balance' }, 300)
  }
  member.accountBalance = round2(member.accountBalance - amount)
  const txn: MemberAccountTransaction = {
    id: nextId('mat'),
    memberId,
    type: 'Charge',
    amount,
    balanceAfter: member.accountBalance,
    orderNumber,
    createdAt: new Date().toISOString(),
  }
  db.memberAccountTxns.push(txn)
  return delay({ ok: true, member }, 350)
}

export async function memberAccountHistory(memberId: string): Promise<MemberAccountTransaction[]> {
  return delay(
    db.memberAccountTxns.filter((t) => t.memberId === memberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    180,
  )
}
