import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopover } from './whiteout/Popover'
import { Button } from './whiteout/Button'
import Icon from './whiteout/Icon'
import { getAuthToken } from '../lib/api'
import { shotApiBase } from '../lib/shotApi'
export default function AccountMenu({
  collapsed = false,
}: {
  collapsed?: boolean
}) {
  const p = usePopover(270),
    [user, setUser] = useState<{
      name: string
      email: string
      id: number
    }>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  useEffect(() => {
    if (getAuthToken())
      fetch(shotApiBase + '/auth/me', {
        headers: { Authorization: 'Bearer ' + getAuthToken() },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then(setUser)
        .catch(() => {})
  }, [])
  useEffect(() => {
    const changed = (e: StorageEvent) => {
      if (e.key === 'token') window.location.reload()
    }
    window.addEventListener('storage', changed)
    return () => window.removeEventListener('storage', changed)
  }, [])
  async function logout(switching = false) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const r = await fetch(shotApiBase + '/auth/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + getAuthToken() },
      })
      if (!r.ok && r.status !== 401)
        throw Error('Sign out could not be confirmed. Retry.')
      localStorage.removeItem('token')
      window.location.assign(
        switching
          ? '/scheduler/#/login?returnTo=' +
              encodeURIComponent('/productiondesk/')
          : '/productiondesk/',
      )
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }
  if (!getAuthToken()) return null
  return (
    <>
      <button
        ref={p.trigger}
        className="pd-account-trigger"
        aria-label="Account menu"
        aria-expanded={p.open}
        onClick={() => p.setOpen(!p.open)}
      >
        <span className="pd-account-avatar">
          {user?.name
            ?.split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('') || <Icon name="people" />}
        </span>
        {!collapsed && (
          <span>
            {user?.name || 'Account'}
            <small>{user?.email || 'Production Desk'}</small>
          </span>
        )}
      </button>
      {p.open &&
        createPortal(
          <div
            ref={p.panel}
            className="pd-ui pd-account-menu"
            role="dialog"
            aria-label="Your account"
            style={p.style}
          >
            <strong>{user?.name || 'Your account'}</strong>
            <small>{user?.email}</small>
            <Button
              icon="people"
              disabled={busy}
              onClick={() => void logout(true)}
            >
              Switch account
            </Button>
            <Button
              icon="arrow"
              disabled={busy}
              onClick={() => void logout()}
            >
              Sign out
            </Button>
            {error && <p role="alert">{error}</p>}
          </div>,
          p.target,
        )}
    </>
  )
}
