import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/client'
import { DEMO_ADMIN } from '../lib/demoApi'
import { errorMessage } from '../lib/utils'

export default function Login() {
  const { user, refreshUser, toast, settings } = useApp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const next = params.get('suite')

  if (user) return <Navigate to={next || (user.role === 'admin' ? '/admin' : '/mon-espace')} replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'login') {
        const p = await api.signIn(email, password)
        await refreshUser()
        toast(`Bienvenue ${p.full_name || ''} !`)
        navigate(next || (p.role === 'admin' ? '/admin' : '/mon-espace'), { replace: true })
      } else {
        const p = await api.signUp({ email, password, full_name: name.trim(), phone: phone.trim() })
        if (!p) {
          toast('Compte créé ! Vérifiez vos e-mails pour confirmer votre adresse.')
          setMode('login')
          return
        }
        await refreshUser()
        toast('Compte créé, bienvenue !')
        navigate(next || '/mon-espace', { replace: true })
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page narrow-sm">
      <div className="card auth-card">
        <h1>{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
        <p className="muted">
          {mode === 'login' ? `Heureux de vous revoir chez ${settings.name}.` : 'Suivez vos rendez-vous et rejoignez la communauté.'}
        </p>
        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Connexion</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Inscription</button>
        </div>
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <label className="field">
                <span className="label">Nom complet</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
              <label className="field">
                <span className="label">Téléphone / WhatsApp</span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
              </label>
            </>
          )}
          <label className="field">
            <span className="label">E-mail</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="field">
            <span className="label">Mot de passe</span>
            <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-gold btn-block" disabled={busy}>
            {busy ? 'Patientez…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
        {api.mode === 'demo' && (
          <div className="demo-hint">
            <strong>Mode démo — compte administrateur :</strong>
            <span>{DEMO_ADMIN.email} / {DEMO_ADMIN.password}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setMode('login'); setEmail(DEMO_ADMIN.email); setPassword(DEMO_ADMIN.password) }}
            >
              Remplir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
