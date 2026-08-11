import { useEffect, useMemo, useState } from 'react'
import { PageHeader, LoadingState, EmptyState, StatusBadge, Modal } from '../components/ui'
import * as membersService from '../services/membersService'
import type { Member, MemberAccountTransaction } from '../types'
import { formatGBP, formatDate, formatDateTime } from '../lib/format'
import { Search, Users } from 'lucide-react'

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Member | null>(null)

  useEffect(() => {
    membersService.listMembers().then((m) => {
      setMembers(m)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(
    () => members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.membershipNo.toLowerCase().includes(query.toLowerCase())),
    [members, query],
  )

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Members" subtitle={`${members.length} club members`} />
      <div className="px-8 py-4 border-b border-ink-100 bg-white">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input className="input pl-9" placeholder="Search by name or membership no…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto thin-scroll">
        {loading ? (
          <LoadingState label="Loading members…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users className="h-8 w-8" />} title="No members found" />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-cream/95 backdrop-blur text-xs uppercase tracking-wide text-ink-400 border-b border-ink-100">
              <tr>
                <th className="text-left font-medium px-8 py-2.5">Member</th>
                <th className="text-left font-medium py-2.5">Membership No.</th>
                <th className="text-left font-medium py-2.5">Tier</th>
                <th className="text-left font-medium py-2.5">Joined</th>
                <th className="text-right font-medium py-2.5">Account Balance</th>
                <th className="text-left font-medium px-8 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} onClick={() => setSelected(m)} className="border-b border-ink-50 hover:bg-white cursor-pointer">
                  <td className="px-8 py-3">
                    <p className="font-medium text-ink-900">{m.name}</p>
                    <p className="text-xs text-ink-400">{m.email}</p>
                  </td>
                  <td className="py-3 text-ink-500 font-mono text-xs">{m.membershipNo}</td>
                  <td className="py-3 text-ink-500">{m.tier}</td>
                  <td className="py-3 text-ink-500">{formatDate(m.joined)}</td>
                  <td className={`py-3 text-right font-medium ${m.accountBalance < 0 ? 'text-red-600' : 'text-ink-900'}`}>{formatGBP(m.accountBalance)}</td>
                  <td className="px-8 py-3"><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} width="max-w-md">
        {selected && <MemberDetail member={selected} />}
      </Modal>
    </div>
  )
}

function MemberDetail({ member }: { member: Member }) {
  const [history, setHistory] = useState<MemberAccountTransaction[]>([])
  useEffect(() => {
    membersService.memberAccountHistory(member.id).then(setHistory)
  }, [member.id])

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Membership No." value={member.membershipNo} />
        <Field label="Tier" value={member.tier} />
        <Field label="Status" value={member.status} />
        <Field label="Joined" value={formatDate(member.joined)} />
        <Field label="Email" value={member.email} />
        <Field label="Phone" value={member.phone} />
        <Field label="Discount rate" value={`${member.discountPercent}%`} />
        <Field label="Account balance" value={formatGBP(member.accountBalance)} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Account activity</p>
        {history.length === 0 ? (
          <p className="text-xs text-ink-400">No account transactions yet.</p>
        ) : (
          <div className="space-y-1.5">
            {history.map((h) => (
              <div key={h.id} className="flex justify-between text-xs border-b border-ink-50 pb-1.5 last:border-0">
                <span className="text-ink-600">{h.type}{h.orderNumber ? ` — ${h.orderNumber}` : ''} · {formatDateTime(h.createdAt)}</span>
                <span className={h.type === 'Charge' ? 'text-red-600' : 'text-pine-700'}>{h.type === 'Charge' ? '-' : '+'}{formatGBP(h.amount)}</span>
              </div>
            ))}
          </div>
        )}
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
