import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login, setAuthSession } from '../lib/api'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const nextPath = (location.state as { from?: string } | null)?.from || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      const result = await login(email, password)
      setAuthSession(result.token, result.user)
      navigate(nextPath, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="vw-page-wrap">
      <section className="vw-section-card vw-auth-card">
        <p className="vw-kicker">Production Desk</p>
        <h1 className="vw-page-title">Log In</h1>
        <p className="vw-page-note">Please log in to access Production Desk.</p>

        <form className="vw-auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error ? <div className="vw-inline-error">{error}</div> : null}

          <div className="vw-actions-row">
            <button className="vw-btn vw-btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log In'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default LoginPage
