import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Till } from '../types'
import * as tillsService from '../services/tillsService'

interface TillContextValue {
  tills: Till[]
  activeTill: Till | null
  loading: boolean
  refresh: () => Promise<void>
  setActiveTillId: (id: string | null) => void
}

const TillContext = createContext<TillContextValue | undefined>(undefined)

export function TillProvider({ children }: { children: ReactNode }) {
  const [tills, setTills] = useState<Till[]>([])
  const [activeTillId, setActiveTillId] = useState<string | null>('till-1')
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    const data = await tillsService.listTills()
    setTills(data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const activeTill = tills.find((t) => t.id === activeTillId) ?? null

  return (
    <TillContext.Provider value={{ tills, activeTill, loading, refresh, setActiveTillId }}>
      {children}
    </TillContext.Provider>
  )
}

export function useTill() {
  const ctx = useContext(TillContext)
  if (!ctx) throw new Error('useTill must be used within TillProvider')
  return ctx
}
