import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Spinner } from './ui'

export function RequireUser({ children }: { children: ReactNode }) {
  const { user, authReady } = useApp()
  const loc = useLocation()
  if (!authReady) return <div className="page-center"><Spinner /></div>
  if (!user) return <Navigate to={`/connexion?suite=${encodeURIComponent(loc.pathname)}`} replace />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, authReady } = useApp()
  if (!authReady) return <div className="page-center"><Spinner /></div>
  if (!user) return <Navigate to="/connexion?suite=/admin" replace />
  if (user.role !== 'admin')
    return (
      <div className="page-center">
        <h2>Accès réservé</h2>
        <p className="muted">Cet espace est réservé à l’administrateur du salon.</p>
      </div>
    )
  return <>{children}</>
}
