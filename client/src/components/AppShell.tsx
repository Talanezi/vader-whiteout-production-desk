import { Link, Outlet } from 'react-router-dom'
import { getAuthToken } from '../lib/api'

function AppShell() {
  const token = getAuthToken()

  return (
    <div className="vw-app-shell d-flex flex-column">
      <header className="vw-navbar">
        <div className="vw-navbar-inner">
          <Link to="/" className="vw-brand">
            Vader: Whiteout
          </Link>

          <nav className="vw-nav-links">
            {token ? (
              <>
                <Link to="/" className="vw-nav-link">
                  Dashboard
                </Link>
                <a className="vw-nav-link" href="/apps/">
                  Apps
                </a>
              </>
            ) : (
              <>
                <a className="vw-nav-link" href="/scheduler/#/signup">
                  Sign Up
                </a>
                <a className="vw-nav-link" href="/scheduler/#/login">
                  Log In
                </a>
                <a className="vw-nav-link" href="/apps/">
                  Apps
                </a>
              </>
            )}
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
