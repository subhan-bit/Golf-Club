import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Flag, Delete } from 'lucide-react'
import { CLUB } from '../data/seedCore'

export default function LoginScreen() {
  const { loginWithPin, loading, error } = useAuth()
  const [pin, setPin] = useState('')
  const navigate = useNavigate()

  async function submit(nextPin: string) {
    if (nextPin.length < 4) return
    const ok = await loginWithPin(nextPin)
    if (ok) navigate('/pos')
    else setPin('')
  }

  function press(digit: string) {
    if (loading) return
    const next = (pin + digit).slice(0, 4)
    setPin(next)
    if (next.length === 4) submit(next)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pine-950 bg-[radial-gradient(circle_at_top,_#1b3b2f,_#0b1a15)] p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-brass-500 flex items-center justify-center shadow-modal">
            <Flag className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl text-white font-semibold tracking-tight">{CLUB.name}</h1>
          <p className="text-pine-300 text-sm mt-1">Point of Sale — Staff Login</p>
        </div>

        <div className="card bg-pine-900/60 border-pine-700 backdrop-blur p-6">
          <p className="label !text-pine-300 text-center mb-3">Enter your 4-digit staff PIN</p>
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-3.5 w-3.5 rounded-full border border-pine-400 ${i < pin.length ? 'bg-brass-400 border-brass-400' : 'bg-transparent'}`}
              />
            ))}
          </div>

          {error && <p className="text-center text-sm text-red-300 mb-4">{error}</p>}
          {loading && <p className="text-center text-sm text-pine-300 mb-4">Checking PIN…</p>}

          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                onClick={() => press(d)}
                className="h-14 rounded-lg bg-pine-800 hover:bg-pine-700 text-white text-lg font-semibold transition-colors"
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => setPin('')}
              className="h-14 rounded-lg bg-pine-800/50 hover:bg-pine-700 text-pine-200 text-xs font-semibold"
            >
              Clear
            </button>
            <button
              onClick={() => press('0')}
              className="h-14 rounded-lg bg-pine-800 hover:bg-pine-700 text-white text-lg font-semibold transition-colors"
            >
              0
            </button>
            <button
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="h-14 rounded-lg bg-pine-800/50 hover:bg-pine-700 text-pine-200 flex items-center justify-center"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-pine-700 text-center">
            <p className="text-xs text-pine-400">Demo PINs — Cashier 1234 · Manager 2345 · Admin 3456 · Staff 4567</p>
          </div>
        </div>
      </div>
    </div>
  )
}
