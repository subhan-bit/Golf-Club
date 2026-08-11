import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TillProvider } from './context/TillContext'
import { BasketProvider } from './context/BasketContext'
import AppShell from './components/AppShell'
import LoginScreen from './pages/LoginScreen'
import Dashboard from './pages/Dashboard'
import Pos from './pages/Pos'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Members from './pages/Members'
import Customers from './pages/Customers'
import Payments from './pages/Payments'
import Refunds from './pages/Refunds'
import Reports from './pages/Reports'
import Staff from './pages/Staff'
import Settings from './pages/Settings'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Root() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginScreen />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <TillProvider>
              <BasketProvider>
                <AppShell />
              </BasketProvider>
            </TillProvider>
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<Pos />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="members" element={<Members />} />
        <Route path="customers" element={<Customers />} />
        <Route path="payments" element={<Payments />} />
        <Route path="refunds" element={<Refunds />} />
        <Route path="reports" element={<Reports />} />
        <Route path="staff" element={<Staff />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </HashRouter>
  )
}
