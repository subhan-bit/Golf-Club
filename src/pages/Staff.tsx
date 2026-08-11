import { useEffect, useState } from 'react'
import { PageHeader, StatusBadge, Modal } from '../components/ui'
import * as staffService from '../services/staffService'
import * as tillsService from '../services/tillsService'
import type { StaffUser, Till, TillSession } from '../types'
import { formatGBP, formatDateTime } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useTill } from '../context/TillContext'
import { Lock } from 'lucide-react'

const ROLE_PERMISSIONS: Record<string, string[]> = {
  CASHIER: ['POS', 'Orders', 'Basic customer search'],
  STAFF: ['POS', 'Orders', 'Basic customer search'],
  MANAGER: ['POS', 'Refunds', 'Inventory', 'Reports', 'Orders', 'Members'],
  ADMIN: ['Everything', 'Staff management', 'Settings', 'Payment configuration'],
}

export default function Staff() {
  const [staff, setStaff] = useState<StaffUser[]>([])
  const { user } = useAuth()
  const { activeTill, refresh: refreshTills } = useTill()
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [sessions, setSessions] = useState<TillSession[]>([])

  useEffect(() => {
    staffService.listStaff().then(setStaff)
    tillsService.listTillSessions().then(setSessions)
  }, [])

  async function reload() {
    await refreshTills()
    tillsService.listTillSessions().then(setSessions)
  }

  const canManageTill = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'CASHIER'

  return (
    <div className="h-full overflow-y-auto thin-scroll">
      <PageHeader title="Staff" subtitle={`${staff.length} staff accounts`} />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Staff Member</th>
                <th className="text-left font-medium py-2.5">Role</th>
                <th className="text-left font-medium py-2.5">Permissions</th>
                <th className="text-left font-medium px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-ink-50">
                  <td className="px-5 py-3 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-pine-100 text-pine-700 text-xs font-semibold flex items-center justify-center">{s.avatarInitials}</div>
                    <span className="font-medium text-ink-900">{s.name}</span>
                  </td>
                  <td className="py-3"><span className="badge bg-ink-100 text-ink-700">{s.role}</span></td>
                  <td className="py-3 text-xs text-ink-500">{ROLE_PERMISSIONS[s.role]?.join(', ')}</td>
                  <td className="px-5 py-3"><StatusBadge status={s.active ? 'Active' : 'Suspended'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-sm font-semibold text-ink-900 mb-3 flex items-center gap-1.5"><Lock className="h-4 w-4 text-pine-700" /> Till Management</p>
            {activeTill ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">{activeTill.name} · {activeTill.location}</span>
                  <StatusBadge status={activeTill.status} />
                </div>
                {activeTill.status === 'Open' ? (
                  <>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-ink-500">Staff</span><span>{activeTill.currentStaffName}</span></div>
                      <div className="flex justify-between"><span className="text-ink-500">Opening float</span><span>{formatGBP(activeTill.openingBalance)}</span></div>
                    </div>
                    {canManageTill && <button className="btn-danger w-full" onClick={() => setCloseModal(true)}>Close Till</button>}
                  </>
                ) : (
                  canManageTill && <button className="btn-primary w-full" onClick={() => setOpenModal(true)}>Open Till</button>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-400">No till selected.</p>
            )}
          </div>

          <div className="card p-5">
            <p className="text-sm font-semibold text-ink-900 mb-3">Recent Till Sessions</p>
            {sessions.length === 0 ? (
              <p className="text-xs text-ink-400">No closed sessions yet.</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="text-xs border-b border-ink-50 pb-2 last:border-0">
                    <div className="flex justify-between">
                      <span className="text-ink-700">{s.staffName}</span>
                      <span className={s.difference! < 0 ? 'text-red-600' : s.difference! > 0 ? 'text-amber-600' : 'text-pine-700'}>
                        {s.difference! >= 0 ? '+' : ''}{formatGBP(s.difference ?? 0)}
                      </span>
                    </div>
                    <p className="text-ink-400">{s.closedAt && formatDateTime(s.closedAt)} · Expected {formatGBP(s.expectedCash)}, actual {formatGBP(s.actualCash ?? 0)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTill && (
        <>
          <OpenTillModal open={openModal} onClose={() => setOpenModal(false)} till={activeTill} onDone={reload} />
          <CloseTillModal open={closeModal} onClose={() => setCloseModal(false)} till={activeTill} onDone={reload} />
        </>
      )}
    </div>
  )
}

function OpenTillModal({ open, onClose, till, onDone }: { open: boolean; onClose: () => void; till: Till; onDone: () => void }) {
  const { user } = useAuth()
  const [amount, setAmount] = useState(150)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!user) return
    setSubmitting(true)
    await tillsService.openTill(till.id, user.id, user.name, amount)
    setSubmitting(false)
    onClose()
    onDone()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Open ${till.name}`} width="max-w-sm">
      <label className="label">Opening float</label>
      <input type="number" className="input mb-5" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      <button className="btn-primary w-full" disabled={submitting} onClick={submit}>{submitting ? 'Opening…' : 'Open Till'}</button>
    </Modal>
  )
}

function CloseTillModal({ open, onClose, till, onDone }: { open: boolean; onClose: () => void; till: Till; onDone: () => void }) {
  const [actual, setActual] = useState(till.expectedCash)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ expected: number; actual: number; diff: number } | null>(null)

  useEffect(() => {
    if (open) {
      setActual(till.expectedCash)
      setResult(null)
    }
  }, [open, till.expectedCash])

  async function submit() {
    setSubmitting(true)
    const res = await tillsService.closeTill(till.id, actual)
    setSubmitting(false)
    if (res.ok && res.session) {
      setResult({ expected: res.session.expectedCash, actual: res.session.actualCash ?? 0, diff: res.session.difference ?? 0 })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Close ${till.name}`} width="max-w-sm">
      {!result ? (
        <>
          <p className="text-sm text-ink-500 mb-4">Count the cash drawer and enter the actual amount to reconcile against expected takings.</p>
          <label className="label">Actual cash counted</label>
          <input type="number" className="input mb-5" value={actual} onChange={(e) => setActual(Number(e.target.value))} />
          <button className="btn-danger w-full" disabled={submitting} onClick={submit}>{submitting ? 'Reconciling…' : 'Close Till & Reconcile'}</button>
        </>
      ) : (
        <div>
          <div className="space-y-1.5 text-sm mb-5">
            <div className="flex justify-between"><span className="text-ink-500">Expected cash</span><span>{formatGBP(result.expected)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Actual cash</span><span>{formatGBP(result.actual)}</span></div>
            <div className="flex justify-between font-semibold pt-1.5 border-t border-ink-100">
              <span>Difference</span>
              <span className={result.diff < 0 ? 'text-red-600' : result.diff > 0 ? 'text-amber-600' : 'text-pine-700'}>{result.diff >= 0 ? '+' : ''}{formatGBP(result.diff)}</span>
            </div>
          </div>
          <button className="btn-primary w-full" onClick={onClose}>Done</button>
        </div>
      )}
    </Modal>
  )
}
