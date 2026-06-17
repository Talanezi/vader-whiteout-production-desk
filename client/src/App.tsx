import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import CallSheetNewPage from './pages/CallSheetNewPage'
import CallSheetEditorPage from './pages/CallSheetEditorPage'
import RosterPage from './pages/RosterPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/roster" element={<RosterPage />} />
        <Route path="/callsheets/new" element={<CallSheetNewPage />} />
        <Route path="/callsheets/:id/edit" element={<CallSheetEditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
