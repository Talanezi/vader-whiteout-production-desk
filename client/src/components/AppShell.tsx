import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { IconButton } from './whiteout/Button'
import Icon from './whiteout/Icon'
import DeskEmblem from './whiteout/DeskEmblem'
import { Overlay } from './whiteout/Overlay'
import { ToastProvider } from './whiteout/Feedback'
import '../styles/whiteout.css'

function AppShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('whiteout:desk:sidebar') === 'collapsed'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const editor = /^\/callsheets\/.+\/edit$/.test(location.pathname)
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])
  function toggle() {
    setCollapsed((old) => {
      try {
        localStorage.setItem(
          'whiteout:desk:sidebar',
          old ? 'expanded' : 'collapsed',
        )
      } catch {
        /* session-only when storage is unavailable */
      }
      return !old
    })
  }
  const navigation = (
    <nav aria-label="Production Desk">
      <NavLink
        end
        to="/"
        title={collapsed ? 'Call sheets' : undefined}
        className={({ isActive }) =>
          `pd-nav-link ${isActive || location.pathname.startsWith('/callsheets') ? 'is-active' : ''}`
        }
      >
        <Icon name="file" />
        <span className="pd-nav-text">Call sheets</span>
      </NavLink>
      <NavLink
        to="/roster"
        title={collapsed ? 'Roster' : undefined}
        className={({ isActive }) =>
          `pd-nav-link ${isActive ? 'is-active' : ''}`
        }
      >
        <Icon name="people" />
        <span className="pd-nav-text">Roster</span>
      </NavLink>
    </nav>
  )
  return (
    <ToastProvider>
      <div className={`pd-app ${collapsed ? 'pd-collapsed' : ''}`}>
        <a className="pd-skip" href="#workspace">
          Skip to workspace
        </a>
        <aside className="pd-sidebar">
          <Link
            to="/"
            className="pd-brand"
            aria-label="Whiteout Production Desk"
          >
            <DeskEmblem />
            <span className="pd-nav-text">
              <strong>WHITEOUT</strong>
              <small>Production Desk</small>
            </span>
          </Link>
          {navigation}
          <div className="pd-sidebar-bottom">
            <a
              href="/apps/"
              className="pd-nav-link"
              title="Whiteout applications"
            >
              <Icon name="grid" />
              <span className="pd-nav-text">
                All applications
                <Icon name="arrow" />
              </span>
            </a>
            <button
              type="button"
              className="pd-collapse"
              onClick={toggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
            >
              <Icon name="collapse" />
              <span className="pd-nav-text">Collapse sidebar</span>
            </button>
          </div>
        </aside>
        <div className="pd-workspace">
          <header className="pd-topbar">
            <IconButton
              className="pd-mobile-menu"
              name="menu"
              label="Open navigation"
              onClick={() => setMobileOpen(true)}
            />
            <Link
              to="/"
              className="pd-mobile-brand"
              aria-label="Whiteout Production Desk"
            >
              <DeskEmblem />
              <span>Production Desk</span>
            </Link>
          </header>
          <main
            id="workspace"
            className={editor ? 'pd-content pd-legacy' : 'pd-content'}
          >
            <Outlet />
          </main>
        </div>
        {mobileOpen && (
          <Overlay
            kind="drawer"
            className="pd-mobile-navigation"
            title="Production Desk"
            onClose={() => setMobileOpen(false)}
          >
            <Link
              to="/callsheets/new"
              className="pd-button pd-button-primary"
              onClick={() => setMobileOpen(false)}
            >
              <Icon name="plus" />
              New call sheet
            </Link>
            <div onClick={() => setMobileOpen(false)}>{navigation}</div>
            <a href="/apps/" className="pd-nav-link">
              <Icon name="grid" />
              All applications
              <Icon name="arrow" />
            </a>
          </Overlay>
        )}
      </div>
    </ToastProvider>
  )
}
export default AppShell
