import { Link, NavLink, Outlet } from 'react-router-dom'

function AppShell() {
  return (
    <div className="vw-app-shell d-flex flex-column">
      <header className="vw-navbar">
        <div className="vw-navbar-inner">
          <Link to="/" className="vw-brand">
            Vader: Whiteout
          </Link>

          <nav className="vw-nav-links">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'vw-nav-link is-active' : 'vw-nav-link'}>
              Dashboard
            </NavLink>
            <NavLink to="/roster" className={({ isActive }) => isActive ? 'vw-nav-link is-active' : 'vw-nav-link'}>
              Roster
            </NavLink>
            <a className="vw-nav-link" href="/apps/">
              Apps
            </a>
            <a className="vw-nav-link" href="/scheduler/">
              Scheduler
            </a>
          </nav>
        </div>
      </header>

      <main className="app-main-container vw-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
