import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

function AppShell() {
  const location = useLocation()
  const inEditor = location.pathname.startsWith('/callsheets/')

  return (
    <div className="vw-shell">
      <header className="vw-topbar">
        <div className="vw-topbar-inner">
          <Link to="/" className="vw-brand">
            VADER: WHITEOUT
          </Link>

          <nav className="vw-nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'vw-nav-link is-active' : 'vw-nav-link'}>
              Dashboard
            </NavLink>
            <NavLink to="/callsheets/new" className={({ isActive }) => isActive ? 'vw-nav-link is-active' : 'vw-nav-link'}>
              New Call Sheet
            </NavLink>
            <a className="vw-nav-link" href="/scheduler/">
              Scheduler
            </a>
          </nav>
        </div>
      </header>

      <main className={inEditor ? 'vw-main vw-main-editor' : 'vw-main'}>
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
