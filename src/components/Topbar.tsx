import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, MonitorSmartphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTill } from '../context/TillContext'

export default function Topbar() {
  const { user, logout } = useAuth()
  const { activeTill, tills, setActiveTillId } = useTill()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [menuOpen, setMenuOpen] = useState(false)
  const [tillMenuOpen, setTillMenuOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 15)
    return () => clearInterval(t)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 shrink-0 border-b border-ink-100 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setTillMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md border border-ink-200 px-3 py-1.5 text-sm hover:bg-ink-50"
          >
            <MonitorSmartphone className="h-4 w-4 text-pine-700" />
            <span className="font-medium">{activeTill?.name ?? 'Select till'}</span>
            <span className={`badge ${activeTill?.status === 'Open' ? 'bg-pine-100 text-pine-700' : 'bg-ink-100 text-ink-500'}`}>
              {activeTill?.status ?? '—'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
          </button>
          {tillMenuOpen && (
            <div className="absolute z-20 mt-1 w-56 rounded-md border border-ink-100 bg-white shadow-panel py-1">
              {tills.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTillId(t.id)
                    setTillMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-ink-50 text-left"
                >
                  <span>{t.name} <span className="text-ink-400">· {t.location}</span></span>
                  <span className={`badge ${t.status === 'Open' ? 'bg-pine-100 text-pine-700' : 'bg-ink-100 text-ink-500'}`}>{t.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <p className="text-sm text-ink-500 tabular-nums hidden md:block">
          {now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })} · {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <button className="relative rounded-full p-2 hover:bg-ink-50">
          <Bell className="h-4.5 w-4.5 text-ink-500" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brass-500" />
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-md pl-1 pr-2 py-1 hover:bg-ink-50">
            <div className="h-8 w-8 rounded-full bg-pine-800 text-white text-xs font-semibold flex items-center justify-center">
              {user?.avatarInitials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-tight">{user?.name}</p>
              <p className="text-[11px] text-ink-400 leading-tight">{user?.role}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-ink-100 bg-white shadow-panel py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
