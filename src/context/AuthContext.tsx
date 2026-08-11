import { createContext, useContext, useState, type ReactNode } from 'react'
import type { StaffUser } from '../types'
import * as staffService from '../services/staffService'

interface AuthContextValue {
  user: StaffUser | null
  loading: boolean
  error: string | null
  loginWithPin: (pin: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loginWithPin(pin: string) {
    setLoading(true)
    setError(null)
    const found = await staffService.login(pin)
    setLoading(false)
    if (found) {
      setUser(found)
      return true
    }
    setError('Incorrect PIN. Please try again.')
    return false
  }

  function logout() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithPin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
