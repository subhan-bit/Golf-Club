import { useEffect, useState } from 'react'
import { Modal } from '../ui'
import { Search, User, UserCheck } from 'lucide-react'
import * as membersService from '../../services/membersService'
import type { Member, CustomerType } from '../../types'
import { useBasket } from '../../context/BasketContext'
import { nextId } from '../../lib/rng'

const NON_MEMBER_TYPES: CustomerType[] = ['Visitor', 'Guest', 'Staff', 'Corporate']

export default function CustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setMember, setCustomer } = useBasket()
  const [tab, setTab] = useState<'member' | 'other'>('member')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Member[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setTab('member')
    }
  }, [open])

  useEffect(() => {
    if (tab !== 'member') return
    const q = query.trim()
    if (!q) {
      setResults([])
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      const r = await membersService.searchMembers(q)
      setResults(r)
      setSearching(false)
    }, 200)
    return () => clearTimeout(t)
  }, [query, tab])

  function selectMember(m: Member) {
    setMember(m)
    onClose()
  }

  function selectOther(type: CustomerType) {
    setCustomer({ id: nextId('cust'), type, name: type === 'Visitor' ? 'Walk-in Visitor' : `${type} Customer` })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Identify customer" width="max-w-md">
      <div className="flex gap-1 mb-4 bg-ink-100 rounded-md p-1">
        <button
          onClick={() => setTab('member')}
          className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'member' ? 'bg-white shadow-card text-pine-800' : 'text-ink-500'}`}
        >
          Find Member
        </button>
        <button
          onClick={() => setTab('other')}
          className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'other' ? 'bg-white shadow-card text-pine-800' : 'text-ink-500'}`}
        >
          Other Customer
        </button>
      </div>

      {tab === 'member' ? (
        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              autoFocus
              className="input pl-9"
              placeholder="Name, membership no, email or phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto thin-scroll">
            {searching && <p className="text-xs text-ink-400 px-1">Searching…</p>}
            {!searching && query && results.length === 0 && (
              <p className="text-sm text-ink-400 px-1 py-4 text-center">No members found for "{query}"</p>
            )}
            {results.map((m) => (
              <button
                key={m.id}
                onClick={() => selectMember(m)}
                disabled={m.status !== 'Active'}
                className="w-full flex items-center justify-between rounded-md border border-ink-100 px-3 py-2.5 text-left hover:bg-pine-50 hover:border-pine-200 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-pine-100 text-pine-700 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{m.name}</p>
                    <p className="text-xs text-ink-400">{m.membershipNo} · {m.tier}</p>
                  </div>
                </div>
                <span className={`badge ${m.status === 'Active' ? 'bg-pine-100 text-pine-700' : 'bg-ink-100 text-ink-500'}`}>{m.status}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {NON_MEMBER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => selectOther(type)}
              className="flex flex-col items-center gap-2 rounded-md border border-ink-200 py-5 hover:bg-pine-50 hover:border-pine-300"
            >
              <UserCheck className="h-5 w-5 text-pine-700" />
              <span className="text-sm font-medium">{type}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
