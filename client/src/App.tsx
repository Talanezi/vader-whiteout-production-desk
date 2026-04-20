import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import CallSheetNewPage from './pages/CallSheetNewPage'
import CallSheetEditorPage from './pages/CallSheetEditorPage'
import LoginPage from './pages/LoginPage'
import { getAuthToken } from './lib/api'

function RequireAuth() {
  const location = useLocation()
  const token = getAuthToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/callsheets/new" element={<CallSheetNewPage />} />
          <Route path="/callsheets/:id/edit" element={<CallSheetEditorPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
