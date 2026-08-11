import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Package, Boxes, Users, UserCircle,
  CreditCard, Undo2, BarChart3, UserCog, Settings as SettingsIcon, Flag,
} from 'lucide-react'
import { CLUB } from '../data/seedCore'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pos', label: 'POS', icon: ShoppingCart },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/customers', label: 'Customers', icon: UserCircle },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/refunds', label: 'Refunds', icon: Undo2 },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/staff', label: 'Staff', icon: UserCog },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-pine-950 text-pine-100 flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-pine-800/80">
        <div className="h-8 w-8 rounded-full bg-brass-500 flex items-center justify-center shrink-0">
          <Flag className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">{CLUB.name}</p>
          <p className="text-[11px] text-pine-400 leading-tight">Club Management Platform</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto thin-scroll py-3 px-2.5 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-pine-800 text-white'
                  : 'text-pine-300 hover:bg-pine-900 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-pine-800/80">
        <p className="text-[11px] text-pine-500">DEMO MODE — Stripe payments simulated</p>
      </div>
    </aside>
  )
}
