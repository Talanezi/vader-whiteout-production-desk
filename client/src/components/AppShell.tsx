import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearAuthSession, getAuthToken, getStoredUser } from '../lib/api'

function AppShell() {
  const navigate = useNavigate()
  const token = getAuthToken()
  const user = getStoredUser()

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
                <span className="vw-nav-user">{user?.name || user?.email || 'Logged in'}</span>
                <button className="vw-nav-link vw-nav-button" type="button" onClick={handleLogout}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <a className="vw-nav-link" href="/scheduler/#/signup">
                  Sign Up
                </a>
                <NavLink to="/login" className={({ isActive }) => isActive ? 'vw-nav-link is-active' : 'vw-nav-link'}>
                  Log In
                </NavLink>
              </>
            )}

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
