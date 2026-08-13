import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        const note = await signUp(displayName, email, password)
        if (note) {
          setMessage(note)
          setMode('login')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not complete that request.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <div className="fish-logo">FI</div>
        <h1>Fishing Intelligence</h1>
        <p className="tagline">Fish smarter. Learn every cast.</p>

        {mode === 'signup' && (
          <label>
            Display name
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </label>
        )}

        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <button className="primary-button" disabled={busy} type="submit">
          {busy ? 'Working…' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>

        <button
          className="text-button"
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError(null)
            setMessage(null)
          }}
        >
          {mode === 'login' ? 'Create an account' : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  )
}
