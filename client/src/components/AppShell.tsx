import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthToken } from '../lib/api'

function AppShell() {
  const navigate = useNavigate()
  const token = getAuthToken()

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login')
  }

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
                <NavLink to="/" end className={({ isActive }) => isActive ? 'vw-nav-link is-active' : 'vw-nav-link'}>
                  Dashboard
                </NavLink>
                <button className="vw-nav-link vw-nav-button" type="button" onClick={handleLogout}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <a className="vw-nav-link" href="/scheduler/#/signup">
                  Sign Up
                </a>
                <a className="vw-nav-link" href="/scheduler/#/login">
                  Log In
                </a>
              </>
            )}

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
