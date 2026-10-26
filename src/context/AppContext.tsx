import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/client'
import { DEFAULT_SETTINGS } from '../lib/seed'
import type { Profile, Settings } from '../types'

interface Toast {
  id: number
  message: string
  kind: 'success' | 'error'
}

interface AppState {
  user: Profile | null
  authReady: boolean
  settings: Settings
  setSettings: (s: Settings) => void
  refreshUser: () => Promise<void>
  toast: (message: string, kind?: Toast['kind']) => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [toasts, setToasts] = useState<Toast[]>([])

  const refreshUser = useCallback(async () => {
    try {
      setUser(await api.getCurrentUser())
    } finally {
      setAuthReady(true)
    }
  }, [])

  useEffect(() => {
    refreshUser()
    api.getSettings().then(setSettings).catch(() => {})
    return api.onAuthChange(refreshUser)
  }, [refreshUser])


  const toast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <Ctx.Provider value={{ user, authReady, settings, setSettings, refreshUser, toast }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp doit être utilisé dans AppProvider')
  return v
}
