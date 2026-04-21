import { Link, Outlet } from 'react-router-dom'

function AppShell() {
  return (
    <div className="vw-app-shell d-flex flex-column">
      <header className="vw-navbar">
        <div className="vw-navbar-inner">
          <Link to="/" className="vw-brand">
            Vader: Whiteout
          </Link>

          <nav className="vw-nav-links">
            <Link to="/" className="vw-nav-link">
              Dashboard
            </Link>
            <a className="vw-nav-link" href="/apps/">
              Apps
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
